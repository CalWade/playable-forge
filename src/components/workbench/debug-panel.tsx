'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Code } from 'lucide-react';

interface DebugEntry {
  type: string;
  content: string;
}

interface DebugPanelProps {
  entries: DebugEntry[];
}

const TYPE_LABELS: Record<string, string> = {
  system_prompt: '📋 System Prompt',
  user_prompt: '👤 User Prompt',
  ai_response: '🤖 AI 原始返回',
};

export function DebugPanel({ entries }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <>
      {/* Toggle button - fixed on right edge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gray-800 text-white px-1 py-3 rounded-l-lg shadow-lg hover:bg-gray-700 transition-colors"
        title="调试面板"
      >
        {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        <Code size={14} className="mt-1" />
      </button>

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full bg-gray-900 text-gray-100 shadow-2xl z-30 transition-all duration-300 ${
          isOpen ? 'w-[480px]' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Code size={14} /> AI 交互日志
            </h3>
            <span className="text-xs text-gray-500">{entries.length} 条记录</span>
          </div>

          {/* Entries */}
          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                生成或迭代后显示 AI 交互详情
              </div>
            ) : (
              entries.map((entry, i) => (
                <div key={i} className="border-b border-gray-800">
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-800 text-left"
                  >
                    <span className="text-xs font-medium">
                      {TYPE_LABELS[entry.type] || entry.type}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {entry.content.length > 100
                        ? `${(entry.content.length / 1024).toFixed(1)}KB`
                        : `${entry.content.length} chars`}
                    </span>
                  </button>
                  {expandedIdx === i && (
                    <div className="px-4 pb-3">
                      <pre className="text-[11px] leading-relaxed text-gray-300 bg-gray-950 rounded-lg p-3 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words">
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
