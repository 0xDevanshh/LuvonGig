'use client'
import React from 'react';
interface JobPostingTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
export function JobPostingTabs({
  activeTab,
  setActiveTab
}: JobPostingTabsProps) {
  const tabs = [{
    id: 'overview',
    label: 'Overview',
    icon: '🔍'
  }, {
    id: 'jobdetails',
    label: 'Job Details',
    icon: '📄'
  }, {
    id: 'contract',
    label: 'Contract & Locations',
    icon: '📝'
  }, {
    id: 'budget',
    label: 'Budget',
    icon: '💰'
  }, {
    id: 'application',
    label: 'Application',
    icon: '📋'
  }];
  return <div className="border-b border-gray-200 overflow-x-auto">
      <div className="flex min-w-max">
        {tabs.map(tab => <button key={tab.id} className={`flex items-center py-3 px-4 relative ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-500'}`} onClick={() => setActiveTab(tab.id)}>
            <span className="mr-2">{tab.icon}</span>
            <span>{tab.label}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400"></div>}
          </button>)}
      </div>
    </div>;
}