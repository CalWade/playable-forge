'use client';

import { useState } from 'react';
import { ChevronRight, Code } from 'lucide-react';

interface DebugEntry {
  type: string;
  content: string;
}

interface DebugPanelProps {
  entries: DebugEntry[];
}

const TYPE_LABELS: Record<string, string> = {
  generate_prompt:    '📤 生成请求 (Prompt)',
  generate_response:  '📥 生成返回 (AI 输出)',
  iterate_prompt:     '📤 迭代请求 (Prompt)',
  iterate_response:   '📥 迭代返回 (AI 输出)',
  autofix_prompt:     '🔧 自修复请求',
  autofix_response:   '🔧 自修复返回',
};

export function DebugPanel({ entries }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'fixed top-1/2 -translate-y-1/2 z-40',
          'flex flex-col items-center gap-1',
          'bg-clay-neutral-800 text-white px-1.5 py-3 rounded-l-clay-md',
          'shadow-clay-md hover:bg-clay-neutral-700 transition-all duration-300',
          isOpen ? 'right-[460px]' : 'right-0',
        ].join(' ')}
        title="调试面板"
      >
        <ChevronRight size={13} className={`transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`} />
        <Code size={13} className="mt-0.5" />
      </button>

      {/* Panel */}
      <div
        className={[
          'fixed right-0 top-0 h-full z-30',
          'bg-clay-neutral-900 text-clay-neutral-100',
          'shadow-clay-xl transition-all duration-300 overflow-hidden',
          isOpen ? 'w-[460px]' : 'w-0',
        ].join(' ')}
      >
        <div className="flex flex-col h-full w-[460px]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-clay-neutral-700/50">
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <Code size={14} className="text-clay-primary" />
              AI 交互日志
            </h3>
            <span className="text-xs text-clay-neutral-500 px-2 py-0.5 rounded-clay-full bg-clay-neutral-800">
              {entries.length} 条
            </span>
          </div>

          {/* Entries */}
          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-clay-neutral-500">
                <Code size={28} className="opacity-30" />
                <p className="text-sm">生成或迭代后显示 AI 交互详情</p>
              </div>
            ) : (
              entries.map((entry, i) => (
                <div key={i} className="border-b border-clay-neutral-800">
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-clay-neutral-800/50 text-left transition-colors"
                  >
                    <span className="text-xs font-medium text-clay-neutral-200">
                      {TYPE_LABELS[entry.type] || entry.type}
                    </span>
                    <span className="text-[10px] text-clay-neutral-500 shrink-0 ml-2">
                      {entry.content.length > 1000
                        ? `${(entry.content.length / 1024).toFixed(1)}KB`
                        : `${entry.content.length} chars`}
                    </span>
                  </button>
                  {expandedIdx === i && (
                    <div className="px-4 pb-4">
                      <pre className="text-[11px] leading-relaxed text-clay-neutral-300 bg-black/40 rounded-clay-lg p-3.5 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words">
                        {entry.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
