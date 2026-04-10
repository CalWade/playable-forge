import { DATA_DIR } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { processImage, processAudio, isImage, isAudio } from '@/lib/assets/processor';
import { generateBase64 } from '@/lib/assets/base64';
import { logActivity } from '@/lib/activity-log';
import { classifyAssets } from '@/lib/ai/classify';
import path from 'path';
import fs from 'fs/promises';



export const POST = withAuth(async (request, { params, auth }) => {
  const projectId = params.id;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  if (files.length === 0) return Response.json({ error: 'No files provided' }, { status: 400 });

  const uploadDir = path.join(DATA_DIR, 'uploads', projectId);
  await fs.mkdir(uploadDir, { recursive: true });

  const assets = [];

  for (const file of files) {
    const assetId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const ext = path.extname(file.name).toLowerCase() || '.bin';
    const fileName = `${assetId}-original${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const fileSize = buffer.length;
    const mimeType = file.type || 'application/octet-stream';

    let compressedSize = fileSize;
    let compressedPath = filePath;
    let thumbnailPath: string | null = null;
    let width: number | null = null;
    let height: number | null = null;
    let duration: number | null = null;
    let base64CachePath: string | null = null;

    if (isImage(mimeType)) {
      const result = await processImage(filePath, projectId, assetId);
      compressedPath = result.compressedPath;
      compressedSize = result.compressedSize;
      thumbnailPath = result.thumbnailPath;
      width = result.width;
      height = result.height;
      base64CachePath = await generateBase64(compressedPath, mimeType, projectId, assetId);
    } else if (isAudio(mimeType)) {
      const result = await processAudio(filePath, projectId, assetId);
      compressedPath = result.compressedPath;
      compressedSize = result.compressedSize;
      duration = result.duration;
      base64CachePath = await generateBase64(compressedPath, mimeType, projectId, assetId);
    }

    const asset = await prisma.asset.create({
      data: {
        projectId, fileName, originalName: file.name, mimeType, fileSize,
        compressedSize, width, height, duration,
        filePath: compressedPath, thumbnailPath, base64CachePath,
      },
    });

    assets.push({
      id: asset.id, fileName: asset.fileName, originalName: asset.originalName,
      mimeType: asset.mimeType, fileSize: asset.fileSize,
      compressedSize: asset.compressedSize, width: asset.width, height: asset.height,
      category: asset.category,
      thumbnailUrl: thumbnailPath ? `/api/projects/${projectId}/assets/${asset.id}/thumbnail` : null,
    });
  }

  // AI classification (with thumbnails for visual analysis)
  try {
    const dbAssets = await prisma.asset.findMany({
      where: { id: { in: assets.map(a => a.id) } },
      select: { id: true, fileName: true, originalName: true, mimeType: true, fileSize: true, width: true, height: true, thumbnailPath: true },
    });
    const assetInfos = dbAssets.map((a) => ({
      fileName: a.fileName, originalName: a.originalName,
      mimeType: a.mimeType, fileSize: a.fileSize,
      width: a.width, height: a.height,
      thumbnailPath: a.thumbnailPath,
    }));
    const classifications = await classifyAssets(assetInfos);

    for (const classification of classifications) {
      const asset = assets.find((a) => a.originalName === classification.fileName || a.fileName === classification.fileName);
      if (asset) {
        await prisma.asset.update({
          where: { id: asset.id },
          data: {
            category: classification.category,
            slotName: classification.suggestedSlotName || classification.category,
          },
        });
        asset.category = classification.category;
      }
    }
  } catch (classifyError) {
    console.error('Classification failed, assets remain unrecognized:', classifyError);
  }

  // Estimate HTML size: only count initial (non-excluded) assets
  const allInitialAssets = await prisma.asset.findMany({
    where: { projectId, variantRole: { not: 'excluded' } },
    select: { compressedSize: true },
  });
  const baseSize = allInitialAssets.reduce((sum, a) => sum + (a.compressedSize || 0), 0);
  const estimatedHtmlSize = Math.ceil(baseSize * 1.37);

  await logActivity({
    projectId, userId: auth.userId,
    action: 'upload_asset',
    description: `上传 ${assets.length} 个素材`,
    metadata: { fileNames: assets.map(a => a.originalName) },
  });

  return Response.json({
    assets,
    totalSize: assets.reduce((sum, a) => sum + (a.compressedSize || 0), 0),
    estimatedHtmlSize,
  });
});
