import { DATA_DIR } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';


const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

export interface AppSettings {
  ai: {
    baseUrl: string;
    model: string;
    apiKey?: string;
    maxTokens: number;
    systemPromptOverride?: string;
  };
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

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const merged: AppSettings = {
    ai: { ...current.ai, ...settings.ai },
    validation: { ...current.validation, ...settings.validation },
    compression: { ...current.compression, ...settings.compression },
    webhook: settings.webhook !== undefined ? settings.webhook : current.webhook,
  };
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2));
  return merged;
}
