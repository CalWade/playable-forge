'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ValidationReportModalProps {
  variant: { name: string; validationGrade: string | null; validationJson: string | null } | null;
  onClose: () => void;
}

const GRADE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  A: 'success', B: 'info', C: 'warning', D: 'error',
};

export function ValidationReportModal({ variant, onClose }: ValidationReportModalProps) {
  if (!variant) return null;

  const report = variant.validationJson ? JSON.parse(variant.validationJson) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-clay-neutral-900/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-clay-2xl bg-clay-surface shadow-clay-effect-xl p-6 animate-clay-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-clay-text">校验报告</h3>
            <p className="text-sm text-clay-text-muted mt-0.5">{variant.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={GRADE_VARIANT[variant.validationGrade || ''] || 'default'}>
              总评 {variant.validationGrade} 级
            </Badge>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X size={15} />
            </Button>
          </div>
        </div>

        {/* Report items */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {report.map((r: { name: string; level: string; passed: boolean; detail: string }, i: number) => (
            <div
              key={i}
              className={[
                'flex items-center justify-between rounded-clay-xl border-2 px-4 py-2.5',
                r.passed
                  ? 'bg-clay-success-lt border-clay-success/30'
                  : r.level === 'error'
                  ? 'bg-clay-danger-lt border-clay-danger/30'
                  : 'bg-clay-warning-lt border-clay-warning/30',
              ].join(' ')}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{r.passed ? '✅' : r.level === 'error' ? '❌' : '⚠️'}</span>
                <span className="text-sm font-medium text-clay-text">{r.name}</span>
              </div>
              <span className="text-xs text-clay-text-muted ml-3 text-right max-w-[160px]">{r.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
