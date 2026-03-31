import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const variants = await prisma.variant.findMany({
    where: { projectId: params.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      status: true,
      fullHtmlSize: true,
      validationGrade: true,
      validationJson: true,
      createdAt: true,
    },
  });

  return Response.json({ variants });
});
