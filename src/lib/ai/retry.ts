export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; retryDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 2, retryDelay = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn(`AI call failed (attempt ${attempt + 1}), retrying...`, error);
      await new Promise((r) => setTimeout(r, retryDelay * (attempt + 1)));
    }
  }
  throw new Error('Unreachable');
}
