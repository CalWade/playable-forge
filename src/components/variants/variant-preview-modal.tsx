'use client';

interface VariantPreviewModalProps {
  variantId: string | null;
  token: string;
  onClose: () => void;
}

export function VariantPreviewModal({ variantId, token, onClose }: VariantPreviewModalProps) {
  if (!variantId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative w-[420px] h-[750px] rounded-xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-medium">变体预览</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
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
