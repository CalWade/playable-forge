'use client';

import { useState } from 'react';
import { ComparePreviewModal } from './compare-preview-modal';
import { Button } from '@/components/ui/button';

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
      await fetch(`/api/projects/${projectId}/versions/${versionId}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCompare(false);
      setSelected(new Set());
      onRefresh();
      onVersionChange(versionId);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex flex-1 flex-col">
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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center gap-3 rounded-clay clay-gradient-surface clay-shadow-sm p-4 hover:clay-shadow hover:-translate-y-0.5 clay-transition">
            <input
              type="checkbox"
              checked={selected.has(v.id)}
              onChange={() => toggleSelect(v.id)}
              className="rounded accent-clay-blue-400 flex-shrink-0"
            />
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="cursor-pointer text-sm font-bold text-clay-blue-400 hover:text-clay-blue-300 clay-transition"
                  onClick={() => onVersionChange(v.id)}
                >
                  v{v.version}
                </span>
                {v.isLocked && <span className="text-xs font-bold text-clay-purple-100">🔒 已锁定</span>}
                {v.parentId && (() => {
                  const parent = versions.find((p) => p.id === v.parentId);
                  return parent ? <span className="text-[10px] font-medium text-clay-muted">↩ 回退自 v{parent.version}</span> : null;
                })()}
                {v.validationGrade && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-clay-sm ${
                    v.validationGrade === 'A' ? 'bg-clay-green-50 text-green-700' :
                    v.validationGrade === 'B' ? 'bg-clay-blue-50 text-blue-700' :
                    v.validationGrade === 'C' ? 'bg-clay-yellow-50 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {v.validationGrade}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-clay-text/40">
                  {new Date(v.createdAt).toLocaleTimeString('zh-CN')}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await fetch(`/api/projects/${projectId}/versions/${v.id}/rollback`, {
                        method: 'POST', headers: { Authorization: `Bearer ${token}` },
                      });
                      onRefresh(); onVersionChange(v.id);
                    } catch { /* ignore */ }
                  }}
                  className="text-xs font-bold text-clay-muted hover:text-clay-blue-400 clay-transition"
                >
                  ↩ 回退
                </button>
              </div>
            </div>
          </div>
        ))}
        {versions.length === 0 && (
          <p className="py-8 text-center text-sm font-medium text-clay-muted">还没有版本</p>
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
