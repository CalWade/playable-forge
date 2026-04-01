'use client';

interface VariantPreviewModalProps {
  variantId: string | null;
  token: string;
  onClose: () => void;
}

export function VariantPreviewModal({ variantId, token, onClose }: VariantPreviewModalProps) {
  if (!variantId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="relative w-[420px] h-[750px] rounded-clay-xl clay-gradient-surface clay-shadow shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-clay-blue-50/30 px-4 py-3">
          <span className="text-sm font-bold text-clay-text">变体预览</span>
          <button onClick={onClose} className="text-clay-muted hover:text-clay-text/70 text-lg">✕</button>
        </div>
        <iframe
          src={`/api/variants/${variantId}/preview?token=${token}`}
          sandbox="allow-scripts"
          className="w-full border-0"
          style={{ height: 'calc(100% - 45px)' }}
        />
      </div>
    </div>
  );
}
