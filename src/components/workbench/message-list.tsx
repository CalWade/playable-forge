'use client';

import { useRef, useEffect } from 'react';

interface Message { role: string; content: string; }
interface MessageListProps { messages: Message[]; isStreaming: boolean; }

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <>
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[80%] rounded-clay px-4 py-2.5 text-sm font-medium whitespace-pre-wrap clay-shadow-sm ${
              msg.role === 'user'
                ? 'clay-gradient-primary text-white'
                : msg.role === 'system' || msg.role === 'status'
                ? 'bg-clay-bg text-clay-text/50 italic'
                : 'clay-gradient-surface text-clay-text'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="rounded-clay clay-gradient-surface clay-shadow-sm px-4 py-2.5 text-sm text-clay-text/50">
            <span className="animate-pulse">思考中...</span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );
}
