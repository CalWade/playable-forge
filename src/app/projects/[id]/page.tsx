'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { AssetPanel } from '@/components/workbench/asset-panel';
import { ChatPanel } from '@/components/workbench/chat-panel';
import { PreviewPanel } from '@/components/workbench/preview-panel';

export default function ProjectWorkbenchPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { token } = useAuth();
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
            <h1 className="text-lg font-semibold text-gray-900">工作台</h1>
          </div>
        </header>

        {/* Three-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Asset Panel */}
          <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
            <AssetPanel projectId={projectId} />
          </div>

          {/* Center: Chat Panel */}
          <div className="flex flex-1 flex-col border-r border-gray-200 bg-white">
            <ChatPanel
              projectId={projectId}
              onVersionChange={setCurrentVersionId}
              hasVersion={!!currentVersionId}
            />
          </div>

          {/* Right: Preview Panel */}
          <div className="flex w-96 flex-shrink-0 flex-col bg-white">
            <PreviewPanel
              projectId={projectId}
              versionId={currentVersionId}
              token={token || ''}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
