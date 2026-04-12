import { describe, it, expect } from 'vitest';
import { extractSlotNames, matchAssetToSlot } from '../lib/html/slot-matcher';
import type { AssetRecord } from '../types';

const SKELETON = `
<img data-variant-slot="background" src="PLACEHOLDER" />
<img data-variant-slot="popup" src="PLACEHOLDER" />
<img data-variant-slot="button" src="PLACEHOLDER" />
<audio data-variant-slot="bgm" src="PLACEHOLDER"></audio>
`;

function makeAsset(overrides: Partial<AssetRecord>): AssetRecord {
  return {
    id: 'test-id',
    fileName: 'test.png',
    originalName: 'test.png',
    mimeType: 'image/png',
    fileSize: 1000,
    compressedSize: 800,
    base64CachePath: '/tmp/test.b64',
    thumbnailPath: null,
    category: 'unrecognized',
    categoryConfirmed: false,
    variantRole: 'fixed',
    variantGroup: null,
    slotName: null,
    width: 100,
    height: 100,
    ...overrides,
  };
}

describe('Slot Matcher', () => {
  describe('extractSlotNames', () => {
    it('extracts all unique slot names', () => {
      const slots = extractSlotNames(SKELETON);
      expect(slots).toEqual(['background', 'popup', 'button', 'bgm']);
    });

    it('deduplicates slot names', () => {
      const html = '<img data-variant-slot="bg" /><img data-variant-slot="bg" />';
      expect(extractSlotNames(html)).toEqual(['bg']);
    });

    it('returns empty for no slots', () => {
      expect(extractSlotNames('<div>no slots</div>')).toEqual([]);
    });
  });

  describe('matchAssetToSlot', () => {
    it('matches by exact slotName', () => {
      const assets = [makeAsset({ id: 'a1', slotName: 'background' })];
      const result = matchAssetToSlot('background', assets, new Set());
      expect(result?.id).toBe('a1');
    });

    it('returns null when slotName does not match', () => {
      const assets = [makeAsset({ id: 'a1', slotName: 'popup' })];
      const result = matchAssetToSlot('background', assets, new Set());
      expect(result).toBeNull();
    });

    it('returns null for unrecognized slotName', () => {
      const assets = [makeAsset({ id: 'a1', category: 'background', slotName: null })];
      const result = matchAssetToSlot('background', assets, new Set());
      expect(result).toBeNull();
    });

    it('respects usedAssetIds', () => {
      const assets = [
        makeAsset({ id: 'a1', slotName: 'background' }),
        makeAsset({ id: 'a2', slotName: 'background' }),
      ];
      const result = matchAssetToSlot('background', assets, new Set(['a1']));
      expect(result?.id).toBe('a2');
    });

    it('skips assets without base64CachePath', () => {
      const assets = [makeAsset({ id: 'a1', slotName: 'background', base64CachePath: null })];
      const result = matchAssetToSlot('background', assets, new Set());
      expect(result).toBeNull();
    });
  });
});
