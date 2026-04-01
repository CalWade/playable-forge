import { describe, it, expect } from 'vitest';
import { validateAIResponse } from '../lib/ai/response-validator';

describe('AI Response Validator', () => {
  it('accepts valid HTML', () => {
    const result = validateAIResponse('<!DOCTYPE html><html><head></head><body>hello</body></html>');
    expect(result.status).toBe('valid');
  });

  it('detects empty response', () => {
    expect(validateAIResponse('').status).toBe('empty');
    expect(validateAIResponse('   ').status).toBe('empty');
    expect(validateAIResponse('hi').status).toBe('empty');
  });

  it('detects refusal', () => {
    const result = validateAIResponse("I'm sorry, I can't generate content that involves gambling.");
    expect(result.status).toBe('refused');
  });

  it('detects refusal even with HTML attached', () => {
    const result = validateAIResponse("I'm sorry, but here's a basic template:\n<!DOCTYPE html><html><body></body></html>");
    expect(result.status).toBe('refused');
  });

  it('detects Chinese refusal', () => {
    const result = validateAIResponse('我无法生成包含赌博内容的广告');
    expect(result.status).toBe('refused');
  });

  it('detects truncated HTML', () => {
    const result = validateAIResponse('<!DOCTYPE html><html><head></head><body><div>content');
    expect(result.status).toBe('truncated');
  });

  it('detects question', () => {
    const result = validateAIResponse('这些背景图是轮播展示还是随机选一张？');
    expect(result.status).toBe('question');
  });

  it('treats no-HTML non-refusal as refused', () => {
    const result = validateAIResponse('Here are some suggestions for your ad campaign layout and design approach.');
    expect(result.status).toBe('refused');
  });
});
