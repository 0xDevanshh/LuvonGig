'use client'
import React from 'react'
import { Header1 } from '@/components/Header1'
import { Sidebar } from '@/components/Sidebar'
import ProfileStatus from '@/components/ProfileStatus'
import Link from 'next/link';
import { BarChart2, Check, Clock, Plus } from 'lucide-react'
export default function DashboardHome() {
  const metrics = [
    {
      title: 'Total Earnings',
      value: '$17,500.90',
      subtitle: 'USD EQUIVALENT',
      icon: '$',
    },
    {
      title: 'Active Projects',
      value: '5',
      subtitle: 'IN PROGRESS',
      icon: '📄',
    },
    {
      title: 'Completed',
      value: '98.5%',
      subtitle: 'PROJECTS FINISHED',
      icon: '✓',
    },
    {
      title: 'Success Rate',
      value: '100%',
      subtitle: 'CLIENT SATISFACTION',
      icon: '📈',
    },
  ]
  const recentProjects = [
    {
      id: 1,
      title: 'Payment for DeFi Dashboard project',
      amount: '+1250 ICP',
      status: 'Completed',
      from: 'client@example.com',
      date: 'Jan 15, 2024 16:00',
    },
    {
      id: 2,
      title: 'Payment for DeFi Dashboard project',
      amount: '+455 ICP',
      status: 'Completed',
      from: 'client@example.com',
      date: 'Jan 15, 2024 16:00',
    },
    {
      id: 3,
      title: 'Payment for DeFi Dashboard project',
      amount: '+1335 ICP',
      status: 'Completed',
      from: 'client@example.com',
      date: 'Jan 15, 2024 16:00',
    },
    {
      id: 4,
      title: 'Payment for DeFi Dashboard project',
      amount: '+1250 ICP',
      status: 'Completed',
      from: 'client@example.com',
      date: 'Jan 15, 2024 16:00',
    },
  ]
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header1 showSearch={false} />
        <main className="flex-1 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Browse Projects</h1>
              <p className="text-gray-600">
                Join Exciting Hackathons and win prizes
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                Available
              </div>
              <Link href="/freelancer/add-service">
                <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg">
                  <Plus size={16} />
                  <span>New Service</span>
                </button>
              </Link>
            </div>
          </div>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm"
              >
                <div className="mb-2">
                  <div className="text-sm text-gray-500">{metric.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 1V23"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="3"
                        y1="9"
                        x2="21"
                        y2="9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="9"
                        y1="21"
                        x2="9"
                        y2="9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {index === 2 && <Clock size={20} />}
                  {index === 3 && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 20V10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M18 20V4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 20V16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <h3 className="text-xl font-bold">{metric.value}</h3>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {metric.subtitle}
                </div>
              </div>
            ))}
          </div>

          {/* Profile Status Section */}
          <div className="mb-8">
            <ProfileStatus />
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
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex"
                  >
                    <div className="mr-4 bg-green-500 rounded-lg w-12 h-12 flex items-center justify-center text-white">
                      <Check size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{project.title}</h3>
                      <div className="text-xs text-gray-500">
                        From: {project.from}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-green-500">
                        <span>{project.amount}</span>
                        <div className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                          {project.status}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.date}
                      </div>
                    </div>
                  </div>
                ))}
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
                  <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Hire Talent</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
