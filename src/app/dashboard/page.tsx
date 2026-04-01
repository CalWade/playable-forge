'use client';

import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, ArrowRight, Sparkles, Settings, LogOut, TrendingUp } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'info' }> = {
  draft:       { label: '草稿',   variant: 'default' },
  in_progress: { label: '进行中', variant: 'success' },
  completed:   { label: '已完成', variant: 'info' },
};

const STAT_ICONS = ['📁', '🎨', '✅', '🔄', '⏱'];
const STAT_COLORS = [
  'bg-clay-primary-lt text-clay-primary-dk',
  'bg-clay-accent-lt  text-clay-accent-dk',
  'bg-clay-success-lt text-clay-success-dk',
  'bg-clay-info-lt    text-clay-info-dk',
  'bg-clay-warning-lt text-clay-warning-dk',
];

export default function DashboardPage() {
  const { token, user, logout } = useAuth();
  const router = useRouter();

  const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data, isLoading } = useSWR(token ? '/api/stats/dashboard' : null, fetcher);

  const handleNewProject = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const { project } = await res.json();
      router.push(`/projects/${project.id}`);
    }
  };

  const stats = [
    { label: '总项目数',  value: data?.totalProjects       ?? '-' },
    { label: '本月变体',  value: data?.monthlyVariants      ?? '-' },
    { label: '首次通过率', value: data?.firstPassRate !== undefined ? `${data.firstPassRate}%` : '-' },
    { label: '平均迭代',  value: data?.avgIterations        !== undefined ? `${data.avgIterations}轮` : '-' },
    { label: '预估节省',  value: data?.estimatedHoursSaved  !== undefined ? `${data.estimatedHoursSaved}h` : '-' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen clay-bg">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b-2 border-clay-border bg-clay-surface/90 backdrop-blur-md px-6 py-3.5 shadow-clay-xs">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-clay-md bg-clay-primary shadow-clay-xs">
                <Sparkles size={16} className="text-white" />
              </div>
              <h1 className="text-base font-bold text-clay-text">PlayableForge</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm font-medium text-clay-text-muted">
                {user?.displayName || user?.username}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => router.push('/settings')}>
                <Settings size={16} />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={logout}>
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
          {/* Page title + new project */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-clay-text">项目工作台</h2>
              <p className="mt-1 text-sm text-clay-text-muted">管理你的可玩广告项目</p>
            </div>
            <Button onClick={handleNewProject} size="lg">
              <Plus size={17} />
              新建项目
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stats.map((stat, i) => (
              <Card key={stat.label} size="sm" className="hover:shadow-clay-effect-lg transition-shadow duration-200">
                <div className="px-4 py-4">
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-clay-md text-lg mb-2.5 ${STAT_COLORS[i]}`}>
                    {STAT_ICONS[i]}
                  </div>
                  <p className="text-2xl font-bold text-clay-text">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-clay-text-muted">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Project list */}
          <Card>
            <div className="px-5 pt-5 pb-0 flex items-center justify-between">
              <h3 className="text-sm font-bold text-clay-text flex items-center gap-2">
                <TrendingUp size={15} className="text-clay-primary" />
                最近项目
              </h3>
            </div>
            <div className="p-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-7 w-7 rounded-full border-3 border-clay-primary/30 border-t-clay-primary animate-spin-soft" />
                </div>
              ) : data?.recentProjects?.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-3xl mb-3">🎨</p>
                  <p className="text-sm text-clay-text-muted">还没有项目，点击「新建项目」开始</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {data?.recentProjects?.map(
                    (p: { id: string; name: string; status: string; variantCount: number; createdAt: string }) => (
                      <button
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}`)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-clay-xl hover:bg-clay-neutral-50 hover:shadow-clay-xs transition-all duration-150 group text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-clay-md bg-clay-primary-lt flex items-center justify-center text-sm shrink-0 shadow-clay-xs">
                            🎮
                          </div>
                          <div className="min-w-0">
                            <span className="block text-sm font-semibold text-clay-text truncate">{p.name}</span>
                            <span className="text-xs text-clay-text-muted">
                              {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <Badge variant={STATUS_MAP[p.status]?.variant || 'default'}>
                            {STATUS_MAP[p.status]?.label || p.status}
                          </Badge>
                          <span className="text-xs text-clay-text-faint">{p.variantCount} 变体</span>
                          <ArrowRight size={15} className="text-clay-text-faint group-hover:text-clay-primary transition-colors" />
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Recent activity */}
          {data?.recentActivity && data.recentActivity.length > 0 && (
            <Card>
              <div className="px-5 pt-5 pb-0">
                <h3 className="text-sm font-bold text-clay-text">最近活动</h3>
              </div>
              <div className="p-3">
                <div className="space-y-1">
                  {data.recentActivity.map(
                    (a: { id: string; projectName: string; projectId: string; role: string; content: string; createdAt: string }) => (
                      <button
                        key={a.id}
                        onClick={() => router.push(`/projects/${a.projectId}`)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-clay-xl hover:bg-clay-neutral-50 transition-all duration-150 group text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-base shrink-0">{a.role === 'user' ? '👤' : '🤖'}</span>
                          <span className="text-sm text-clay-text truncate">{a.content}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-xs text-clay-text-muted">{a.projectName}</span>
                          <span className="text-xs text-clay-text-faint">
                            {new Date(a.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
