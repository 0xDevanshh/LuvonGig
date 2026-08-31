'use client'
import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { StatsCard } from '@/components/admin/StatsCard';
import { DollarSign, TrendingUp, Users, Clock } from 'lucide-react';
export default function SubscriptionsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  // Mock data for stats
  const stats = [{
    title: 'Total Revenue',
    value: '$17,500.90',
    icon: <DollarSign size={24} />,
    trend: 'up',
    trendValue: '+12.5%'
  }, {
    title: 'Active Subscriptions',
    value: '3,245',
    icon: <TrendingUp size={24} />,
    trend: 'up',
    trendValue: '+8.2%'
  }, {
    title: 'Premium Users',
    value: '1,876',
    icon: <Users size={24} />,
    trend: 'up',
    trendValue: '+5.1%'
  }, {
    title: 'Avg. Subscription Length',
    value: '8.3 months',
    icon: <Clock size={24} />,
    trend: 'up',
    trendValue: '+2.4%'
  }];
  // Mock data for subscriptions
  const subscriptions = [{
    id: '1',
    user: {
      name: 'Lana Steiner',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      type: 'Freelancer'
    },
    plan: 'Premium+',
    status: 'Active',
    startDate: '12/05/2023',
    nextBilling: '12/06/2024',
    amount: '$99.99'
  }, {
    id: '2',
    user: {
      name: 'Hourglass',
      avatar: 'https://ui-avatars.com/api/?name=H&background=007AFF&color=fff',
      type: 'Enterprise'
    },
    plan: 'Enterprise',
    status: 'Active',
    startDate: '08/12/2023',
    nextBilling: '08/12/2024',
    amount: '$499.99'
  }, {
    id: '3',
    user: {
      name: 'David Wilson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      type: 'Freelancer'
    },
    plan: 'Basic',
    status: 'Active',
    startDate: '03/18/2024',
    nextBilling: '04/18/2024',
    amount: '$19.99'
  }, {
    id: '4',
    user: {
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      type: 'Freelancer'
    },
    plan: 'Premium',
    status: 'Canceled',
    startDate: '01/05/2024',
    nextBilling: '02/05/2024',
    amount: '$49.99'
  }, {
    id: '5',
    user: {
      name: 'TechCorp',
      avatar: 'https://ui-avatars.com/api/?name=TC&background=FF3B30&color=fff',
      type: 'Enterprise'
    },
    plan: 'Enterprise',
    status: 'Active',
    startDate: '11/20/2023',
    nextBilling: '11/20/2024',
    amount: '$499.99'
  }];
  // Table columns configuration
  const columns = [{
    key: 'user',
    header: 'User',
    render: (user: any) => <div className="flex items-center">
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-gray-500 text-sm">{user.type}</div>
          </div>
        </div>
  }, {
    key: 'plan',
    header: 'Plan'
  }, {
    key: 'status',
    header: 'Status',
    render: (value: string) => <span className={`px-2 py-1 text-xs rounded-full ${value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value}
        </span>
  }, {
    key: 'startDate',
    header: 'Start Date'
  }, {
    key: 'nextBilling',
    header: 'Next Billing'
  }, {
    key: 'amount',
    header: 'Amount',
    render: (value: string) => <span className="font-medium">{value}</span>
  }, {
    key: 'actions',
    header: 'Actions',
    render: (value: any, item: any) => <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100">
            Edit
          </button>
          {item.status === 'Active' && <button className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-full hover:bg-red-100">
              Cancel
            </button>}
        </div>
  }];
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real app, you would filter data based on the query
    console.log('Searching for:', query);
  };
  return <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Subscriptions Management" onSearch={handleSearch} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-6">Subscription Overview</h2>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} trendValue={stat.trendValue} />)}
            </div>
          </div>
          {/* Subscription Plans */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Basic</h4>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Popular
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$19.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>10 project submissions</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Basic profile customization</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Email support</span>
                  </li>
                </ul>
                <button className="w-full py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700">
                  Edit Plan
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs transform translate-x-2 -translate-y-2 rotate-45">
                  Best Value
                </div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Premium</h4>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Recommended
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$49.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Unlimited project submissions</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Advanced profile customization</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Featured in search results</span>
                  </li>
                </ul>
                <button className="w-full py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                  Edit Plan
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Enterprise</h4>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    Business
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">$499.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>All Premium features</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>SLA guarantees</span>
                  </li>
                </ul>
                <button className="w-full py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700">
                  Edit Plan
                </button>
              </div>
            </div>
          </div>
          {/* Subscriptions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Active Subscriptions</h3>
            </div>
            <DataTable columns={columns} data={subscriptions} />
          </div>
        </main>
      </div>
    </div>;
}