'use client';

import { useState, useCallback } from 'react';

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

export function useSSE() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const startStream = useCallback(
    async (url: string, options: { method?: string; body?: string; token?: string }) => {
      setEvents([]);
      setIsStreaming(true);
      setLastEvent(null);

      try {
        const headers: Record<string, string> = {};
        if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
        if (options.body) headers['Content-Type'] = 'application/json';

        const res = await fetch(url, {
          method: options.method || 'POST',
          headers,
          body: options.body,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                const evt = { event: currentEvent, data };
                setEvents((prev) => [...prev, evt]);
                setLastEvent(evt);
              } catch {
                // skip invalid JSON
              }
              currentEvent = '';
            }
          }
        }
      } catch (error) {
        const errEvt = {
          event: 'error',
          data: { message: error instanceof Error ? error.message : 'Stream failed' },
        };
        setEvents((prev) => [...prev, errEvt]);
        setLastEvent(errEvt);
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  return { events, isStreaming, lastEvent, startStream };
}
