'use client';

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

export function VersionList({ versions, token, projectId, onVersionChange, onRefresh }: VersionListProps) {
  return (
    <div className="overflow-y-auto p-4 space-y-2" style={{ height: 'calc(100vh - 140px)' }}>
      {versions.map((v) => (
        <div key={v.id} className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="cursor-pointer text-sm font-medium text-blue-600 hover:underline"
                onClick={() => onVersionChange(v.id)}
              >
                v{v.version}
              </span>
              {v.isLocked && <span className="text-xs text-blue-600">🔒 已锁定</span>}
              {v.validationGrade && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  v.validationGrade === 'A' ? 'bg-green-100 text-green-700' :
                  v.validationGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                  v.validationGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {v.validationGrade}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
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
                className="text-xs text-gray-400 hover:text-blue-600"
                title="回退到此版本"
              >
                ↩ 回退
              </button>
            </div>
          </div>
        </div>
      ))}
      {versions.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">还没有版本</p>
      )}
    </div>
  );
}
