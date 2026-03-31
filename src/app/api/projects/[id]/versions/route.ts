import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const versions = await prisma.htmlVersion.findMany({
    where: { projectId: params.id },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      isLocked: true,
      validationGrade: true,
      fullHtmlSize: true,
      aiModel: true,
      createdAt: true,
    },
  });

  return Response.json({ versions });
});
