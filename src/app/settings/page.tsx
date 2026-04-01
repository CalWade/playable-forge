'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, baseUrl: e.target.value } })} />
              <Input label="模型" value={settings.ai.model}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, model: e.target.value } })} />
              <Input label="最大 Token" type="number" value={String(settings.ai.maxTokens)}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, maxTokens: Number(e.target.value) } })} />
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
              <p className="mb-2 text-xs font-medium text-clay-text/40">自定义 AI 生成时的系统指令（留空则使用默认 prompt）</p>
              <textarea
                value={settings.ai.systemPromptOverride || ''}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, systemPromptOverride: e.target.value } })}
                placeholder="留空使用默认 System Prompt..."
                className="w-full rounded-clay clay-inset bg-gradient-to-br from-[#e8f4ff] to-[#dceefb] px-4 py-3 text-sm font-medium font-mono text-clay-text placeholder:text-clay-muted focus:outline-none focus:clay-inset-focus resize-y clay-transition"
                rows={10}
              />
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
