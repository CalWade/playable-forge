'use client';

import { useAuth } from '@/components/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, ArrowRight } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'info' }> = {
  draft: { label: '草稿', variant: 'default' },
  in_progress: { label: '进行中', variant: 'success' },
  completed: { label: '已完成', variant: 'info' },
};

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f4ff 0%, #cae9ff 50%, #e8f4ff 100%)' }}>
        {/* Top bar */}
        <header className="rounded-clay-lg clay-gradient-surface clay-shadow mx-6 mt-4 px-6 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <h1 className="text-xl font-extrabold text-clay-text">PlayableForge</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-clay-text/60">{user?.displayName || user?.username}</span>
              <button onClick={logout} className="text-sm font-bold text-clay-blue-400 hover:text-clay-blue-300 clay-transition">
                登出
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-8">
          {/* Stats bar */}
          <div className="mb-8 flex items-center gap-4">
            {[
              { label: '总项目数', value: data?.totalProjects ?? '-' },
              { label: '本月变体', value: data?.monthlyVariants ?? '-' },
              { label: '首次通过率', value: data?.firstPassRate !== undefined ? `${data.firstPassRate}%` : '-' },
              { label: '平均迭代', value: data?.avgIterations !== undefined ? `${data.avgIterations}轮` : '-' },
              { label: '预估节省', value: data?.estimatedHoursSaved !== undefined ? `${data.estimatedHoursSaved}h` : '-' },
            ].map((stat) => (
              <Card key={stat.label} className="flex-1">
                <p className="text-xs font-semibold text-clay-text/50">{stat.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-clay-text">{stat.value}</p>
              </Card>
            ))}

            <Button onClick={handleNewProject} size="lg">
              <Plus size={16} className="mr-1" /> 新建项目
            </Button>
          </div>

          {/* Project list */}
          <Card>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-clay-blue-200 border-t-clay-blue-400" />
              </div>
            ) : data?.recentProjects?.length === 0 ? (
              <div className="py-12 text-center text-sm font-medium text-clay-muted">
                还没有项目，点击上方「新建项目」开始
              </div>
            ) : (
              <div className="space-y-3">
                {data?.recentProjects?.map(
                  (p: { id: string; name: string; status: string; variantCount: number; createdAt: string }) => (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-clay clay-gradient-blue px-5 py-4 clay-shadow-sm hover:clay-shadow hover:-translate-y-0.5 clay-transition"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-clay-text">{p.name}</span>
                        <Badge variant={STATUS_MAP[p.status]?.variant || 'default'}>
                          {STATUS_MAP[p.status]?.label || p.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-semibold text-clay-text/50">{p.variantCount}</span>
                        <span className="text-sm font-medium text-clay-text/40">
                          {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        <ArrowRight size={16} className="text-clay-blue-200" />
                      </div>
                    </div>
                  )
                )}
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
      </div>
    </ProtectedRoute>
  );
}
