'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ArrowLeft, Bot, ShieldCheck, Zap, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  { id: 'ai',          label: 'AI 服务',  icon: Bot },
  { id: 'validation',  label: '校验规则', icon: ShieldCheck },
  { id: 'compression', label: '压缩参数', icon: Zap },
  { id: 'prompt',      label: 'Prompt',  icon: MessageSquare },
];

export default function SettingsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('ai');
  const [settings, setSettings] = useState({
    ai: { baseUrl: '', model: '', maxTokens: 16000, systemPromptOverride: '' },
    validation: { maxFileSize: 5242880, warnFileSize: 4194304, platform: 'applovin' },
    compression: { imageQuality: 80, maxImageWidth: 1920, audioTargetKbps: 128 },
  });

  useEffect(() => {
    if (!token) return;
    fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.settings) setSettings(d.settings); })
      .catch(() => {});
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) toast('设置已保存', 'success');
      else throw new Error('Save failed');
    } catch {
      toast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen clay-bg">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b-2 border-clay-border bg-clay-surface/90 backdrop-blur-md px-6 py-3.5 shadow-clay-xs">
          <div className="mx-auto max-w-4xl flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft size={17} />
            </Button>
            <h1 className="text-base font-bold text-clay-text">系统设置</h1>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex gap-6">
            {/* Sidebar nav */}
            <aside className="w-48 shrink-0 space-y-1.5">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-clay-xl text-sm font-semibold transition-all duration-150',
                    activeSection === id
                      ? 'bg-clay-primary text-white shadow-clay-effect-sm'
                      : 'text-clay-text-muted hover:bg-clay-surface hover:text-clay-text hover:shadow-clay-xs',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </aside>

            {/* Content */}
            <div className="flex-1 space-y-5">
              {activeSection === 'ai' && (
                <Card>
                  <CardHeader><CardTitle>AI 服务配置</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="API Base URL" value={settings.ai.baseUrl}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, baseUrl: e.target.value } })} />
                    <Input label="模型" value={settings.ai.model}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, model: e.target.value } })} />
                    <Input label="最大 Token" type="number" value={String(settings.ai.maxTokens)}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, maxTokens: Number(e.target.value) } })} />
                  </CardContent>
                </Card>
              )}

              {activeSection === 'validation' && (
                <Card>
                  <CardHeader><CardTitle>校验规则</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="文件体积上限 (bytes)" type="number" value={String(settings.validation.maxFileSize)}
                      onChange={(e) => setSettings({ ...settings, validation: { ...settings.validation, maxFileSize: Number(e.target.value) } })} />
                    <Input label="体积预警阈值 (bytes)" type="number" value={String(settings.validation.warnFileSize)}
                      onChange={(e) => setSettings({ ...settings, validation: { ...settings.validation, warnFileSize: Number(e.target.value) } })} />
                    <Input label="投放平台" value={settings.validation.platform} disabled />
                  </CardContent>
                </Card>
              )}

              {activeSection === 'compression' && (
                <Card>
                  <CardHeader><CardTitle>压缩参数</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="图片质量 (0-100)" type="number" value={String(settings.compression.imageQuality)}
                      onChange={(e) => setSettings({ ...settings, compression: { ...settings.compression, imageQuality: Number(e.target.value) } })} />
                    <Input label="最大图片宽度 (px)" type="number" value={String(settings.compression.maxImageWidth)}
                      onChange={(e) => setSettings({ ...settings, compression: { ...settings.compression, maxImageWidth: Number(e.target.value) } })} />
                    <Input label="音频目标码率 (kbps)" type="number" value={String(settings.compression.audioTargetKbps)}
                      onChange={(e) => setSettings({ ...settings, compression: { ...settings.compression, audioTargetKbps: Number(e.target.value) } })} />
                  </CardContent>
                </Card>
              )}

              {activeSection === 'prompt' && (
                <Card>
                  <CardHeader><CardTitle>System Prompt</CardTitle></CardHeader>
                  <CardContent>
                    <p className="mb-3 text-xs text-clay-text-muted">
                      自定义 AI 生成时的系统指令（留空则使用默认 prompt）
                    </p>
                    <Textarea
                      value={settings.ai.systemPromptOverride || ''}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, systemPromptOverride: e.target.value } })}
                      placeholder="留空使用默认 System Prompt..."
                      className="font-mono text-xs min-h-[240px]"
                      rows={12}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin-soft" />
                      保存中...
                    </span>
                  ) : '保存设置'}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
