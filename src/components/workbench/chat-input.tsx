'use client';

import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onAttach: (file: File) => void;
  isStreaming: boolean;
}

export function ChatInput({ input, onInputChange, onSend, onAttach, isStreaming }: ChatInputProps) {
  return (
    <div className="border-t-2 border-clay-border bg-clay-surface px-4 py-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="描述修改需求... (Enter 发送，Shift+Enter 换行)"
            disabled={isStreaming}
            rows={1}
            className={[
              'w-full rounded-clay-xl border-2 border-clay-border bg-clay-neutral-50',
              'px-4 py-2.5 pr-12 text-sm text-clay-text placeholder:text-clay-text-faint',
              'shadow-clay-input',
              'focus:outline-none focus:border-clay-primary/50 focus:shadow-clay-input-focus',
              'disabled:opacity-50 resize-none leading-relaxed',
              'transition-all duration-150',
            ].join(' ')}
            style={{ minHeight: 44, maxHeight: 120 }}
          />
        </div>
        {/* Attach */}
        <label className="flex items-center justify-center w-10 h-10 rounded-clay-lg border-2 border-clay-border bg-clay-surface text-clay-text-muted hover:text-clay-primary hover:border-clay-primary/40 hover:shadow-clay-xs cursor-pointer transition-all duration-150 shrink-0">
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
          <Paperclip size={16} />
        </label>
        {/* Send */}
        <Button
          onClick={onSend}
          disabled={isStreaming || !input.trim()}
          size="icon"
          className="shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
