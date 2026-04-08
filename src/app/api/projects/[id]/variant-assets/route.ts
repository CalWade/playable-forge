import { DATA_DIR } from '@/lib/constants';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { processImage, isImage } from '@/lib/assets/processor';
import { generateBase64 } from '@/lib/assets/base64';
import { inferFromFile } from '@/lib/assets/classifier';
import path from 'path';
import fs from 'fs/promises';



// POST /api/projects/[id]/variant-assets — upload variant-only assets
export const POST = withAuth(async (request, { params, auth }) => {
  const projectId = params.id;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const dimensionGroup = formData.get('dimensionGroup') as string | null;

  if (files.length === 0) return Response.json({ error: 'No files' }, { status: 400 });

  const uploadDir = path.join(DATA_DIR, 'uploads', projectId, 'variants');
  await fs.mkdir(uploadDir, { recursive: true });

  const assets = [];

  for (const file of files) {
    const assetId = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const ext = path.extname(file.name).toLowerCase() || '.bin';
    const fileName = `${assetId}-original${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const mimeType = file.type || 'application/octet-stream';
    let compressedSize = buffer.length;
    let compressedPath = filePath;
    let thumbnailPath: string | null = null;
    let width: number | null = null;
    let height: number | null = null;
    let base64CachePath: string | null = null;

    if (isImage(mimeType)) {
      const result = await processImage(filePath, projectId, assetId);
      compressedPath = result.compressedPath;
      compressedSize = result.compressedSize;
      thumbnailPath = result.thumbnailPath;
      width = result.width;
      height = result.height;
      base64CachePath = await generateBase64(compressedPath, mimeType, projectId, assetId);
    }

    // Infer dimension from filename if not specified
    const inferred = inferFromFile({ originalName: file.name, mimeType, width, height });
    const group = dimensionGroup || inferred.variantGroup || inferred.slotName;
    const slotName = inferred.slotName;

    const asset = await prisma.variantAsset.create({
      data: {
        projectId,
        fileName,
        originalName: file.name,
        mimeType,
        fileSize: buffer.length,
        compressedSize,
        width,
        height,
        filePath: compressedPath,
        thumbnailPath,
        base64CachePath,
        slotName,
        dimensionGroup: group,
      },
    });

    assets.push({
      id: asset.id,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      compressedSize: asset.compressedSize,
      dimensionGroup: asset.dimensionGroup,
      slotName: asset.slotName,
      thumbnailUrl: thumbnailPath ? `/api/projects/${projectId}/variant-assets/${asset.id}/thumbnail` : null,
    });
  }

  return Response.json({ assets });
});

// GET /api/projects/[id]/variant-assets — list variant assets
export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const assets = await prisma.variantAsset.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json({
    assets: assets.map((a) => ({
      id: a.id,
      originalName: a.originalName,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
      compressedSize: a.compressedSize,
      width: a.width,
      height: a.height,
      slotName: a.slotName,
      dimensionGroup: a.dimensionGroup,
      thumbnailUrl: a.thumbnailPath ? `/api/projects/${params.id}/variant-assets/${a.id}/thumbnail` : null,
    })),
  });
});
