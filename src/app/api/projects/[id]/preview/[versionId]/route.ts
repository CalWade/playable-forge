import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuth, handleAuthError } from '@/lib/auth/middleware';
import { synthesize } from '@/lib/html/synthesizer';
import { readBase64 } from '@/lib/assets/base64';

// GET /api/projects/[id]/preview/[versionId]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const auth = getAuth(request);

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!project) return new Response('Not found', { status: 404 });

    const version = await prisma.htmlVersion.findUnique({
      where: { id: params.versionId },
    });
    if (!version) return new Response('Version not found', { status: 404 });

    const assets = await prisma.asset.findMany({
      where: { projectId: params.id, variantRole: { not: 'excluded' } },
    });

    // Extract skeleton slots
    const skeletonSlots: string[] = [];
    const slotRegex = /data-variant-slot="([^"]+)"/g;
    let match;
    while ((match = slotRegex.exec(version.skeletonHtml)) !== null) {
      if (!skeletonSlots.includes(match[1])) {
        skeletonSlots.push(match[1]);
      }
    }

    // Smart slot matching (same logic as main preview)
    const slotAssets = new Map<string, { slotName: string; base64DataUri: string; mimeType: string }>();
    const usedAssetIds = new Set<string>();

    for (const slot of skeletonSlots) {
      let asset = assets.find(a => a.slotName === slot && a.base64CachePath && !usedAssetIds.has(a.id));

      if (!asset) {
        asset = assets.find(a => a.category === slot && a.base64CachePath && !usedAssetIds.has(a.id));
      }

      if (!asset) {
        const slotLower = slot.toLowerCase();
        asset = assets.find(a => {
          const nameLower = a.originalName.toLowerCase();
          return a.base64CachePath && !usedAssetIds.has(a.id) && (
            nameLower.includes(slotLower) ||
            slotLower.includes('background') && (nameLower.includes('背景') || nameLower.includes('bg')) ||
            slotLower.includes('popup') && (nameLower.includes('弹窗') || nameLower.includes('popup')) ||
            slotLower.includes('button') && (nameLower.includes('按钮') || nameLower.includes('btn'))
          );
        });
      }

      if (!asset) {
        const isAudioSlot = slot.includes('audio') || slot.includes('bgm') || slot.includes('sound');
        if (isAudioSlot) {
          asset = assets.find(a => a.mimeType.startsWith('audio/') && a.base64CachePath && !usedAssetIds.has(a.id));
        } else {
          asset = assets.find(a => a.mimeType.startsWith('image/') && a.base64CachePath && !usedAssetIds.has(a.id));
        }
      }

      if (asset && asset.base64CachePath) {
        try {
          const b64 = await readBase64(asset.base64CachePath);
          slotAssets.set(slot, { slotName: slot, base64DataUri: b64, mimeType: asset.mimeType });
          usedAssetIds.add(asset.id);
        } catch { /* skip */ }
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
