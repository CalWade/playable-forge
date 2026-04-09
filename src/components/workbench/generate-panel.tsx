'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface GeneratePanelProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  safetyClarification: boolean;
  onSafetyClarificationChange: (value: boolean) => void;
  streamPreview: boolean;
  onStreamPreviewChange: (value: boolean) => void;
  onGenerate: () => void;
  isStreaming: boolean;
  estimatedSize?: number;
  isSizeWarning?: boolean;
  collapsed?: boolean;
}

export function GeneratePanel({
  description, onDescriptionChange, safetyClarification, onSafetyClarificationChange,
  streamPreview, onStreamPreviewChange, onGenerate, isStreaming,
  estimatedSize, isSizeWarning, collapsed: initialCollapsed = false,
}: GeneratePanelProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (collapsed) {
    return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-clay-blue-50/30">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 text-xs font-bold text-clay-blue-400 hover:text-clay-blue-300 clay-transition"
        >
          <ChevronDown size={14} /> 展开生成面板
        </button>
        <button
          onClick={onGenerate}
          disabled={isStreaming}
          className="flex items-center gap-1.5 rounded-clay-sm clay-gradient-primary text-white clay-shadow-sm px-4 py-1.5 text-xs font-bold hover:clay-shadow clay-transition disabled:opacity-50"
        >
          <Sparkles size={12} /> {isStreaming ? '生成中...' : '重新生成'}
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-clay-blue-50/30">
      <div className="flex flex-col items-center py-6 px-4">
        {initialCollapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="self-end mb-2 flex items-center gap-1 text-xs text-clay-muted hover:text-clay-text/60 clay-transition"
          >
            <ChevronUp size={12} /> 收起
          </button>
        )}

        <p className="mb-3 text-sm font-bold text-clay-text/60">
          {initialCollapsed ? '重新生成骨架' : '上传素材后，描述你想要的广告效果'}
        </p>

        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={"描述广告效果（可选）\n例如：背景图全屏展示，2秒后弹窗从底部滑入，弹窗上的按钮有呼吸动画，点击跳转商店"}
          className="w-full max-w-md rounded-clay clay-inset bg-gradient-to-br from-[#e8f4ff] to-[#dceefb] px-4 py-3 text-sm font-medium text-clay-text placeholder:text-clay-muted focus:outline-none focus:clay-inset-focus resize-none clay-transition"
          rows={3}
        />

        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-clay-text/50 cursor-pointer">
            <input
              type="checkbox"
              checked={safetyClarification}
              onChange={(e) => onSafetyClarificationChange(e.target.checked)}
              className="rounded-lg accent-clay-blue-400"
            />
            安全声明
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-clay-text/50 cursor-pointer">
            <input
              type="checkbox"
              checked={streamPreview}
              onChange={(e) => onStreamPreviewChange(e.target.checked)}
              className="rounded-lg accent-clay-blue-400"
            />
            实时预览
          </label>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={onGenerate}
            disabled={isStreaming}
            className="rounded-clay-lg clay-gradient-primary text-white clay-shadow px-8 py-2.5 text-sm font-bold hover:clay-shadow-hover hover:-translate-y-1 active:translate-y-0 active:clay-shadow-active clay-transition disabled:opacity-50"
          >
            {isStreaming ? '生成中...' : initialCollapsed ? '🔄 重新生成' : '✨ 生成初稿'}
          </button>
          {isSizeWarning && (
            <span className="text-yellow-500 text-lg" title={`预估体积: ${((estimatedSize || 0) / 1024 / 1024).toFixed(1)}MB，可能超过 5MB 限制`}>
              ⚠️
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
