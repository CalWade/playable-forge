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
  description,
  onDescriptionChange,
  safetyClarification,
  onSafetyClarificationChange,
  onGenerate,
  isStreaming,
}: GeneratePanelProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <p className="mb-4 text-sm text-gray-500 font-medium">上传素材后，描述你想要的广告效果</p>
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={"描述广告效果（可选）\n例如：背景图全屏展示，2秒后弹窗从底部滑入，弹窗上的按钮有呼吸动画，点击跳转商店"}
        className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={4}
      />
      <label className="mt-3 flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
        <input
          type="checkbox"
          checked={safetyClarification}
          onChange={(e) => onSafetyClarificationChange(e.target.checked)}
          className="rounded"
        />
        添加安全声明（适用于游戏/博彩类广告素材）
      </label>
      <button
        onClick={onGenerate}
        disabled={isStreaming}
        className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isStreaming ? '生成中...' : '✨ 生成初稿'}
      </button>
    </div>
  );
}
