import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { iterateSkeleton, extractHtml } from '@/lib/ai/orchestrator';
import { validate } from '@/lib/validation/engine';

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

    const body = await request.json();
    const userMessage = body.message;
    if (!userMessage) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    const latestVersion = await prisma.htmlVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
    if (!latestVersion) {
      return Response.json({ error: 'No version exists yet' }, { status: 400 });
    }

    // Check if skeleton is locked — if so, reject iteration
    const lockedVersion = await prisma.htmlVersion.findFirst({
      where: { projectId, isLocked: true },
    });
    if (lockedVersion) {
      return Response.json(
        { error: '骨架已锁定，请先解锁后再修改。或在变体页面点击"解锁"按钮。' },
        { status: 400 }
      );
    }

    const history = await prisma.conversationMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    await prisma.conversationMessage.create({
      data: { projectId, role: 'user', content: userMessage },
    });

    await prisma.projectStats.upsert({
      where: { projectId },
      update: { iterationCount: { increment: 1 } },
      create: { projectId, iterationCount: 1 },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(sseEvent('status', { step: 'generating', message: '🛠️ 正在修改...' }))
          );

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

          const skeleton = extractHtml(fullText);

          // Auto-validate after iteration
          controller.enqueue(
            encoder.encode(sseEvent('status', { step: 'validating', message: '✅ 正在校验修改结果...' }))
          );
          const validation = validate(skeleton);

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

          // Send validation results
          controller.enqueue(
            encoder.encode(sseEvent('validation', {
              grade: validation.grade,
              results: validation.results,
            }))
          );

          // Warn if validation degraded
          const hasErrors = validation.results.some((r) => r.level === 'error' && !r.passed);
          if (hasErrors) {
            const failedNames = validation.results
              .filter((r) => r.level === 'error' && !r.passed)
              .map((r) => r.name);
            controller.enqueue(
              encoder.encode(sseEvent('status', {
                step: 'warning',
                message: `⚠️ 修改后校验不通过: ${failedNames.join(', ')}`,
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
          console.error('Iterate error:', error);
          controller.enqueue(
            encoder.encode(sseEvent('error', {
              message: error instanceof Error ? error.message : 'Iteration failed',
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
