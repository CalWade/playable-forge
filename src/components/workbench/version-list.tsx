'use client';

interface Version {
  id: string; version: number; validationGrade: string | null; isLocked: boolean; createdAt: string;
}

interface VersionListProps {
  versions: Version[]; token: string; projectId: string;
  onVersionChange: (id: string) => void; onRefresh: () => void;
}

export function VersionList({ versions, token, projectId, onVersionChange, onRefresh }: VersionListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3" >
      {versions.map((v) => (
        <div key={v.id} className="rounded-clay clay-gradient-surface clay-shadow-sm p-4 hover:clay-shadow hover:-translate-y-0.5 clay-transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="cursor-pointer text-sm font-bold text-clay-blue-400 hover:text-clay-blue-300 clay-transition"
                onClick={() => onVersionChange(v.id)}
              >
                v{v.version}
              </span>
              {v.isLocked && <span className="text-xs font-bold text-clay-purple-100">🔒 已锁定</span>}
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
  );
}
