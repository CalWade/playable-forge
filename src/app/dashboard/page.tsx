'use client';

import { ProtectedRoute } from '@/components/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold">PlayableForge</h1>
        <p className="mt-2 text-gray-500">Dashboard placeholder — Task 14 will build this out.</p>
      </div>
    </ProtectedRoute>
  );
}
