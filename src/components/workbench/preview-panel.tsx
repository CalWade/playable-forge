'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, RotateCcw } from 'lucide-react';

const DEVICES = [
  { id: 'iphone13pro', label: 'iPhone 13 Pro', width: 390, height: 844 },
  { id: 'iphoneSE',    label: 'iPhone SE',     width: 375, height: 667 },
  { id: 'ipad',        label: 'iPad',           width: 768, height: 1024 },
  { id: 'pixel5',      label: 'Pixel 5',        width: 393, height: 851 },
];

interface PreviewPanelProps {
  projectId: string;
  versionId?: string;
  validationGrade?: string;
  htmlSize?: number;
  token: string;
}

const GRADE_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  A: 'success', B: 'info', C: 'warning', D: 'error',
};

export function PreviewPanel({ projectId, versionId, validationGrade, htmlSize, token }: PreviewPanelProps) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [deviceIdx, setDeviceIdx] = useState(0);
  const [replayKey, setReplayKey] = useState(0);

  const device = DEVICES[deviceIdx];
  const deviceW = isLandscape ? device.height : device.width;
  const deviceH = isLandscape ? device.width  : device.height;

  const previewUrl = versionId
    ? `/api/projects/${projectId}/preview/${versionId}`
    : `/api/projects/${projectId}/preview`;

  return (
    <div className="flex h-full flex-col bg-clay-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-clay-border px-4 py-2.5 shrink-0">
        <h3 className="text-sm font-bold text-clay-text">预览</h3>
        <div className="flex items-center gap-2">
          {validationGrade && (
            <Badge variant={GRADE_VARIANT[validationGrade] || 'default'}>
              {validationGrade} 级
            </Badge>
          )}
          {htmlSize && (
            <span className="text-[10px] text-clay-text-faint font-medium">
              {(htmlSize / 1024).toFixed(0)}KB
            </span>
          )}
        </div>
      </div>

      {/* Device controls */}
      <div className="flex items-center justify-between border-b border-clay-border px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsLandscape(false)}
            className={`rounded-clay-md p-1.5 transition-all duration-150 ${
              !isLandscape
                ? 'bg-clay-primary-lt text-clay-primary shadow-clay-xs'
                : 'text-clay-text-faint hover:text-clay-text'
            }`}
          >
            <Smartphone size={13} />
          </button>
          <button
            onClick={() => setIsLandscape(true)}
            className={`rounded-clay-md p-1.5 transition-all duration-150 ${
              isLandscape
                ? 'bg-clay-primary-lt text-clay-primary shadow-clay-xs'
                : 'text-clay-text-faint hover:text-clay-text'
            }`}
          >
            <Monitor size={13} />
          </button>
          <button
            onClick={() => setReplayKey((k) => k + 1)}
            className="rounded-clay-md p-1.5 text-clay-text-faint hover:text-clay-primary transition-colors"
            title="重播"
          >
            <RotateCcw size={13} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-clay-text-faint">{deviceW}×{deviceH}</span>
          <select
            value={deviceIdx}
            onChange={(e) => setDeviceIdx(Number(e.target.value))}
            className="rounded-clay-md border border-clay-border bg-clay-neutral-50 px-2 py-0.5 text-[10px] text-clay-text shadow-clay-input focus:outline-none"
          >
            {DEVICES.map((d, i) => <option key={d.id} value={i}>{d.label}</option>)}
          </select>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-clay-neutral-100 p-3">
        {versionId ? (
          <DeviceFrame
            width={deviceW}
            height={deviceH}
            src={`${previewUrl}?token=${token}`}
            frameKey={`${versionId}-${isLandscape}-${deviceIdx}-${replayKey}`}
          />
        ) : (
          <div className="text-center">
            <p className="text-4xl mb-3">📱</p>
            <p className="text-sm text-clay-text-muted">生成后即可预览</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceFrame({
  width, height, src, frameKey,
}: {
  width: number;
  height: number;
  src: string;
  frameKey: string;
}) {
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
        className="overflow-hidden rounded-clay-xl shadow-clay-effect-lg"
        style={{
          width:  width  * scale,
          height: height * scale,
          border: '3px solid rgba(147,112,219,0.25)',
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
