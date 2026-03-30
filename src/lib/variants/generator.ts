import { synthesize, saveHtml } from '@/lib/html/synthesizer';
import { validate } from '@/lib/validation/engine';
import { readBase64 } from '@/lib/assets/base64';

interface VariantDimension {
  name: string;
  label: string;
  assets: Array<{ id: string; slotName: string; base64CachePath: string; mimeType: string; originalName: string }>;
  enabled: boolean;
}

interface FixedAsset {
  slotName: string;
  base64CachePath: string;
  mimeType: string;
}

export interface VariantCombination {
  [slotName: string]: string; // slotName → assetId
}

/**
 * Generate cartesian product of variant dimensions
 */
export function generateCombinations(dimensions: VariantDimension[]): VariantCombination[] {
  const enabled = dimensions.filter((d) => d.enabled && d.assets.length > 0);
  if (enabled.length === 0) return [{}];

  let combos: VariantCombination[] = [{}];

  for (const dim of enabled) {
    const newCombos: VariantCombination[] = [];
    for (const combo of combos) {
      for (const asset of dim.assets) {
        newCombos.push({ ...combo, [dim.name]: asset.id });
      }
    }
    combos = newCombos;
  }

  return combos;
}

/**
 * Build variant name from combination
 */
export function buildVariantName(
  combo: VariantCombination,
  dimensions: VariantDimension[]
): string {
  const parts: string[] = [];
  for (const dim of dimensions) {
    if (combo[dim.name]) {
      const idx = dim.assets.findIndex((a) => a.id === combo[dim.name]) + 1;
      parts.push(`${dim.name}${idx}`);
    }
  }
  return parts.join('_') || 'variant';
}

interface BatchGenerateParams {
  skeleton: string;
  combinations: VariantCombination[];
  dimensions: VariantDimension[];
  fixedAssets: FixedAsset[];
  projectId: string;
}

export interface BatchResult {
  combination: VariantCombination;
  name: string;
  slotMapping: string;
  html: string;
  size: number;
  grade: string;
  validationJson: string;
  filePath: string;
}

export async function batchGenerate(params: BatchGenerateParams): Promise<BatchResult[]> {
  const { skeleton, combinations, dimensions, fixedAssets, projectId } = params;
  const results: BatchResult[] = [];

  // Pre-load all fixed assets base64
  const fixedSlotMap = new Map<string, { slotName: string; base64DataUri: string; mimeType: string }>();
  for (const fa of fixedAssets) {
    try {
      const b64 = await readBase64(fa.base64CachePath);
      fixedSlotMap.set(fa.slotName, { slotName: fa.slotName, base64DataUri: b64, mimeType: fa.mimeType });
    } catch { /* skip */ }
  }

  // Pre-load all variant assets base64
  const assetB64Cache = new Map<string, string>();
  for (const dim of dimensions) {
    for (const asset of dim.assets) {
      if (!assetB64Cache.has(asset.id)) {
        try {
          const b64 = await readBase64(asset.base64CachePath);
          assetB64Cache.set(asset.id, b64);
        } catch { /* skip */ }
      }
    }
  }

  for (const combo of combinations) {
    const name = buildVariantName(combo, dimensions);

    // Build slot map: start with fixed assets
    const slotAssets = new Map(fixedSlotMap);

    // Override with variant assets
    for (const dim of dimensions) {
      const assetId = combo[dim.name];
      if (assetId) {
        const asset = dim.assets.find((a) => a.id === assetId);
        if (asset) {
          const b64 = assetB64Cache.get(assetId);
          if (b64) {
            slotAssets.set(asset.slotName, {
              slotName: asset.slotName,
              base64DataUri: b64,
              mimeType: asset.mimeType,
            });
          }
        }
      }
    }

    const synthesized = synthesize(skeleton, slotAssets);
    const validation = validate(synthesized.html);
    const saved = await saveHtml(synthesized.html, projectId, `variants/${name}.html`);

    results.push({
      combination: combo,
      name,
      slotMapping: JSON.stringify(combo),
      html: synthesized.html,
      size: synthesized.size,
      grade: validation.grade,
      validationJson: JSON.stringify(validation.results),
      filePath: saved.filePath,
    });
  }

  return results;
}
