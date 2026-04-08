'use client';

import { useState } from 'react';
import { UploadZone } from './upload-zone';
import { AssetCard } from './asset-card';
import { useAssets } from '@/hooks/use-assets';
import { useAuth } from '@/components/auth-provider';
import { LibrarySelectModal } from '@/components/library/library-select-modal';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api-client';
import { FolderOpen } from 'lucide-react';

interface AssetPanelProps {
  projectId: string;
}

export function AssetPanel({ projectId }: AssetPanelProps) {
  const { assets, isLoading, refresh } = useAssets(projectId);
  const { token } = useAuth();
  const [showLibrary, setShowLibrary] = useState(false);

  const totalSize = assets
    .filter((a: { variantRole: string }) => a.variantRole !== 'excluded')
    .reduce(
      (sum: number, a: { compressedSize: number | null; fileSize: number }) =>
        sum + (a.compressedSize || a.fileSize),
      0
    );
  const estimatedHtml = Math.ceil(totalSize * 1.37) + 50 * 1024; // base64 expansion + skeleton overhead
  const MAX_SIZE = 5 * 1024 * 1024;
  const isSizeWarning = estimatedHtml > MAX_SIZE * 0.8;
  const isSizeError = estimatedHtml > MAX_SIZE;

  const handleSaveToLibrary = async (assetId: string) => {
    try {
      await api.post('/api/library', { assetId, projectId });
      toast('已收藏到素材库', 'success');
    } catch { toast('收藏失败', 'error'); }
  };

  const handleImportFromLibrary = async (libraryAssetId: string) => {
    try {
      await api.post(`/api/projects/${projectId}/assets/from-library`, { libraryAssetId });
      refresh();
      toast('已从素材库导入', 'success');
    } catch { toast('导入失败', 'error'); }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3">
        <h3 className="text-sm font-bold text-clay-text">素材</h3>
      </div>

      <div className="p-3">
        <UploadZone projectId={projectId} onUploadComplete={refresh} />
        <button
          onClick={() => setShowLibrary(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-clay clay-gradient-blue clay-shadow-sm px-3 py-2 text-xs font-bold text-clay-blue-400 hover:clay-shadow hover:-translate-y-0.5 clay-transition"
        >
          <FolderOpen size={12} /> 从素材库选择
        </button>
      </div>

      {/* Size estimate */}
      {assets.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-semibold ${isSizeError ? 'text-red-500' : isSizeWarning ? 'text-yellow-600' : 'text-clay-text/40'}`}>
              预估体积: {(estimatedHtml / 1024 / 1024).toFixed(1)}MB / 5.0MB
            </p>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-clay-bg">
            <div
              className={`h-full rounded-full transition-all ${
                isSizeError ? 'bg-red-500' : isSizeWarning ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(100, (estimatedHtml / MAX_SIZE) * 100)}%`,
              }}
            />
          </div>
          {isSizeError && (
            <p className="mt-1 text-[10px] font-semibold text-red-500">
              ⚠️ 素材总体积可能超标，建议降低图片质量或减少素材
            </p>
          )}
        </div>
      )}

      {/* Asset grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : assets.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-clay-muted">
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
                onSaveToLibrary={handleSaveToLibrary}
              />
            ))}
          </div>
        )}
      </div>

      <LibrarySelectModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleImportFromLibrary}
        token={token || ''}
      />
    </div>
  );
}
