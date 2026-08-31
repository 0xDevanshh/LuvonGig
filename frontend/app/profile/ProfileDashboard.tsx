"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Clock } from 'lucide-react';
export function ProfileDashboard() {
  const navigate = useRouter();
  const handleNavigateToAnalytics = () => {
    navigate.push('/analytics');
  };
  const handleNavigateToHireTalent = () => {
    navigate.push('/hire-talent');
  };
  return <div className="flex min-h-screen bg-white">
    {/* Sidebar */}
    <div className="w-64 border-r border-gray-200 hidden md:block">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z" fill="#FF3B30" />
            <path d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z" fill="#34C759" />
            <path d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z" fill="#007AFF" />
          </svg>
          <span className="ml-2 font-bold text-xl text-[#161616]">
            Workbudd
          </span>
        </div>
      </div>
      <nav className="p-2">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex items-center gap-3 mb-2">
          <div className="bg-white p-1 rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-medium">Dashboard</span>
        </div>
        {[{
          icon: 'user',
          label: 'Workers',
          onClick: handleNavigateToHireTalent
        }, {
          icon: 'folder',
          label: 'Browse Projects'
        }, {
          icon: 'gift',
          label: 'Bounties'
        }, {
          icon: 'briefcase',
          label: 'My Projects'
        }, {
          icon: 'mail',
          label: 'Messages'
        }, {
          icon: 'code',
          label: 'Hackathons'
        }, {
          icon: 'dollar-sign',
          label: 'Pay & Loans'
        }, {
          icon: 'bar-chart-2',
          label: 'Analytics',
          onClick: handleNavigateToAnalytics
        }, {
          icon: 'refresh-cw',
          label: 'Workbudd Swap'
        }, {
          icon: 'coffee',
          label: 'Caffeine AI'
        }, {
          icon: 'credit-card',
          label: 'Crypto Card'
        }].map((item, index) => <div key={index} className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={item.onClick}>
          <div className="w-5 h-5 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {item.icon === 'user' && <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'user' && <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'folder' && <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'gift' && <path d="M20 12V22H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'gift' && <path d="M22 7H2V12H22V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'gift' && <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'gift' && <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'gift' && <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'briefcase' && <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'briefcase' && <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'mail' && <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'mail' && <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'code' && <path d="M16 18L22 12L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'code' && <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'dollar-sign' && <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'dollar-sign' && <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'bar-chart-2' && <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'bar-chart-2' && <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'bar-chart-2' && <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'refresh-cw' && <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'refresh-cw' && <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'refresh-cw' && <path d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26543 8.52547 3.55976 10.0083 3.22426C11.4911 2.88875 13.0348 2.93434 14.4952 3.35677C15.9556 3.77921 17.2853 4.56471 18.36 5.64L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'coffee' && <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'coffee' && <path d="M2 8H18V17C18 18.0609 17.5786 19.0783 16.8284 19.8284C16.0783 20.5786 15.0609 21 14 21H6C4.93913 21 3.92172 20.5786 3.17157 19.8284C2.42143 19.0783 2 18.0609 2 17V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'coffee' && <path d="M6 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'coffee' && <path d="M10 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'coffee' && <path d="M14 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'credit-card' && <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              {item.icon === 'credit-card' && <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </div>
          <span className="text-gray-700">{item.label}</span>
        </div>)}
      </nav>
    </div>
    {/* Main Content */}
    <div className="flex-1 overflow-auto">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="block md:hidden">
          <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z" fill="#FF3B30" />
            <path d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z" fill="#34C759" />
            <path d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z" fill="#007AFF" />
          </svg>
        </div>
        <div className="flex items-center ml-auto">
          <div className="relative mr-4">
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                1
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Client</span>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop" alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              <div className="hidden md:block">
                <span>Darshana</span>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="p-6">
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">Browse Projects</h1>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                Available
              </div>
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg">
                <Plus size={16} />
                New Project
              </button>
            </div>
          </div>
          <p className="text-gray-600">
            Join Exciting Hackathons and win prizes
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">Total Earnings</div>
              <div className="text-xs text-green-500 flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                +12.5%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="text-xl font-bold">$17,500.90</h3>
            </div>
            <div className="text-xs text-gray-500 mt-1">USD EQUIVALENT</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">Active Projects</div>
              <div className="text-xs text-green-500 flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                +12.5%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="text-xl font-bold">5</h3>
            </div>
            <div className="text-xs text-gray-500 mt-1">IN PROGRESS</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-xs text-green-500 flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                +12.5%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <h3 className="text-xl font-bold">98.5%</h3>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              PROJECTS FINISHED
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-xs text-green-500 flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                +12.5%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="text-xl font-bold">100%</h3>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              CLIENT SATISFACTION
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Projects</h2>
              <button className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                Browse All
              </button>
            </div>
            <div className="space-y-4">
              {[1250, 455, 1335, 1250].map((amount, index) => <div key={index} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex">
                <div className="mr-4 bg-green-500 rounded-lg w-12 h-12 flex items-center justify-center text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">
                    Payment for DeFi Dashboard project
                  </h3>
                  <div className="text-xs text-gray-500">
                    From: client@example.com
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-green-500">
                    <span>+{amount} ICP</span>
                    <div className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                      Completed
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Jan 15, 2024 16:00
                  </div>
                </div>
              </div>)}
            </div>
          </div>
          <div>
            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-xl font-bold mb-4">Performance</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium">ICP Development</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timeline</span>
                  <span className="font-medium">3-4 weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Level</span>
                  <span className="font-medium text-green-500">
                    $75K - $100K
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proposals</span>
                  <span className="font-medium">5</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-6">
                <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Plus size={18} />
                  <span>Create New Proposal</span>
                </button>
                <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Clock size={18} />
                  <span>View Active Projects</span>
                </button>
                <button onClick={handleNavigateToHireTalent} className="w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Hire Talent</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>;
}