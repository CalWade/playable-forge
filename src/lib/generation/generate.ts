import { prisma } from '@/lib/db';
import { generateSkeleton, extractHtml } from '@/lib/ai/orchestrator';
import { validateAIResponse } from '@/lib/ai/response-validator';
import { readBase64 } from '@/lib/assets/base64';
import { logActivity } from '@/lib/activity-log';
import { sendWebhook } from '@/lib/webhook';
import { getSettings } from '@/lib/settings';
import { validateAndAutoFix } from './validate-and-fix';
import type { AssetMetadata } from '@/types';
import type { GeneratePipelineParams } from './types';

export async function runGeneratePipeline(params: GeneratePipelineParams) {
  const { projectId, description, sse } = params;

  const assets = await prisma.asset.findMany({ where: { projectId } });
  if (assets.length === 0) throw new Error('No assets uploaded');

  // Get reference images
  const referenceImageBase64: string[] = [];
  for (const ref of assets.filter((a) => a.category === 'reference')) {
    if (ref.base64CachePath) {
      try { referenceImageBase64.push(await readBase64(ref.base64CachePath)); } catch (e) { console.warn("Skipped:", e instanceof Error ? e.message : e); }
    }
  }

  const assetMetadata: AssetMetadata[] = assets.map((a) => ({
    originalName: a.originalName,
    category: a.category,
    slotName: a.slotName,
    variantRole: a.variantRole,
    width: a.width,
    height: a.height,
    mimeType: a.mimeType,
  }));

  sse.write('status', { step: 'understanding', message: '🔍 正在理解素材和意图...' });

  await prisma.conversationMessage.create({
    data: { projectId, role: 'user', content: description ? `生成初稿：${description}` : '生成初稿' },
  });

  sse.write('status', { step: 'generating', message: '🛠️ 正在生成 HTML 骨架...' });

  const result = await generateSkeleton({
    assets: assetMetadata,
    referenceImageBase64,
    description,
    safetyClarification: params.safetyClarification,
  });

  sse.write('debug', { type: 'generate_prompt', content: `[System Prompt]\n${result.systemPrompt}\n\n[User Prompt]\n${result.prompt}` });

  // Emit API config for debugging
  const settings = await getSettings();
  const apiUrl = settings.ai.baseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const modelName = settings.ai.model || process.env.AI_MODEL || 'gpt-4o';
  sse.write('debug', { type: 'api_config', content: `API: ${apiUrl}\nModel: ${modelName}` });

  let fullText = '';
  try {
    for await (const chunk of result.stream.textStream) {
      fullText += chunk;
      if (params.streamPreview) {
        sse.write('chunk', { text: chunk });
      }
    }
  } catch (streamError) {
    const errMsg = streamError instanceof Error ? streamError.message : String(streamError);
    sse.write('debug', { type: 'stream_error', content: errMsg });
    sse.write('error', { message: `AI 流式读取失败: ${errMsg}`, canRetry: true });
    return;
  }

  sse.write('debug', { type: 'generate_response', content: fullText || '(empty response)' });
  sse.write('debug', { type: 'generate_response_length', content: `Response length: ${fullText.length} chars` });

  // Validate raw AI response
  const responseCheck = validateAIResponse(fullText);
  if (responseCheck.status === 'empty') {
    sse.write('error', { message: `AI 未返回有效内容。响应长度: ${fullText.length}，内容: "${fullText.slice(0, 200)}"`, canRetry: true });
    return;
  }
  if (responseCheck.status === 'refused') { sse.write('error', { message: responseCheck.message, type: 'refused' }); return; }
  if (responseCheck.status === 'question') { sse.write('question', { message: responseCheck.message }); return; }
  if (responseCheck.status === 'truncated') { sse.write('status', { step: 'truncated', message: '⚠️ AI 输出被截断，继续处理...' }); }

  let skeleton = extractHtml(fullText);

  // Validate + auto-fix
  const fixResult = await validateAndAutoFix(skeleton, sse);
  skeleton = fixResult.skeleton;
  const validation = fixResult.validation;

  // Save version
  const maxVersion = await prisma.htmlVersion.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const newVersion = (maxVersion?.version || 0) + 1;

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

  await prisma.project.update({ where: { id: projectId }, data: { status: 'in_progress' } });

  await prisma.conversationMessage.create({
    data: {
      projectId,
      role: 'assistant',
      content: `已生成初稿 (v${newVersion})，校验等级: ${validation.grade}`,
      versionId: version.id,
    },
  });

  const hasErrors = validation.results.some((r) => r.level === 'error' && !r.passed);
  await prisma.projectStats.upsert({
    where: { projectId },
    update: { firstPassValidation: !hasErrors },
    create: { projectId, firstPassValidation: !hasErrors },
  });

  sse.write('validation', { grade: validation.grade, results: validation.results });

  if (hasErrors) {
    const failedNames = validation.results.filter((r) => r.level === 'error' && !r.passed).map((r) => r.name);
    sse.write('status', { step: 'manual_fix_needed', message: `⚠️ 以下问题需要人工介入: ${failedNames.join(', ')}` });
  }

  sse.write('complete', { versionId: version.id, version: newVersion, grade: validation.grade });

  if (params.userId) {
    await logActivity({
      projectId, userId: params.userId,
      action: 'generate',
      description: `生成初稿 v${newVersion}，校验等级 ${validation.grade}`,
    });
  }

  await sendWebhook('generate_complete', {
    projectId, version: newVersion, grade: validation.grade,
  });
}
