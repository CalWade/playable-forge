'use client';

import { Badge } from '@/components/ui/badge';

interface ValidationReportModalProps {
  variant: { name: string; validationGrade: string | null; validationJson: string | null } | null;
  onClose: () => void;
}

export function ValidationReportModal({ variant, onClose }: ValidationReportModalProps) {
  if (!variant) return null;

  const report = variant.validationJson ? JSON.parse(variant.validationJson) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[500px] rounded-clay-xl clay-gradient-surface clay-shadow p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-clay-text">校验报告 — {variant.name}</h3>
          <button onClick={onClose} className="text-clay-muted hover:text-clay-blue-300 clay-transition">✕</button>
        </div>
        <div className="space-y-2">
          {report.map((r: { name: string; level: string; passed: boolean; detail: string }, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-clay-sm clay-gradient-blue px-4 py-2.5 text-sm clay-shadow-sm">
              <div className="flex items-center gap-2">
                <span>{r.passed ? '✅' : r.level === 'error' ? '❌' : '⚠️'}</span>
                <span className="text-clay-text">{r.name}</span>
              </div>
              <span className="text-clay-muted text-xs">{r.detail}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Badge variant={variant.validationGrade === 'A' ? 'success' : variant.validationGrade === 'B' ? 'info' : 'warning'}>
            总评: {variant.validationGrade} 级
          </Badge>
        </div>
      </div>
    </div>
  );
}
