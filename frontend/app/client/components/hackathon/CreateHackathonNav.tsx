import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CreateHackathonNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const CreateHackathonNav: React.FC<CreateHackathonNavProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'prizes', label: 'Prizes', icon: '🏆' },
    { id: 'judges', label: 'Judges', icon: '👥' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
  ];

  return (
    <nav className="w-64 bg-white border-r border-gray-200">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Link href="/client" className="flex items-center text-gray-600 hover:text-gray-800">
            <span className="mr-2">←</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Hackathon</h2>

        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <span className="mr-3">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Tips</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Complete all sections for better visibility</li>
            <li>• Add clear criteria for prizes</li>
            <li>• Set a realistic timeline</li>
            <li>• Choose experienced judges</li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default CreateHackathonNav;