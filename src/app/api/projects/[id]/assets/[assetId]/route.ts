import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { z } from 'zod';
import fs from 'fs/promises';

const updateSchema = z.object({
  category: z.string().optional(),
  categoryConfirmed: z.boolean().optional(),
  variantRole: z.enum(['variant', 'fixed', 'excluded']).optional(),
  variantGroup: z.string().nullable().optional(),
  slotName: z.string().nullable().optional(),
});

// PATCH /api/projects/[id]/assets/[assetId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    const auth = getAuth(request);

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    const asset = await prisma.asset.update({
      where: { id: params.assetId },
      data: parsed.data,
    });

    return Response.json({ asset });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    console.error('Update asset error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/assets/[assetId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assetId: string } }
) {
  try {
    const auth = getAuth(request);

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: params.assetId } });
    if (!asset) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Delete files
    const filesToDelete = [asset.filePath, asset.thumbnailPath, asset.base64CachePath].filter(Boolean);
    for (const f of filesToDelete) {
      try {
        await fs.unlink(f!);
      } catch {
        // ignore missing files
      }
    }

    await prisma.asset.delete({ where: { id: params.assetId } });

    return Response.json({ success: true });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    console.error('Delete asset error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
