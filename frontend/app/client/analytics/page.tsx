'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  BarChart2,
  PieChart,
  ChevronRight,
} from 'lucide-react'
export default function AnalyticsDashboard() {
  const router = useRouter()
  const [activeTimeframe, setActiveTimeframe] = useState<
    '7days' | '30days' | '90days'
  >('7days')
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 hidden md:block">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <svg
              width="40"
              height="32"
              viewBox="0 0 40 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z"
                fill="#FF3B30"
              />
              <path
                d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z"
                fill="#34C759"
              />
              <path
                d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z"
                fill="#007AFF"
              />
            </svg>
            <span className="ml-2 font-bold text-xl text-[#161616]">
              Workbudd
            </span>
          </div>
        </div>
        <nav className="p-2">
          <div className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="w-5 h-5 flex items-center justify-center">
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
                  width="7"
                  height="7"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="14"
                  y="3"
                  width="7"
                  height="7"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="14"
                  y="14"
                  width="7"
                  height="7"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="3"
                  y="14"
                  width="7"
                  height="7"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-gray-700">Dashboard</span>
          </div>
          <div className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg
                width="20"
                height="20"
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
            </div>
            <span className="text-gray-700">Workers</span>
          </div>
          <div className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-gray-700">Browse Projects</span>
          </div>
          <div className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-gray-700">My Projects</span>
          </div>
          <div className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 6L12 13L2 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-gray-700">Messages</span>
          </div>
          <div className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="w-5 h-5 flex items-center justify-center">
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
            </div>
            <span className="text-gray-700">Payments</span>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex items-center gap-3 mb-2">
            <div className="bg-white p-1 rounded">
              <BarChart2 size={20} className="text-purple-500" />
            </div>
            <span className="font-medium text-purple-700">Analytics</span>
          </div>
        </nav>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="block md:hidden">
            <svg
              width="40"
              height="32"
              viewBox="0 0 40 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z"
                fill="#FF3B30"
              />
              <path
                d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z"
                fill="#34C759"
              />
              <path
                d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z"
                fill="#007AFF"
              />
            </svg>
          </div>
          <div className="flex items-center ml-auto">
            <div className="relative mr-4">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  1
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12H22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Client</span>
                  <ChevronDown size={16} />
                </div>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop"
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="hidden md:block">
                  <span>John Doe</span>
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Manage your projects and proposals</p>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveTimeframe('7days')}
                className={`px-4 py-2 text-sm rounded-full ${activeTimeframe === '7days' ? 'bg-orange-500 text-white' : 'text-gray-600'}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setActiveTimeframe('30days')}
                className={`px-4 py-2 text-sm rounded-full ${activeTimeframe === '30days' ? 'bg-orange-500 text-white' : 'text-gray-600'}`}
              >
                30 Days
              </button>
              <button
                onClick={() => setActiveTimeframe('90days')}
                className={`px-4 py-2 text-sm rounded-full ${activeTimeframe === '90days' ? 'bg-orange-500 text-white' : 'text-gray-600'}`}
              >
                90 Days
              </button>
            </div>
          </div>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-500">Total Earnings</div>
                <div className="text-xs text-green-500 flex items-center">
                  <TrendingUp size={14} className="mr-1" />
                  +12.5%
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
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
                <h3 className="text-xl font-bold">$17,500.90</h3>
              </div>
              <div className="text-xs text-gray-500">USD EQUIVALENT</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-500">Completed</div>
                <div className="text-xs text-green-500 flex items-center">
                  <TrendingUp size={14} className="mr-1" />
                  +12.5%
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={20} className="text-gray-700" />
                <h3 className="text-xl font-bold">98.5%</h3>
              </div>
              <div className="text-xs text-gray-500">PROJECTS FINISHED</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-500">Client Rating</div>
                <div className="text-xs text-green-500 flex items-center">
                  <TrendingUp size={14} className="mr-1" />
                  +12.5%
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-xl font-bold">5</h3>
              </div>
              <div className="text-xs text-gray-500">IN PROGRESS</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <div className="text-sm text-gray-500">Profile Views</div>
                <div className="text-xs text-green-500 flex items-center">
                  <TrendingUp size={14} className="mr-1" />
                  +12.5%
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-xl font-bold">100%</h3>
              </div>
              <div className="text-xs text-gray-500">CLIENT SATISFACTION</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Earnings Chart */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Earning Overview</h2>
              <div className="h-64 relative">
                {/* Simplified chart visualization */}
                <div className="absolute inset-0 flex items-end">
                  <div className="w-1/6 bg-pink-100 h-1/5 rounded-t-md relative">
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-pink-200 to-transparent rounded-t-md"></div>
                  </div>
                  <div className="w-1/6 bg-pink-100 h-1/3 rounded-t-md relative">
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-pink-200 to-transparent rounded-t-md"></div>
                  </div>
                  <div className="w-1/6 bg-pink-100 h-3/5 rounded-t-md relative">
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-pink-200 to-transparent rounded-t-md"></div>
                  </div>
                  <div className="w-1/6 bg-pink-100 h-2/5 rounded-t-md relative">
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-pink-200 to-transparent rounded-t-md"></div>
                  </div>
                  <div className="w-1/6 bg-pink-100 h-1/2 rounded-t-md relative">
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-pink-200 to-transparent rounded-t-md"></div>
                  </div>
                  <div className="w-1/6 bg-pink-100 h-4/5 rounded-t-md relative">
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-pink-200 to-transparent rounded-t-md"></div>
                    <div className="absolute -top-2 left-1/2 w-3 h-3 bg-pink-500 rounded-full transform -translate-x-1/2"></div>
                    <div className="absolute -top-2 left-1/2 w-6 h-6 bg-pink-500 rounded-full transform -translate-x-1/2 opacity-20 animate-ping"></div>
                  </div>
                </div>
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 pt-2">
                  <div>Jan</div>
                  <div>Feb</div>
                  <div>Mar</div>
                  <div>Apr</div>
                  <div>May</div>
                  <div>Jun</div>
                </div>
                {/* Y-axis labels */}
                <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
                  <div>5000</div>
                  <div>4000</div>
                  <div>3000</div>
                  <div>2000</div>
                  <div>1000</div>
                  <div>0</div>
                </div>
              </div>
            </div>
            {/* Project Categories */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Project Categories</h2>
              <div className="h-64 flex flex-col justify-between space-y-4 pt-4">
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-500">S</div>
                  <div
                    className="flex-1 h-6 bg-blue-100 rounded-sm"
                    style={{
                      width: '60%',
                    }}
                  ></div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-500">M</div>
                  <div
                    className="flex-1 h-6 bg-blue-100 rounded-sm"
                    style={{
                      width: '40%',
                    }}
                  ></div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-500">T</div>
                  <div
                    className="flex-1 h-6 bg-blue-100 rounded-sm"
                    style={{
                      width: '80%',
                    }}
                  ></div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-500">W</div>
                  <div
                    className="flex-1 h-6 bg-blue-500 rounded-sm"
                    style={{
                      width: '95%',
                    }}
                  ></div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-500">T</div>
                  <div
                    className="flex-1 h-6 bg-blue-100 rounded-sm"
                    style={{
                      width: '75%',
                    }}
                  ></div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-sm text-gray-500">F</div>
                  <div
                    className="flex-1 h-6 bg-blue-100 rounded-sm"
                    style={{
                      width: '25%',
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-2">
                  <div>Jan</div>
                  <div>Feb</div>
                  <div>Mar</div>
                  <div>Apr</div>
                  <div>May</div>
                  <div>Jun</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills Distribution */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                Skills Distribution
              </h2>
              <div className="h-64 relative flex items-center justify-center">
                {/* Simplified pie chart */}
                <div className="w-48 h-48 rounded-full border-[16px] border-purple-500 relative">
                  <div className="absolute top-0 right-0 bottom-0 left-0 border-[16px] border-transparent border-t-orange-400 border-r-orange-400 rounded-full transform -rotate-45"></div>
                  <div className="absolute top-0 right-0 bottom-0 left-0 border-[16px] border-transparent border-b-blue-400 border-l-blue-400 rounded-full transform rotate-45"></div>
                  <div className="absolute top-0 right-0 bottom-0 left-0 border-[16px] border-transparent border-b-red-400 rounded-full transform rotate-[200deg]"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-400 mr-2"></div>
                  <span className="text-sm">ICP Development</span>
                  <span className="ml-auto font-medium">35%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 mr-2"></div>
                  <span className="text-sm">React</span>
                  <span className="ml-auto font-medium">25%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-400 mr-2"></div>
                  <span className="text-sm">UI/UX Design</span>
                  <span className="ml-auto font-medium">15%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-400 mr-2"></div>
                  <span className="text-sm">Other</span>
                  <span className="ml-auto font-medium">5%</span>
                </div>
              </div>
            </div>
            {/* Performance Insights */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                Performance Insights
              </h2>
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="text-blue-700 font-medium">
                    Strong Performance
                  </h3>
                  <p className="text-sm mt-1">
                    Your earnings increased by 23% this month. You're in the top
                    10% of freelancers on the platform!
                  </p>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                  <h3 className="text-orange-700 font-medium">
                    Optimization Tip
                  </h3>
                  <p className="text-sm mt-1">
                    Consider increasing your rates for ICP development projects.
                    Market data shows 15% higher rates for similar skills.
                  </p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                  <h3 className="text-purple-700 font-medium">
                    Client Feedback
                  </h3>
                  <p className="text-sm mt-1">
                    Your client satisfaction score is exceptional at 4.9/5. Keep
                    up the excellent work!
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/client/dashboard')}
              className="inline-flex items-center text-purple-600 font-medium"
            >
              Back to Dashboard
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
