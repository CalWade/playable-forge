'use client';

import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SkeletonPreviewProps {
  projectId: string;
  lockedVersion: { id: string; version: number } | null;
  token: string;
  onUnlock: () => void;
}

export function SkeletonPreview({ projectId, lockedVersion, token, onUnlock }: SkeletonPreviewProps) {
  return (
    <div className="w-72 shrink-0 flex flex-col bg-clay-surface border-r-2 border-clay-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-clay-border">
        {lockedVersion ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-clay-md bg-clay-primary-lt flex items-center justify-center shadow-clay-xs">
              <Lock size={13} className="text-clay-primary" />
            </div>
            <span className="text-sm font-bold text-clay-text">骨架 v{lockedVersion.version}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-clay-md bg-clay-neutral-100 flex items-center justify-center">
              <Unlock size={13} className="text-clay-text-faint" />
            </div>
            <span className="text-sm text-clay-text-muted">未锁定骨架</span>
          </div>
        )}
        {lockedVersion && (
          <Button variant="ghost" size="xs" onClick={onUnlock}>
            解锁
          </Button>
        )}
      </div>

      {/* Preview */}
      {lockedVersion ? (
        <div className="flex-1 bg-clay-neutral-100 overflow-hidden">
          <iframe
            src={`/api/projects/${projectId}/preview/${lockedVersion.id}?token=${token}`}
            sandbox="allow-scripts"
            className="w-full h-full border-0 pointer-events-none"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-4xl">🔒</p>
          <p className="text-sm text-clay-text-muted leading-relaxed">
            请回到工作台<br/>锁定一个骨架版本
          </p>
        </div>
      )}
    </div>
  );
}
