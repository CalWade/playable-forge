'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

const GRADE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  A: 'success', B: 'info', C: 'warning', D: 'error',
};

export function VariantMatrix({ variants, onPreview }: VariantMatrixProps) {
  if (variants.length === 0) return null;

  return (
    <Card>
      <div className="px-5 pt-5 pb-0">
        <h3 className="text-sm font-bold text-clay-text mb-4">变体矩阵</h3>
      </div>
      <div className="px-5 pb-5">
        <div className="grid grid-cols-6 gap-2.5">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => onPreview(v.id)}
              className="group rounded-clay-xl bg-clay-neutral-50 border-2 border-clay-border p-2.5 text-center hover:shadow-clay-effect-sm hover:border-clay-primary/40 hover:-translate-y-0.5 transition-all duration-150"
            >
              <p className="truncate text-[11px] font-semibold text-clay-text mb-1.5">{v.name}</p>
              <div className="flex flex-col items-center gap-1">
                <Badge variant={GRADE_VARIANT[v.validationGrade || ''] || 'default'} className="text-[9px]">
                  {v.validationGrade || '?'}
                </Badge>
                {v.fullHtmlSize && (
                  <span className="text-[9px] text-clay-text-faint">
                    {(v.fullHtmlSize / 1024).toFixed(0)}KB
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
