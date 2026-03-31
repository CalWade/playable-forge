'use client';

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
      <h3 className="mb-4 font-semibold text-gray-900">变体维度</h3>
      {configLoading ? (
        <div className="py-4 text-center text-sm text-gray-400">加载中...</div>
      ) : rawDimensions.length === 0 ? (
        <p className="text-sm text-gray-400">没有标记为&ldquo;参与变体&rdquo;的素材</p>
      ) : (
        <div className="space-y-4">
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
                  <span className="text-sm text-gray-600">{d.label} ({selectedIds.length}张)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {d.assets.map((a) => {
                    const isSelected = selectedIds.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => isEnabled && onToggleAsset(d.name, a.id)}
                        className={`h-12 w-12 overflow-hidden rounded border-2 bg-gray-100 cursor-pointer transition-all ${
                          isSelected && isEnabled ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 opacity-40'
                        }`}
                      >
                        {a.thumbnailUrl ? (
                          <img src={`${a.thumbnailUrl}?token=${token}`} alt="asset" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">?</div>
                        )}
                      </div>
                    );
                  })}
                  {/* Per-dimension upload */}
                  <label className={`h-12 w-12 flex items-center justify-center rounded border-2 border-dashed border-gray-300 bg-white cursor-pointer hover:border-blue-400 hover:text-blue-600 text-gray-400 text-lg ${!isEnabled ? 'pointer-events-none' : ''}`}>
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

          <div className="mt-4 text-lg font-semibold text-blue-600">
            {enabledDimensions.length > 0
              ? enabledDimensions.map((d) => d.assets.length).join(' × ') + ' = '
              : ''}
            <span className="text-2xl">{totalCombinations}</span> 个变体
          </div>

          {/* Auto-classify upload */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600">
              <span>+ 新增变体素材（自动分类）</span>
              <input
                type="file"
                multiple
                accept="image/*,audio/*"
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
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
                  e.target.value = '';
                }}
              />
            </label>
            <p className="mt-1 text-xs text-gray-400">根据文件名自动归入维度（背景/弹窗/按钮），也可在每个维度旁的 + 按钮上传</p>
          </div>
        </div>
      )}
    </Card>
  );
}
