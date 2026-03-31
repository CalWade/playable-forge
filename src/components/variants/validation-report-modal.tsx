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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-[500px] rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">校验报告 — {variant.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="space-y-2">
          {report.map((r: { name: string; level: string; passed: boolean; detail: string }, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span>{r.passed ? '✅' : r.level === 'error' ? '❌' : '⚠️'}</span>
                <span className="text-gray-700">{r.name}</span>
              </div>
              <span className="text-gray-400 text-xs">{r.detail}</span>
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
