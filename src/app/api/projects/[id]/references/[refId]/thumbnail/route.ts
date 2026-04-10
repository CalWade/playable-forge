import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!project) return new Response('Not found', { status: 404 });

  const ref = await prisma.referenceImage.findFirst({ where: { id: params.refId, projectId: params.id } });
  if (!ref?.thumbnailPath) return new Response('Not found', { status: 404 });

  try {
    const buffer = await fs.readFile(ref.thumbnailPath);
    return new Response(buffer, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return new Response('File not found', { status: 404 });
  }
});
