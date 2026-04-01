'use client';

import { useRef, useEffect } from 'react';

interface Message {
  role: string;
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <>
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={[
              'max-w-[82%] px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed',
              msg.role === 'user'
                ? 'rounded-clay-xl rounded-br-clay-sm bg-clay-primary text-white shadow-clay-effect-sm'
                : msg.role === 'system' || msg.role === 'status'
                ? 'rounded-clay-xl bg-clay-neutral-100 text-clay-text-muted italic text-xs border border-clay-border'
                : 'rounded-clay-xl rounded-bl-clay-sm bg-clay-surface text-clay-text shadow-clay-effect-sm border border-clay-border',
            ].join(' ')}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="rounded-clay-xl bg-clay-surface border border-clay-border px-4 py-2.5 shadow-clay-xs">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-clay-primary/60"
                  style={{ animation: `clay-float 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </>
  );
}
