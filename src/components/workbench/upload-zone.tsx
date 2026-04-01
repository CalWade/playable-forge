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
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Upload failed');
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

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      className={`relative rounded-clay-lg border-2 border-dashed p-6 text-center clay-transition ${
        isDragging ? 'border-clay-blue-300 bg-clay-blue-50/30' : 'border-clay-blue-100 hover:border-clay-blue-200'
      }`}
    >
      {uploading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-clay-blue-300 border-t-transparent" />
          <span className="text-sm font-medium text-clay-text/50">上传中...</span>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-clay-text/50">拖拽素材到这里，或点击上传</p>
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
