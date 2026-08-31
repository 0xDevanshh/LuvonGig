'use client'
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function ProjectTabs({ activeTab, onTabChange, className }: ProjectTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'team', label: 'Team' },
    { id: 'progress', label: 'Progress' },
    { id: 'files', label: 'Files' },
    { id: 'comments', label: 'Comments' }
  ];

  return (
    <div className={cn('border-b border-gray-200', className)}>
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}