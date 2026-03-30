'use client';

import { UploadZone } from './upload-zone';
import { AssetCard } from './asset-card';
import { useAssets } from '@/hooks/use-assets';
import { useAuth } from '@/components/auth-provider';

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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">素材</h3>
      </div>

      <div className="p-3">
        <UploadZone projectId={projectId} onUploadComplete={refresh} />
      </div>

      {/* Size estimate */}
      {assets.length > 0 && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-gray-400">
            预估 HTML: {(estimatedHtml / 1024).toFixed(0)} KB / 5120 KB
          </p>
          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                estimatedHtml > 5 * 1024 * 1024
                  ? 'bg-red-500'
                  : estimatedHtml > 4 * 1024 * 1024
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(100, (estimatedHtml / (5 * 1024 * 1024)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Asset grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : assets.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            还没有素材，上传开始
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
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
