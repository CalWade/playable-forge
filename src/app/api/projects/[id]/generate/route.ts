import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { generateSkeleton, extractHtml, autofixSkeleton } from '@/lib/ai/orchestrator';
import { readBase64 } from '@/lib/assets/base64';
import { validate } from '@/lib/validation/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AUTO_FIX = 3;

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);
    const projectId = params.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: auth.userId },
    });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    let description: string | undefined;
    try {
      const body = await request.json();
      description = body.description;
    } catch {
      // empty body ok
    }

    const assets = await prisma.asset.findMany({ where: { projectId } });

    if (assets.length === 0) {
      return Response.json({ error: 'No assets uploaded' }, { status: 400 });
    }

    // Get reference images base64
    const referenceImageBase64: string[] = [];
    for (const ref of assets.filter((a) => a.category === 'reference')) {
      if (ref.base64CachePath) {
        try {
          referenceImageBase64.push(await readBase64(ref.base64CachePath));
        } catch { /* skip */ }
      }
    }

    const assetMetadata = assets.map((a) => ({
      originalName: a.originalName,
      category: a.category,
      slotName: a.slotName,
      variantRole: a.variantRole,
      width: a.width,
      height: a.height,
      mimeType: a.mimeType,
    }));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Understanding
          controller.enqueue(
            encoder.encode(sseEvent('status', { step: 'understanding', message: '🔍 正在理解素材和意图...' }))
          );

          // Step 2: Generating
          controller.enqueue(
            encoder.encode(sseEvent('status', { step: 'generating', message: '🛠️ 正在生成 HTML 骨架...' }))
          );

          const result = await generateSkeleton({
            assets: assetMetadata,
            referenceImageBase64,
            description,
          });

          let fullText = '';
          for await (const chunk of result.textStream) {
            fullText += chunk;
          }

          let skeleton = extractHtml(fullText);

          // Step 3: Validate
          controller.enqueue(
            encoder.encode(sseEvent('status', { step: 'validating', message: '✅ 正在校验生成结果...' }))
          );

          let validation = validate(skeleton);

          // Step 4: Auto-fix loop (up to 3 attempts)
          let fixAttempt = 0;
          while (
            fixAttempt < MAX_AUTO_FIX &&
            validation.results.some((r) => r.level === 'error' && !r.passed)
          ) {
            fixAttempt++;
            const failedItems = validation.results
              .filter((r) => !r.passed)
              .map((r) => `${r.name}: ${r.detail}`);

            controller.enqueue(
              encoder.encode(sseEvent('status', {
                step: 'fixing',
                message: `🔧 校验未通过，正在自动修复 (${fixAttempt}/${MAX_AUTO_FIX})...`,
              }))
            );

            try {
              skeleton = await autofixSkeleton(skeleton, failedItems);
              validation = validate(skeleton);
            } catch (fixError) {
              console.error(`Auto-fix attempt ${fixAttempt} failed:`, fixError);
              break;
            }
          }

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

          // Update project status & stats
          await prisma.project.update({
            where: { id: projectId },
            data: { status: 'in_progress' },
          });

          const hasErrors = validation.results.some((r) => r.level === 'error' && !r.passed);
          await prisma.projectStats.upsert({
            where: { projectId },
            update: { firstPassValidation: !hasErrors },
            create: { projectId, firstPassValidation: !hasErrors },
          });

          // Send validation result
          controller.enqueue(
            encoder.encode(sseEvent('validation', {
              grade: validation.grade,
              results: validation.results,
              fixAttempts: fixAttempt,
            }))
          );

          // If still has errors after auto-fix, notify but still complete
          if (hasErrors) {
            const failedNames = validation.results
              .filter((r) => r.level === 'error' && !r.passed)
              .map((r) => r.name);
            controller.enqueue(
              encoder.encode(sseEvent('status', {
                step: 'manual_fix_needed',
                message: `⚠️ 以下问题需要人工介入: ${failedNames.join(', ')}`,
              }))
            );
          }

          controller.enqueue(
            encoder.encode(sseEvent('complete', {
              versionId: version.id,
              version: newVersion,
              grade: validation.grade,
            }))
          );
        } catch (error) {
          console.error('Generate error:', error);
          controller.enqueue(
            encoder.encode(sseEvent('error', {
              message: error instanceof Error ? error.message : 'Generation failed',
              canRetry: true,
            }))
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
