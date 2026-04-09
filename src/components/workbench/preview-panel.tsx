'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { DeviceFrame } from '@/components/ui/device-frame';
import { Monitor, Smartphone, RotateCcw } from 'lucide-react';

const DEVICES = [
  { id: 'iphone13pro', label: 'iPhone 13 Pro', width: 390, height: 844 },
  { id: 'iphoneSE', label: 'iPhone SE', width: 375, height: 667 },
  { id: 'ipad', label: 'iPad', width: 768, height: 1024 },
  { id: 'pixel5', label: 'Pixel 5', width: 393, height: 851 },
];

// Streaming progress stages
interface StreamingStage {
  id: string;
  label: string;
  check: (html: string) => boolean;
}

const STAGES: StreamingStage[] = [
  { id: 'doctype', label: 'DOCTYPE', check: (h) => /<!DOCTYPE/i.test(h) },
  { id: 'css', label: 'CSS 样式', check: (h) => /<\/style>/i.test(h) },
  { id: 'html', label: 'HTML 结构', check: (h) => /<body/i.test(h) },
  { id: 'script', label: '交互逻辑', check: (h) => /<script/i.test(h) },
];

function getStreamingProgress(html: string): { completed: string[]; current: string | null } {
  const completed: string[] = [];
  let current: string | null = null;

  for (const stage of STAGES) {
    if (stage.check(html)) {
      completed.push(stage.id);
    } else {
      current = stage.id;
      break;
    }
  }

  // All stages completed but stream not finished yet
  if (completed.length === STAGES.length) {
    current = 'finishing';
  }

  return { completed, current };
}

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
  const [fadeIn, setFadeIn] = useState(false);
  const prevStreamingRef = useRef(false);

  const device = DEVICES[deviceIdx];
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

  // Detect transition from streaming → complete → trigger fade-in
  useEffect(() => {
    if (prevStreamingRef.current && !isCurrentlyStreaming && versionId) {
      setFadeIn(true);
      const timer = setTimeout(() => setFadeIn(false), 500);
      return () => clearTimeout(timer);
    }
    prevStreamingRef.current = !!isCurrentlyStreaming;
  }, [isCurrentlyStreaming, versionId]);

  // Compute streaming progress
  const progress = streamingHtml ? getStreamingProgress(streamingHtml) : null;
  const charCount = streamingHtml?.length || 0;
  const showStreamingProgress = isCurrentlyStreaming && charCount > 0;

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

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-clay-bg p-3">
        {/* Streaming: show progress stages instead of iframe */}
        {isCurrentlyStreaming ? (
          <div className="flex flex-col items-center gap-4">
            {/* Spinner */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-clay-blue-100 border-t-clay-blue-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg">🛠️</span>
              </div>
            </div>

            {/* Stage checklist */}
            {showStreamingProgress && progress ? (
              <div className="space-y-2 w-56">
                {STAGES.map((stage) => {
                  const isCompleted = progress.completed.includes(stage.id);
                  const isCurrent = progress.current === stage.id;
                  return (
                    <div key={stage.id} className="flex items-center gap-2">
                      <span className="w-5 text-center text-sm">
                        {isCompleted ? '✅' : isCurrent ? '⏳' : '⬜'}
                      </span>
                      <span className={`text-xs font-medium ${
                        isCompleted ? 'text-clay-text' : isCurrent ? 'text-clay-blue-400' : 'text-clay-muted'
                      }`}>
                        {stage.label}{isCompleted ? '已生成' : isCurrent ? '生成中...' : ''}
                      </span>
                    </div>
                  );
                })}
                {progress.current === 'finishing' && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center text-sm">⏳</span>
                    <span className="text-xs font-medium text-clay-blue-400">收尾中...</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm font-medium text-clay-text/40">⏳ 等待 AI 响应...</p>
            )}

            {/* Char count */}
            {charCount > 0 && (
              <p className="text-[10px] text-clay-muted">
                已接收 {charCount.toLocaleString()} 字符
              </p>
            )}
          </div>
        ) : versionId ? (
          /* Completed: show iframe with fade-in */
          <div className={`w-full h-full transition-opacity duration-400 ${fadeIn ? 'animate-fade-in' : ''}`}
            style={fadeIn ? { animation: 'fadeIn 0.4s ease-in-out' } : undefined}
          >
            <DeviceFrame
              width={deviceW}
              height={deviceH}
              src={`${previewUrl}?token=${token}`}
              frameKey={`${versionId}-${isLandscape}-${deviceIdx}-${replayKey}`}
            />
          </div>
        ) : (
          <p className="text-sm text-clay-muted">生成后即可预览</p>
        )}
      </div>

      {/* Fade-in keyframe (injected once) */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
