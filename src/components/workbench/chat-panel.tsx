'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useSSE } from '@/hooks/use-sse';
import { Send } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
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

  // Fetch conversation history
  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data: convData, mutate: refreshConv } = useSWR(
    token ? `/api/projects/${projectId}/versions` : null,
    fetcher
  );

  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  // Handle SSE events
  useEffect(() => {
    if (!lastEvent) return;
    
    if (lastEvent.event === 'complete') {
      const versionId = lastEvent.data.versionId as string;
      onVersionChange(versionId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `✅ 已完成 (v${lastEvent.data.version})` },
      ]);
      refreshConv();
    } else if (lastEvent.event === 'error') {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `❌ 错误: ${lastEvent.data.message}` },
      ]);
    } else if (lastEvent.event === 'status') {
      setMessages((prev) => {
        // Replace last status message if exists, otherwise add
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'status') {
          return [...prev.slice(0, -1), { role: 'status', content: lastEvent.data.message as string }];
        }
        return [...prev, { role: 'status', content: lastEvent.data.message as string }];
      });
    }
  }, [lastEvent, onVersionChange, refreshConv]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerate = async () => {
    setMessages((prev) => [...prev, { role: 'system', content: description ? `正在生成初稿... (描述: ${description})` : '正在生成初稿...' }]);
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
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);

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
                {messages.length === 0 && !hasVersion && (
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
                {messages.map((msg, i) => (
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
                  onClick={() => onVersionChange(v.id)}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <div>
                    <span className="text-sm font-medium">v{v.version}</span>
                    {v.isLocked && (
                      <span className="ml-2 text-xs text-blue-600">🔒 已锁定</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {v.validationGrade && (
                      <span className="text-xs text-gray-400">{v.validationGrade}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(v.createdAt).toLocaleTimeString('zh-CN')}
                    </span>
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
