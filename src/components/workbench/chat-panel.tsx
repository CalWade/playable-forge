'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useSSE } from '@/hooks/use-sse';
import { Send } from 'lucide-react';
import { SimpleTabs as Tabs } from '@/components/ui/simple-tabs';
import useSWR from 'swr';

interface ChatPanelProps {
  projectId: string;
  onVersionChange: (versionId: string) => void;
  hasVersion: boolean;
}

export function ChatPanel({ projectId, onVersionChange, hasVersion }: ChatPanelProps) {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isStreaming, lastEvent, startStream } = useSSE();

  // Fetch versions
  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data: convData, mutate: refreshConv } = useSWR(
    token ? `/api/projects/${projectId}/versions` : null,
    fetcher
  );

  // DB messages = persistent history
  const { data: historyData, mutate: refreshHistory } = useSWR(
    token ? `/api/projects/${projectId}/conversations` : null,
    fetcher
  );
  const dbMessages: Array<{ role: string; content: string }> = (historyData?.messages || []).map(
    (m: { role: string; content: string }) => ({ role: m.role, content: m.content })
  );

  // Temp messages = SSE status updates (cleared after completion)
  const [tempMessages, setTempMessages] = useState<Array<{ role: string; content: string }>>([]);

  // Combined messages for display
  const allMessages = [...dbMessages, ...tempMessages];

  // Handle SSE events — only write to tempMessages
  useEffect(() => {
    if (!lastEvent) return;
    
    if (lastEvent.event === 'complete') {
      const versionId = lastEvent.data.versionId as string;
      onVersionChange(versionId);
      // Clear temp messages and reload from DB (which now has the new messages)
      setTempMessages([]);
      refreshHistory();
      refreshConv();
    } else if (lastEvent.event === 'error') {
      setTempMessages((prev) => [
        ...prev,
        { role: 'system', content: `❌ 错误: ${lastEvent.data.message}` },
      ]);
    } else if (lastEvent.event === 'status') {
      setTempMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'status') {
          return [...prev.slice(0, -1), { role: 'status', content: lastEvent.data.message as string }];
        }
        return [...prev, { role: 'status', content: lastEvent.data.message as string }];
      });
    } else if (lastEvent.event === 'question') {
      // AI is asking the user a clarifying question
      setTempMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `🤔 ${lastEvent.data.message}` },
      ]);
    }
  }, [lastEvent, onVersionChange, refreshConv, refreshHistory]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleGenerate = async () => {
    setTempMessages([{ role: 'status', content: '🔍 正在生成初稿...' }]);
    await startStream(`/api/projects/${projectId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ description: description || undefined }),
      token: token || undefined,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setInput('');
    // Show user message immediately as temp, DB will persist it
    setTempMessages([{ role: 'user', content: msg }, { role: 'status', content: '🛠️ 正在修改...' }]);

    await startStream(`/api/projects/${projectId}/iterate`, {
      method: 'POST',
      body: JSON.stringify({ message: msg }),
      token: token || undefined,
    });
  };

  const versions = convData?.versions || [];

  return (
    <div className="flex h-full flex-col">
      <Tabs
        tabs={[
          { id: 'chat', label: '对话' },
          { id: 'versions', label: '版本' },
        ]}
      >
        {(activeTab) =>
          activeTab === 'chat' ? (
            <div className="flex flex-1 flex-col" style={{ height: 'calc(100vh - 140px)' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {allMessages.length === 0 && !hasVersion && (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <p className="mb-4 text-sm text-gray-500 font-medium">上传素材后，描述你想要的广告效果</p>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={"描述广告效果（可选）\n例如：背景图全屏展示，2秒后弹窗从底部滑入，弹窗上的按钮有呼吸动画，点击跳转商店"}
                      className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={isStreaming}
                      className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isStreaming ? '生成中...' : '✨ 生成初稿'}
                    </button>
                  </div>
                )}
                {allMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : msg.role === 'system' || msg.role === 'status'
                          ? 'bg-gray-100 text-gray-500 italic'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
                      <span className="animate-pulse">思考中...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {hasVersion && (
                <div className="border-t border-gray-100 p-3">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="描述修改需求..."
                      disabled={isStreaming}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="flex cursor-pointer items-center rounded-lg border border-gray-200 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('files', file);
                          try {
                            const res = await fetch(`/api/projects/${projectId}/assets/upload`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                              body: formData,
                            });
                            if (res.ok) {
                              setTempMessages((prev) => [
                                ...prev,
                                { role: 'system', content: `📎 已追加素材: ${file.name}` },
                              ]);
                            }
                          } catch { /* ignore */ }
                          e.target.value = '';
                        }}
                      />
                      📎
                    </label>
                    <button
                      onClick={handleSend}
                      disabled={isStreaming || !input.trim()}
                      className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-y-auto p-4 space-y-2" style={{ height: 'calc(100vh - 140px)' }}>
              {versions.map((v: { id: string; version: number; validationGrade: string | null; isLocked: boolean; createdAt: string }) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="cursor-pointer text-sm font-medium text-blue-600 hover:underline"
                        onClick={() => onVersionChange(v.id)}
                      >
                        v{v.version}
                      </span>
                      {v.isLocked && (
                        <span className="text-xs text-blue-600">🔒 已锁定</span>
                      )}
                      {v.validationGrade && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          v.validationGrade === 'A' ? 'bg-green-100 text-green-700' :
                          v.validationGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                          v.validationGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {v.validationGrade}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(v.createdAt).toLocaleTimeString('zh-CN')}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetch(`/api/projects/${projectId}/versions/${v.id}/rollback`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            refreshConv();
                            onVersionChange(v.id);
                          } catch { /* ignore */ }
                        }}
                        className="text-xs text-gray-400 hover:text-blue-600"
                        title="回退到此版本"
                      >
                        ↩ 回退
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {versions.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">还没有版本</p>
              )}
            </div>
          )
        }
      </Tabs>
    </div>
  );
}
