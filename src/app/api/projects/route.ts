import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, { auth }) => {
  const projects = await prisma.project.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { variants: true } } },
  });

  return Response.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      variantCount: p._count.variants,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
});

export const POST = withAuth(async (request, { auth }) => {
  let name = '新项目';
  try {
    const body = await request.json();
    if (body.name) name = body.name;
  } catch { /* empty body ok */ }

  const project = await prisma.project.create({
    data: { name, userId: auth.userId },
  });

  await prisma.projectStats.create({ data: { projectId: project.id } });

  return Response.json({ project }, { status: 201 });
});
