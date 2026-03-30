import { createOpenAI } from '@ai-sdk/openai';

export function getAIProvider() {
  return createOpenAI({
    baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.AI_API_KEY || '',
  });
}

export function getModel(modelId?: string) {
  const provider = getAIProvider();
  return provider(modelId || process.env.AI_MODEL || 'gpt-4o');
}
