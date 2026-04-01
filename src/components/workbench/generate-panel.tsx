'use client';

import { Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface GeneratePanelProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  safetyClarification: boolean;
  onSafetyClarificationChange: (value: boolean) => void;
  onGenerate: () => void;
  isStreaming: boolean;
}

export function GeneratePanel({
  description,
  onDescriptionChange,
  safetyClarification,
  onSafetyClarificationChange,
  onGenerate,
  isStreaming,
}: GeneratePanelProps) {
  return (
    <div className="mx-2 rounded-clay-2xl bg-clay-surface border-2 border-clay-border shadow-clay-effect-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-clay-md bg-clay-primary shadow-clay-xs flex items-center justify-center">
          <Sparkles size={17} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-clay-text">生成初稿</p>
          <p className="text-xs text-clay-text-muted">上传素材后，描述你想要的广告效果</p>
        </div>
      </div>

      <Textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={"描述广告效果（可选）\n例如：背景图全屏展示，2秒后弹窗从底部滑入，弹窗上的按钮有呼吸动画，点击跳转商店"}
        rows={4}
        className="text-sm"
      />

      <label className="flex items-center gap-2.5 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={safetyClarification}
            onChange={(e) => onSafetyClarificationChange(e.target.checked)}
            className="sr-only"
          />
          <div className={[
            'w-10 h-6 rounded-clay-full transition-all duration-200 shadow-clay-input',
            safetyClarification ? 'bg-clay-primary' : 'bg-clay-neutral-200',
          ].join(' ')} />
          <div className={[
            'absolute top-1 w-4 h-4 rounded-full bg-white shadow-clay-xs transition-all duration-200',
            safetyClarification ? 'left-5' : 'left-1',
          ].join(' ')} />
        </div>
        <span className="text-xs text-clay-text-muted group-hover:text-clay-text transition-colors">
          添加安全声明（适用于游戏/博彩类广告素材）
        </span>
      </label>

      <Button
        onClick={onGenerate}
        disabled={isStreaming}
        className="w-full"
        size="lg"
      >
        {isStreaming ? (
          <span className="flex items-center gap-2">
            <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin-soft" />
            生成中...
          </span>
        ) : (
          <>
            <Sparkles size={16} />
            生成初稿
          </>
        )}
      </Button>
    </div>
  );
}
