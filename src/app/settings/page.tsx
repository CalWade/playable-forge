'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    ai: { baseUrl: '', model: '', apiKey: '', maxTokens: 16000, systemPromptOverride: '' },
    aiOverrides: { classification: { baseUrl: '', model: '', apiKey: '', maxTokens: 2000 } },
    validation: { maxFileSize: 5242880, warnFileSize: 4194304, platform: 'applovin' },
    compression: { imageQuality: 80, maxImageWidth: 1920, audioTargetKbps: 128 },
    webhook: { url: '', events: ['generate_complete', 'batch_complete'] as string[] },
  });
  const [defaultPrompt, setDefaultPrompt] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get<{ settings: typeof settings; defaultSystemPrompt?: string }>('/api/settings')
      .then((d) => {
        if (d.settings) setSettings(d.settings);
        if (d.defaultSystemPrompt) setDefaultPrompt(d.defaultSystemPrompt);
      })
      .catch(() => {});
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/settings', settings);
      toast('设置已保存', 'success');
    } catch { toast('保存失败', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f4ff 0%, #cae9ff 50%, #e8f4ff 100%)' }}>
        <header className="rounded-clay-lg clay-gradient-surface clay-shadow mx-6 mt-4 px-6 py-4">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <button onClick={() => router.push('/dashboard')} className="text-clay-blue-400 hover:text-clay-blue-300 clay-transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-extrabold text-clay-text">设置</h1>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
          <Card>
            <CardHeader><h3 className="font-bold text-clay-text">AI 服务配置</h3></CardHeader>
            <CardContent className="space-y-4">
              <Input label="API Base URL" value={settings.ai.baseUrl}
                placeholder="https://api.openai.com/v1"
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, baseUrl: e.target.value } })} />
              <Input label="API Key" value={settings.ai.apiKey || ''}
                type="password"
                placeholder="sk-... 或 Bearer token"
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, apiKey: e.target.value } })} />
              <Input label="模型" value={settings.ai.model}
                placeholder="gpt-4o / LongCat-Flash-Chat / qwen2.5:72b"
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, model: e.target.value } })} />
              <Input label="最大 Token" type="number" value={String(settings.ai.maxTokens)}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, maxTokens: Number(e.target.value) } })} />
              <p className="text-[10px] text-clay-muted">优先级：设置页 &gt; .env 文件 &gt; 默认值。保存后立即生效，无需重启。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-clay-text">素材分类 AI（可选独立配置）</h3></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[10px] text-clay-muted">素材分类使用多模态 AI 识别图片内容。留空则复用上方的 AI 服务配置。</p>
              <Input label="API Base URL" value={settings.aiOverrides?.classification?.baseUrl || ''}
                placeholder="留空使用主配置"
                onChange={(e) => setSettings({
                  ...settings,
                  aiOverrides: {
                    ...settings.aiOverrides,
                    classification: { ...settings.aiOverrides?.classification, baseUrl: e.target.value },
                  },
                })} />
              <Input label="API Key" value={settings.aiOverrides?.classification?.apiKey || ''}
                type="password"
                placeholder="留空使用主配置"
                onChange={(e) => setSettings({
                  ...settings,
                  aiOverrides: {
                    ...settings.aiOverrides,
                    classification: { ...settings.aiOverrides?.classification, apiKey: e.target.value },
                  },
                })} />
              <Input label="模型" value={settings.aiOverrides?.classification?.model || ''}
                placeholder="留空使用主配置（建议用支持视觉的模型）"
                onChange={(e) => setSettings({
                  ...settings,
                  aiOverrides: {
                    ...settings.aiOverrides,
                    classification: { ...settings.aiOverrides?.classification, model: e.target.value },
                  },
                })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-clay-text">校验规则</h3></CardHeader>
            <CardContent className="space-y-4">
              <Input label="文件体积上限 (bytes)" type="number" value={String(settings.validation.maxFileSize)}
                onChange={(e) => setSettings({ ...settings, validation: { ...settings.validation, maxFileSize: Number(e.target.value) } })} />
              <Input label="体积预警阈值 (bytes)" type="number" value={String(settings.validation.warnFileSize)}
                onChange={(e) => setSettings({ ...settings, validation: { ...settings.validation, warnFileSize: Number(e.target.value) } })} />
              <Input label="投放平台" value={settings.validation.platform} disabled />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-clay-text">压缩参数</h3></CardHeader>
            <CardContent className="space-y-4">
              <Input label="图片质量 (0-100)" type="number" value={String(settings.compression.imageQuality)}
                onChange={(e) => setSettings({ ...settings, compression: { ...settings.compression, imageQuality: Number(e.target.value) } })} />
              <Input label="最大图片宽度 (px)" type="number" value={String(settings.compression.maxImageWidth)}
                onChange={(e) => setSettings({ ...settings, compression: { ...settings.compression, maxImageWidth: Number(e.target.value) } })} />
              <Input label="音频目标码率 (kbps)" type="number" value={String(settings.compression.audioTargetKbps)}
                onChange={(e) => setSettings({ ...settings, compression: { ...settings.compression, audioTargetKbps: Number(e.target.value) } })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-clay-text">System Prompt</h3></CardHeader>
            <CardContent>
              <p className="mb-2 text-xs font-medium text-clay-text/40">
                AI 生成时的系统指令。编辑后保存即生效，清空内容恢复默认。
              </p>
              <textarea
                value={settings.ai.systemPromptOverride || defaultPrompt}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, systemPromptOverride: e.target.value } })}
                className="w-full rounded-clay clay-inset bg-gradient-to-br from-[#e8f4ff] to-[#dceefb] px-4 py-3 text-sm font-medium font-mono text-clay-text placeholder:text-clay-muted focus:outline-none focus:clay-inset-focus resize-y clay-transition"
                rows={12}
              />
              {settings.ai.systemPromptOverride && (
                <button
                  onClick={() => setSettings({ ...settings, ai: { ...settings.ai, systemPromptOverride: '' } })}
                  className="mt-2 text-xs font-bold text-clay-blue-400 hover:text-clay-blue-300 clay-transition"
                >
                  ↩ 恢复默认 Prompt
                </button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h3 className="font-bold text-clay-text">Webhook 通知</h3></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Webhook URL（飞书/钉钉/Slack）" value={settings.webhook?.url || ''}
                placeholder="https://hooks.slack.com/..."
                onChange={(e) => setSettings({ ...settings, webhook: { ...settings.webhook, url: e.target.value } })} />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-clay-text/50">触发事件</p>
                {[
                  { id: 'generate_complete', label: '生成完成' },
                  { id: 'batch_complete', label: '批量变体完成' },
                ].map((evt) => (
                  <label key={evt.id} className="flex items-center gap-2 text-xs text-clay-text/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.webhook?.events?.includes(evt.id) ?? true}
                      onChange={(e) => {
                        const events = settings.webhook?.events || [];
                        const next = e.target.checked
                          ? [...events, evt.id]
                          : events.filter((x) => x !== evt.id);
                        setSettings({ ...settings, webhook: { ...settings.webhook, events: next } });
                      }}
                      className="rounded accent-clay-blue-400"
                    />
                    {evt.label}
                  </label>
                ))}
              </div>
              <Button
                variant="outline" size="sm"
                onClick={async () => {
                  if (!settings.webhook?.url) { toast('请先填写 Webhook URL', 'warning'); return; }
                  try {
                    await fetch(settings.webhook.url, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ event: 'test', message: 'PlayableForge Webhook 测试', timestamp: new Date().toISOString() }),
                    });
                    toast('测试消息已发送', 'success');
                  } catch { toast('发送失败，请检查 URL', 'error'); }
                }}
              >
                🔔 发送测试
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
