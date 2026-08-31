'use client'    
import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { DataTable } from '@/components/admin/DataTable';
import Link from 'next/link';
import { Banknote, Users, Building2, UserSquare, CheckCircle2, Trash2 } from 'lucide-react';
export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  // Mock data for stats
  const stats = [{
    title: 'Total Revenue',
    value: '$17,500.90',
    icon: <Banknote size={24} />,
    trend: 'up',
    trendValue: '+12.5%'
  }, {
    title: 'Active Freelancers',
    value: '5000',
    icon: <Users size={24} />,
    trend: 'up',
    trendValue: '+12.5%'
  }, {
    title: 'Customers',
    value: '5022',
    icon: <UserSquare size={24} />,
    trend: 'up',
    trendValue: '+12.5%'
  }, {
    title: 'Enterprise Customers',
    value: '233',
    icon: <Building2 size={24} />,
    trend: 'up',
    trendValue: '+12.5%'
  }];
  // Mock data for recent payments
  const recentPayment = {
    id: '1',
    from: 'DeFi Ola',
    userId: 'user.id.223',
    amount: '+1250 ICP',
    status: 'Completed',
    date: 'Jun 15, 2024 15:00'
  };
  // Mock data for recent users
  const recentUsers = [{
    id: '1',
    name: 'Hourglass',
    avatar: 'https://ui-avatars.com/api/?name=H&background=007AFF&color=fff',
    type: 'Enterprise',
    userId: '46332',
    subscriptionType: 'Enterprise',
    joinedAt: '30 min ago'
  }, {
    id: '2',
    name: 'Lana Steiner',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    type: 'Freelancers',
    userId: '46332',
    subscriptionType: '-',
    joinedAt: '30 min ago'
  }, {
    id: '3',
    name: 'Hourglass',
    avatar: 'https://ui-avatars.com/api/?name=H&background=007AFF&color=fff',
    type: 'Enterprise',
    userId: '46332',
    subscriptionType: 'Enterprise',
    joinedAt: '30 min ago'
  }, {
    id: '4',
    name: 'Lana Steiner',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    type: 'Freelancers',
    userId: '46332',
    subscriptionType: '-',
    joinedAt: '30 min ago'
  }, {
    id: '5',
    name: 'Hourglass',
    avatar: 'https://ui-avatars.com/api/?name=H&background=007AFF&color=fff',
    type: 'Enterprise',
    userId: '46332',
    subscriptionType: 'Enterprise',
    joinedAt: '30 min ago'
  }];
  // Table columns configuration
  const userColumns = [{
    key: 'name',
    header: 'Name',
    render: (value: string, item: any) => <div className="flex items-center">
          <img src={item.avatar} alt={value} className="w-10 h-10 rounded-full mr-3" />
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-gray-500 text-sm">Joined {item.joinedAt}</div>
          </div>
        </div>
  }, {
    key: 'type',
    header: 'Type'
  }, {
    key: 'userId',
    header: 'User_id'
  }, {
    key: 'subscriptionType',
    header: 'Subscription Type'
  }, {
    key: 'actions',
    header: 'Actions',
    render: () => <button className="p-1 bg-red-50 rounded-full">
          <Trash2 size={18} className="text-red-500" />
        </button>
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
        <AdminHeader title="Admin Dashboard" onSearch={handleSearch} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Browse Projects</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Available
                </span>
                <Link href="/freelancer/add-service">
                <button className="flex items-center gap-2 bg-rainbow-gradient text-white px-4 py-2 rounded-lg">
                    <span className="text-lg">+</span>
                    <span>New Project</span>
                  </button>
                </Link>
              </div>
            </div>
            <p className="text-gray-500 mb-6">
              Join Exciting Hackathons and win prizes
            </p>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} trend={stat.trend} trendValue={stat.trendValue} />)}
            </div>
          </div>
          {/* Recent Payment Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Payments</h3>
              <button className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                Browse All
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="text-green-500" size={24} />
                </div>
                <div>
                  <h4 className="font-medium">
                    Payment from {recentPayment.from}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {recentPayment.userId}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  {recentPayment.amount}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {recentPayment.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {recentPayment.date}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Recent Users Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Users</h3>
              <button className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                Browse All
              </button>
            </div>
            <DataTable columns={userColumns} data={recentUsers} onDelete={id => console.log('Delete user with id:', id as any)} />
          </div>
        </main>
      </div>
    </div>;
}