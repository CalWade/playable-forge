import { createOpenAI } from '@ai-sdk/openai';
import { getSettings, getAIConfig } from '@/lib/settings';
import type { AIOverrides } from '@/lib/settings';

/**
 * Create an OpenAI-compatible provider for a specific purpose.
 * Each purpose can have its own baseUrl, apiKey, and model.
 * Falls back to primary AI config for missing fields.
 */
export async function getProviderForPurpose(purpose?: keyof AIOverrides) {
  const config = purpose ? await getAIConfig(purpose) : await getPrimaryConfig();
  return createOpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey || 'ollama',
  });
}

/**
 * Get a chat model for a specific purpose.
 * Uses .chat() to force /v1/chat/completions (compatible with third-party APIs).
 */
export async function getModelForPurpose(purpose?: keyof AIOverrides, modelOverride?: string) {
  const config = purpose ? await getAIConfig(purpose) : await getPrimaryConfig();
  const provider = await getProviderForPurpose(purpose);
  return provider.chat(modelOverride || config.model);
}

// ==================== Backwards-compatible exports ====================

/**
 * Get the primary (generation) model. Used by orchestrator for generate/iterate/autofix.
 */
export async function getModel(modelId?: string) {
  return getModelForPurpose(undefined, modelId);
}

/**
 * Get the classification model. May use a different provider/model than generation.
 */
export async function getClassificationModel() {
  return getModelForPurpose('classification');
}

// ==================== Internal ====================

async function getPrimaryConfig() {
  const settings = await getSettings();
  return {
    baseUrl: settings.ai.baseUrl || 'https://api.openai.com/v1',
    model: settings.ai.model || 'gpt-4o',
    apiKey: settings.ai.apiKey,
    maxTokens: settings.ai.maxTokens,
  };
}
