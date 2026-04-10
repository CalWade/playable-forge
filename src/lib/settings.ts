import { DATA_DIR } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

// ==================== AI Provider Config ====================

/**
 * A single AI provider configuration.
 * Used for both the primary (generation) config and per-purpose overrides.
 */
export interface AIProviderConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  maxTokens: number;
}

/**
 * Per-purpose AI configurations.
 * Each purpose can override any field; missing fields fall back to the primary `ai` config.
 */
export interface AIOverrides {
  classification?: Partial<AIProviderConfig>;
  // Future: embedding, tts, etc.
}

// ==================== App Settings ====================

export interface AppSettings {
  ai: AIProviderConfig & {
    systemPromptOverride?: string;
  };
  aiOverrides?: AIOverrides;
  validation: {
    maxFileSize: number;
    warnFileSize: number;
    platform: string;
  };
  compression: {
    imageQuality: number;
    maxImageWidth: number;
    audioTargetKbps: number;
  };
  webhook?: {
    url: string;
    events: string[];
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-4o',
    maxTokens: 16000,
  },
  validation: {
    maxFileSize: 5 * 1024 * 1024,
    warnFileSize: 4 * 1024 * 1024,
    platform: 'applovin',
  },
  compression: {
    imageQuality: 80,
    maxImageWidth: 1920,
    audioTargetKbps: 128,
  },
};

// ==================== Settings IO ====================

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8');
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      ai: { ...DEFAULT_SETTINGS.ai, ...saved.ai },
      validation: { ...DEFAULT_SETTINGS.validation, ...saved.validation },
      compression: { ...DEFAULT_SETTINGS.compression, ...saved.compression },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const merged: AppSettings = {
    ai: { ...current.ai, ...settings.ai },
    aiOverrides: settings.aiOverrides !== undefined
      ? settings.aiOverrides
      : current.aiOverrides,
    validation: { ...current.validation, ...settings.validation },
    compression: { ...current.compression, ...settings.compression },
    webhook: settings.webhook !== undefined ? settings.webhook : current.webhook,
  };
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

// ==================== Resolved Config Helpers ====================

/**
 * Resolve a purpose-specific AI config by merging overrides onto the primary config.
 * Missing override fields fall back to the primary `ai` config.
 */
export async function getAIConfig(purpose: keyof AIOverrides = 'classification'): Promise<AIProviderConfig> {
  const settings = await getSettings();
  const base: AIProviderConfig = {
    baseUrl: settings.ai.baseUrl,
    model: settings.ai.model,
    apiKey: settings.ai.apiKey,
    maxTokens: settings.ai.maxTokens,
  };
  const override = settings.aiOverrides?.[purpose];
  if (!override) return base;

  return {
    baseUrl: override.baseUrl || base.baseUrl,
    model: override.model || base.model,
    apiKey: override.apiKey || base.apiKey,
    maxTokens: override.maxTokens || base.maxTokens,
  };
}
