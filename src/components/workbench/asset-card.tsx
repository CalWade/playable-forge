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
  reference: '效果图',
  background: '背景',
  popup: '弹窗',
  button: '按钮',
  icon: '图标',
  audio: '音频',
  unrecognized: '未识别',
};

const CATEGORY_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  reference: 'info',
  background: 'success',
  popup: 'warning',
  button: 'error',
  icon: 'default',
  audio: 'info',
  unrecognized: 'default',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const ROLE_OPTIONS = [
  { value: 'variant', label: '参与变体' },
  { value: 'fixed', label: '固定素材' },
  { value: 'excluded', label: '不使用' },
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
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      onUpdate();
    } catch {
      toast('更新失败', 'error');
    }
  };


  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-2">
      {/* Thumbnail */}
      <div className="relative mb-2 aspect-square overflow-hidden rounded-md bg-gray-100">
        {asset.thumbnailUrl ? (
          <img
            src={`${asset.thumbnailUrl}?token=${token}`}
            alt={asset.originalName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            {asset.mimeType.startsWith('audio/') ? '🔊' : '📄'}
          </div>
        )}
        {/* Category badge */}
        <Badge
          variant={CATEGORY_VARIANTS[asset.category] || 'default'}
          className="absolute left-1 top-1 text-[10px]"
        >
          {CATEGORY_LABELS[asset.category] || asset.category}
        </Badge>
      </div>

      {/* File name + size comparison */}
      <p className="truncate text-xs text-gray-600" title={asset.originalName}>
        {asset.originalName}
      </p>
      <div className="flex items-center gap-1 text-[10px] text-gray-400">
        <span>{(asset.fileSize / 1024).toFixed(0)}KB</span>
        {asset.compressedSize && asset.compressedSize < asset.fileSize && (
          <>
            <span>→</span>
            <span className="text-green-600">{(asset.compressedSize / 1024).toFixed(0)}KB</span>
            <span className="text-green-600">(-{Math.round((1 - asset.compressedSize / asset.fileSize) * 100)}%)</span>
          </>
        )}
      </div>

      {/* Controls (visible on hover) */}
      <div className="mt-1 space-y-1 opacity-0 transition-opacity group-hover:opacity-100">
        <SelectDropdown
          value={asset.category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => updateAsset({ category: v, categoryConfirmed: true })}
          className="w-full text-[10px]"
        />
        <SelectDropdown
          value={asset.variantRole}
          options={ROLE_OPTIONS}
          onChange={(v) => updateAsset({ variantRole: v })}
          className="w-full text-[10px]"
        />
      </div>
    </div>
  );
}
