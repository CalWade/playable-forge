'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { AssetPanel } from '@/components/workbench/asset-panel';
import { ChatPanel } from '@/components/workbench/chat-panel';
import { PreviewPanel } from '@/components/workbench/preview-panel';
import { Badge } from '@/components/ui/badge';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { ArrowLeft, Settings, Lock, Copy } from 'lucide-react';
import useSWR from 'swr';
import { useAssets } from '@/hooks/use-assets';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';

export default function ProjectWorkbenchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { token } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();
  const [streamingHtml, setStreamingHtml] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { assets } = useAssets(projectId);

  // Compute estimated HTML size from assets
  const totalAssetSize = assets
    .reduce((sum: number, a: { compressedSize: number | null; fileSize: number }) => sum + (a.compressedSize || a.fileSize), 0);
  const estimatedHtmlSize = Math.ceil(totalAssetSize * 1.37) + 50 * 1024;
  const MAX_SIZE = 5 * 1024 * 1024;
  const isSizeWarning = estimatedHtmlSize > MAX_SIZE * 0.8;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projectData } = useSWR<any>(
    token ? `/api/projects/${projectId}` : null,
    swrFetcher
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: versionData, mutate: refreshVersions } = useSWR<any>(
    token ? `/api/projects/${projectId}/versions` : null,
    swrFetcher,
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
    if (!currentVersionId) {
      toast('请先生成一个版本', 'warning');
      return;
    }
    try {
      await api.post(`/api/projects/${projectId}/versions/${currentVersionId}/lock`);
      toast('骨架已锁定', 'success');
      refreshVersions();
    } catch {
      toast('锁定失败', 'error');
    }
  };

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const handleRename = async () => {
    if (!nameInput.trim()) return;
    try {
      await api.patch(`/api/projects/${projectId}`, { name: nameInput.trim() });
      setEditingName(false);
    } catch { /* ignore */ }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col bg-clay-bg p-3 gap-3">
        {/* Header */}
        <header className="flex items-center justify-between rounded-clay-lg clay-gradient-surface clay-shadow px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard')} className="text-clay-blue-400 hover:text-clay-blue-300 clay-transition flex-shrink-0">
              <ArrowLeft size={18} />
            </button>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false); }}
                  autoFocus
                  className="rounded-clay-sm clay-inset px-3 py-1 text-sm font-bold focus:outline-none focus:clay-inset-focus"
                />
                <button onClick={handleRename} className="text-xs font-bold text-clay-blue-400">保存</button>
                <button onClick={() => setEditingName(false)} className="text-xs font-bold text-clay-muted">取消</button>
              </div>
            ) : (
              <h1
                className="cursor-pointer text-sm font-semibold text-gray-900 hover:text-blue-600 truncate"
                onClick={() => { setNameInput(project?.name || ''); setEditingName(true); }}
                title="点击修改项目名"
              >
                {project?.name || '加载中...'}
              </h1>
            )}
            {latestVersion?.validationGrade && (
              <Badge
                variant={
                  latestVersion.validationGrade === 'A' ? 'success' :
                  latestVersion.validationGrade === 'B' ? 'info' :
                  latestVersion.validationGrade === 'C' ? 'warning' : 'error'
                }
              >
                校验等级 {latestVersion.validationGrade} 级
              </Badge>
            )}
            {latestVersion?.fullHtmlSize && (
              <span className="text-xs text-gray-400">
                {(latestVersion.fullHtmlSize / 1024).toFixed(0)}KB / 5120KB
              </span>
            )}
          </div>
          <button onClick={() => router.push('/settings')} className="text-clay-blue-400 hover:text-clay-blue-300 clay-transition">
            <Settings size={20} />
          </button>
        </header>

        {/* Three-column layout */}
        <div className="flex flex-1 overflow-hidden bg-clay-bg p-3 gap-3">
          <div className="w-72 flex-shrink-0 overflow-y-auto rounded-clay-lg clay-gradient-surface clay-shadow">
            <AssetPanel projectId={projectId} />
          </div>
          <div className="flex flex-1 flex-col rounded-clay-lg clay-gradient-surface clay-shadow">
            <ChatPanel
              projectId={projectId}
              onVersionChange={(vid) => { setCurrentVersionId(vid); refreshVersions(); setStreamingHtml(''); setIsStreaming(false); }}
              onAssetChange={() => globalMutate(`/api/projects/${projectId}/assets`)}
              onStreamingHtmlChange={(html) => { setStreamingHtml(html); setIsStreaming(html.length > 0); }}
              hasVersion={!!currentVersionId}
              estimatedSize={estimatedHtmlSize}
              isSizeWarning={isSizeWarning}
            />
          </div>
          <div className="flex flex-shrink-0 flex-col rounded-clay-lg clay-gradient-surface clay-shadow" style={{ width: 450 }}>
            <PreviewPanel
              projectId={projectId}
              versionId={currentVersionId}
              validationGrade={latestVersion?.validationGrade}
              htmlSize={latestVersion?.fullHtmlSize}
              token={token || ''}
              streamingHtml={streamingHtml}
              isStreaming={isStreaming}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-end gap-3 rounded-clay-lg clay-gradient-surface clay-shadow px-5 py-3 flex-shrink-0">
          {currentVersionId && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.post('/api/templates', { projectId, name: `${project?.name || '项目'}-模板` });
                  toast('已保存为模板', 'success');
                } catch { toast('保存失败（需要至少一个版本）', 'error'); }
              }}
            >
              <Copy size={16} className="mr-1.5" /> 存为模板
            </Button>
          )}
          {currentVersionId && (
            <a
              href={`/api/projects/${projectId}/preview/${currentVersionId}?token=${token}`}
              download="playable-ad.html"
              className="inline-flex items-center gap-1.5 rounded-clay clay-gradient-surface clay-shadow-sm px-5 py-2.5 text-sm font-bold text-clay-text hover:clay-shadow hover:-translate-y-0.5 clay-transition"
            >
              ⬇ 下载 HTML
            </a>
          )}
          <Button variant="outline" onClick={handleLockSkeleton} disabled={!currentVersionId}>
            <Lock size={16} className="mr-1.5" /> 锁定骨架
          </Button>
          <Button onClick={() => router.push(`/projects/${projectId}/variants`)}>
            生成变体 →
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
