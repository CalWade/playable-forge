import { withAuth } from '@/lib/auth/middleware';
import { getSettings, saveSettings, type AppSettings } from '@/lib/settings';
import { GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts';

const REDACTED = '__REDACTED__';

/**
 * Mask sensitive fields before returning settings to clients.
 * - AI apiKey (primary + per-purpose overrides) → REDACTED placeholder
 * - Webhook URL is left visible (it's a config destination, not a credential),
 *   but if you treat it as sensitive in your environment, mask it the same way.
 */
function maskSettings(s: AppSettings): AppSettings {
  const masked: AppSettings = JSON.parse(JSON.stringify(s));
  if (masked.ai?.apiKey) masked.ai.apiKey = REDACTED;
  if (masked.aiOverrides) {
    for (const k of Object.keys(masked.aiOverrides) as (keyof typeof masked.aiOverrides)[]) {
      const o = masked.aiOverrides[k];
      if (o?.apiKey) o.apiKey = REDACTED;
    }
  }
  return masked;
}

/**
 * Replace REDACTED placeholders in a PATCH body with the existing stored values,
 * so unchanged fields are preserved and not blanked out.
 */
function unmaskPatch(patch: Partial<AppSettings>, current: AppSettings): Partial<AppSettings> {
  const out: Partial<AppSettings> = JSON.parse(JSON.stringify(patch));
  if (out.ai?.apiKey === REDACTED) out.ai.apiKey = current.ai.apiKey;
  if (out.aiOverrides) {
    for (const k of Object.keys(out.aiOverrides) as (keyof NonNullable<AppSettings['aiOverrides']>)[]) {
      const o = out.aiOverrides[k];
      if (o?.apiKey === REDACTED) {
        o.apiKey = current.aiOverrides?.[k]?.apiKey;
      }
    }
  }
  return out;
}

export const GET = withAuth(async () => {
  const settings = await getSettings();
  return Response.json({
    settings: maskSettings(settings),
    defaultSystemPrompt: GENERATE_SYSTEM_PROMPT,
  });
});

export const PATCH = withAuth(async (request) => {
  const body = (await request.json()) as Partial<AppSettings>;
  const current = await getSettings();
  const sanitized = unmaskPatch(body, current);
  const settings = await saveSettings(sanitized);
  return Response.json({ settings: maskSettings(settings) });
});
