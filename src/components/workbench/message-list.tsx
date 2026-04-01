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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <>
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : msg.role === 'system' || msg.role === 'status'
                ? 'bg-gray-100 text-gray-500 italic'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
            <span className="animate-pulse">思考中...</span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );
}
