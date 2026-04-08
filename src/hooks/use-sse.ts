'use client';

import { useState, useCallback, useRef } from 'react';

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

export function useSSE() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [debugLog, setDebugLog] = useState<Array<{ type: string; content: string }>>([]);
  const [streamingHtml, setStreamingHtml] = useState('');
  const gotCompleteOrError = useRef(false);

  const startStream = useCallback(
    async (url: string, options: { method?: string; body?: string; token?: string }) => {
      setEvents([]);
      setIsStreaming(true);
      setLastEvent(null);
      setDebugLog([]);
      setStreamingHtml('');
      gotCompleteOrError.current = false;

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
          const errEvt: SSEEvent = {
            event: 'error',
            data: { message: data.error || `请求失败: ${res.status}` },
          };
          setEvents([errEvt]);
          setLastEvent(errEvt);
          setIsStreaming(false);
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/event-stream')) {
          // Not SSE - might be a JSON error response
          const data = await res.json().catch(() => ({}));
          const errEvt: SSEEvent = {
            event: 'error',
            data: { message: data.error || '服务器返回了非预期格式' },
          };
          setEvents([errEvt]);
          setLastEvent(errEvt);
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          const errEvt: SSEEvent = { event: 'error', data: { message: '无响应数据' } };
          setEvents([errEvt]);
          setLastEvent(errEvt);
          setIsStreaming(false);
          return;
        }

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
                const evt: SSEEvent = { event: currentEvent, data };
                setEvents((prev) => [...prev, evt]);
                setLastEvent(evt);

                if (currentEvent === 'complete' || currentEvent === 'error') {
                  gotCompleteOrError.current = true;
                }
                if (currentEvent === 'debug') {
                  setDebugLog((prev) => [...prev, { type: data.type, content: data.content }]);
                }
                if (currentEvent === 'chunk') {
                  setStreamingHtml((prev) => prev + (data.text as string));
                }
              } catch {
                // skip invalid JSON
              }
              currentEvent = '';
            }
          }
        }

        // Stream ended without complete or error event
        if (!gotCompleteOrError.current) {
          const errEvt: SSEEvent = {
            event: 'error',
            data: { message: 'AI 生成中断，未返回完整结果，请重试' },
          };
          setEvents((prev) => [...prev, errEvt]);
          setLastEvent(errEvt);
        }
      } catch (error) {
        const errEvt: SSEEvent = {
          event: 'error',
          data: { message: error instanceof Error ? error.message : '网络错误' },
        };
        setEvents((prev) => [...prev, errEvt]);
        setLastEvent(errEvt);
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  return { events, isStreaming, lastEvent, debugLog, streamingHtml, startStream };
}
