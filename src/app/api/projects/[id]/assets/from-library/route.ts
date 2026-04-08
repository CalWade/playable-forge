import { DATA_DIR } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { generateBase64 } from '@/lib/assets/base64';
import fs from 'fs/promises';
import path from 'path';



// POST /api/projects/[id]/assets/from-library — import asset from library
export const POST = withAuth(async (request, { params, auth }) => {
  const projectId = params.id;
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: auth.userId } });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const body = await request.json();
  const { libraryAssetId } = body as { libraryAssetId: string };
  if (!libraryAssetId) return Response.json({ error: 'libraryAssetId required' }, { status: 400 });

  const libAsset = await prisma.assetLibrary.findFirst({
    where: { id: libraryAssetId, userId: auth.userId },
  });
  if (!libAsset) return Response.json({ error: 'Library asset not found' }, { status: 404 });

  // Copy files to project directory
  const uploadDir = path.join(DATA_DIR, 'uploads', projectId);
  const base64Dir = path.join(DATA_DIR, 'base64', projectId);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.mkdir(base64Dir, { recursive: true });

  const assetId = `asset_${Date.now()}`;
  const ext = path.extname(libAsset.fileName);
  const newFileName = `${assetId}-compressed${ext}`;
  const newFilePath = path.join(uploadDir, newFileName);
  await fs.copyFile(libAsset.filePath, newFilePath);

  // Copy thumbnail
  let thumbnailPath: string | null = null;
  if (libAsset.thumbnailPath) {
    thumbnailPath = path.join(uploadDir, `${assetId}-thumbnail.jpg`);
    try { await fs.copyFile(libAsset.thumbnailPath, thumbnailPath); } catch { thumbnailPath = null; }
  }

  // Compute base64
  let base64CachePath: string | null = null;
  try {
    base64CachePath = await generateBase64(newFilePath, libAsset.mimeType, projectId, assetId);
  } catch { /* ignore */ }

  const asset = await prisma.asset.create({
    data: {
      projectId,
      fileName: newFileName,
      originalName: libAsset.originalName,
      mimeType: libAsset.mimeType,
      fileSize: libAsset.fileSize,
      compressedSize: libAsset.compressedSize,
      width: libAsset.width,
      height: libAsset.height,
      filePath: newFilePath,
      thumbnailPath,
      base64CachePath,
      category: libAsset.category,
      categoryConfirmed: true,
    },
  });

  // Increment usage count
  await prisma.assetLibrary.update({
    where: { id: libraryAssetId },
    data: { usageCount: { increment: 1 } },
  });

  return Response.json({ asset }, { status: 201 });
});
