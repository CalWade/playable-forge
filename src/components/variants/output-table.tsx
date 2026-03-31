'use client';

import { Card } from '@/components/ui/card';

interface Variant {
  id: string;
  name: string;
  validationGrade: string | null;
  fullHtmlSize: number | null;
}

interface OutputTableProps {
  variants: Variant[];
  token: string;
  onPreview: (id: string) => void;
  onShowReport: (id: string) => void;
}

export function OutputTable({ variants, token, onPreview, onShowReport }: OutputTableProps) {
  if (variants.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-gray-900">产出管理</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2 font-medium">文件名</th>
            <th className="pb-2 font-medium">体积</th>
            <th className="pb-2 font-medium">校验</th>
            <th className="pb-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {variants.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="py-2 text-gray-700">{v.name}.html</td>
              <td className="py-2 text-gray-500">{v.fullHtmlSize ? `${(v.fullHtmlSize / 1024).toFixed(0)}KB` : '-'}</td>
              <td className="py-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  v.validationGrade === 'A' ? 'bg-green-100 text-green-700' :
                  v.validationGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                  v.validationGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{v.validationGrade || '-'}</span>
              </td>
              <td className="py-2 space-x-2">
                <button onClick={() => onPreview(v.id)} className="text-xs text-blue-600 hover:underline">预览</button>
                <a href={`/api/variants/${v.id}/preview?token=${token}`} download={`${v.name}.html`} className="text-xs text-blue-600 hover:underline">下载</a>
                <button onClick={() => onShowReport(v.id)} className="text-xs text-gray-500 hover:underline">校验报告</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
