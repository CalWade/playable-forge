'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function toast(message: string, type: Toast['type'] = 'info') {
  addToastFn?.({ message, type });
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <XCircle size={18} className="text-red-400" />,
    warning: <AlertTriangle size={18} className="text-yellow-500" />,
    info: <CheckCircle size={18} className="text-clay-blue-100" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-clay clay-gradient-surface clay-shadow px-5 py-3 animate-in slide-in-from-right"
        >
          {icons[t.type]}
          <span className="text-sm font-medium text-clay-text">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="ml-2 text-clay-muted hover:text-clay-text clay-transition"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
