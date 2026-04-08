import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

// GET /api/projects/[id]/activity — activity log
export const GET = withAuth(async (request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = 20;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { username: true, displayName: true } } },
    }),
    prisma.activityLog.count({ where: { projectId: params.id } }),
  ]);

  return Response.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      description: l.description,
      userName: l.user.displayName || l.user.username,
      createdAt: l.createdAt.toISOString(),
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
    })),
    total,
    page,
    pageSize,
  });
});
