import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import fs from 'fs/promises';

// GET /api/variants/[variantId]/preview
export async function GET(
  request: NextRequest,
  { params }: { params: { variantId: string } }
) {
  try {
    const auth = getAuth(request);

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
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return new Response('Internal server error', { status: 500 });
  }
}
