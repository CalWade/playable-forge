import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { synthesize } from '@/lib/html/synthesizer';
import { readBase64 } from '@/lib/assets/base64';

// GET /api/projects/[id]/preview — latest version preview
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuth(request);

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) return new Response('Not found', { status: 404 });

    // Get latest version
    const version = await prisma.htmlVersion.findFirst({
      where: { projectId: params.id },
      orderBy: { version: 'desc' },
    });
    if (!version) return new Response('No version yet', { status: 404 });

    // Get non-excluded assets
    const assets = await prisma.asset.findMany({
      where: { projectId: params.id, variantRole: { not: 'excluded' } },
    });

    // Build slot map
    const slotAssets = new Map<string, { slotName: string; base64DataUri: string; mimeType: string }>();
    for (const asset of assets) {
      if (asset.slotName && asset.base64CachePath) {
        try {
          const b64 = await readBase64(asset.base64CachePath);
          slotAssets.set(asset.slotName, {
            slotName: asset.slotName,
            base64DataUri: b64,
            mimeType: asset.mimeType,
          });
        } catch {
          // skip missing cache
        }
      }
    }

    const result = synthesize(version.skeletonHtml, slotAssets);

    return new Response(result.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    return new Response('Internal server error', { status: 500 });
  }
}
