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

    // Get non-excluded assets with base64
    const assets = await prisma.asset.findMany({
      where: { projectId: params.id, variantRole: { not: 'excluded' } },
    });

    // Extract all slot names from skeleton
    const skeletonSlots: string[] = [];
    const slotRegex = /data-variant-slot="([^"]+)"/g;
    let match;
    while ((match = slotRegex.exec(version.skeletonHtml)) !== null) {
      if (!skeletonSlots.includes(match[1])) {
        skeletonSlots.push(match[1]);
      }
    }

    console.log(`[Preview] Skeleton slots: ${skeletonSlots.join(', ')}`);
    console.log(`[Preview] Assets: ${assets.map(a => `${a.originalName}(slot=${a.slotName})`).join(', ')}`);

    // Build slot map - try multiple matching strategies
    const slotAssets = new Map<string, { slotName: string; base64DataUri: string; mimeType: string }>();
    const usedAssetIds = new Set<string>();

    for (const slot of skeletonSlots) {
      // Strategy 1: exact slotName match
      let asset = assets.find(a => a.slotName === slot && a.base64CachePath && !usedAssetIds.has(a.id));

      // Strategy 2: category match (e.g., slot="background" matches category="background")
      if (!asset) {
        asset = assets.find(a => a.category === slot && a.base64CachePath && !usedAssetIds.has(a.id));
      }

      // Strategy 3: fuzzy match on original filename
      if (!asset) {
        const slotLower = slot.toLowerCase();
        asset = assets.find(a => {
          const nameLower = a.originalName.toLowerCase();
          return a.base64CachePath && !usedAssetIds.has(a.id) && (
            nameLower.includes(slotLower) ||
            slotLower.includes('background') && (nameLower.includes('背景') || nameLower.includes('bg') || nameLower.includes('background')) ||
            slotLower.includes('popup') && (nameLower.includes('弹窗') || nameLower.includes('popup') || nameLower.includes('dialog')) ||
            slotLower.includes('button') && (nameLower.includes('按钮') || nameLower.includes('btn') || nameLower.includes('button') || nameLower.includes('cta'))
          );
        });
      }

      // Strategy 4: if only one image asset, and one image slot, just match them
      if (!asset && assets.filter(a => a.mimeType.startsWith('image/') && a.base64CachePath && !usedAssetIds.has(a.id)).length > 0) {
        // Match by mime type: image slots get image assets, audio slots get audio assets
        const isAudioSlot = slot.includes('audio') || slot.includes('bgm') || slot.includes('sound') || slot.includes('music');
        if (isAudioSlot) {
          asset = assets.find(a => a.mimeType.startsWith('audio/') && a.base64CachePath && !usedAssetIds.has(a.id));
        } else {
          asset = assets.find(a => a.mimeType.startsWith('image/') && a.base64CachePath && !usedAssetIds.has(a.id));
        }
      }

      if (asset && asset.base64CachePath) {
        try {
          const b64 = await readBase64(asset.base64CachePath);
          slotAssets.set(slot, {
            slotName: slot,
            base64DataUri: b64,
            mimeType: asset.mimeType,
          });
          usedAssetIds.add(asset.id);
          console.log(`[Preview] Slot "${slot}" → ${asset.originalName} (strategy match)`);
        } catch {
          console.log(`[Preview] Slot "${slot}" → base64 read failed for ${asset.originalName}`);
        }
      } else {
        console.log(`[Preview] Slot "${slot}" → NO MATCH`);
      }
    }

    const result = synthesize(version.skeletonHtml, slotAssets);

    console.log(`[Preview] Result: ${result.replacedSlots.length} replaced, ${result.unreplacedSlots.length} unreplaced`);

    return new Response(result.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    if ((error as Error).name === 'AuthError') return handleAuthError(error);
    console.error('[Preview] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
