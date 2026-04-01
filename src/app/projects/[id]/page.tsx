'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { AssetPanel } from '@/components/workbench/asset-panel';
import { ChatPanel } from '@/components/workbench/chat-panel';
import { PreviewPanel } from '@/components/workbench/preview-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { ArrowLeft, Settings, Lock, Download, Layers } from 'lucide-react';
import useSWR from 'swr';

const GRADE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  A: 'success', B: 'info', C: 'warning', D: 'error',
};

export default function ProjectWorkbenchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { token } = useAuth();
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data: projectData } = useSWR(token ? `/api/projects/${projectId}` : null, fetcher);
  const { data: versionData, mutate: refreshVersions } = useSWR(
    token ? `/api/projects/${projectId}/versions` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const project = projectData?.project;
  const versions = versionData?.versions || [];
  const latestVersion = versions[0];

  useEffect(() => {
    if (latestVersion && !currentVersionId) {
      setCurrentVersionId(latestVersion.id);
    }
  }, [latestVersion, currentVersionId]);

  const handleLockSkeleton = async () => {
    if (!currentVersionId) { toast('请先生成一个版本', 'warning'); return; }
    try {
      await fetch(`/api/projects/${projectId}/versions/${currentVersionId}/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      toast('骨架已锁定', 'success');
      refreshVersions();
    } catch {
      toast('锁定失败', 'error');
    }
  };

  const handleRename = async () => {
    if (!nameInput.trim()) return;
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      setEditingName(false);
    } catch { /* ignore */ }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col bg-clay-bg">
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-clay-border bg-clay-surface/95 backdrop-blur-sm px-4 py-2.5 shrink-0 shadow-clay-xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft size={16} />
            </Button>

            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  autoFocus
                  className="rounded-clay-md border-2 border-clay-primary/50 bg-clay-neutral-50 px-2.5 py-1 text-sm font-bold text-clay-text shadow-clay-input focus:outline-none"
                />
                <button onClick={handleRename} className="text-xs font-semibold text-clay-primary hover:underline">保存</button>
                <button onClick={() => setEditingName(false)} className="text-xs text-clay-text-faint hover:underline">取消</button>
              </div>
            ) : (
              <h1
                className="cursor-pointer text-sm font-bold text-clay-text hover:text-clay-primary transition-colors truncate"
                onClick={() => { setNameInput(project?.name || ''); setEditingName(true); }}
                title="点击修改项目名"
              >
                {project?.name || '加载中...'}
              </h1>
            )}

            {latestVersion?.validationGrade && (
              <Badge variant={GRADE_VARIANT[latestVersion.validationGrade] || 'default'}>
                {latestVersion.validationGrade} 级
              </Badge>
            )}
            {latestVersion?.fullHtmlSize && (
              <span className="hidden sm:block text-[11px] font-medium text-clay-text-faint">
                {(latestVersion.fullHtmlSize / 1024).toFixed(0)}KB / 5120KB
              </span>
            )}
          </div>

          <Button variant="ghost" size="icon-sm" onClick={() => router.push('/settings')}>
            <Settings size={16} />
          </Button>
        </header>

        {/* Three-column layout */}
        <div className="flex flex-1 overflow-hidden gap-px bg-clay-border">
          {/* Asset panel */}
          <div className="w-56 shrink-0 overflow-y-auto">
            <AssetPanel projectId={projectId} />
          </div>

          {/* Chat panel */}
          <div className="flex flex-1 flex-col">
            <ChatPanel
              projectId={projectId}
              onVersionChange={(vid) => { setCurrentVersionId(vid); refreshVersions(); }}
              hasVersion={!!currentVersionId}
            />
          </div>

          {/* Preview panel */}
          <div className="shrink-0 flex flex-col" style={{ width: 420 }}>
            <PreviewPanel
              projectId={projectId}
              versionId={currentVersionId}
              validationGrade={latestVersion?.validationGrade}
              htmlSize={latestVersion?.fullHtmlSize}
              token={token || ''}
            />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-end gap-2.5 border-t-2 border-clay-border bg-clay-surface px-5 py-3 shrink-0">
          {currentVersionId && (
            <a
              href={`/api/projects/${projectId}/preview/${currentVersionId}?token=${token}`}
              download="playable-ad.html"
              className="inline-flex items-center gap-1.5 rounded-clay-lg border-2 border-clay-border bg-clay-surface px-4 py-2 text-sm font-semibold text-clay-text-muted hover:text-clay-text hover:border-clay-primary/40 hover:shadow-clay-xs transition-all duration-150"
            >
              <Download size={14} />
              下载 HTML
            </a>
          )}
          <Button variant="outline" onClick={handleLockSkeleton} disabled={!currentVersionId}>
            <Lock size={14} />
            锁定骨架
          </Button>
          <Button onClick={() => router.push(`/projects/${projectId}/variants`)}>
            <Layers size={14} />
            生成变体
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
