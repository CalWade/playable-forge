'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: { id: string; label: string }[];
  defaultTab?: string;
  children: (activeTab: string) => ReactNode;
  className?: string;
}

export function Tabs({ tabs, defaultTab, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1">{children(activeTab)}</div>
    </div>
  );
}
