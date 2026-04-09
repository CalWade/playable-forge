'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface SimpleTabsProps {
  tabs: { id: string; label: string }[];
  defaultTab?: string;
  children: (activeTab: string) => ReactNode;
  className?: string;
}

export function SimpleTabs({ tabs, defaultTab, children, className }: SimpleTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex gap-1 p-2 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-bold rounded-clay-sm clay-transition',
              activeTab === tab.id
                ? 'clay-gradient-primary text-white clay-shadow-sm'
                : 'text-clay-text hover:bg-clay-blue-50/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 flex flex-col">{children(activeTab)}</div>
    </div>
  );
}
