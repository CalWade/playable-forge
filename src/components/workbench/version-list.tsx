'use client';

import { useState } from 'react';
import { ComparePreviewModal } from './compare-preview-modal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

interface Version {
  id: string; version: number; validationGrade: string | null; fullHtmlSize: number | null; isLocked: boolean; parentId: string | null; createdAt: string;
}

interface VersionListProps {
  versions: Version[]; token: string; projectId: string;
  onVersionChange: (id: string) => void; onRefresh: () => void;
}

export function VersionList({ versions, token, projectId, onVersionChange, onRefresh }: VersionListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const compareItems = versions
    .filter((v) => selected.has(v.id))
    .map((v) => ({
      id: v.id,
      label: `v${v.version}`,
      previewUrl: `/api/projects/${projectId}/preview/${v.id}`,
      grade: v.validationGrade,
      size: v.fullHtmlSize,
    }));

  const handleAdopt = async (versionId: string) => {
    try {
      await api.post(`/api/projects/${projectId}/versions/${versionId}/rollback`);
      setShowCompare(false);
      setSelected(new Set());
      onRefresh();
      onVersionChange(versionId);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Compare bar */}
      {selected.size >= 2 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-clay-blue-50/30">
          <span className="text-xs font-semibold text-clay-text/50">
            已选 {selected.size} 个版本
          </span>
          <Button size="sm" onClick={() => setShowCompare(true)}>
            对比预览
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {versions.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-clay-muted">还没有版本</p>
        ) : (
          <div className="relative">
            {/* Vertical timeline rail */}
            <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gradient-to-b from-clay-blue-200 via-clay-blue-100 to-transparent" />

            <div className="space-y-3">
              {versions.map((v, idx) => {
                const parent = v.parentId ? versions.find((p) => p.id === v.parentId) : null;
                const dateStr = new Date(v.createdAt).toLocaleString('zh-CN', {
                  month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                });
                const isLatest = idx === 0;
                return (
                  <div key={v.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 border-white ${
                      isLatest
                        ? 'bg-gradient-to-br from-clay-blue-300 to-clay-blue-500 clay-shadow-sm'
                        : v.isLocked
                        ? 'bg-gradient-to-br from-purple-300 to-purple-500'
                        : 'bg-gradient-to-br from-clay-blue-100 to-clay-blue-200'
                    }`} />

                    <div className="flex items-center gap-3 rounded-clay clay-gradient-surface clay-shadow-sm p-3 hover:clay-shadow hover:-translate-y-0.5 clay-transition">
                      <input
                        type="checkbox"
                        checked={selected.has(v.id)}
                        onChange={() => toggleSelect(v.id)}
                        className="rounded accent-clay-blue-400 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="cursor-pointer text-sm font-bold text-clay-blue-400 hover:text-clay-blue-300 clay-transition"
                            onClick={() => onVersionChange(v.id)}
                          >
                            v{v.version}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-clay-sm bg-gradient-to-br from-clay-blue-50 to-clay-blue-100 text-clay-blue-500">
                              最新
                            </span>
                          )}
                          {v.isLocked && <span className="text-[10px] font-bold text-purple-600">🔒 锁定</span>}
                          {parent && (
                            <span className="text-[10px] font-medium text-clay-muted">↩ 回退自 v{parent.version}</span>
                          )}
                          {v.validationGrade && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-clay-sm ${
                              v.validationGrade === 'A' ? 'bg-clay-green-50 text-green-700' :
                              v.validationGrade === 'B' ? 'bg-clay-blue-50 text-blue-700' :
                              v.validationGrade === 'C' ? 'bg-clay-yellow-50 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {v.validationGrade} 级
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-clay-text/40">
                          {dateStr}
                          {v.fullHtmlSize && (
                            <span className="ml-2">· {(v.fullHtmlSize / 1024).toFixed(0)}KB</span>
                          )}
                        </p>
                      </div>
                      {!isLatest && (
                        <button
                          onClick={async () => {
                            try {
                              await api.post(`/api/projects/${projectId}/versions/${v.id}/rollback`);
                              onRefresh(); onVersionChange(v.id);
                            } catch { /* ignore */ }
                          }}
                          className="text-xs font-bold text-clay-muted hover:text-clay-blue-400 clay-transition flex-shrink-0"
                          title="采用此版本作为最新"
                        >
                          ↩ 采用
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ComparePreviewModal
        open={showCompare}
        onClose={() => setShowCompare(false)}
        items={compareItems}
        onSelect={handleAdopt}
        selectLabel="采用此版本"
        token={token}
      />
    </div>
  );
}
