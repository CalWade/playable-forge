import { describe, it, expect } from 'vitest';
import { extractHtml } from '../lib/ai/orchestrator';

describe('extractHtml', () => {
  it('extracts HTML from markdown code block', () => {
    const text = '```html\n<!DOCTYPE html>\n<html><body>Hello</body></html>\n```';
    const result = extractHtml(text);
    expect(result).toBe('<!DOCTYPE html>\n<html><body>Hello</body></html>');
  });

  it('extracts HTML from code block without language hint', () => {
    const text = '```\n<!DOCTYPE html>\n<html><body>Test</body></html>\n```';
    const result = extractHtml(text);
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('returns raw text starting with <!DOCTYPE', () => {
    const text = '<!DOCTYPE html>\n<html><body>Direct</body></html>';
    expect(extractHtml(text)).toBe(text);
  });

  it('returns raw text starting with <html', () => {
    const text = '<html><body>No doctype</body></html>';
    expect(extractHtml(text)).toBe(text);
  });

  it('strips surrounding whitespace', () => {
    const text = '  \n<!DOCTYPE html>\n<html></html>\n  ';
    expect(extractHtml(text)).toBe('<!DOCTYPE html>\n<html></html>');
  });

  it('handles text with explanation before code block', () => {
    const text = 'Here is the HTML:\n\n```html\n<!DOCTYPE html><html></html>\n```\n\nDone!';
    expect(extractHtml(text)).toBe('<!DOCTYPE html><html></html>');
  });
});
