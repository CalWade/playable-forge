'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
        {versionId ? (
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

/**
 * Device frame that renders an iframe at native device size,
 * then scales it down to fit the available container.
 */
function DeviceFrame({
  width,
  height,
  src,
  frameKey,
}: {
  width: number;
  height: number;
  src: string;
  frameKey: string;
}) {
  // Use a container ref to calculate scale
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const scale = containerSize.w > 0
    ? Math.min(containerSize.w / width, containerSize.h / height, 1)
    : 0.5;

  return (
    <div
      ref={(el) => {
        if (el && (containerSize.w !== el.clientWidth || containerSize.h !== el.clientHeight)) {
          setContainerSize({ w: el.clientWidth, h: el.clientHeight });
        }
      }}
      className="relative w-full h-full flex items-center justify-center"
    >
      <div
        className="overflow-hidden rounded-xl border border-clay-blue-100 bg-white shadow-lg"
        style={{
          width: width * scale,
          height: height * scale,
        }}
      >
        <iframe
          key={frameKey}
          src={src}
          sandbox="allow-scripts"
          className="border-0"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </div>
  );
}
