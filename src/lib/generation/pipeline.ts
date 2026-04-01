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

// ==================== Generate Pipeline ====================

interface GeneratePipelineParams {
  projectId: string;
  description?: string;
  safetyClarification?: boolean;
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
      try { referenceImageBase64.push(await readBase64(ref.base64CachePath)); } catch { /* skip */ }
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

  let fullText = '';
  for await (const chunk of result.textStream) {
    fullText += chunk;
  }

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

  // Step 2: Validate HTML rules
  sse.write('status', { step: 'validating', message: '✅ 正在校验生成结果...' });
  let validation = validate(skeleton);

  // Step 3: Auto-fix loop
  let fixAttempt = 0;
  while (fixAttempt < MAX_AUTO_FIX && validation.results.some((r) => r.level === 'error' && !r.passed)) {
    fixAttempt++;
    const failedItems = validation.results.filter((r) => !r.passed).map((r) => `${r.name}: ${r.detail}`);
    sse.write('status', { step: 'fixing', message: `🔧 校验未通过，正在自动修复 (${fixAttempt}/${MAX_AUTO_FIX})...` });

    try {
      const fixedSkeleton = await autofixSkeleton(skeleton, failedItems);
      const fixCheck = validateAIResponse(fixedSkeleton);
      if (fixCheck.status !== 'valid' && fixCheck.status !== 'truncated') {
        console.error(`Auto-fix attempt ${fixAttempt} returned invalid response: ${fixCheck.status}`);
        break;
      }
      skeleton = fixedSkeleton;
      validation = validate(skeleton);
    } catch (e) {
      console.error(`Auto-fix attempt ${fixAttempt} failed:`, e);
      break;
    }
  }

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
      content: `已生成初稿 (v${newVersion})，校验等级: ${validation.grade}${fixAttempt > 0 ? `，自动修复 ${fixAttempt} 次` : ''}`,
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
  sse.write('validation', { grade: validation.grade, results: validation.results, fixAttempts: fixAttempt });

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
  });

  let fullText = '';
  for await (const chunk of result.textStream) {
    fullText += chunk;
  }

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

  const skeleton = extractHtml(fullText);

  // Validate HTML rules
  sse.write('status', { step: 'validating', message: '✅ 正在校验修改结果...' });
  const validation = validate(skeleton);

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

  const hasErrors = validation.results.some((r) => r.level === 'error' && !r.passed);
  if (hasErrors) {
    const failedNames = validation.results.filter((r) => r.level === 'error' && !r.passed).map((r) => r.name);
    sse.write('status', { step: 'warning', message: `⚠️ 修改后校验不通过: ${failedNames.join(', ')}` });
  }

  sse.write('complete', { versionId: version.id, version: newVersion, grade: validation.grade });
}
