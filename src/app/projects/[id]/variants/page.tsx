'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { ArrowLeft, Lock, Unlock, Download, Sparkles } from 'lucide-react';
import useSWR from 'swr';

export default function VariantsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { token } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [previewVariantId, setPreviewVariantId] = useState<string | null>(null);
  const [dimensionOverrides, setDimensionOverrides] = useState<Record<string, { enabled: boolean; assetIds: string[] }>>({});
  const [validationReportId, setValidationReportId] = useState<string | null>(null);

  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data: configData, isLoading: configLoading } = useSWR(
    token ? `/api/projects/${projectId}/variant-config` : null,
    fetcher
  );

  const { data: variantData, mutate: refreshVariants } = useSWR(
    token ? `/api/projects/${projectId}/variants` : null,
    fetcher
  );

  const { data: versionData } = useSWR(
    token ? `/api/projects/${projectId}/versions` : null,
    fetcher
  );

  const lockedVersion = versionData?.versions?.find((v: { isLocked: boolean }) => v.isLocked);
  const rawDimensions = configData?.dimensions || [];
  const variants = variantData?.variants || [];

  // Apply overrides to dimensions
  const dimensions = rawDimensions.map((d: { name: string; label: string; assets: Array<{ id: string; fileName: string; thumbnailUrl: string | null }>; enabled: boolean }) => {
    const override = dimensionOverrides[d.name];
    if (!override) return { ...d, enabled: true };
    return {
      ...d,
      enabled: override.enabled,
      assets: d.assets.filter((a: { id: string }) => override.assetIds.includes(a.id)),
    };
  });

  const enabledDimensions = dimensions.filter((d: { enabled: boolean; assets: { length: number } }) => d.enabled && d.assets.length > 0);
  const totalCombinations = enabledDimensions.length > 0
    ? enabledDimensions.reduce((acc: number, d: { assets: { length: number } }) => acc * d.assets.length, 1)
    : 0;

  const toggleDimension = (name: string, enabled: boolean) => {
    const raw = rawDimensions.find((d: { name: string }) => d.name === name);
    setDimensionOverrides((prev) => ({
      ...prev,
      [name]: {
        enabled,
        assetIds: prev[name]?.assetIds || raw?.assets.map((a: { id: string }) => a.id) || [],
      },
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
      return {
        ...prev,
        [dimName]: { enabled: prev[dimName]?.enabled !== false, assetIds: newIds },
      };
    });
  };

  const handleGenerate = async () => {
    if (!lockedVersion) {
      toast('请先锁定一个骨架版本', 'warning');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/variants/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed');
      }
      const data = await res.json();
      toast(`已生成 ${data.total} 个变体`, 'success');
      refreshVariants();
    } catch (err) {
      toast(err instanceof Error ? err.message : '生成失败', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    window.open(`/api/projects/${projectId}/variants/download?token=${token}`, '_blank');
  };

  const gradeColor = (grade: string | null) => {
    if (grade === 'A') return 'border-green-400';
    if (grade === 'B') return 'border-blue-400';
    if (grade === 'C') return 'border-yellow-400';
    return 'border-red-400';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/projects/${projectId}`)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">变体生成</h1>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
          {/* Locked skeleton info */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {lockedVersion ? (
                  <>
                    <Lock size={20} className="text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">骨架已锁定</p>
                      <p className="text-sm text-gray-500">v{lockedVersion.version} — 已锁定骨架的只读预览</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Unlock size={20} className="text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">未锁定骨架</p>
                      <p className="text-sm text-gray-500">请回到工作台锁定一个版本</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Variant dimensions */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-gray-900">变体维度</h3>
            {configLoading ? (
              <div className="py-4 text-center text-sm text-gray-400">加载中...</div>
            ) : dimensions.length === 0 ? (
              <p className="text-sm text-gray-400">没有标记为&ldquo;参与变体&rdquo;的素材</p>
            ) : (
              <div className="space-y-4">
                {rawDimensions.map((d: { name: string; label: string; assets: Array<{ id: string; thumbnailUrl: string | null }> }) => {
                  const override = dimensionOverrides[d.name];
                  const isEnabled = override?.enabled !== false;
                  const selectedIds = override?.assetIds || d.assets.map((a: { id: string }) => a.id);

                  return (
                    <div key={d.name} className={`flex items-center gap-4 ${!isEnabled ? 'opacity-40' : ''}`}>
                      <label className="flex items-center gap-2 w-32 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => toggleDimension(d.name, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">
                          {d.label} ({selectedIds.length}张)
                        </span>
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {d.assets.map((a: { id: string; thumbnailUrl: string | null }) => {
                          const isSelected = selectedIds.includes(a.id);
                          return (
                            <div
                              key={a.id}
                              onClick={() => isEnabled && toggleAsset(d.name, a.id)}
                              className={`h-12 w-12 overflow-hidden rounded border-2 bg-gray-100 cursor-pointer transition-all ${
                                isSelected && isEnabled ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 opacity-40'
                              }`}
                            >
                              {a.thumbnailUrl ? (
                                <img src={`${a.thumbnailUrl}?token=${token}`} alt="asset" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">?</div>
                              )}
                            </div>
                          );
                        })}
                        {/* Per-dimension upload button */}
                        <label className={`h-12 w-12 flex items-center justify-center rounded border-2 border-dashed border-gray-300 bg-white cursor-pointer hover:border-blue-400 hover:text-blue-600 text-gray-400 text-lg ${!isEnabled ? 'pointer-events-none' : ''}`}>
                          +
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              const formData = new FormData();
                              Array.from(files).forEach((f) => formData.append('files', f));
                              try {
                                const res = await fetch(`/api/projects/${projectId}/assets/upload`, {
                                  method: 'POST',
                                  headers: { Authorization: `Bearer ${token}` },
                                  body: formData,
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  for (const asset of data.assets) {
                                    await fetch(`/api/projects/${projectId}/assets/${asset.id}`, {
                                      method: 'PATCH',
                                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ variantRole: 'variant', variantGroup: d.name, slotName: d.name }),
                                    });
                                  }
                                  window.location.reload();
                                }
                              } catch { /* ignore */ }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 text-lg font-semibold text-blue-600">
                  {enabledDimensions.length > 0
                    ? enabledDimensions.map((d: { assets: { length: number } }) => d.assets.length).join(' × ') + ' = '
                    : ''}
                  <span className="text-2xl">{totalCombinations}</span> 个变体
                </div>

                {/* Upload variant assets - auto-classify by filename */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600">
                    <span>+ 新增变体素材（自动分类）</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,audio/*"
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        const formData = new FormData();
                        Array.from(files).forEach((f) => formData.append('files', f));
                        try {
                          const res = await fetch(`/api/projects/${projectId}/assets/upload`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData,
                          });
                          if (res.ok) {
                            const data = await res.json();
                            for (const asset of data.assets) {
                              // Auto-detect dimension from filename/category
                              const name = asset.originalName?.toLowerCase() || '';
                              let group = 'background';
                              if (name.includes('弹窗') || name.includes('popup') || name.includes('dialog')) group = 'popup';
                              else if (name.includes('按钮') || name.includes('btn') || name.includes('button')) group = 'button';
                              else if (name.includes('图标') || name.includes('icon')) group = 'icon';
                              else if (asset.mimeType?.startsWith('audio/')) group = 'bgm';

                              await fetch(`/api/projects/${projectId}/assets/${asset.id}`, {
                                method: 'PATCH',
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ variantRole: 'variant', variantGroup: group, slotName: group }),
                              });
                            }
                            window.location.reload();
                          }
                        } catch { /* ignore */ }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-400">根据文件名自动归入维度（背景/弹窗/按钮），也可在每个维度旁的 + 按钮上传</p>
                </div>
              </div>
            )}
          </Card>

          {/* Variant matrix */}
          {variants.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-gray-900">变体矩阵</h3>
              <div className="grid grid-cols-6 gap-3">
                {variants.map((v: { id: string; name: string; validationGrade: string | null; fullHtmlSize: number | null }) => (
                  <div
                    key={v.id}
                    onClick={() => setPreviewVariantId(v.id)}
                    className={`cursor-pointer rounded-lg border-2 p-2 text-center hover:shadow-md transition-shadow ${gradeColor(v.validationGrade)}`}
                  >
                    <p className="truncate text-xs font-medium text-gray-700">{v.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Badge variant={v.validationGrade === 'A' || v.validationGrade === 'B' ? 'success' : 'warning'}>
                        {v.validationGrade}
                      </Badge>
                      <span className="text-[10px] text-gray-400">
                        {v.fullHtmlSize ? `${(v.fullHtmlSize / 1024).toFixed(0)}KB` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Variant preview modal */}
          {previewVariantId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewVariantId(null)}>
              <div className="relative w-[420px] h-[750px] rounded-xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b px-4 py-2">
                  <span className="text-sm font-medium">变体预览</span>
                  <button onClick={() => setPreviewVariantId(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>
                <iframe
                  src={`/api/variants/${previewVariantId}/preview?token=${token}`}
                  sandbox="allow-scripts"
                  className="w-full border-0"
                  style={{ height: 'calc(100% - 45px)' }}
                />
              </div>
            </div>
          )}

          {/* F7: Output management table */}
          {variants.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-gray-900">产出管理</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">文件名</th>
                    <th className="pb-2 font-medium">体积</th>
                    <th className="pb-2 font-medium">校验</th>
                    <th className="pb-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {variants.map((v: { id: string; name: string; validationGrade: string | null; fullHtmlSize: number | null }) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-2 text-gray-700">{v.name}.html</td>
                      <td className="py-2 text-gray-500">{v.fullHtmlSize ? `${(v.fullHtmlSize / 1024).toFixed(0)}KB` : '-'}</td>
                      <td className="py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          v.validationGrade === 'A' ? 'bg-green-100 text-green-700' :
                          v.validationGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                          v.validationGrade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{v.validationGrade || '-'}</span>
                      </td>
                      <td className="py-2 space-x-2">
                        <button onClick={() => setPreviewVariantId(v.id)} className="text-xs text-blue-600 hover:underline">预览</button>
                        <a href={`/api/variants/${v.id}/preview?token=${token}`} download={`${v.name}.html`} className="text-xs text-blue-600 hover:underline">下载</a>
                        <button onClick={() => setValidationReportId(v.id)} className="text-xs text-gray-500 hover:underline">校验报告</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">
              {configData?.estimatedTotalSize
                ? `预估总体积: ${(configData.estimatedTotalSize / 1024 / 1024).toFixed(1)} MB`
                : ''}
              <span className="ml-4">预估成本: $0（纯素材替换，不调 AI）</span>
              {variants.length > 0 && (
                <span className="ml-4">
                  已完成 {variants.length}/{totalCombinations}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {variants.length > 0 && (
                <Button variant="outline" onClick={handleDownload}>
                  <Download size={16} className="mr-1" /> 批量下载
                </Button>
              )}
              <Button onClick={handleGenerate} disabled={generating || !lockedVersion}>
                <Sparkles size={16} className="mr-1" />
                {generating ? '生成中...' : '开始生成'}
              </Button>
            </div>
          </div>

          {/* Validation report modal */}
          {validationReportId && (() => {
            const variant = variants.find((v: { id: string }) => v.id === validationReportId);
            const report = variant?.validationJson ? JSON.parse(variant.validationJson) : [];
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setValidationReportId(null)}>
                <div className="w-[500px] rounded-xl bg-white p-6 shadow-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">校验报告 — {variant?.name}</h3>
                    <button onClick={() => setValidationReportId(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <div className="space-y-2">
                    {report.map((r: { id: string; name: string; level: string; passed: boolean; detail: string }, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{r.passed ? '✅' : r.level === 'error' ? '❌' : '⚠️'}</span>
                          <span className="text-gray-700">{r.name}</span>
                        </div>
                        <span className="text-gray-400 text-xs">{r.detail}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Badge variant={variant?.validationGrade === 'A' ? 'success' : variant?.validationGrade === 'B' ? 'info' : 'warning'}>
                      总评: {variant?.validationGrade} 级
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
