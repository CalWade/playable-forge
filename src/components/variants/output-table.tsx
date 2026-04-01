'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, FileText, RotateCcw } from 'lucide-react';

interface Variant {
  id: string;
  name: string;
  validationGrade: string | null;
  fullHtmlSize: number | null;
  status?: string;
}

interface OutputTableProps {
  variants: Variant[];
  token: string;
  onPreview: (id: string) => void;
  onShowReport: (id: string) => void;
  onRetry: (id: string) => void;
}

const GRADE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  A: 'success', B: 'info', C: 'warning', D: 'error',
};

export function OutputTable({ variants, token, onPreview, onShowReport, onRetry }: OutputTableProps) {
  if (variants.length === 0) return null;

  return (
    <Card>
      <div className="px-5 pt-5 pb-0">
        <h3 className="text-sm font-bold text-clay-text mb-4">产出管理</h3>
      </div>
      <div className="px-5 pb-5">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_60px_auto] gap-3 px-3 pb-2 text-xs font-semibold text-clay-text-muted">
          <span>文件名</span>
          <span>体积</span>
          <span>校验</span>
          <span>操作</span>
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {variants.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-[1fr_80px_60px_auto] gap-3 items-center px-3 py-2.5 rounded-clay-xl hover:bg-clay-neutral-50 transition-colors duration-100"
            >
              <span className="text-sm font-medium text-clay-text truncate">{v.name}.html</span>
              <span className="text-sm text-clay-text-muted">
                {v.fullHtmlSize ? `${(v.fullHtmlSize / 1024).toFixed(0)}KB` : '-'}
              </span>
              <div>
                <Badge variant={GRADE_VARIANT[v.validationGrade || ''] || 'default'}>
                  {v.validationGrade || '?'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-xs" onClick={() => onPreview(v.id)} title="预览">
                  <Eye size={13} />
                </Button>
                <a
                  href={`/api/variants/${v.id}/preview?token=${token}`}
                  download={`${v.name}.html`}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-clay-sm text-clay-text-muted hover:text-clay-primary hover:bg-clay-neutral-100 transition-colors"
                  title="下载"
                >
                  <Download size={13} />
                </a>
                <Button variant="ghost" size="icon-xs" onClick={() => onShowReport(v.id)} title="校验报告">
                  <FileText size={13} />
                </Button>
                {(v.validationGrade === 'C' || v.validationGrade === 'D' || v.status === 'failed') && (
                  <Button variant="ghost" size="icon-xs" onClick={() => onRetry(v.id)} title="重试">
                    <RotateCcw size={13} className="text-clay-warning-dk" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
