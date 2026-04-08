import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';

// GET /api/library/[id]/thumbnail
export const GET = withAuth(async (_request, { params, auth }) => {
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
});
