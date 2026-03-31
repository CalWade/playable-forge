import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const POST = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  await prisma.htmlVersion.updateMany({
    where: { projectId: params.id },
    data: { isLocked: false },
  });

  const version = await prisma.htmlVersion.update({
    where: { id: params.versionId },
    data: { isLocked: true },
  });

  return Response.json({ version });
});
