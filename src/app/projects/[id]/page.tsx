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
import { ArrowLeft, Settings, Lock, Copy, Download, MoreHorizontal, LogOut, User, Hammer } from 'lucide-react';
import useSWR from 'swr';
import { useAssets } from '@/hooks/use-assets';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';

export default function ProjectWorkbenchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { token, user, logout } = useAuth();
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const displayName = user?.displayName || user?.username || 'U';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleRename = async () => {
    if (!nameInput.trim()) return;
    try {
      await api.patch(`/api/projects/${projectId}`, { name: nameInput.trim() });
      setEditingName(false);
    } catch { /* ignore */ }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col bg-clay-bg p-2 gap-2">
        {/* Header - compact */}
        <header className="flex items-center justify-between rounded-clay-lg clay-gradient-surface clay-shadow px-4 py-2 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard')} className="text-clay-blue-400 hover:text-clay-blue-300 clay-transition flex-shrink-0" title="返回">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-clay-sm bg-gradient-to-br from-clay-blue-300 to-clay-blue-500 clay-shadow-sm">
                <Hammer size={12} className="text-white" />
              </div>
              <span className="text-xs font-extrabold text-clay-text/50">Forge</span>
              <span className="text-xs font-bold text-clay-text/30">/</span>
            </div>
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
          <div className="relative flex items-center">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-clay-blue-300 to-clay-blue-500 text-xs font-bold text-white clay-shadow-sm hover:clay-shadow clay-transition"
              title={displayName}
            >
              {avatarLetter}
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-11 z-50 w-48 rounded-clay bg-white clay-shadow-lg py-2 border border-clay-blue-100">
                  <div className="px-4 py-2 border-b border-clay-blue-50">
                    <p className="text-xs text-clay-text/50">登录身份</p>
                    <p className="text-sm font-semibold text-clay-text truncate">{displayName}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); router.push('/settings'); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-clay-text hover:bg-clay-blue-50 clay-transition"
                  >
                    <Settings size={14} /> 设置
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); router.push('/dashboard'); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-clay-text hover:bg-clay-blue-50 clay-transition"
                  >
                    <User size={14} /> 返回控制台
                  </button>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 clay-transition"
                  >
                    <LogOut size={14} /> 登出
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Three-column layout */}
        <div className="flex flex-1 overflow-hidden bg-clay-bg gap-2">
          <div className="w-80 flex-shrink-0 overflow-y-auto rounded-clay-lg clay-gradient-surface clay-shadow">
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

        {/* Bottom bar - compact with clear hierarchy: secondary (icon only) | primary CTA */}
        <div className="flex items-center justify-between gap-2 rounded-clay-lg clay-gradient-surface clay-shadow px-4 py-2 flex-shrink-0">
          {/* Left: version/asset status hint (keeps bottom bar feeling informed, not just buttons) */}
          <div className="flex items-center gap-2 text-xs text-clay-text/50">
            {currentVersionId ? (
              <>
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="font-semibold">当前版本已保存</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-clay-blue-300" />
                <span className="font-semibold">等待生成初稿</span>
              </>
            )}
          </div>

          {/* Right: secondary actions (icon buttons) + primary CTA */}
          <div className="flex items-center gap-2">
            {currentVersionId && (
              <a
                href={`/api/projects/${projectId}/preview/${currentVersionId}?token=${token}`}
                download="playable-ad.html"
                title="下载 HTML"
                className="inline-flex items-center justify-center rounded-clay-sm bg-white/60 clay-shadow-sm h-9 w-9 text-clay-text/70 hover:text-clay-text hover:clay-shadow clay-transition"
              >
                <Download size={15} />
              </a>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title="更多"
                className="inline-flex items-center justify-center rounded-clay-sm bg-white/60 clay-shadow-sm h-9 w-9 text-clay-text/70 hover:text-clay-text hover:clay-shadow clay-transition"
              >
                <MoreHorizontal size={15} />
              </button>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute right-0 bottom-11 z-50 w-48 rounded-clay bg-white clay-shadow-lg py-2 border border-clay-blue-100">
                    <button
                      disabled={!currentVersionId}
                      onClick={async () => {
                        setShowMoreMenu(false);
                        try {
                          await api.post('/api/templates', { projectId, name: `${project?.name || '项目'}-模板` });
                          toast('已保存为模板', 'success');
                        } catch { toast('保存失败（需要至少一个版本）', 'error'); }
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-clay-text hover:bg-clay-blue-50 clay-transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Copy size={14} /> 存为模板
                    </button>
                    <button
                      disabled={!currentVersionId}
                      onClick={() => { setShowMoreMenu(false); handleLockSkeleton(); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-clay-text hover:bg-clay-blue-50 clay-transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Lock size={14} /> 锁定骨架
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={() => router.push(`/projects/${projectId}/variants`)}
              disabled={!currentVersionId}
              title={!currentVersionId ? '需先生成初稿' : '批量生成变体'}
            >
              生成变体 →
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
