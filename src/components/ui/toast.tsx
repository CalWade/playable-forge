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
    return () => {
      addToastFn = null;
    };
  }, []);

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    warning: <AlertTriangle size={18} className="text-yellow-500" />,
    info: <CheckCircle size={18} className="text-blue-500" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2 rounded-lg border bg-white px-4 py-3 shadow-lg animate-in slide-in-from-right',
            {
              'border-green-200': t.type === 'success',
              'border-red-200': t.type === 'error',
              'border-yellow-200': t.type === 'warning',
              'border-blue-200': t.type === 'info',
            }
          )}
        >
          {icons[t.type]}
          <span className="text-sm text-gray-700">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
