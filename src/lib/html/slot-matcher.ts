import { readBase64 } from '@/lib/assets/base64';
import type { AssetRecord, SlotAsset } from '@/types';

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
 * Match asset to slot by exact slotName.
 * No fuzzy matching — if slotName doesn't match, return null.
 * User should fix mismatches via the UI.
 */
export function matchAssetToSlot(
  slot: string,
  assets: AssetRecord[],
  usedAssetIds: Set<string>
): AssetRecord | null {
  const asset = assets.find(
    (a) => a.slotName === slot && a.base64CachePath && !usedAssetIds.has(a.id)
  );
  return asset || null;
}

/**
 * Build a complete slot→base64 map for synthesizing HTML.
 * Only exact slotName matches are used. Unmatched slots remain as PLACEHOLDER.
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
