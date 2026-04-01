'use client';

import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

interface Version {
  id: string;
  version: number;
  validationGrade: string | null;
  isLocked: boolean;
  createdAt: string;
}

interface VersionListProps {
  versions: Version[];
  token: string;
  projectId: string;
  onVersionChange: (id: string) => void;
  onRefresh: () => void;
}

const GRADE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  A: 'success', B: 'info', C: 'warning', D: 'error',
};

export function VersionList({ versions, token, projectId, onVersionChange, onRefresh }: VersionListProps) {
  return (
    <div className="overflow-y-auto px-3 py-3 space-y-2" style={{ height: 'calc(100vh - 140px)' }}>
      {versions.map((v) => (
        <div
          key={v.id}
          className="rounded-clay-xl bg-clay-surface border-2 border-clay-border shadow-clay-xs hover:shadow-clay-effect-sm transition-all duration-150 p-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Version pill */}
              <button
                onClick={() => onVersionChange(v.id)}
                className="px-3 py-1 rounded-clay-full bg-clay-primary-lt text-clay-primary-dk text-sm font-bold hover:bg-clay-primary hover:text-white transition-all duration-150 shadow-clay-xs"
              >
                v{v.version}
              </button>
              {v.isLocked && (
                <Badge variant="info">🔒 已锁定</Badge>
              )}
              {v.validationGrade && (
                <Badge variant={GRADE_VARIANT[v.validationGrade] || 'default'}>
                  {v.validationGrade} 级
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-clay-text-faint">
                {new Date(v.createdAt).toLocaleTimeString('zh-CN')}
              </span>
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/projects/${projectId}/versions/${v.id}/rollback`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    onRefresh();
                    onVersionChange(v.id);
                  } catch { /* ignore */ }
                }}
                className="flex items-center gap-1 text-xs text-clay-text-faint hover:text-clay-primary transition-colors rounded-clay-md px-2 py-1 hover:bg-clay-primary-lt"
                title="回退到此版本"
              >
                <RotateCcw size={11} />
                回退
              </button>
            </div>
          </div>
        </div>
      ))}
      {versions.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm text-clay-text-muted">还没有版本</p>
        </div>
      )}
    </div>
  );
}
