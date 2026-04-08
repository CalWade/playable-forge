import { describe, it, expect } from 'vitest';
import { ApiError } from '../lib/api-client';

describe('ApiError', () => {
  it('has correct name and status', () => {
    const err = new ApiError('Not found', 404);
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
    expect(err instanceof Error).toBe(true);
  });
});
