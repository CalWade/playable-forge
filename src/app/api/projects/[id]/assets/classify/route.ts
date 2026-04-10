import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { classifyAssets } from '@/lib/ai/classify';

// POST /api/projects/[id]/assets/classify — trigger AI visual classification
export const POST = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const assets = await prisma.asset.findMany({
    where: { projectId: params.id },
    select: {
      id: true, fileName: true, originalName: true,
      mimeType: true, fileSize: true,
      width: true, height: true, thumbnailPath: true,
    },
  });

  if (assets.length === 0) {
    return Response.json({ error: '没有素材可分类' }, { status: 400 });
  }

  const assetInfos = assets.map((a) => ({
    fileName: a.fileName,
    originalName: a.originalName,
    mimeType: a.mimeType,
    fileSize: a.fileSize,
    width: a.width,
    height: a.height,
    thumbnailPath: a.thumbnailPath,
  }));

  // This may throw — caller should handle the error
  const classifications = await classifyAssets(assetInfos);

  // Apply results to DB
  const results = [];
  for (const classification of classifications) {
    const asset = assets.find(
      (a) => a.originalName === classification.fileName || a.fileName === classification.fileName
    );
    if (asset) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          category: classification.category,
          slotName: classification.suggestedSlotName || classification.category,
        },
      });
      results.push({
        id: asset.id,
        originalName: asset.originalName,
        category: classification.category,
        confidence: classification.confidence,
        slotName: classification.suggestedSlotName || classification.category,
      });
    }
  }

  return Response.json({
    classified: results.length,
    total: assets.length,
    results,
  });
});
