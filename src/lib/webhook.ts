import { getSettings } from '@/lib/settings';

interface WebhookConfig {
  url?: string;
  events?: string[];
}

export async function sendWebhook(event: string, payload: Record<string, unknown>) {
  try {
    const settings = await getSettings();
    const webhook = (settings as unknown as Record<string, unknown>).webhook as WebhookConfig | undefined;

    if (!webhook?.url) return;
    if (webhook.events && !webhook.events.includes(event)) return;

    await fetch(webhook.url, {
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
