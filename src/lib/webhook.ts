import { getSettings } from '@/lib/settings';

export async function sendWebhook(event: string, payload: Record<string, unknown>) {
  try {
    const settings = await getSettings();
    if (!settings.webhook?.url) return;
    if (settings.webhook.events && !settings.webhook.events.includes(event)) return;

    await fetch(settings.webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.warn);
  } catch {
    // Webhook should never break the main flow
  }
}
