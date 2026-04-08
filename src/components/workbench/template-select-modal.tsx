'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface TemplateSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  token: string;
}

export function TemplateSelectModal({ open, onClose, onSelect, token }: TemplateSelectModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/templates', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [open, token]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-clay-lg clay-gradient-surface clay-shadow p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-clay-text">选择模板</h2>
          <button onClick={onClose} className="text-clay-muted hover:text-clay-text clay-transition">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-clay-blue-400 border-t-transparent" />
          </div>
        ) : templates.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-clay-muted">
            还没有模板。先在项目中点击「存为模板」
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="cursor-pointer rounded-clay clay-gradient-blue px-4 py-3 clay-shadow-sm hover:clay-shadow hover:-translate-y-0.5 clay-transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-clay-text">{t.name}</span>
                  <span className="text-xs text-clay-text/40">
                    {new Date(t.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {t.description && (
                  <p className="mt-1 text-xs text-clay-text/50">{t.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
