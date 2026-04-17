import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const POST = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const sourceVersion = await prisma.htmlVersion.findFirst({
    where: { id: params.versionId, projectId: params.id },
  });
  if (!sourceVersion) return Response.json({ error: 'Version not found' }, { status: 404 });

  const maxVersion = await prisma.htmlVersion.findFirst({
    where: { projectId: params.id },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const newVersion = await prisma.htmlVersion.create({
    data: {
      projectId: params.id,
      version: (maxVersion?.version || 0) + 1,
      skeletonHtml: sourceVersion.skeletonHtml,
      validationGrade: sourceVersion.validationGrade,
      validationJson: sourceVersion.validationJson,
      aiModel: sourceVersion.aiModel,
      parentId: sourceVersion.id, // track rollback source for version tree
    },
  });

  return Response.json({ version: newVersion });
});
