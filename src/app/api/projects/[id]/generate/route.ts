import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { generateSkeleton, extractHtml } from '@/lib/ai/orchestrator';
import { readBase64 } from '@/lib/assets/base64';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Get assets
    const assets = await prisma.asset.findMany({
      where: { projectId },
    });

    if (assets.length === 0) {
      return Response.json({ error: 'No assets uploaded' }, { status: 400 });
    }

    // Get reference images base64
    const referenceAssets = assets.filter((a) => a.category === 'reference');
    const referenceImageBase64: string[] = [];
    for (const ref of referenceAssets) {
      if (ref.base64CachePath) {
        try {
          const b64 = await readBase64(ref.base64CachePath);
          referenceImageBase64.push(b64);
        } catch {
          // skip
        }
      }
    }

    // Build asset metadata
    const assetMetadata = assets.map((a) => ({
      originalName: a.originalName,
      category: a.category,
      slotName: a.slotName,
      variantRole: a.variantRole,
      width: a.width,
      height: a.height,
      mimeType: a.mimeType,
    }));

    // SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Understanding
          controller.enqueue(
            encoder.encode(sseEvent('status', { step: 'understanding', message: '正在理解素材和意图...' }))
          );

          // Step 2: Generating
          controller.enqueue(
            encoder.encode(sseEvent('status', { step: 'generating', message: '正在生成 HTML 骨架...' }))
          );

          const result = await generateSkeleton({
            assets: assetMetadata,
            referenceImageBase64,
            description,
          });

          let fullText = '';
          for await (const chunk of result.textStream) {
            fullText += chunk;
            controller.enqueue(
              encoder.encode(sseEvent('progress', { percent: Math.min(90, fullText.length / 100) }))
            );
          }

          const skeleton = extractHtml(fullText);

          // Get current max version
          const maxVersion = await prisma.htmlVersion.findFirst({
            where: { projectId },
            orderBy: { version: 'desc' },
            select: { version: true },
          });
          const newVersion = (maxVersion?.version || 0) + 1;

          // Save version
          const version = await prisma.htmlVersion.create({
            data: {
              projectId,
              version: newVersion,
              skeletonHtml: skeleton,
              aiModel: process.env.AI_MODEL || 'gpt-4o',
            },
          });

          // Update project status
          await prisma.project.update({
            where: { id: projectId },
            data: { status: 'in_progress' },
          });

          controller.enqueue(
            encoder.encode(
              sseEvent('skeleton', { versionId: version.id, version: newVersion })
            )
          );

          controller.enqueue(
            encoder.encode(
              sseEvent('complete', {
                versionId: version.id,
                version: newVersion,
              })
            )
          );
        } catch (error) {
          console.error('Generate error:', error);
          controller.enqueue(
            encoder.encode(
              sseEvent('error', {
                message: error instanceof Error ? error.message : 'Generation failed',
                canRetry: true,
              })
            )
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
    console.error('Generate route error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
