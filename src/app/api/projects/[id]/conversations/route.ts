import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const messages = await prisma.conversationMessage.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, versionId: true, createdAt: true },
  });

  return Response.json({ messages });
});
