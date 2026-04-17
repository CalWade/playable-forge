'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TemplateSelectModal } from '@/components/workbench/template-select-modal';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, ArrowRight, FileText, Hammer, Search, LogOut, User } from 'lucide-react';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'info' }> = {
  draft: { label: '草稿', variant: 'default' },
  in_progress: { label: '进行中', variant: 'success' },
  completed: { label: '已完成', variant: 'info' },
};

type StatusFilter = 'all' | 'in_progress' | 'draft' | 'completed';
type SortBy = 'recent' | 'variants' | 'name';

interface RecentProject {
  id: string;
  name: string;
  status: string;
  variantCount: number;
  createdAt: string;
  updatedAt?: string;
  latestGrade?: string;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export default function DashboardPage() {
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading } = useSWR<any>(token ? '/api/stats/dashboard' : null, swrFetcher);

  const handleNewProject = async () => {
    try {
      const { project } = await api.post<{ project: { id: string } }>('/api/projects');
      router.push(`/projects/${project.id}`);
    } catch { /* ignore */ }
  };

  const handleNewFromTemplate = async (templateId: string) => {
    setShowTemplateModal(false);
    try {
      const { project } = await api.post<{ project: { id: string } }>('/api/projects', { templateId });
      router.push(`/projects/${project.id}`);
    } catch { /* ignore */ }
  };

  const filteredProjects = useMemo(() => {
    const list = (data?.recentProjects || []) as RecentProject[];
    let filtered = list;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (sortBy === 'recent') {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
    } else if (sortBy === 'variants') {
      filtered = [...filtered].sort((a, b) => b.variantCount - a.variantCount);
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    }
    return filtered;
  }, [data?.recentProjects, query, statusFilter, sortBy]);

  const hasData =
    (data?.totalProjects || 0) > 0 ||
    (data?.monthlyVariants || 0) > 0 ||
    (data?.firstPassRate || 0) > 0;

  const displayName = user?.displayName || user?.username || 'U';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f4ff 0%, #cae9ff 50%, #e8f4ff 100%)' }}>
        {/* Top bar */}
        <header className="rounded-clay-lg clay-gradient-surface clay-shadow mx-6 mt-4 px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-clay bg-gradient-to-br from-clay-blue-300 to-clay-blue-500 clay-shadow-sm">
                <Hammer size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-extrabold text-clay-text">PlayableForge</h1>
            </div>
            <div className="relative flex items-center gap-3">
              <a href="/audit" className="text-sm font-semibold text-clay-text/60 hover:text-clay-text clay-transition">
                审计演示
              </a>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-clay-blue-300 to-clay-blue-500 text-sm font-bold text-white clay-shadow-sm hover:clay-shadow clay-transition"
                title={displayName}
              >
                {avatarLetter}
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-clay bg-white clay-shadow-lg py-2 border border-clay-blue-100">
                    <div className="px-4 py-2 border-b border-clay-blue-50">
                      <p className="text-xs text-clay-text/50">登录身份</p>
                      <p className="text-sm font-semibold text-clay-text truncate">{displayName}</p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); router.push('/settings'); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-clay-text hover:bg-clay-blue-50 clay-transition"
                    >
                      <User size={14} /> 账户设置
                    </button>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 clay-transition"
                    >
                      <LogOut size={14} /> 登出
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-8">
          {/* Hero action bar (always visible new-project ctas) */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-extrabold text-clay-text">我的项目</h2>
              <p className="text-sm text-clay-text/60 mt-1">
                {hasData ? `共 ${data?.totalProjects || 0} 个项目` : '开始创建你的第一个互动广告项目'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleNewProject} size="lg">
                <Plus size={16} className="mr-1" /> 新建项目
              </Button>
              <Button onClick={() => setShowTemplateModal(true)} size="lg" variant="outline">
                <FileText size={16} className="mr-1" /> 从模板新建
              </Button>
            </div>
          </div>

          {/* Stats bar - only when we have meaningful data */}
          {hasData && (
            <div className="mb-6 grid grid-cols-5 gap-3">
              {[
                { label: '总项目数', value: data?.totalProjects ?? 0, suffix: '' },
                { label: '本月变体', value: data?.monthlyVariants ?? 0, suffix: '' },
                { label: '首次通过率', value: data?.firstPassRate ?? 0, suffix: '%' },
                { label: '平均迭代', value: data?.avgIterations ?? 0, suffix: '轮' },
                { label: '预估节省', value: data?.estimatedHoursSaved ?? 0, suffix: 'h' },
              ].map((stat) => (
                <Card key={stat.label} className="py-3">
                  <p className="text-xs font-semibold text-clay-text/50">{stat.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-clay-text">
                    {stat.value}
                    <span className="text-base font-bold text-clay-text/40 ml-0.5">{stat.suffix}</span>
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Search + filters */}
          {(data?.recentProjects?.length || 0) > 0 && (
            <div className="mb-4 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-clay-text/40" />
                <input
                  type="text"
                  placeholder="搜索项目名..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-clay-sm bg-white/70 clay-shadow-sm pl-9 pr-3 py-2 text-sm text-clay-text placeholder:text-clay-text/40 focus:outline-none focus:ring-2 focus:ring-clay-blue-300 clay-transition"
                />
              </div>
              <div className="flex gap-1 rounded-clay-sm bg-white/70 clay-shadow-sm p-1">
                {(['all', 'in_progress', 'draft', 'completed'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-clay-sm text-xs font-semibold clay-transition ${
                      statusFilter === s
                        ? 'bg-gradient-to-br from-clay-blue-300 to-clay-blue-500 text-white clay-shadow-sm'
                        : 'text-clay-text/60 hover:text-clay-text'
                    }`}
                  >
                    {s === 'all' ? '全部' : STATUS_MAP[s]?.label}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="rounded-clay-sm bg-white/70 clay-shadow-sm px-3 py-2 text-xs font-semibold text-clay-text/70 focus:outline-none focus:ring-2 focus:ring-clay-blue-300 clay-transition"
              >
                <option value="recent">最近更新</option>
                <option value="variants">变体最多</option>
                <option value="name">名称</option>
              </select>
            </div>
          )}

          {/* Project list */}
          <Card>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-clay-blue-200 border-t-clay-blue-400" />
              </div>
            ) : data?.recentProjects?.length === 0 ? (
              <div className="py-16 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-clay-lg bg-gradient-to-br from-clay-blue-100 to-clay-blue-200 mb-4 clay-shadow-sm">
                  <Hammer size={28} className="text-clay-blue-500" />
                </div>
                <p className="text-sm font-semibold text-clay-text mb-1">还没有项目</p>
                <p className="text-xs text-clay-text/50 mb-6">点击上方「新建项目」或从模板开始</p>
                <Button onClick={handleNewProject} size="lg">
                  <Plus size={16} className="mr-1" /> 新建项目
                </Button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-sm text-clay-text/50">
                没有匹配的项目。
                <button
                  onClick={() => { setQuery(''); setStatusFilter('all'); }}
                  className="ml-2 text-clay-blue-400 font-semibold hover:underline"
                >
                  清除筛选
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((p) => {
                  const updatedIso = p.updatedAt || p.createdAt;
                  const statusInfo = STATUS_MAP[p.status] || { label: p.status, variant: 'default' as const };
                  return (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="group flex cursor-pointer items-center justify-between gap-4 rounded-clay clay-gradient-blue px-5 py-4 clay-shadow-sm hover:clay-shadow hover:-translate-y-0.5 clay-transition"
                    >
                      {/* Left: thumbnail + name + sub info */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-clay bg-gradient-to-br from-white/80 to-clay-blue-50 clay-shadow-sm text-lg font-extrabold text-clay-blue-500">
                          {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-clay-text truncate">{p.name}</span>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-clay-text/50 truncate">
                            {p.variantCount > 0 ? (
                              <>
                                🎨 {p.variantCount} 个变体
                                {p.latestGrade && <> · 最新 <b className="text-clay-text/70">{p.latestGrade}</b> 级</>}
                                <> · {formatRelative(updatedIso)}</>
                              </>
                            ) : p.status === 'draft' ? (
                              <span className="text-clay-text/40">草稿 · 点击继续编辑</span>
                            ) : (
                              <>暂无变体 · 创建于 {formatRelative(updatedIso)}</>
                            )}
                          </p>
                        </div>
                      </div>
                      {/* Right: CTA */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ArrowRight size={16} className="text-clay-blue-300 group-hover:translate-x-0.5 clay-transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent activity */}
          {data?.recentActivity && data.recentActivity.length > 0 && (
            <Card className="mt-6">
              <h3 className="text-sm font-bold text-clay-text mb-4">最近活动</h3>
              <div className="space-y-2">
                {data.recentActivity.map(
                  (a: { id: string; projectName: string; projectId: string; role: string; content: string; createdAt: string }) => (
                    <div
                      key={a.id}
                      onClick={() => router.push(`/projects/${a.projectId}`)}
                      className="flex cursor-pointer items-center justify-between rounded-clay-sm bg-clay-bg/50 px-4 py-3 hover:bg-clay-blue-50/30 clay-transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs flex-shrink-0">{a.role === 'user' ? '👤' : '🤖'}</span>
                        <span className="text-sm font-medium text-clay-text/70 truncate">{a.content}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className="text-xs font-semibold text-clay-text/40">{a.projectName}</span>
                        <span className="text-xs text-clay-text/30">
                          {new Date(a.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>
          )}
        </main>

        <TemplateSelectModal
          open={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelect={handleNewFromTemplate}
        />
      </div>
    </ProtectedRoute>
  );
}
