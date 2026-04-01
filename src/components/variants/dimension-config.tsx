'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

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
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-clay-text">变体维度</h3>
      {configLoading ? (
        <div className="py-4 text-center text-sm text-clay-muted">加载中...</div>
      ) : (
        <div className="space-y-4">
          {rawDimensions.length === 0 && (
            <p className="text-sm text-clay-muted">还没有变体素材，点击下方按钮上传</p>
          )}
          {rawDimensions.map((d) => {
            const override = dimensionOverrides[d.name];
            const isEnabled = override?.enabled !== false;
            const selectedIds = override?.assetIds || d.assets.map((a) => a.id);

            return (
              <div key={d.name} className={`flex items-center gap-4 ${!isEnabled ? 'opacity-40' : ''}`}>
                <label className="flex items-center gap-2 w-32 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => onToggleDimension(d.name, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-clay-text/70">{d.label} ({selectedIds.length}张)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {d.assets.map((a) => {
                    const isSelected = selectedIds.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => isEnabled && onToggleAsset(d.name, a.id)}
                        className={`h-12 w-12 overflow-hidden rounded border-2 bg-clay-bg cursor-pointer transition-all ${
                          isSelected && isEnabled ? 'border-blue-400 ring-1 ring-blue-200' : 'border-clay-blue-50 opacity-40'
                        }`}
                      >
                        {a.thumbnailUrl ? (
                          <img src={`${a.thumbnailUrl}?token=${token}`} alt="asset" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-clay-muted">?</div>
                        )}
                      </div>
                    );
                  })}
                  {/* Per-dimension upload */}
                  <label className={`h-12 w-12 flex items-center justify-center rounded border-2 border-dashed border-clay-blue-100/50 clay-gradient-surface cursor-pointer hover:border-blue-400 hover:text-clay-blue-400 text-clay-muted text-lg ${!isEnabled ? 'pointer-events-none' : ''}`}>
                    +
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

          <div className="mt-4 text-lg font-semibold text-clay-blue-400">
            {enabledDimensions.length > 0
              ? enabledDimensions.map((d) => d.assets.length).join(' × ') + ' = '
              : ''}
            <span className="text-2xl">{totalCombinations}</span> 个变体
          </div>

          {/* Auto-classify upload with drag & drop */}
          <VariantUploadZone projectId={projectId} token={token} />
        </div>
      )}
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
    <div className="mt-4 pt-4 border-t border-clay-blue-50/20">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-clay-blue-100 hover:border-gray-400'
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-clay-text/60">上传中...</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-clay-text/60">拖拽变体素材到这里，或点击上传</p>
            <p className="mt-1 text-xs text-clay-muted">根据文件名自动归入维度（背景/弹窗/按钮）</p>
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
    </div>
  );
}
