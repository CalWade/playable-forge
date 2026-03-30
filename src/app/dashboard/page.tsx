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
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const { project } = await res.json();
      router.push(`/projects/${project.id}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">PlayableForge</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{user?.displayName || user?.username}</span>
              <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">
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
            ].map((stat) => (
              <Card key={stat.label} className="flex-1 px-5 py-4">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : data?.recentProjects?.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                还没有项目，点击上方「新建项目」开始
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data?.recentProjects?.map(
                  (p: {
                    id: string;
                    name: string;
                    status: string;
                    variantCount: number;
                    createdAt: string;
                  }) => (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">{p.name}</span>
                        <Badge variant={STATUS_MAP[p.status]?.variant || 'default'}>
                          {STATUS_MAP[p.status]?.label || p.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-500">{p.variantCount}</span>
                        <span className="text-sm text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        <ArrowRight size={16} className="text-gray-300" />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
