import { describe, it, expect } from 'vitest';
import { generateCombinations, buildVariantName } from '../lib/variants/generator';

describe('Variant Generator', () => {
  const dims = [
    {
      name: 'background',
      label: '背景图',
      assets: [
        { id: 'bg1', slotName: 'background', base64CachePath: '/tmp/bg1.b64', mimeType: 'image/jpeg', originalName: 'bg1.jpg' },
        { id: 'bg2', slotName: 'background', base64CachePath: '/tmp/bg2.b64', mimeType: 'image/jpeg', originalName: 'bg2.jpg' },
      ],
      enabled: true,
    },
    {
      name: 'popup',
      label: '弹窗',
      assets: [
        { id: 'pop1', slotName: 'popup', base64CachePath: '/tmp/pop1.b64', mimeType: 'image/png', originalName: 'pop1.png' },
        { id: 'pop2', slotName: 'popup', base64CachePath: '/tmp/pop2.b64', mimeType: 'image/png', originalName: 'pop2.png' },
        { id: 'pop3', slotName: 'popup', base64CachePath: '/tmp/pop3.b64', mimeType: 'image/png', originalName: 'pop3.png' },
      ],
      enabled: true,
    },
  ];

  it('generates correct number of combinations (cartesian product)', () => {
    const combos = generateCombinations(dims);
    expect(combos.length).toBe(6); // 2 × 3
  });

  it('each combination has all dimension keys', () => {
    const combos = generateCombinations(dims);
    for (const combo of combos) {
      expect(combo).toHaveProperty('background');
      expect(combo).toHaveProperty('popup');
    }
  });

  it('all asset IDs appear in combinations', () => {
    const combos = generateCombinations(dims);
    const bgIds = new Set(combos.map(c => c.background));
    const popIds = new Set(combos.map(c => c.popup));
    expect(bgIds).toEqual(new Set(['bg1', 'bg2']));
    expect(popIds).toEqual(new Set(['pop1', 'pop2', 'pop3']));
  });

  it('skips disabled dimensions', () => {
    const dimsWithDisabled = [
      { ...dims[0], enabled: false },
      dims[1],
    ];
    const combos = generateCombinations(dimsWithDisabled);
    expect(combos.length).toBe(3); // only popup dimension
    expect(combos[0]).not.toHaveProperty('background');
  });

  it('returns single empty combo for no dimensions', () => {
    const combos = generateCombinations([]);
    expect(combos.length).toBe(1);
    expect(combos[0]).toEqual({});
  });

  it('builds correct variant name', () => {
    const combo = { background: 'bg1', popup: 'pop2' };
    const name = buildVariantName(combo, dims);
    expect(name).toBe('background1_popup2');
  });
});
