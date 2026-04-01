'use client';

import { Badge } from '@/components/ui/badge';
import { SelectDropdown } from '@/components/ui/dropdown';
import { toast } from '@/components/ui/toast';

interface Asset {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  compressedSize: number | null;
  category: string;
  variantRole: string;
  thumbnailUrl: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  reference:    '效果图',
  background:   '背景',
  popup:        '弹窗',
  button:       '按钮',
  icon:         '图标',
  audio:        '音频',
  unrecognized: '未识别',
};

const CATEGORY_BADGE_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'> = {
  reference:    'info',
  background:   'success',
  popup:        'warning',
  button:       'accent',
  icon:         'default',
  audio:        'info',
  unrecognized: 'default',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

const ROLE_OPTIONS = [
  { value: 'variant', label: '参与变体' },
  { value: 'fixed',   label: '固定素材' },
  { value: 'excluded',label: '不使用' },
];

interface AssetCardProps {
  asset: Asset;
  projectId: string;
  onUpdate: () => void;
  token: string;
}

export function AssetCard({ asset, projectId, onUpdate, token }: AssetCardProps) {
  const updateAsset = async (data: Record<string, unknown>) => {
    try {
      await fetch(`/api/projects/${projectId}/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      onUpdate();
    } catch {
      toast('更新失败', 'error');
    }
  };

  return (
    <div className="group relative rounded-clay-xl bg-clay-surface border-2 border-clay-border shadow-clay-xs hover:shadow-clay-effect-sm transition-all duration-200 p-2 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative mb-2 aspect-square overflow-hidden rounded-clay-lg bg-clay-neutral-100 shadow-clay-input">
        {asset.thumbnailUrl ? (
          <img
            src={`${asset.thumbnailUrl}?token=${token}`}
            alt={asset.originalName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xl">
            {asset.mimeType.startsWith('audio/') ? '🔊' : '📄'}
          </div>
        )}
        <div className="absolute left-1.5 top-1.5">
          <Badge
            variant={CATEGORY_BADGE_VARIANTS[asset.category] || 'default'}
            className="text-[9px] px-1.5 py-0.5"
          >
            {CATEGORY_LABELS[asset.category] || asset.category}
          </Badge>
        </div>
      </div>

      {/* File name */}
      <p className="truncate text-[11px] font-medium text-clay-text" title={asset.originalName}>
        {asset.originalName}
      </p>

      {/* Size */}
      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-clay-text-faint">
        <span>{(asset.fileSize / 1024).toFixed(0)}KB</span>
        {asset.compressedSize && asset.compressedSize < asset.fileSize && (
          <>
            <span>→</span>
            <span className="text-clay-success-dk font-medium">
              {(asset.compressedSize / 1024).toFixed(0)}KB
            </span>
          </>
        )}
      </div>

      {/* Controls on hover */}
      <div className="mt-1.5 space-y-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <SelectDropdown
          value={asset.category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => updateAsset({ category: v, categoryConfirmed: true })}
          className="w-full text-[10px] py-1"
        />
        <SelectDropdown
          value={asset.variantRole}
          options={ROLE_OPTIONS}
          onChange={(v) => updateAsset({ variantRole: v })}
          className="w-full text-[10px] py-1"
        />
      </div>
    </div>
  );
}
