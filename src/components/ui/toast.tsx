'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function toast(message: string, type: Toast['type'] = 'info') {
  addToastFn?.({ message, type });
}

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bg:     'bg-clay-success-lt border-clay-success/40',
    icon_cls:'text-clay-success-dk',
    text:   'text-clay-success-dk',
  },
  error: {
    icon: XCircle,
    bg:     'bg-clay-danger-lt border-clay-danger/40',
    icon_cls:'text-clay-danger-dk',
    text:   'text-clay-danger-dk',
  },
  warning: {
    icon: AlertTriangle,
    bg:     'bg-clay-warning-lt border-clay-warning/40',
    icon_cls:'text-clay-warning-dk',
    text:   'text-clay-warning-dk',
  },
  info: {
    icon: Info,
    bg:     'bg-clay-info-lt border-clay-info/40',
    icon_cls:'text-clay-info-dk',
    text:   'text-clay-info-dk',
  },
} as const;

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-xs w-full">
      {toasts.map((t) => {
        const cfg = TOAST_CONFIG[t.type];
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3',
              'rounded-clay-xl border-2 px-4 py-3',
              'shadow-clay-effect-md',
              'animate-clay-bounce-in',
              cfg.bg
            )}
          >
            <Icon size={18} className={cn('shrink-0 mt-0.5', cfg.icon_cls)} />
            <span className={cn('flex-1 text-sm font-medium', cfg.text)}>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className={cn('shrink-0 opacity-60 hover:opacity-100 transition-opacity', cfg.icon_cls)}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
