'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { X, Search } from 'lucide-react';

interface LibraryAsset {
  id: string;
  originalName: string;
  mimeType: string;
  category: string;
  usageCount: number;
  thumbnailUrl: string;
}

interface LibrarySelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (libraryAssetId: string) => void;
  token: string;
}

export function LibrarySelectModal({ open, onClose, onSelect, token }: LibrarySelectModalProps) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    api.get<{ assets: LibraryAsset[] }>(`/api/library?${params}`)
      .then((data) => setAssets(data.assets || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, [open, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-clay-lg clay-gradient-surface clay-shadow p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-clay-text">素材库</h2>
          <button onClick={onClose} className="text-clay-muted hover:text-clay-text clay-transition">
            <X size={18} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索素材..."
            className="w-full rounded-clay clay-inset bg-gradient-to-br from-[#e8f4ff] to-[#dceefb] pl-9 pr-4 py-2 text-sm text-clay-text placeholder:text-clay-muted focus:outline-none focus:clay-inset-focus"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-clay-blue-400 border-t-transparent" />
          </div>
        ) : assets.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-clay-muted">
            素材库为空。在项目中点击素材的 ⭐ 按钮收藏
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
            {assets.map((a) => (
              <div
                key={a.id}
                onClick={() => { onSelect(a.id); onClose(); }}
                className="cursor-pointer rounded-clay clay-gradient-blue p-2 clay-shadow-sm hover:clay-shadow hover:-translate-y-0.5 clay-transition"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-clay-bg mb-1">
                  {a.mimeType.startsWith('image/') ? (
                    <img
                      src={`${a.thumbnailUrl}?token=${token}`}
                      alt={a.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-clay-muted text-xs">
                      {a.mimeType.startsWith('audio/') ? '🔊' : '📄'}
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-medium text-clay-text truncate">{a.originalName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="default" className="text-[8px] px-1 py-0">{a.category}</Badge>
                  <span className="text-[8px] text-clay-muted">×{a.usageCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}
