import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';

export const GET = withAuth(async (_request, { params, auth }) => {
  const variant = await prisma.variant.findUnique({
    where: { id: params.variantId },
    include: { project: true },
  });
  if (!variant || variant.project.userId !== auth.userId) {
    return new Response('Not found', { status: 404 });
  }
  if (!variant.fullHtmlPath) {
    return new Response('HTML not generated', { status: 404 });
  }

  const html = await fs.readFile(variant.fullHtmlPath, 'utf-8');
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});
