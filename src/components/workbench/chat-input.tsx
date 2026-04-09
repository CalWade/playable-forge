'use client';

import { useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onAttach: (file: File) => void;
  isStreaming: boolean;
}

export function ChatInput({ input, onInputChange, onSend, onAttach, isStreaming }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  return (
    <div className="border-t border-clay-blue-50/30 p-3">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files);
              if (files.length > 0) {
                e.preventDefault();
                files.forEach((f) => onAttach(f));
              }
            }}
            placeholder="描述修改需求... (Shift+Enter 换行)"
            disabled={isStreaming}
            rows={1}
            className="w-full rounded-clay clay-inset bg-gradient-to-br from-[#e8f4ff] to-[#dceefb] px-4 py-2.5 pr-10 text-sm font-medium text-clay-text placeholder:text-clay-muted focus:outline-none focus:clay-inset-focus clay-transition resize-none"
          />
        </div>
        <label className="flex-shrink-0 flex cursor-pointer items-center justify-center rounded-clay-sm clay-gradient-surface clay-shadow-sm w-10 h-10 text-clay-muted hover:text-clay-blue-300 clay-transition">
          <input
            type="file"
            accept="image/*,audio/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onAttach(file); e.target.value = ''; }}
          />
          <Paperclip size={16} />
        </label>
        <button
          onClick={onSend}
          disabled={isStreaming || !input.trim()}
          className="flex-shrink-0 flex items-center justify-center rounded-clay-sm clay-gradient-primary text-white clay-shadow-sm w-10 h-10 hover:clay-shadow hover:-translate-y-0.5 active:translate-y-0 clay-transition disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
      {isStreaming && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <div className="h-1.5 w-1.5 rounded-full bg-clay-blue-400 animate-pulse" />
          <span className="text-xs font-medium text-clay-text/40">AI 正在处理...</span>
        </div>
      )}
    </div>
  );
}
