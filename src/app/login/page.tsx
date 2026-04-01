'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LabeledInput as Input } from '@/components/ui/labeled-input';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password, displayName || undefined);
      } else {
        await login(username, password);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #cae9ff 0%, #a2d2ff 50%, #cae9ff 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-clay-text">PlayableForge</h1>
          <p className="mt-2 text-sm font-medium text-clay-text/60">
            {isRegister ? '创建账号' : '欢迎回来'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-clay-xl clay-gradient-surface clay-shadow p-8">
          <Input
            id="username"
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            required
          />

          {isRegister && (
            <Input
              id="displayName"
              label="显示名称（可选）"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="你希望展示的名字"
            />
          )}

          <Input
            id="password"
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
          />

          {error && <p className="text-sm font-medium text-red-400">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </Button>

          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="w-full text-center text-sm font-semibold text-clay-blue-400 hover:text-clay-blue-300 clay-transition"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </form>
      </div>
    </div>
  );
}
