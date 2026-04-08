import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';

// GET /api/library/[id]
export const GET = withAuth(async (_request, { params, auth }) => {
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
