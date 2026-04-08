import { describe, it, expect } from 'vitest';
import { DATA_DIR, PATHS } from '../lib/constants';

describe('Constants', () => {
  it('DATA_DIR has default value', () => {
    expect(DATA_DIR).toBe('./data');
  });

  it('PATHS.uploads returns correct path', () => {
    const p = PATHS.uploads('proj123');
    expect(p).toContain('data');
    expect(p).toContain('uploads');
    expect(p).toContain('proj123');
  });

  it('PATHS.base64 returns correct path', () => {
    const p = PATHS.base64('proj123');
    expect(p).toContain('base64');
    expect(p).toContain('proj123');
  });

  it('PATHS.html returns correct path', () => {
    const p = PATHS.html('proj123');
    expect(p).toContain('html');
  });

  it('PATHS.library returns correct path', () => {
    const p = PATHS.library('user123');
    expect(p).toContain('library');
    expect(p).toContain('user123');
  });

  it('PATHS.settings is a string', () => {
    expect(typeof PATHS.settings).toBe('string');
    expect(PATHS.settings).toContain('settings.json');
  });
});
