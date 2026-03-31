import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const assets = await prisma.asset.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json({
    assets: assets.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      originalName: a.originalName,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
      compressedSize: a.compressedSize,
      width: a.width,
      height: a.height,
      category: a.category,
      categoryConfirmed: a.categoryConfirmed,
      variantRole: a.variantRole,
      variantGroup: a.variantGroup,
      slotName: a.slotName,
      thumbnailUrl: a.thumbnailPath ? `/api/projects/${params.id}/assets/${a.id}/thumbnail` : null,
    })),
  });
});
