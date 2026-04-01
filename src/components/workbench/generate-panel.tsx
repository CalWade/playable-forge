'use client';

interface GeneratePanelProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  safetyClarification: boolean;
  onSafetyClarificationChange: (value: boolean) => void;
  onGenerate: () => void;
  isStreaming: boolean;
}

export function GeneratePanel({
  description, onDescriptionChange, safetyClarification, onSafetyClarificationChange, onGenerate, isStreaming,
}: GeneratePanelProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <p className="mb-4 text-sm font-bold text-clay-text/60">上传素材后，描述你想要的广告效果</p>
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={"描述广告效果（可选）\n例如：背景图全屏展示，2秒后弹窗从底部滑入，弹窗上的按钮有呼吸动画，点击跳转商店"}
        className="w-full max-w-md rounded-clay clay-inset bg-gradient-to-br from-[#f0e5f5] to-[#e8d8f0] px-4 py-3 text-sm font-medium text-clay-text placeholder:text-clay-muted focus:outline-none focus:clay-inset-focus resize-none clay-transition"
        rows={4}
      />
      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-clay-text/50 cursor-pointer">
        <input
          type="checkbox"
          checked={safetyClarification}
          onChange={(e) => onSafetyClarificationChange(e.target.checked)}
          className="rounded-lg accent-clay-pink-400"
        />
        添加安全声明（适用于游戏/博彩类广告素材）
      </label>
      <button
        onClick={onGenerate}
        disabled={isStreaming}
        className="mt-4 rounded-clay-lg clay-gradient-primary text-white clay-shadow px-8 py-3 text-sm font-bold hover:clay-shadow-hover hover:-translate-y-1 active:translate-y-0 active:clay-shadow-active clay-transition disabled:opacity-50"
      >
        {isStreaming ? '生成中...' : '✨ 生成初稿'}
      </button>
    </div>
  );
}
