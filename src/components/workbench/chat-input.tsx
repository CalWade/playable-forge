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
    <div className="border-t border-clay-pink-50 p-3">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="描述修改需求..."
          disabled={isStreaming}
          className="flex-1 rounded-clay clay-inset bg-gradient-to-br from-[#f0e5f5] to-[#e8d8f0] px-4 py-2.5 text-sm font-medium text-clay-text placeholder:text-clay-muted focus:outline-none focus:clay-inset-focus clay-transition"
        />
        <label className="flex cursor-pointer items-center rounded-clay-sm clay-gradient-surface clay-shadow-sm p-2.5 text-clay-muted hover:text-clay-pink-300 clay-transition">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onAttach(file); e.target.value = ''; }}
          />
          📎
        </label>
        <button
          onClick={onSend}
          disabled={isStreaming || !input.trim()}
          className="rounded-clay-sm clay-gradient-primary text-white clay-shadow-sm p-2.5 hover:clay-shadow hover:-translate-y-0.5 active:translate-y-0 clay-transition disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
