import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';
import path from 'path';

// GET /api/library/[id]/thumbnail
export const GET = withAuth(async (request, { params, auth }) => {
  const url = new URL(request.url);
  
  // Handle thumbnail sub-route
  if (url.pathname.endsWith('/thumbnail')) {
    const libAsset = await prisma.assetLibrary.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!libAsset?.thumbnailPath) {
      return Response.json({ error: 'Thumbnail not found' }, { status: 404 });
    }
    try {
      const buffer = await fs.readFile(libAsset.thumbnailPath);
      return new Response(buffer, {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
      });
    } catch {
      return Response.json({ error: 'File not found' }, { status: 404 });
    }
  }

  const asset = await prisma.assetLibrary.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!asset) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ asset });
});

// DELETE /api/library/[id]
export const DELETE = withAuth(async (_request, { params, auth }) => {
  const asset = await prisma.assetLibrary.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!asset) return Response.json({ error: 'Not found' }, { status: 404 });

  // Delete files
  for (const p of [asset.filePath, asset.thumbnailPath, asset.base64CachePath]) {
    if (p) try { await fs.unlink(p); } catch { /* ignore */ }
  }

  await prisma.assetLibrary.delete({ where: { id: params.id } });
  return Response.json({ success: true });
});
