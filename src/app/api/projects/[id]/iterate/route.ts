import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { iterateSkeleton, extractHtml } from '@/lib/ai/orchestrator';

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

    // Get latest version skeleton
    const latestVersion = await prisma.htmlVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
    if (!latestVersion) {
      return Response.json({ error: 'No version exists yet' }, { status: 400 });
    }

    // Get conversation history
    const history = await prisma.conversationMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    // Save user message
    await prisma.conversationMessage.create({
      data: { projectId, role: 'user', content: userMessage },
    });

    // Update iteration count
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
            encoder.encode(sseEvent('status', { step: 'generating', message: '正在修改...' }))
          );

          const convHistory = history
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }));

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

          // Save new version
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
              aiModel: process.env.AI_MODEL || 'gpt-4o',
            },
          });

          // Save assistant message
          await prisma.conversationMessage.create({
            data: {
              projectId,
              role: 'assistant',
              content: '已根据您的要求修改了 HTML。',
              versionId: version.id,
            },
          });

          controller.enqueue(
            encoder.encode(sseEvent('complete', { versionId: version.id, version: newVersion }))
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
