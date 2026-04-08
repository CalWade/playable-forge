import { prisma } from '@/lib/db';
import { generateSkeleton, iterateSkeleton, autofixSkeleton, extractHtml } from '@/lib/ai/orchestrator';
import { validate } from '@/lib/validation/engine';
import { validateAIResponse } from '@/lib/ai/response-validator';
import { readBase64 } from '@/lib/assets/base64';
import type { AssetMetadata } from '@/types';

const MAX_AUTO_FIX = 3;

export interface SSEWriter {
  write(event: string, data: Record<string, unknown>): void;
}

/**
 * Shared: validate skeleton + auto-fix loop (used by both generate and iterate)
 */
async function validateAndAutoFix(
  skeleton: string,
  sse: SSEWriter
): Promise<{ skeleton: string; validation: ReturnType<typeof validate> }> {
  sse.write('status', { step: 'validating', message: '✅ 正在校验结果...' });
  let validation = validate(skeleton);

  const passed = validation.results.filter((r) => r.passed);
  const failed = validation.results.filter((r) => !r.passed);

  if (failed.length === 0) {
    sse.write('status', { step: 'validated', message: `✅ 校验全部通过 (${validation.grade} 级)` });
  } else {
    const failedList = failed.map((r) => `${r.level === 'error' ? '❌' : '⚠️'} ${r.name}: ${r.detail}`).join('\n');
    const errors = failed.filter((r) => r.level === 'error');
    sse.write('status', {
      step: 'validation_issues',
      message: `📋 校验结果 (${validation.grade} 级): ${passed.length} 通过, ${failed.length} 未通过\n${failedList}`
    });

    if (errors.length > 0) {
      sse.write('status', { step: 'will_fix', message: `🔧 发现 ${errors.length} 个必须修复的问题，将自动尝试修复（最多 ${MAX_AUTO_FIX} 次）` });
    }
  }

  let fixAttempt = 0;
  let currentSkeleton = skeleton;
  while (fixAttempt < MAX_AUTO_FIX && validation.results.some((r) => r.level === 'error' && !r.passed)) {
    fixAttempt++;
    const failedDescriptions = validation.results.filter((r) => !r.passed).map((r) => `${r.name}: ${r.detail}`);

    sse.write('status', {
      step: 'fixing',
      message: `🔧 自动修复 (${fixAttempt}/${MAX_AUTO_FIX})...\n修复目标:\n${failedDescriptions.map(f => `  - ${f}`).join('\n')}`
    });

    try {
      const fixResult = await autofixSkeleton(currentSkeleton, failedDescriptions);
      sse.write('debug', { type: `autofix_prompt_${fixAttempt}`, content: `[System Prompt]\n${fixResult.systemPrompt}\n\n[User Prompt]\n${fixResult.prompt}` });
      sse.write('debug', { type: `autofix_response_${fixAttempt}`, content: fixResult.rawResponse });

      const fixCheck = validateAIResponse(fixResult.html);
      if (fixCheck.status !== 'valid' && fixCheck.status !== 'truncated') {
        sse.write('status', { step: 'fix_failed', message: `⚠️ 修复尝试 ${fixAttempt} 返回无效结果，停止修复` });
        break;
      }
      currentSkeleton = fixResult.html;
      validation = validate(currentSkeleton);

      const newFailed = validation.results.filter((r) => !r.passed);
      if (newFailed.length === 0) {
        sse.write('status', { step: 'fix_success', message: `✅ 修复成功！校验全部通过 (${validation.grade} 级)` });
      } else {
        sse.write('status', { step: 'fix_progress', message: `🔄 修复后仍有 ${newFailed.length} 项未通过` });
      }
    } catch (e) {
      console.error(`Auto-fix attempt ${fixAttempt} failed:`, e);
      sse.write('status', { step: 'fix_error', message: `⚠️ 修复尝试 ${fixAttempt} 出错，停止修复` });
      break;
    }
  }

  return { skeleton: currentSkeleton, validation };
}

// ==================== Generate Pipeline ====================

interface GeneratePipelineParams {
  projectId: string;
  description?: string;
  safetyClarification?: boolean;
  streamPreview?: boolean;
  sse: SSEWriter;
}

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

  // Step 1: Generate
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

  // Emit debug info
  sse.write('debug', { type: 'generate_prompt', content: `[System Prompt]\n${result.systemPrompt}\n\n[User Prompt]\n${result.prompt}` });

  let fullText = '';
  for await (const chunk of result.stream.textStream) {
    fullText += chunk;
    if (params.streamPreview) {
      sse.write('chunk', { text: chunk });
    }
  }

  sse.write('debug', { type: 'generate_response', content: fullText });

  // Validate raw AI response BEFORE extracting HTML
  const responseCheck = validateAIResponse(fullText);
  if (responseCheck.status === 'empty') {
    throw new Error(responseCheck.message);
  }
  if (responseCheck.status === 'refused') {
    sse.write('error', { message: responseCheck.message, type: 'refused' });
    return;
  }
  if (responseCheck.status === 'question') {
    sse.write('question', { message: responseCheck.message });
    return;
  }
  if (responseCheck.status === 'truncated') {
    sse.write('status', { step: 'truncated', message: '⚠️ AI 输出被截断，继续处理...' });
  }

  let skeleton = extractHtml(fullText);

  // Validate + auto-fix
  const fixResult = await validateAndAutoFix(skeleton, sse);
  skeleton = fixResult.skeleton;
  const validation = fixResult.validation;

  // Step 4: Save version
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

  // Send results
  sse.write('validation', { grade: validation.grade, results: validation.results });

  if (hasErrors) {
    const failedNames = validation.results.filter((r) => r.level === 'error' && !r.passed).map((r) => r.name);
    sse.write('status', { step: 'manual_fix_needed', message: `⚠️ 以下问题需要人工介入: ${failedNames.join(', ')}` });
  }

  sse.write('complete', { versionId: version.id, version: newVersion, grade: validation.grade });
}

// ==================== Iterate Pipeline ====================

interface IteratePipelineParams {
  projectId: string;
  userMessage: string;
  safetyClarification?: boolean;
  streamPreview?: boolean;
  sse: SSEWriter;
}

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

  let fullText = '';
  for await (const chunk of result.stream.textStream) {
    fullText += chunk;
    if (params.streamPreview) {
      sse.write('chunk', { text: chunk });
    }
  }

  sse.write('debug', { type: 'iterate_response', content: fullText });

  // Validate raw AI response BEFORE extracting HTML
  const responseCheck = validateAIResponse(fullText);
  if (responseCheck.status === 'empty') {
    throw new Error(responseCheck.message);
  }
  if (responseCheck.status === 'refused') {
    sse.write('error', { message: responseCheck.message, type: 'refused' });
    return;
  }
  if (responseCheck.status === 'question') {
    sse.write('question', { message: responseCheck.message });
    return;
  }

  let skeleton = extractHtml(fullText);

  // Validate + auto-fix (shared with generate pipeline)
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
}
