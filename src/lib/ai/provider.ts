import { createOpenAI } from '@ai-sdk/openai';
import { getSettings } from '@/lib/settings';

export async function getAIProvider() {
  const settings = await getSettings();
  return createOpenAI({
    baseURL: settings.ai.baseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: settings.ai.apiKey || process.env.AI_API_KEY || 'ollama',
  });
}

export async function getModel(modelId?: string) {
  const settings = await getSettings();
  const provider = await getAIProvider();
  const model = modelId || settings.ai.model || process.env.AI_MODEL || 'gpt-4o';
  // Use .chat() to force /v1/chat/completions endpoint.
  // Default provider(model) uses /responses which third-party APIs don't support.
  return provider.chat(model);
}
