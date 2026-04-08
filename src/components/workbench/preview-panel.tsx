'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DeviceFrame } from '@/components/ui/device-frame';
import { Monitor, Smartphone, RotateCcw } from 'lucide-react';

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
  streamingHtml?: string;
  isStreaming?: boolean;
}

export function PreviewPanel({
  projectId,
  versionId,
  validationGrade,
  htmlSize,
  token,
  streamingHtml,
  isStreaming: isCurrentlyStreaming,
}: PreviewPanelProps) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [deviceIdx, setDeviceIdx] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  const device = DEVICES[deviceIdx];
  // In landscape mode, swap width and height
  const deviceW = isLandscape ? device.height : device.width;
  const deviceH = isLandscape ? device.width : device.height;

  const previewUrl = versionId
    ? `/api/projects/${projectId}/preview/${versionId}`
    : `/api/projects/${projectId}/preview`;

  const gradeVariant =
    validationGrade === 'A' ? 'success'
      : validationGrade === 'B' ? 'info'
      : validationGrade === 'C' ? 'warning'
      : validationGrade === 'D' ? 'error'
      : ('default' as const);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clay-blue-50/30 px-4 py-2 flex-shrink-0">
        <h3 className="text-sm font-bold text-clay-text">预览</h3>
        <div className="flex items-center gap-2">
          {validationGrade && <Badge variant={gradeVariant}>{validationGrade} 级</Badge>}
          {htmlSize && <span className="text-[10px] text-clay-muted">{(htmlSize / 1024).toFixed(0)}KB</span>}
        </div>
      </div>

      {/* Device controls */}
      <div className="flex items-center justify-between border-b border-clay-blue-50/30 px-4 py-1.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsLandscape(false)}
            className={`rounded p-1 ${!isLandscape ? 'bg-blue-100 text-blue-600' : 'text-clay-muted hover:text-clay-text/70'}`}
          >
            <Smartphone size={14} />
          </button>
          <button
            onClick={() => setIsLandscape(true)}
            className={`rounded p-1 ${isLandscape ? 'bg-blue-100 text-blue-600' : 'text-clay-muted hover:text-clay-text/70'}`}
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setReplayKey((k) => k + 1)}
            className="rounded p-1 text-clay-muted hover:text-clay-text/70"
            title="重播"
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-clay-muted">{deviceW}×{deviceH}</span>
          <select
            value={deviceIdx}
            onChange={(e) => setDeviceIdx(Number(e.target.value))}
            className="rounded border border-clay-blue-50 px-1.5 py-0.5 text-[10px] text-clay-text/70"
          >
            {DEVICES.map((d, i) => (
              <option key={d.id} value={i}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview iframe - scaled to fit panel while maintaining device aspect ratio */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-clay-bg p-3">
        {isCurrentlyStreaming && streamingHtml && streamingHtml.length > 200 ? (
          <DeviceFrame
            width={deviceW}
            height={deviceH}
            srcdoc={streamingHtml}
            frameKey={`streaming-${isLandscape}-${deviceIdx}`}
          />
        ) : versionId ? (
          <DeviceFrame
            width={deviceW}
            height={deviceH}
            src={`${previewUrl}?token=${token}`}
            frameKey={`${versionId}-${isLandscape}-${deviceIdx}-${replayKey}`}
          />
        ) : (
          <p className="text-sm text-clay-muted">生成后即可预览</p>
        )}
      </div>
    </div>
  );
}
