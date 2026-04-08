'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useSSE } from '@/hooks/use-sse';
import { SimpleTabs as Tabs } from '@/components/ui/simple-tabs';
import useSWR from 'swr';

import { GeneratePanel } from './generate-panel';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { VersionList } from './version-list';
import { DebugPanel } from './debug-panel';
import { ActivityList } from './activity-list';

interface ChatPanelProps {
  projectId: string;
  onVersionChange: (versionId: string) => void;
  onAssetChange?: () => void;
  onStreamingHtmlChange?: (html: string) => void;
  hasVersion: boolean;
  estimatedSize?: number;
  isSizeWarning?: boolean;
}

export function ChatPanel({ projectId, onVersionChange, onAssetChange, onStreamingHtmlChange, hasVersion, estimatedSize, isSizeWarning }: ChatPanelProps) {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [safetyClarification, setSafetyClarification] = useState(false);
  const [streamPreview, setStreamPreview] = useState(false);
  const { isStreaming, lastEvent, debugLog, streamingHtml, startStream } = useSSE();

  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data: convData, mutate: refreshConv } = useSWR(
    token ? `/api/projects/${projectId}/versions` : null, fetcher
  );
  const { data: historyData, mutate: refreshHistory } = useSWR(
    token ? `/api/projects/${projectId}/conversations` : null, fetcher
  );

  const dbMessages = (historyData?.messages || []).map(
    (m: { role: string; content: string }) => ({ role: m.role, content: m.content })
  );
  const [tempMessages, setTempMessages] = useState<Array<{ role: string; content: string }>>([]);
  const allMessages = [...dbMessages, ...tempMessages];

  // Forward streamingHtml to parent for preview panel
  useEffect(() => {
    onStreamingHtmlChange?.(streamingHtml);
  }, [streamingHtml, onStreamingHtmlChange]);

  // SSE event handler
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.event === 'complete') {
      onVersionChange(lastEvent.data.versionId as string);
      setTempMessages([]);
      refreshHistory();
      refreshConv();
    } else if (lastEvent.event === 'error') {
      setTempMessages((prev) => [...prev, { role: 'system', content: `❌ 错误: ${lastEvent.data.message}` }]);
    } else if (lastEvent.event === 'status') {
      setTempMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'status') return [...prev.slice(0, -1), { role: 'status', content: lastEvent.data.message as string }];
        return [...prev, { role: 'status', content: lastEvent.data.message as string }];
      });
    } else if (lastEvent.event === 'question') {
      setTempMessages((prev) => [...prev, { role: 'assistant', content: `🤔 ${lastEvent.data.message}` }]);
    }
  }, [lastEvent, onVersionChange, refreshConv, refreshHistory]);

  const handleGenerate = async () => {
    setTempMessages([{ role: 'status', content: '🔍 正在生成初稿...' }]);
    await startStream(`/api/projects/${projectId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ description: description || undefined, safetyClarification, streamPreview }),
      token: token || undefined,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setInput('');
    setTempMessages([{ role: 'user', content: msg }, { role: 'status', content: '🛠️ 正在修改...' }]);
    await startStream(`/api/projects/${projectId}/iterate`, {
      method: 'POST',
      body: JSON.stringify({ message: msg, safetyClarification, streamPreview }),
      token: token || undefined,
    });
  };

  const handleAttach = async (file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    try {
      const res = await fetch(`/api/projects/${projectId}/assets/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setTempMessages((prev) => [...prev, { role: 'system', content: `📎 已追加素材: ${file.name}` }]);
        onAssetChange?.();
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="flex h-full flex-col">
      <Tabs tabs={[{ id: 'chat', label: '对话' }, { id: 'versions', label: '版本' }, { id: 'activity', label: '活动' }]}>
        {(activeTab) =>
          activeTab === 'chat' ? (
            <div className="flex flex-1 flex-col" >
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!hasVersion && (
                  <GeneratePanel
                    description={description}
                    onDescriptionChange={setDescription}
                    safetyClarification={safetyClarification}
                    onSafetyClarificationChange={setSafetyClarification}
                    streamPreview={streamPreview}
                    onStreamPreviewChange={setStreamPreview}
                    onGenerate={handleGenerate}
                    isStreaming={isStreaming}
                    estimatedSize={estimatedSize}
                    isSizeWarning={isSizeWarning}
                  />
                )}
                <MessageList messages={allMessages} isStreaming={isStreaming} />
              </div>
              {hasVersion && (
                <ChatInput
                  input={input}
                  onInputChange={setInput}
                  onSend={handleSend}
                  onAttach={handleAttach}
                  isStreaming={isStreaming}
                />
              )}
            </div>
          ) : activeTab === 'versions' ? (
            <VersionList
              versions={convData?.versions || []}
              token={token || ''}
              projectId={projectId}
              onVersionChange={onVersionChange}
              onRefresh={refreshConv}
            />
          ) : (
            <ActivityList projectId={projectId} token={token || ''} />
          )
        }
      </Tabs>
      <DebugPanel entries={debugLog} />
    </div>
  );
}
