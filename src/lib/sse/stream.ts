import type { SSEWriter } from '@/lib/generation/pipeline';

export function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Create an SSE streaming response with a pipeline runner.
 *
 * Resilient to client disconnects: if the consumer closes the stream
 * (browser tab closed, network blip, fetch abort), `enqueue()` would
 * otherwise throw `ERR_INVALID_STATE: Controller is already closed`
 * and crash the pipeline mid-flight. We track the closed state via the
 * `cancel` hook and skip writes once the stream is gone.
 */
export function createSSEResponse(
  runner: (sse: SSEWriter) => Promise<void>
): Response {
  const encoder = new TextEncoder();
  let closed = false;

  const safeEnqueue = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    payload: Uint8Array
  ) => {
    if (closed) return;
    try {
      controller.enqueue(payload);
    } catch (err) {
      // Stream went away between our check and the enqueue — flip the flag.
      closed = true;
      console.warn('[sse] enqueue after close:', (err as Error).message);
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sse: SSEWriter = {
        write(event, data) {
          safeEnqueue(controller, encoder.encode(sseEvent(event, data)));
        },
      };

      try {
        await runner(sse);
      } catch (error) {
        console.error('SSE pipeline error:', error);
        safeEnqueue(
          controller,
          encoder.encode(
            sseEvent('error', {
              message: error instanceof Error ? error.message : 'Internal error',
              canRetry: true,
            })
          )
        );
      } finally {
        if (!closed) {
          try {
            controller.close();
          } catch {
            /* already closed by consumer */
          }
        }
      }
    },
    cancel() {
      // Consumer aborted (browser closed, fetch cancelled, etc.).
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
