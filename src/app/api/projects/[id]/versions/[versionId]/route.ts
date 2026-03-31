import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Version not found' }, { status: 404 });

  const version = await prisma.htmlVersion.findUnique({
    where: { id: params.versionId },
  });
  if (!version) return Response.json({ error: 'Version not found' }, { status: 404 });

  return Response.json({ version });
});
