import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { runIteratePipeline } from '@/lib/generation/pipeline';
import { createSSEResponse } from '@/lib/sse/stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, { params, auth }) => {
  const projectId = params.id;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const body = await request.json();
  const userMessage = body.message;
  if (!userMessage) return Response.json({ error: 'Message required' }, { status: 400 });

  return createSSEResponse((sse) =>
    runIteratePipeline({ projectId, userMessage, sse })
  );
});
