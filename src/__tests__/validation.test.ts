import { describe, it, expect } from 'vitest';
import { validate } from '../lib/validation/engine';

const VALID_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta name="viewport" content="width=device-width"><title>Test</title></head>
<body>
<script>
  mraid.open('https://example.com');
  mraid.addEventListener('ready', function(){});
  window.addEventListener('resize', function(){});
</script>
</body>
</html>`;

const MINIMAL_HTML = `<!DOCTYPE html><html><head></head><body></body></html>`;

describe('Validation Engine', () => {
  it('passes valid HTML with all requirements', () => {
    const result = validate(VALID_HTML);
    expect(result.grade).toBe('A');
    expect(result.failedCount).toBe(0);
  });

  it('detects missing mraid.open()', () => {
    const html = MINIMAL_HTML;
    const result = validate(html);
    const mraidRule = result.results.find(r => r.id === 'mraid-open');
    expect(mraidRule?.passed).toBe(false);
  });

  it('detects missing orientation handling', () => {
    const result = validate(MINIMAL_HTML);
    const rule = result.results.find(r => r.id === 'orientation');
    expect(rule?.passed).toBe(false);
  });

  it('detects missing viewport meta', () => {
    const result = validate(MINIMAL_HTML);
    const rule = result.results.find(r => r.id === 'viewport');
    expect(rule?.passed).toBe(false);
  });

  it('detects external references', () => {
    const html = `<!DOCTYPE html><html><head></head><body><script src="https://cdn.example.com/lib.js"></script></body></html>`;
    const result = validate(html);
    const rule = result.results.find(r => r.id === 'no-external-refs');
    expect(rule?.passed).toBe(false);
  });

  it('detects audio autoplay', () => {
    const html = `<!DOCTYPE html><html><head></head><body><audio autoplay src="test.mp3"></audio></body></html>`;
    const result = validate(html);
    const rule = result.results.find(r => r.id === 'audio-autoplay');
    expect(rule?.passed).toBe(false);
  });

  it('detects PLACEHOLDER remnants', () => {
    const html = `<!DOCTYPE html><html><head></head><body><img src="PLACEHOLDER" /></body></html>`;
    const result = validate(html);
    const rule = result.results.find(r => r.id === 'asset-integrity');
    expect(rule?.passed).toBe(false);
  });

  it('detects incomplete HTML structure', () => {
    const result = validate('<div>not html</div>');
    const rule = result.results.find(r => r.id === 'html-structure');
    expect(rule?.passed).toBe(false);
  });

  it('grades correctly: minimal HTML gets warnings but fewer errors', () => {
    const result = validate(MINIMAL_HTML);
    // Only html-structure passes (has doctype+html+head+body), most others are warnings now
    expect(result.warningCount).toBeGreaterThan(0);
  });

  it('file size check passes for small HTML', () => {
    const result = validate(VALID_HTML);
    const rule = result.results.find(r => r.id === 'file-size');
    expect(rule?.passed).toBe(true);
    expect(rule?.detail).toContain('KB');
  });
});
