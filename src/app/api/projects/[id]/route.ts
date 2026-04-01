import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
    include: { stats: true, _count: { select: { variants: true, assets: true, versions: true } } },
  });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
  return Response.json({ project });
});

export const PATCH = withAuth(async (request, { params, auth }) => {
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });
  return Response.json({ project: updated });
});

export const DELETE = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: auth.userId } });
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const dirs = ['uploads', 'base64', 'html'].map((d) => path.join(DATA_DIR, d, params.id));
  for (const dir of dirs) {
    try { await fs.rm(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  await prisma.variant.deleteMany({ where: { projectId: params.id } });
  await prisma.variantAsset.deleteMany({ where: { projectId: params.id } });
  await prisma.conversationMessage.deleteMany({ where: { projectId: params.id } });
  await prisma.htmlVersion.deleteMany({ where: { projectId: params.id } });
  await prisma.asset.deleteMany({ where: { projectId: params.id } });
  await prisma.projectStats.deleteMany({ where: { projectId: params.id } });
  await prisma.project.delete({ where: { id: params.id } });

  return Response.json({ success: true });
});
