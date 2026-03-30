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
import { ArrowLeft, Settings, Lock } from 'lucide-react';
import useSWR from 'swr';

export default function ProjectWorkbenchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { token } = useAuth();
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();

  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data: projectData } = useSWR(
    token ? `/api/projects/${projectId}` : null,
    fetcher
  );

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
    if (!currentVersionId) {
      toast('请先生成一个版本', 'warning');
      return;
    }
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

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {project?.name || '加载中...'}
            </h1>
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
          <button onClick={() => router.push('/settings')} className="text-gray-400 hover:text-gray-600">
            <Settings size={20} />
          </button>
        </header>

        {/* Three-column layout */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
            <AssetPanel projectId={projectId} />
          </div>
          <div className="flex flex-1 flex-col border-r border-gray-200 bg-white">
            <ChatPanel
              projectId={projectId}
              onVersionChange={(vid) => { setCurrentVersionId(vid); refreshVersions(); }}
              hasVersion={!!currentVersionId}
            />
          </div>
          <div className="flex w-96 flex-shrink-0 flex-col bg-white">
            <PreviewPanel
              projectId={projectId}
              versionId={currentVersionId}
              validationGrade={latestVersion?.validationGrade}
              htmlSize={latestVersion?.fullHtmlSize}
              token={token || ''}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
          <Button variant="outline" onClick={handleLockSkeleton} disabled={!currentVersionId}>
            <Lock size={16} className="mr-1" /> 锁定骨架
          </Button>
          <Button onClick={() => router.push(`/projects/${projectId}/variants`)}>
            生成变体 →
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
