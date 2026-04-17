'use client';

import { Badge } from '@/components/ui/badge';
import { SelectDropdown } from '@/components/ui/dropdown';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api-client';

interface Asset {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  compressedSize: number | null;
  category: string;
  thumbnailUrl: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  background: '背景',
  popup: '弹窗',
  button: '按钮',
  icon: '图标',
  audio: '音频',
  unrecognized: '未识别',
};

const CATEGORY_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
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

interface AssetCardProps {
  asset: Asset;
  projectId: string;
  onUpdate: () => void;
  token: string;
  onSaveToLibrary?: (assetId: string) => void;
}

export function AssetCard({ asset, projectId, onUpdate, token, onSaveToLibrary }: AssetCardProps) {

  const updateAsset = async (data: Record<string, unknown>) => {
    try {
      await api.patch(`/api/projects/${projectId}/assets/${asset.id}`, data);
      onUpdate();
    } catch {
      toast('更新失败', 'error');
    }
  };


  return (
    <div className="group relative rounded-lg border border-clay-blue-50 bg-white p-2">
      {/* Thumbnail */}
      <div className="relative mb-2 aspect-square overflow-hidden rounded-md bg-clay-bg">
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
        {/* Category badge - shown on hover only to reduce visual noise */}
        <Badge
          variant={CATEGORY_VARIANTS[asset.category] || 'default'}
          className="absolute left-1 top-1 text-[10px] opacity-0 group-hover:opacity-100 clay-transition"
        >
          {CATEGORY_LABELS[asset.category] || asset.category}
        </Badge>
      </div>

      {/* File name + size comparison */}
      <p className="truncate text-xs text-clay-text/70" title={asset.originalName}>
        {asset.originalName}
      </p>
      <div className="flex items-center gap-1 text-[10px] font-medium text-clay-text/40" title="AI 压缩节省空间">
        <span>{(asset.fileSize / 1024).toFixed(0)}KB</span>
        {asset.compressedSize && asset.compressedSize < asset.fileSize && (
          <>
            <span>→</span>
            <span className="text-green-600">{(asset.compressedSize / 1024).toFixed(0)}KB</span>
            <span className="text-green-600">↓{Math.round((1 - asset.compressedSize / asset.fileSize) * 100)}%</span>
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
        {onSaveToLibrary && (
          <button
            onClick={() => onSaveToLibrary(asset.id)}
            className="w-full text-[10px] font-semibold text-clay-blue-400 hover:text-clay-blue-300 clay-transition py-0.5"
          >
            ⭐ 收藏到素材库
          </button>
        )}
      </div>
    </div>
  );
}
