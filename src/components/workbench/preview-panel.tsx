'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone } from 'lucide-react';

const DEVICES = [
  { id: 'iphone13pro', label: 'iPhone 13 Pro', width: 390, height: 844 },
  { id: 'iphoneSE', label: 'iPhone SE', width: 375, height: 667 },
  { id: 'ipad', label: 'iPad', width: 768, height: 1024 },
  { id: 'pixel5', label: 'Pixel 5', width: 393, height: 851 },
];

interface PreviewPanelProps {
  projectId: string;
  versionId?: string;
  validationGrade?: string;
  htmlSize?: number;
  token: string;
}

export function PreviewPanel({
  projectId,
  versionId,
  validationGrade,
  htmlSize,
  token,
}: PreviewPanelProps) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [deviceIdx, setDeviceIdx] = useState(0);

  const device = DEVICES[deviceIdx];
  const iframeWidth = isLandscape ? device.height : device.width;
  const iframeHeight = isLandscape ? device.width : device.height;

  const previewUrl = versionId
    ? `/api/projects/${projectId}/preview/${versionId}`
    : `/api/projects/${projectId}/preview`;

  const gradeVariant =
    validationGrade === 'A'
      ? 'success'
      : validationGrade === 'B'
      ? 'info'
      : validationGrade === 'C'
      ? 'warning'
      : validationGrade === 'D'
      ? 'error'
      : ('default' as const);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">预览</h3>
        <div className="flex items-center gap-2">
          {validationGrade && (
            <Badge variant={gradeVariant}>
              校验 {validationGrade} 级
            </Badge>
          )}
          {htmlSize && (
            <span className="text-xs text-gray-400">
              {(htmlSize / 1024).toFixed(0)}KB / 5120KB
            </span>
          )}
        </div>
      </div>

      {/* Device controls */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLandscape(false)}
            className={`rounded p-1.5 ${!isLandscape ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Smartphone size={16} />
          </button>
          <button
            onClick={() => setIsLandscape(true)}
            className={`rounded p-1.5 ${isLandscape ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Monitor size={16} />
          </button>
        </div>
        <select
          value={deviceIdx}
          onChange={(e) => setDeviceIdx(Number(e.target.value))}
          className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
        >
          {DEVICES.map((d, i) => (
            <option key={d.id} value={i}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preview iframe */}
      <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-100 p-4">
        {versionId ? (
          <>
            <div
              className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg"
              style={{ width: iframeWidth * 0.8, height: iframeHeight * 0.8 }}
            >
              <iframe
                key={`${versionId}-${isLandscape}-${deviceIdx}`}
                src={`${previewUrl}?token=${token}`}
                sandbox="allow-scripts"
                className="h-full w-full"
                style={{
                  width: iframeWidth,
                  height: iframeHeight,
                  transform: `scale(${0.8})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
            <a
              href={`${previewUrl}?token=${token}`}
              download="playable-ad.html"
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              ⬇ 下载当前 HTML
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-400">生成后即可预览</p>
        )}
      </div>
    </div>
  );
}
