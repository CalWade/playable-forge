'use client';

import { DeviceFrame } from '@/components/ui/device-frame';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CompareItem {
  id: string;
  label: string;
  previewUrl: string;
  grade?: string | null;
  size?: number | null;
}

interface ComparePreviewModalProps {
  open: boolean;
  onClose: () => void;
  items: CompareItem[];
  onSelect?: (id: string) => void;
  selectLabel?: string;
  token: string;
}

const COMPARE_DEVICE = { width: 390, height: 844 };

export function ComparePreviewModal({
  open,
  onClose,
  items,
  onSelect,
  selectLabel = '采用此版本',
  token,
}: ComparePreviewModalProps) {
  if (!open || items.length < 2) return null;

  const gridCols = items.length <= 2 ? 'grid-cols-2' : 'grid-cols-2';
  const frameHeight = items.length <= 2 ? 'h-[70vh]' : 'h-[35vh]';

  const gradeVariant = (g?: string | null) =>
    g === 'A' ? 'success' : g === 'B' ? 'info' : g === 'C' ? 'warning' : g === 'D' ? 'error' : 'default';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[95vw] max-w-6xl rounded-clay-lg clay-gradient-surface clay-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-clay-text">对比预览</h2>
          <button onClick={onClose} className="text-clay-muted hover:text-clay-text clay-transition">
            <X size={18} />
          </button>
        </div>

        <div className={`grid ${gridCols} gap-4`}>
          {items.map((item) => (
            <div key={item.id} className="flex flex-col rounded-clay clay-gradient-blue clay-shadow-sm p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-clay-text">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.grade && <Badge variant={gradeVariant(item.grade)}>{item.grade}</Badge>}
                  {item.size && <span className="text-[10px] text-clay-muted">{(item.size / 1024).toFixed(0)}KB</span>}
                </div>
              </div>

              {/* Preview */}
              <div className={`${frameHeight} bg-clay-bg rounded-lg overflow-hidden`}>
                <DeviceFrame
                  width={COMPARE_DEVICE.width}
                  height={COMPARE_DEVICE.height}
                  src={`${item.previewUrl}?token=${token}`}
                  frameKey={`compare-${item.id}`}
                />
              </div>

              {/* Action */}
              {onSelect && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => onSelect(item.id)}
                >
                  {selectLabel}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
