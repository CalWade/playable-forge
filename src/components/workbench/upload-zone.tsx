'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/components/ui/toast';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  projectId: string;
  onUploadComplete: () => void;
}

export function UploadZone({ projectId, onUploadComplete }: UploadZoneProps) {
  const { token } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      try {
        const res = await fetch(`/api/projects/${projectId}/assets/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Upload failed');
        }
        const data = await res.json();
        toast(`已上传 ${data.assets.length} 个文件`, 'success');
        onUploadComplete();
      } catch (err) {
        toast(err instanceof Error ? err.message : '上传失败', 'error');
      } finally {
        setUploading(false);
      }
    },
    [projectId, token, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.files);
      if (files.length > 0) { e.preventDefault(); handleFiles(files); }
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={[
        'relative rounded-clay-xl border-2 border-dashed p-4 text-center transition-all duration-200',
        isDragging
          ? 'border-clay-primary bg-clay-primary-lt shadow-clay-effect-sm scale-[1.01]'
          : 'border-clay-border hover:border-clay-primary/50 hover:bg-clay-neutral-50',
      ].join(' ')}
    >
      {uploading ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="size-6 rounded-full border-2 border-clay-primary/30 border-t-clay-primary animate-spin-soft" />
          <span className="text-xs text-clay-text-muted font-medium">上传中...</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-1.5 py-1">
            <Upload size={20} className={isDragging ? 'text-clay-primary' : 'text-clay-text-faint'} />
            <p className="text-xs font-medium text-clay-text-muted">
              {isDragging ? '松手上传' : '拖拽 / 点击上传素材'}
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*,audio/*,.pdf,.txt,.zip"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </>
      )}
    </div>
  );
}
