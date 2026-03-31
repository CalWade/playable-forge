import type { SSEWriter } from '@/lib/generation/pipeline';

export function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Create an SSE streaming response with a pipeline runner.
 */
export function createSSEResponse(
  runner: (sse: SSEWriter) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sse: SSEWriter = {
        write(event, data) {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        },
      };

      try {
        await runner(sse);
      } catch (error) {
        console.error('SSE pipeline error:', error);
        controller.enqueue(
          encoder.encode(
            sseEvent('error', {
              message: error instanceof Error ? error.message : 'Internal error',
              canRetry: true,
            })
          )
        );
      } finally {
        controller.close();
      }
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
