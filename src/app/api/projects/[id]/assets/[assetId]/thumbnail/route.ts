import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    const auth = getAuth(request);

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) {
      return new Response('Not found', { status: 404 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: params.assetId } });
    if (!asset || !asset.thumbnailPath) {
      return new Response('Not found', { status: 404 });
    }

    const buffer = await fs.readFile(asset.thumbnailPath);
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return new Response('Internal server error', { status: 500 });
  }
}
