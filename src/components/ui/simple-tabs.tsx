'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface SimpleTabsProps {
  tabs: { id: string; label: string }[];
  defaultTab?: string;
  children: (activeTab: string) => ReactNode;
  className?: string;
}

/**
 * Clay Tabs — pill-style active tab pops out like a raised clay button.
 */
export function SimpleTabs({ tabs, defaultTab, children, className }: SimpleTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tab bar — tray with floating pill indicator */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
        <div className="flex gap-1 p-1 rounded-clay-xl bg-clay-neutral-100 shadow-clay-input">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-1.5 text-sm font-semibold rounded-clay-lg transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-clay-surface text-clay-primary shadow-clay-effect-sm'
                  : 'text-clay-text-muted hover:text-clay-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">{children(activeTab)}</div>
    </div>
  );
}
