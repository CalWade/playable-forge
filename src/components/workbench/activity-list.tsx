'use client';

import useSWR from 'swr';
import { swrFetcher } from '@/lib/swr-fetcher';

interface ActivityListProps {
  projectId: string;
  token: string;
}

const ACTION_ICONS: Record<string, string> = {
  create_project: '📁',
  upload_asset: '📤',
  generate: '🛠️',
  iterate: '🔄',
  lock: '🔒',
  batch_generate: '⚡',
  download: '⬇️',
};

export function ActivityList({ projectId }: ActivityListProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading } = useSWR<any>(
    `/api/projects/${projectId}/activity`,
    swrFetcher
  );

  const logs = data?.logs || [];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-2">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-clay-blue-400 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm font-medium text-clay-muted">暂无操作记录</p>
      ) : (
        logs.map((log: { id: string; action: string; description: string; userName: string; createdAt: string }) => (
          <div key={log.id} className="flex items-start gap-3 rounded-clay-sm bg-clay-bg/50 px-4 py-3">
            <span className="text-sm flex-shrink-0 mt-0.5">{ACTION_ICONS[log.action] || '📋'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-clay-text">{log.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-clay-muted">{log.userName}</span>
                <span className="text-[10px] text-clay-text/30">
                  {new Date(log.createdAt).toLocaleString('zh-CN', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
