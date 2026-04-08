'use client';

import { useState, useRef, useEffect } from 'react';

interface DeviceFrameProps {
  width: number;
  height: number;
  src?: string;
  srcdoc?: string;
  frameKey: string;
}

export function DeviceFrame({ width, height, src, srcdoc, frameKey }: DeviceFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      setContainerSize((prev) => (prev.w === w && prev.h === h) ? prev : { w, h });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = containerSize.w > 0
    ? Math.min(containerSize.w / width, containerSize.h / height, 1)
    : 0.5;

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      <div
        className="overflow-hidden rounded-xl border border-clay-blue-100 bg-white shadow-lg"
        style={{
          width: width * scale,
          height: height * scale,
        }}
      >
        <iframe
          key={frameKey}
          src={srcdoc ? undefined : src}
          srcDoc={srcdoc || undefined}
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
