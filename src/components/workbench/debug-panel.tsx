'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Code } from 'lucide-react';

interface DebugEntry { type: string; content: string; }
interface DebugPanelProps { entries: DebugEntry[]; }

const TYPE_LABELS: Record<string, string> = {
  generate_prompt: '📤 生成请求',
  generate_response: '📥 生成返回',
  iterate_prompt: '📤 迭代请求',
  iterate_response: '📥 迭代返回',
  autofix_prompt: '🔧 自修复请求',
  autofix_response: '🔧 自修复返回',
};

export function DebugPanel({ entries }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-40 clay-gradient-primary text-white px-1.5 py-4 rounded-l-clay-sm clay-shadow-sm hover:clay-shadow clay-transition ${
          isOpen ? 'right-[480px]' : 'right-0'
        }`}
        title="调试面板"
      >
        {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        <Code size={14} className="mt-1" />
      </button>

      <div className={`fixed right-0 top-0 h-full bg-gradient-to-b from-[#2d1b3d] to-[#1a1025] text-gray-100 clay-shadow z-30 transition-all duration-300 ${
        isOpen ? 'w-[480px]' : 'w-0'
      } overflow-hidden`}>
        <div className="flex flex-col h-full w-[480px]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Code size={14} /> AI 交互日志
            </h3>
            <span className="text-xs font-medium text-white/40">{entries.length} 条记录</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm font-medium text-white/30">
                生成或迭代后显示 AI 交互详情
              </div>
            ) : (
              entries.map((entry, i) => (
                <div key={i} className="border-b border-white/5">
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 text-left clay-transition"
                  >
                    <span className="text-xs font-bold">{TYPE_LABELS[entry.type] || entry.type}</span>
                    <span className="text-[10px] font-medium text-white/30">
                      {entry.content.length > 100 ? `${(entry.content.length / 1024).toFixed(1)}KB` : `${entry.content.length} chars`}
                    </span>
                  </button>
                  {expandedIdx === i && (
                    <div className="px-5 pb-4">
                      <pre className="text-[11px] leading-relaxed text-white/70 bg-black/30 rounded-clay-sm p-4 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words">
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
