import { withAuth } from '@/lib/auth/middleware';
import { getSettings, saveSettings } from '@/lib/settings';
import { GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export const GET = withAuth(async () => {
  const settings = await getSettings();
  return Response.json({
    settings,
    defaultSystemPrompt: GENERATE_SYSTEM_PROMPT,
  });
});

export const PATCH = withAuth(async (request) => {
  const body = await request.json();
  const settings = await saveSettings(body);
  return Response.json({ settings });
});
