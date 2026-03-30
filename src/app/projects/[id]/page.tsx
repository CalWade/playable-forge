'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { AssetPanel } from '@/components/workbench/asset-panel';

export default function ProjectWorkbenchPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col">
        {/* Header - placeholder for Task 18 */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">工作台</h1>
        </header>

        {/* Three-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Asset Panel */}
          <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
            <AssetPanel projectId={projectId} />
          </div>

          {/* Center: Chat Panel - placeholder for Task 12 */}
          <div className="flex flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              对话区域（Task 12）
            </div>
          </div>

          {/* Right: Preview Panel - placeholder for Task 11 */}
          <div className="flex w-96 flex-shrink-0 flex-col bg-white">
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              预览区域（Task 11）
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
