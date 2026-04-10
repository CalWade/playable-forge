import { prisma } from '@/lib/db';
import { iterateSkeleton, extractHtml } from '@/lib/ai/orchestrator';
import { validateAIResponse } from '@/lib/ai/response-validator';
import { logActivity } from '@/lib/activity-log';
import { getSettings } from '@/lib/settings';
import { validateAndAutoFix } from './validate-and-fix';
import type { IteratePipelineParams } from './types';

export async function runIteratePipeline(params: IteratePipelineParams) {
  const { projectId, userMessage, sse } = params;

  const latestVersion = await prisma.htmlVersion.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
  });
  if (!latestVersion) throw new Error('No version exists yet');

  // Check lock
  const lockedVersion = await prisma.htmlVersion.findFirst({ where: { projectId, isLocked: true } });
  if (lockedVersion) throw new Error('骨架已锁定，请先解锁后再修改。');

  // Save user message + update stats
  await prisma.conversationMessage.create({ data: { projectId, role: 'user', content: userMessage } });
  await prisma.projectStats.upsert({
    where: { projectId },
    update: { iterationCount: { increment: 1 } },
    create: { projectId, iterationCount: 1 },
  });

  // Get history
  const history = await prisma.conversationMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    take: 20,
    select: { role: true, content: true },
  });

  sse.write('status', { step: 'generating', message: '🛠️ 正在修改...' });

  const convHistory = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const result = await iterateSkeleton({
    currentSkeleton: latestVersion.skeletonHtml,
    userMessage,
    conversationHistory: convHistory,
    safetyClarification: params.safetyClarification,
  });

  sse.write('debug', { type: 'iterate_prompt', content: `[System Prompt]\n${result.systemPrompt}\n\n[User Prompt]\n${result.prompt}` });

  // Emit API config for debugging
  const settings = await getSettings();
  const apiUrl = settings.ai.baseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const modelName = settings.ai.model || process.env.AI_MODEL || 'gpt-4o';
  sse.write('debug', { type: 'api_config', content: `API: ${apiUrl}\nModel: ${modelName}` });

  let fullText = '';
  try {
    for await (const chunk of result.stream.textStream) {
      fullText += chunk;
      sse.write('chunk', { text: chunk });
    }
  } catch (streamError) {
    const errMsg = streamError instanceof Error ? streamError.message : String(streamError);
    sse.write('debug', { type: 'stream_error', content: errMsg });
    sse.write('error', { message: `AI 流式读取失败: ${errMsg}`, canRetry: true });
    return;
  }

  sse.write('debug', { type: 'iterate_response', content: fullText || '(empty response)' });
  sse.write('debug', { type: 'iterate_response_length', content: `Response length: ${fullText.length} chars` });

  // Validate raw AI response
  const responseCheck = validateAIResponse(fullText);
  if (responseCheck.status === 'empty') {
    sse.write('error', { message: `AI 未返回有效内容。响应长度: ${fullText.length}，内容: "${fullText.slice(0, 200)}"`, canRetry: true });
    return;
  }
  if (responseCheck.status === 'refused') { sse.write('error', { message: responseCheck.message, type: 'refused' }); return; }
  if (responseCheck.status === 'question') { sse.write('question', { message: responseCheck.message }); return; }

  let skeleton = extractHtml(fullText);

  // Validate + auto-fix
  const autoFixResult = await validateAndAutoFix(skeleton, sse);
  skeleton = autoFixResult.skeleton;
  const validation = autoFixResult.validation;

  // Save version
  const maxV = await prisma.htmlVersion.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const newVersion = (maxV?.version || 0) + 1;

  const version = await prisma.htmlVersion.create({
    data: {
      projectId,
      version: newVersion,
      skeletonHtml: skeleton,
      validationGrade: validation.grade,
      validationJson: JSON.stringify(validation.results),
      aiModel: process.env.AI_MODEL || 'gpt-4o',
    },
  });

  await prisma.conversationMessage.create({
    data: {
      projectId,
      role: 'assistant',
      content: `已根据您的要求修改了 HTML。校验等级: ${validation.grade}`,
      versionId: version.id,
    },
  });

  sse.write('validation', { grade: validation.grade, results: validation.results });
  sse.write('complete', { versionId: version.id, version: newVersion, grade: validation.grade });

  if (params.userId) {
    await logActivity({
      projectId, userId: params.userId,
      action: 'iterate',
      description: `迭代生成 v${newVersion}，校验等级 ${validation.grade}`,
    });
  }
}
