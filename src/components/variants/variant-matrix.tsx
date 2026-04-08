'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComparePreviewModal } from '@/components/workbench/compare-preview-modal';
import { useAuth } from '@/components/auth-provider';

interface Variant {
  id: string;
  name: string;
  validationGrade: string | null;
  fullHtmlSize: number | null;
}

interface VariantMatrixProps {
  variants: Variant[];
  onPreview: (id: string) => void;
}

function gradeColor(grade: string | null) {
  if (grade === 'A') return 'border-green-400';
  if (grade === 'B') return 'border-blue-400';
  if (grade === 'C') return 'border-yellow-400';
  return 'border-red-400';
}

export function VariantMatrix({ variants, onPreview }: VariantMatrixProps) {
  const { token } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const compareItems = variants
    .filter((v) => selected.has(v.id))
    .map((v) => ({
      id: v.id,
      label: v.name,
      previewUrl: `/api/variants/${v.id}/preview`,
      grade: v.validationGrade,
      size: v.fullHtmlSize,
    }));

  if (variants.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-clay-text">变体矩阵</h3>
        {selected.size >= 2 && (
          <Button size="sm" onClick={() => setShowCompare(true)}>
            对比预览 ({selected.size})
          </Button>
        )}
      </div>
      <div className="grid grid-cols-6 gap-3">
        {variants.map((v) => (
          <div
            key={v.id}
            onClick={() => onPreview(v.id)}
            className={`cursor-pointer rounded-lg border-2 p-2 text-center hover:shadow-md transition-shadow ${gradeColor(v.validationGrade)} ${selected.has(v.id) ? 'ring-2 ring-clay-blue-400 ring-offset-1' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <input
                type="checkbox"
                checked={selected.has(v.id)}
                onChange={() => {/* handled by click */}}
                onClick={(e) => toggleSelect(v.id, e)}
                className="rounded accent-clay-blue-400"
              />
              <span className="text-[8px] text-clay-muted">
                {v.fullHtmlSize ? `${(v.fullHtmlSize / 1024).toFixed(0)}KB` : ''}
              </span>
            </div>
            <p className="truncate text-xs font-medium text-clay-text">{v.name}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Badge variant={v.validationGrade === 'A' || v.validationGrade === 'B' ? 'success' : 'warning'}>
                {v.validationGrade}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <ComparePreviewModal
        open={showCompare}
        onClose={() => setShowCompare(false)}
        items={compareItems}
        token={token || ''}
      />
    </Card>
  );
}
