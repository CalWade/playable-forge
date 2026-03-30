'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/components/ui/toast';

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
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      {uploading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm text-gray-500">上传中...</span>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            拖拽素材到这里，或点击上传
          </p>
          <input
            type="file"
            multiple
            accept="image/*,audio/*,.pdf,.txt,.zip"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </>
      )}
    </div>
  );
}
