import { describe, it, expect } from 'vitest';
import { synthesize } from '../lib/html/synthesizer';
import type { SlotAsset } from '../types';

const SKELETON = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <img data-variant-slot="background" src="data:image/png;base64,PLACEHOLDER" />
  <img data-variant-slot="popup" src="data:image/png;base64,PLACEHOLDER" />
  <audio data-variant-slot="bgm" src="data:audio/mp3;base64,PLACEHOLDER"></audio>
</body>
</html>`;

describe('HTML Synthesizer', () => {
  it('replaces PLACEHOLDER with base64 data URIs', () => {
    const slotAssets = new Map<string, SlotAsset>([
      ['background', { slotName: 'background', base64DataUri: 'data:image/png;base64,ABC123', mimeType: 'image/png' }],
      ['popup', { slotName: 'popup', base64DataUri: 'data:image/png;base64,DEF456', mimeType: 'image/png' }],
    ]);

    const result = synthesize(SKELETON, slotAssets);
    expect(result.html).toContain('data:image/png;base64,ABC123');
    expect(result.html).toContain('data:image/png;base64,DEF456');
    expect(result.replacedSlots).toContain('background');
    expect(result.replacedSlots).toContain('popup');
  });

  it('reports unreplaced PLACEHOLDERs', () => {
    const slotAssets = new Map<string, SlotAsset>([
      ['background', { slotName: 'background', base64DataUri: 'data:image/png;base64,ABC', mimeType: 'image/png' }],
    ]);

    const result = synthesize(SKELETON, slotAssets);
    // popup and bgm still have PLACEHOLDER
    expect(result.unreplacedSlots.length).toBeGreaterThanOrEqual(1);
  });

  it('calculates size correctly', () => {
    const slotAssets = new Map<string, SlotAsset>();
    const result = synthesize(SKELETON, slotAssets);
    expect(result.size).toBe(Buffer.byteLength(result.html, 'utf-8'));
    expect(result.size).toBeGreaterThan(0);
  });

  it('handles empty slot map gracefully', () => {
    const result = synthesize(SKELETON, new Map());
    expect(result.html).toContain('PLACEHOLDER');
    expect(result.replacedSlots).toHaveLength(0);
  });

  it('handles skeleton with no slots', () => {
    const noSlotHtml = '<!DOCTYPE html><html><head></head><body>No slots here</body></html>';
    const result = synthesize(noSlotHtml, new Map());
    expect(result.unreplacedSlots).toHaveLength(0);
    expect(result.replacedSlots).toHaveLength(0);
  });
});
