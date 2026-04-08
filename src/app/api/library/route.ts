import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';

// GET /api/library — list library assets
export const GET = withAuth(async (request, { auth }) => {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');

  const where: Record<string, unknown> = { userId: auth.userId };
  if (category) where.category = category;
  if (search) where.originalName = { contains: search };

  const assets = await prisma.assetLibrary.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      compressedSize: true,
      width: true,
      height: true,
      category: true,
      usageCount: true,
      createdAt: true,
    },
  });

  return Response.json({
    assets: assets.map((a) => ({
      ...a,
      thumbnailUrl: `/api/library/${a.id}/thumbnail`,
    })),
  });
});

// POST /api/library — save project asset to library
export const POST = withAuth(async (request, { auth }) => {
  const body = await request.json();
  const { assetId, projectId } = body as { assetId: string; projectId: string };

  if (!assetId || !projectId) {
    return Response.json({ error: 'assetId and projectId required' }, { status: 400 });
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: auth.userId } });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const asset = await prisma.asset.findFirst({ where: { id: assetId, projectId } });
  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 });

  // Copy file to library directory
  const libraryDir = path.join(DATA_DIR, 'library', auth.userId);
  await fs.mkdir(libraryDir, { recursive: true });

  const ext = path.extname(asset.fileName);
  const libId = `lib_${Date.now()}`;
  const libFileName = `${libId}${ext}`;
  const libFilePath = path.join(libraryDir, libFileName);

  await fs.copyFile(asset.filePath, libFilePath);

  // Copy thumbnail if exists
  let thumbnailPath: string | null = null;
  if (asset.thumbnailPath) {
    const thumbFileName = `${libId}-thumbnail.jpg`;
    thumbnailPath = path.join(libraryDir, thumbFileName);
    try {
      await fs.copyFile(asset.thumbnailPath, thumbnailPath);
    } catch { thumbnailPath = null; }
  }

  // Copy base64 cache if exists
  let base64CachePath: string | null = null;
  if (asset.base64CachePath) {
    const b64FileName = `${libId}.b64`;
    base64CachePath = path.join(libraryDir, b64FileName);
    try {
      await fs.copyFile(asset.base64CachePath, base64CachePath);
    } catch { base64CachePath = null; }
  }

  const libraryAsset = await prisma.assetLibrary.create({
    data: {
      userId: auth.userId,
      fileName: libFileName,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      compressedSize: asset.compressedSize,
      width: asset.width,
      height: asset.height,
      filePath: libFilePath,
      thumbnailPath,
      base64CachePath,
      category: asset.category,
    },
  });

  return Response.json({ asset: libraryAsset }, { status: 201 });
});
