import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import fs from 'fs/promises';

const updateSchema = z.object({
  category: z.string().optional(),
  categoryConfirmed: z.boolean().optional(),
  variantRole: z.enum(['variant', 'fixed', 'excluded']).optional(),
  variantGroup: z.string().nullable().optional(),
  slotName: z.string().nullable().optional(),
});

export const PATCH = withAuth(async (request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });

  const asset = await prisma.asset.update({
    where: { id: params.assetId },
    data: parsed.data,
  });

  return Response.json({ asset });
});

export const DELETE = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const asset = await prisma.asset.findUnique({ where: { id: params.assetId } });
  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 });

  const filesToDelete = [asset.filePath, asset.thumbnailPath, asset.base64CachePath].filter(Boolean);
  for (const f of filesToDelete) {
    try { await fs.unlink(f!); } catch (e) { console.warn("Ignored:", e instanceof Error ? e.message : e); }
  }

  await prisma.asset.delete({ where: { id: params.assetId } });
  return Response.json({ success: true });
});
