'use client';

import { Lock, Unlock } from 'lucide-react';

interface SkeletonPreviewProps {
  projectId: string;
  lockedVersion: { id: string; version: number } | null;
  token: string;
  onUnlock: () => void;
}

export function SkeletonPreview({ projectId, lockedVersion, token, onUnlock }: SkeletonPreviewProps) {
  return (
    <div className="w-80 flex-shrink-0 border-r border-clay-blue-50 clay-gradient-surface flex flex-col">
      <div className="px-4 py-3 border-b border-clay-blue-50/20">
        <div className="flex items-center justify-between">
          {lockedVersion ? (
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-clay-blue-400" />
              <span className="text-sm font-medium text-clay-text">骨架 v{lockedVersion.version}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Unlock size={14} className="text-clay-muted" />
              <span className="text-sm text-clay-text/60">未锁定</span>
            </div>
          )}
          {lockedVersion && (
            <button onClick={onUnlock} className="text-xs text-clay-muted hover:text-clay-blue-400">
              解锁
            </button>
          )}
        </div>
      </div>
      {lockedVersion ? (
        <div className="flex-1 bg-clay-bg">
          <iframe
            src={`/api/projects/${projectId}/preview/${lockedVersion.id}?token=${token}`}
            sandbox="allow-scripts"
            className="w-full h-full border-0 pointer-events-none"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-clay-muted text-center">请回到工作台锁定一个版本</p>
        </div>
      )}
    </div>
  );
}
