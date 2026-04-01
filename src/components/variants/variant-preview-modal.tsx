'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VariantPreviewModalProps {
  variantId: string | null;
  token: string;
  onClose: () => void;
}

export function VariantPreviewModal({ variantId, token, onClose }: VariantPreviewModalProps) {
  if (!variantId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-clay-neutral-900/40 backdrop-blur-sm" />

      {/* Device frame */}
      <div
        className="relative rounded-clay-2xl bg-clay-surface shadow-clay-effect-xl overflow-hidden animate-clay-bounce-in"
        style={{ width: 420, height: 760 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-clay-border px-4 py-2.5 bg-clay-surface shrink-0">
          <span className="text-sm font-bold text-clay-text">变体预览</span>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X size={15} />
          </Button>
        </div>
        <iframe
          src={`/api/variants/${variantId}/preview?token=${token}`}
          sandbox="allow-scripts"
          className="w-full border-0"
          style={{ height: 'calc(100% - 48px)' }}
        />
      </div>
    </div>
  );
}
