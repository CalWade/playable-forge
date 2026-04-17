import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return new Response('Not found', { status: 404 });

  const asset = await prisma.asset.findFirst({
    where: { id: params.assetId, projectId: params.id },
  });
  if (!asset || !asset.thumbnailPath) return new Response('Not found', { status: 404 });

  const buffer = await fs.readFile(asset.thumbnailPath);
  return new Response(buffer, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' },
  });
});
