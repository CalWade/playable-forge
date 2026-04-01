'use client';

import { UploadZone } from './upload-zone';
import { AssetCard } from './asset-card';
import { useAssets } from '@/hooks/use-assets';
import { useAuth } from '@/components/auth-provider';
import { Package } from 'lucide-react';

interface AssetPanelProps {
  projectId: string;
}

export function AssetPanel({ projectId }: AssetPanelProps) {
  const { assets, isLoading, refresh } = useAssets(projectId);
  const { token } = useAuth();

  const totalSize = assets.reduce(
    (sum: number, a: { compressedSize: number | null; fileSize: number }) =>
      sum + (a.compressedSize || a.fileSize),
    0
  );
  const estimatedHtml = Math.ceil(totalSize * 1.37);
  const pct = Math.min(100, (estimatedHtml / (5 * 1024 * 1024)) * 100);
  const barColor = estimatedHtml > 5 * 1024 * 1024
    ? 'bg-clay-danger'
    : estimatedHtml > 4 * 1024 * 1024
    ? 'bg-clay-warning'
    : 'bg-clay-success';

  return (
    <div className="flex h-full flex-col bg-clay-surface">
      {/* Header */}
      <div className="border-b-2 border-clay-border px-4 py-3 flex items-center gap-2">
        <Package size={14} className="text-clay-primary" />
        <h3 className="text-sm font-bold text-clay-text">素材库</h3>
        {assets.length > 0 && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-clay-full bg-clay-primary-lt text-clay-primary-dk">
            {assets.length}
          </span>
        )}
      </div>

      {/* Upload zone */}
      <div className="p-3">
        <UploadZone projectId={projectId} onUploadComplete={refresh} />
      </div>

      {/* Size progress */}
      {assets.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-clay-text-muted font-medium">预估 HTML 体积</p>
            <p className={`text-[10px] font-bold ${estimatedHtml > 4 * 1024 * 1024 ? 'text-clay-danger-dk' : 'text-clay-text-muted'}`}>
              {(estimatedHtml / 1024).toFixed(0)} / 5120 KB
            </p>
          </div>
          <div className="h-2 w-full rounded-clay-full bg-clay-neutral-100 shadow-clay-input overflow-hidden">
            <div
              className={`h-full rounded-clay-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Asset grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="size-7 rounded-full border-2 border-clay-primary/30 border-t-clay-primary animate-spin-soft" />
          </div>
        ) : assets.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl mb-2">🖼</p>
            <p className="text-xs text-clay-text-muted">还没有素材</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset: { id: string; originalName: string; mimeType: string; fileSize: number; compressedSize: number | null; category: string; variantRole: string; thumbnailUrl: string | null }) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                projectId={projectId}
                onUpdate={refresh}
                token={token || ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
