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

function gradeColor(grade: string | null) {
  if (grade === 'A') return 'border-green-400';
  if (grade === 'B') return 'border-blue-400';
  if (grade === 'C') return 'border-yellow-400';
  return 'border-red-400';
}

export function VariantMatrix({ variants, onPreview }: VariantMatrixProps) {
  if (variants.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-clay-text">变体矩阵</h3>
      <div className="grid grid-cols-6 gap-3">
        {variants.map((v) => (
          <div
            key={v.id}
            onClick={() => onPreview(v.id)}
            className={`cursor-pointer rounded-lg border-2 p-2 text-center hover:shadow-md transition-shadow ${gradeColor(v.validationGrade)}`}
          >
            <p className="truncate text-xs font-medium text-clay-text">{v.name}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Badge variant={v.validationGrade === 'A' || v.validationGrade === 'B' ? 'success' : 'warning'}>
                {v.validationGrade}
              </Badge>
              <span className="text-[10px] text-clay-muted">
                {v.fullHtmlSize ? `${(v.fullHtmlSize / 1024).toFixed(0)}KB` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
