'use client';

import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onAttach: (file: File) => void;
  isStreaming: boolean;
}

export function ChatInput({ input, onInputChange, onSend, onAttach, isStreaming }: ChatInputProps) {
  return (
    <div className="border-t border-gray-100 p-3">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="描述修改需求..."
          disabled={isStreaming}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex cursor-pointer items-center rounded-lg border border-gray-200 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAttach(file);
              e.target.value = '';
            }}
          />
          📎
        </label>
        <button
          onClick={onSend}
          disabled={isStreaming || !input.trim()}
          className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
