import { readBase64 } from '@/lib/assets/base64';

interface AssetRecord {
  id: string;
  originalName: string;
  mimeType: string;
  category: string;
  slotName: string | null;
  base64CachePath: string | null;
}

interface SlotAsset {
  slotName: string;
  base64DataUri: string;
  mimeType: string;
}

/**
 * Extract all unique data-variant-slot names from skeleton HTML
 */
export function extractSlotNames(skeletonHtml: string): string[] {
  const slots: string[] = [];
  const regex = /data-variant-slot="([^"]+)"/g;
  let match;
  while ((match = regex.exec(skeletonHtml)) !== null) {
    if (!slots.includes(match[1])) {
      slots.push(match[1]);
    }
  }
  return slots;
}

/**
 * Match assets to skeleton slots using multi-strategy fallback:
 * 1. Exact slotName match
 * 2. Category name match
 * 3. Fuzzy filename match (Chinese + English)
 * 4. MIME type fallback (images → image slots, audio → audio slots)
 */
export function matchAssetToSlot(
  slot: string,
  assets: AssetRecord[],
  usedAssetIds: Set<string>
): AssetRecord | null {
  // Strategy 1: exact slotName
  let asset = assets.find(
    (a) => a.slotName === slot && a.base64CachePath && !usedAssetIds.has(a.id)
  );

  // Strategy 2: category match
  if (!asset) {
    asset = assets.find(
      (a) => a.category === slot && a.base64CachePath && !usedAssetIds.has(a.id)
    );
  }

  // Strategy 3: fuzzy filename
  if (!asset) {
    const slotLower = slot.toLowerCase();
    asset = assets.find((a) => {
      const nameLower = a.originalName.toLowerCase();
      return (
        a.base64CachePath &&
        !usedAssetIds.has(a.id) &&
        (nameLower.includes(slotLower) ||
          (slotLower.includes('background') &&
            (nameLower.includes('背景') || nameLower.includes('bg') || nameLower.includes('background'))) ||
          (slotLower.includes('popup') &&
            (nameLower.includes('弹窗') || nameLower.includes('popup') || nameLower.includes('dialog'))) ||
          (slotLower.includes('button') &&
            (nameLower.includes('按钮') || nameLower.includes('btn') || nameLower.includes('button') || nameLower.includes('cta'))))
      );
    });
  }

  // Strategy 4: MIME type fallback
  if (!asset) {
    const isAudioSlot =
      slot.includes('audio') || slot.includes('bgm') || slot.includes('sound') || slot.includes('music');
    if (isAudioSlot) {
      asset = assets.find(
        (a) => a.mimeType.startsWith('audio/') && a.base64CachePath && !usedAssetIds.has(a.id)
      );
    } else {
      asset = assets.find(
        (a) => a.mimeType.startsWith('image/') && a.base64CachePath && !usedAssetIds.has(a.id)
      );
    }
  }

  return asset || null;
}

/**
 * Build a complete slot→base64 map for synthesizing HTML.
 * Combines slot extraction, asset matching, and base64 loading.
 */
export async function buildSlotMap(
  skeletonHtml: string,
  assets: AssetRecord[]
): Promise<Map<string, SlotAsset>> {
  const slots = extractSlotNames(skeletonHtml);
  const slotAssets = new Map<string, SlotAsset>();
  const usedAssetIds = new Set<string>();

  for (const slot of slots) {
    const asset = matchAssetToSlot(slot, assets, usedAssetIds);
    if (asset && asset.base64CachePath) {
      try {
        const b64 = await readBase64(asset.base64CachePath);
        slotAssets.set(slot, {
          slotName: slot,
          base64DataUri: b64,
          mimeType: asset.mimeType,
        });
        usedAssetIds.add(asset.id);
      } catch {
        // skip missing cache
      }
    }
  }

  return slotAssets;
}
