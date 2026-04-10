import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import { synthesize } from '@/lib/html/synthesizer';
import { buildSlotMap } from '@/lib/html/slot-matcher';

export const GET = withAuth(async (_request, { params, auth }) => {
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: auth.userId },
  });
  if (!project) return new Response('Not found', { status: 404 });

  const version = await prisma.htmlVersion.findFirst({
    where: { projectId: params.id },
    orderBy: { version: 'desc' },
  });
  if (!version) return new Response('No version yet', { status: 404 });

  const assets = await prisma.asset.findMany({
    where: { projectId: params.id },
  });

  const slotAssets = await buildSlotMap(version.skeletonHtml, assets);
  const result = synthesize(version.skeletonHtml, slotAssets);

  return new Response(result.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
});
