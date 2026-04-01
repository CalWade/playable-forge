'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import useSWR from 'swr';

import { SkeletonPreview } from '@/components/variants/skeleton-preview';
import { DimensionConfig } from '@/components/variants/dimension-config';
import { VariantMatrix } from '@/components/variants/variant-matrix';
import { OutputTable } from '@/components/variants/output-table';
import { VariantPreviewModal } from '@/components/variants/variant-preview-modal';
import { ValidationReportModal } from '@/components/variants/validation-report-modal';

export default function VariantsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { token } = useAuth();

  const [generating, setGenerating] = useState(false);
  const [previewVariantId, setPreviewVariantId] = useState<string | null>(null);
  const [validationReportId, setValidationReportId] = useState<string | null>(null);
  const [dimensionOverrides, setDimensionOverrides] = useState<Record<string, { enabled: boolean; assetIds: string[] }>>({});

  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data: configData, isLoading: configLoading } = useSWR(
    token ? `/api/projects/${projectId}/variant-config` : null, fetcher
  );
  const { data: variantData, mutate: refreshVariants } = useSWR(
    token ? `/api/projects/${projectId}/variants` : null, fetcher
  );
  const { data: versionData } = useSWR(
    token ? `/api/projects/${projectId}/versions` : null, fetcher
  );

  const lockedVersion = versionData?.versions?.find((v: { isLocked: boolean }) => v.isLocked);
  const rawDimensions = configData?.dimensions || [];
  const variants = variantData?.variants || [];

  const dimensions = rawDimensions.map((d: { name: string; assets: Array<{ id: string }> }) => {
    const override = dimensionOverrides[d.name];
    if (!override) return { ...d, enabled: true };
    return {
      ...d,
      enabled: override.enabled,
      assets: d.assets.filter((a: { id: string }) => override.assetIds.includes(a.id)),
    };
  });

  const enabledDimensions = dimensions.filter(
    (d: { enabled: boolean; assets: { length: number } }) => d.enabled && d.assets.length > 0
  );
  const totalCombinations = enabledDimensions.length > 0
    ? enabledDimensions.reduce((acc: number, d: { assets: { length: number } }) => acc * d.assets.length, 1)
    : 0;

  const toggleDimension = (name: string, enabled: boolean) => {
    const raw = rawDimensions.find((d: { name: string }) => d.name === name);
    setDimensionOverrides((prev) => ({
      ...prev,
      [name]: { enabled, assetIds: prev[name]?.assetIds || raw?.assets.map((a: { id: string }) => a.id) || [] },
    }));
  };

  const toggleAsset = (dimName: string, assetId: string) => {
    const raw = rawDimensions.find((d: { name: string }) => d.name === dimName);
    const allIds = raw?.assets.map((a: { id: string }) => a.id) || [];
    setDimensionOverrides((prev) => {
      const current = prev[dimName]?.assetIds || allIds;
      const newIds = current.includes(assetId)
        ? current.filter((id: string) => id !== assetId)
        : [...current, assetId];
      return { ...prev, [dimName]: { enabled: prev[dimName]?.enabled !== false, assetIds: newIds } };
    });
  };

  const handleGenerate = async () => {
    if (!lockedVersion) { toast('请先锁定一个骨架版本', 'warning'); return; }
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/variants/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
      const data = await res.json();
      toast(`已生成 ${data.total} 个变体`, 'success');
      refreshVariants();
    } catch (err) {
      toast(err instanceof Error ? err.message : '生成失败', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleUnlock = async () => {
    if (!lockedVersion) return;
    try {
      await fetch(`/api/projects/${projectId}/versions/${lockedVersion.id}/unlock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.reload();
    } catch { /* ignore */ }
  };

  const reportVariant = validationReportId
    ? variants.find((v: { id: string }) => v.id === validationReportId) || null
    : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen clay-bg">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b-2 border-clay-border bg-clay-surface/90 backdrop-blur-md px-6 py-3.5 shadow-clay-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/projects/${projectId}`)}>
                <ArrowLeft size={17} />
              </Button>
              <h1 className="text-base font-bold text-clay-text">变体生成</h1>
            </div>
            {/* Bottom bar actions moved to header for compactness */}
            <div className="flex items-center gap-2.5">
              {configData?.estimatedTotalSize && (
                <span className="hidden md:block text-xs text-clay-text-muted">
                  预估体积: {(configData.estimatedTotalSize / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
              {variants.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/projects/${projectId}/variants/download?token=${token}`, '_blank')}
                >
                  <Download size={14} />
                  批量下载
                </Button>
              )}
              <Button
                onClick={handleGenerate}
                disabled={generating || !lockedVersion}
                size="sm"
              >
                <Sparkles size={14} />
                {generating ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin-soft" />
                    生成中...
                  </span>
                ) : '开始生成'}
              </Button>
            </div>
          </div>
        </header>

        {/* Split layout */}
        <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
          {/* Skeleton sidebar */}
          <SkeletonPreview
            projectId={projectId}
            lockedVersion={lockedVersion || null}
            token={token || ''}
            onUnlock={handleUnlock}
          />

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <DimensionConfig
              rawDimensions={rawDimensions}
              dimensionOverrides={dimensionOverrides}
              enabledDimensions={enabledDimensions}
              totalCombinations={totalCombinations}
              configLoading={configLoading}
              token={token || ''}
              projectId={projectId}
              onToggleDimension={toggleDimension}
              onToggleAsset={toggleAsset}
            />

            <VariantMatrix variants={variants} onPreview={setPreviewVariantId} />

            <OutputTable
              variants={variants}
              token={token || ''}
              onPreview={setPreviewVariantId}
              onShowReport={setValidationReportId}
              onRetry={async (variantId) => {
                try {
                  const res = await fetch(`/api/variants/${variantId}/retry`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) { toast('重试成功', 'success'); refreshVariants(); }
                  else toast('重试失败', 'error');
                } catch { toast('重试失败', 'error'); }
              }}
            />

            {variants.length > 0 && (
              <div className="text-xs text-clay-text-faint text-center pb-2">
                已完成 {variants.length} / {totalCombinations} 个变体
                <span className="mx-3">·</span>
                预估成本: $0（纯素材替换，不调 AI）
              </div>
            )}
          </div>
        </div>

        <VariantPreviewModal variantId={previewVariantId} token={token || ''} onClose={() => setPreviewVariantId(null)} />
        <ValidationReportModal variant={reportVariant} onClose={() => setValidationReportId(null)} />
      </div>
    </ProtectedRoute>
  );
}
