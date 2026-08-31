'use client'
import React from 'react';
import { cn } from '@/lib/utils';

interface CreateHackathonNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  className?: string;
}

export function CreateHackathonNav({
  activeTab,
  setActiveTab,
  className
}: CreateHackathonNavProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'prizes', label: 'Prizes' },
    { id: 'judges', label: 'Judges' },
    { id: 'schedule', label: 'Schedule' }
  ];

  return (
    <div className={cn('w-64 bg-white border-r border-gray-200 p-4', className)}>
      <nav className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg transition-colors',
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}