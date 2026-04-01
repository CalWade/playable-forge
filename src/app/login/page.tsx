'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LabeledInput as Input } from '@/components/ui/labeled-input';
import { Sparkles } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center clay-bg px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-clay-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-clay-accent/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-clay-info/8 blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-clay-bounce-in">
        {/* Logo / header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-clay-xl bg-clay-primary shadow-clay-effect-lg mb-4 animate-clay-float">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-clay-text">PlayableForge</h1>
          <p className="mt-1.5 text-sm text-clay-text-muted">
            {isRegister ? '创建你的账号' : '欢迎回来'}
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-clay-2xl bg-clay-surface shadow-clay-effect-lg p-7 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <div className="rounded-clay-md bg-clay-danger-lt border-2 border-clay-danger/30 px-3.5 py-2.5">
                <p className="text-sm font-medium text-clay-danger-dk">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin-soft" />
                  处理中...
                </span>
              ) : (
                isRegister ? '注册账号' : '登录'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-clay-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-clay-surface px-3 text-xs text-clay-text-faint">或者</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="w-full rounded-clay-xl py-2.5 text-sm font-semibold text-clay-primary bg-clay-primary-lt/60 hover:bg-clay-primary-lt transition-colors duration-150"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
