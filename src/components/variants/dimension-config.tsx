'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';

interface DimensionAsset {
  id: string;
  thumbnailUrl: string | null;
}

interface Dimension {
  name: string;
  label: string;
  assets: DimensionAsset[];
}

interface DimensionConfigProps {
  rawDimensions: Dimension[];
  dimensionOverrides: Record<string, { enabled: boolean; assetIds: string[] }>;
  enabledDimensions: Array<{ assets: { length: number } }>;
  totalCombinations: number;
  configLoading: boolean;
  token: string;
  projectId: string;
  onToggleDimension: (name: string, enabled: boolean) => void;
  onToggleAsset: (dimName: string, assetId: string) => void;
}

export function DimensionConfig({
  rawDimensions,
  dimensionOverrides,
  enabledDimensions,
  totalCombinations,
  configLoading,
  token,
  projectId,
  onToggleDimension,
  onToggleAsset,
}: DimensionConfigProps) {
  return (
    <Card>
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-clay-text">变体维度配置</h3>
          {/* Combination count badge */}
          {totalCombinations > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-clay-xl bg-clay-primary-lt shadow-clay-xs">
              <span className="text-sm text-clay-text-muted">共</span>
              <span className="text-lg font-bold text-clay-primary">{totalCombinations}</span>
              <span className="text-sm text-clay-text-muted">个变体</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {configLoading ? (
          <div className="py-6 text-center">
            <div className="size-6 rounded-full border-2 border-clay-primary/30 border-t-clay-primary animate-spin-soft mx-auto" />
          </div>
        ) : (
          <>
            {rawDimensions.length === 0 && (
              <p className="text-sm text-clay-text-muted py-2">还没有变体素材，在下方上传</p>
            )}

            {rawDimensions.map((d) => {
              const override = dimensionOverrides[d.name];
              const isEnabled = override?.enabled !== false;
              const selectedIds = override?.assetIds || d.assets.map((a) => a.id);

              return (
                <div key={d.name} className={`transition-opacity duration-200 ${!isEnabled ? 'opacity-40' : ''}`}>
                  {/* Dimension header */}
                  <label className="flex items-center gap-3 mb-2.5 cursor-pointer group">
                    {/* Toggle */}
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => onToggleDimension(d.name, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-9 h-5 rounded-clay-full transition-all duration-200 shadow-clay-input ${isEnabled ? 'bg-clay-primary' : 'bg-clay-neutral-200'}`} />
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-clay-xs transition-all duration-200 ${isEnabled ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                    <span className="text-sm font-semibold text-clay-text">
                      {d.label}
                      <span className="ml-1.5 text-xs font-normal text-clay-text-muted">
                        ({selectedIds.length} 张)
                      </span>
                    </span>
                  </label>

                  {/* Asset thumbnails */}
                  <div className="flex gap-2 flex-wrap pl-12">
                    {d.assets.map((a) => {
                      const isSelected = selectedIds.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          onClick={() => isEnabled && onToggleAsset(d.name, a.id)}
                          className={[
                            'h-14 w-14 overflow-hidden rounded-clay-lg transition-all duration-150',
                            isEnabled ? 'cursor-pointer' : 'pointer-events-none',
                            isSelected && isEnabled
                              ? 'ring-2 ring-clay-primary ring-offset-1 shadow-clay-effect-sm'
                              : 'opacity-40 ring-2 ring-clay-border',
                          ].join(' ')}
                        >
                          {a.thumbnailUrl ? (
                            <img src={`${a.thumbnailUrl}?token=${token}`} alt="asset" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xl bg-clay-neutral-100">?</div>
                          )}
                        </div>
                      );
                    })}

                    {/* Per-dimension add button */}
                    <label className={[
                      'h-14 w-14 flex flex-col items-center justify-center rounded-clay-lg border-2 border-dashed',
                      'cursor-pointer transition-all duration-150',
                      isEnabled
                        ? 'border-clay-border hover:border-clay-primary/50 text-clay-text-faint hover:text-clay-primary'
                        : 'pointer-events-none border-clay-border text-clay-text-faint',
                    ].join(' ')}>
                      <span className="text-lg leading-none">+</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const formData = new FormData();
                          Array.from(files).forEach((f) => formData.append('files', f));
                          formData.append('dimensionGroup', d.name);
                          try {
                            const res = await fetch(`/api/projects/${projectId}/variant-assets`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                              body: formData,
                            });
                            if (res.ok) window.location.reload();
                          } catch { /* ignore */ }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}

            {/* Combination formula */}
            {enabledDimensions.length > 1 && (
              <div className="pt-2 border-t border-clay-border flex items-center gap-2 text-sm text-clay-text-muted">
                {enabledDimensions.map((d, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-clay-text-faint">×</span>}
                    <span className="font-bold text-clay-primary">{d.assets.length}</span>
                  </span>
                ))}
                <span>=</span>
                <span className="font-bold text-clay-text">{totalCombinations} 个变体</span>
              </div>
            )}

            {/* Global variant upload */}
            <VariantUploadZone projectId={projectId} token={token} />
          </>
        )}
      </div>
    </Card>
  );
}

function VariantUploadZone({ projectId, token }: { projectId: string; token: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));
    try {
      const res = await fetch(`/api/projects/${projectId}/variant-assets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) window.location.reload();
    } catch { /* ignore */ }
    setUploading(false);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      className={[
        'relative rounded-clay-xl border-2 border-dashed p-4 text-center transition-all duration-200',
        isDragging
          ? 'border-clay-primary bg-clay-primary-lt scale-[1.01]'
          : 'border-clay-border hover:border-clay-primary/50',
      ].join(' ')}
    >
      {uploading ? (
        <div className="flex items-center justify-center gap-2 py-1">
          <div className="size-5 rounded-full border-2 border-clay-primary/30 border-t-clay-primary animate-spin-soft" />
          <span className="text-sm text-clay-text-muted">上传中...</span>
        </div>
      ) : (
        <>
          <Upload size={18} className={`mx-auto mb-2 ${isDragging ? 'text-clay-primary' : 'text-clay-text-faint'}`} />
          <p className="text-sm text-clay-text-muted font-medium">拖拽变体素材到这里，或点击上传</p>
          <p className="mt-1 text-xs text-clay-text-faint">根据文件名自动归入维度（背景/弹窗/按钮）</p>
          <input
            type="file"
            multiple
            accept="image/*,audio/*"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </>
      )}
    </div>
  );
}
