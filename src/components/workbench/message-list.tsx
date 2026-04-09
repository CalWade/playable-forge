'use client';

import { useRef, useEffect } from 'react';

interface Message { role: string; content: string; }
interface MessageListProps { messages: Message[]; isStreaming: boolean; }

const ROLE_CONFIG: Record<string, { align: string; bubble: string; icon: string }> = {
  user: {
    align: 'justify-end',
    bubble: 'clay-gradient-primary text-white rounded-2xl rounded-tr-md',
    icon: '👤',
  },
  assistant: {
    align: 'justify-start',
    bubble: 'clay-gradient-surface text-clay-text clay-shadow-sm rounded-2xl rounded-tl-md',
    icon: '🤖',
  },
  system: {
    align: 'justify-center',
    bubble: 'bg-clay-bg/60 text-clay-text/50 rounded-clay-sm text-xs italic',
    icon: 'ℹ️',
  },
  status: {
    align: 'justify-center',
    bubble: 'bg-clay-blue-50/40 text-clay-blue-400 rounded-clay-sm text-xs font-semibold',
    icon: '',
  },
};

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <>
      {messages.map((msg, i) => {
        const config = ROLE_CONFIG[msg.role] || ROLE_CONFIG.system;

        // Status messages: compact inline
        if (msg.role === 'status') {
          return (
            <div key={i} className="flex justify-center">
              <div className={`${config.bubble} px-3 py-1.5 max-w-[90%]`}>
                {msg.content}
              </div>
            </div>
          );
        }

        // System messages: centered
        if (msg.role === 'system') {
          return (
            <div key={i} className="flex justify-center">
              <div className={`${config.bubble} px-4 py-2 max-w-[85%]`}>
                {msg.content}
              </div>
            </div>
          );
        }

        // User / Assistant messages: aligned with avatar
        return (
          <div key={i} className={`flex ${config.align} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-clay-blue-50 flex items-center justify-center text-xs">
                {config.icon}
              </div>
            )}
            <div className={`max-w-[75%] px-4 py-2.5 text-sm font-medium whitespace-pre-wrap ${config.bubble}`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-clay-blue-400/20 flex items-center justify-center text-xs">
                {config.icon}
              </div>
            )}
          </div>
        );
      })}

      {isStreaming && messages[messages.length - 1]?.role !== 'status' && (
        <div className="flex justify-start gap-2">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-clay-blue-50 flex items-center justify-center text-xs">
            🤖
          </div>
          <div className="rounded-2xl rounded-tl-md clay-gradient-surface clay-shadow-sm px-4 py-2.5 text-sm text-clay-text/50">
            <span className="inline-flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
            </span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );
}
