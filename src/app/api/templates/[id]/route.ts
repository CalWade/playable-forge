import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

// DELETE /api/templates/[id]
export const DELETE = withAuth(async (_request, { params, auth }) => {
  const template = await prisma.projectTemplate.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  await prisma.projectTemplate.delete({ where: { id: params.id } });

  return Response.json({ success: true });
});

// GET /api/templates/[id]
export const GET = withAuth(async (_request, { params, auth }) => {
  const template = await prisma.projectTemplate.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!template) {
    return Response.json({ error: 'Template not found' }, { status: 404 });
  }

  return Response.json({ template });
});
