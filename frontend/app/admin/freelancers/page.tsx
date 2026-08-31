'use client'
import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Trash2 } from 'lucide-react';
export default function FreelancersManagement() {
  // Mock data for freelancers
  const freelancers = Array(11).fill(null).map((_, index) => ({
    id: (index + 1).toString(),
    name: 'Lana Steiner',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    type: 'Freelancers',
    userId: '46332',
    subscriptionType: index % 3 === 0 ? 'Premium +' : '-',
    joinedAt: '30 min ago'
  }));
  // Table columns configuration
  const columns = [{
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
    // In a real app, you would filter data based on the query
    console.log('Searching for:', query);
  };
  const handleDelete = (id: string | number) => {
    // In a real app, you would make an API call to delete the freelancer
  };
  return <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Freelancers Management" onSearch={handleSearch} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Browse freelancers</h2>
          </div>
          {/* Freelancers Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <DataTable columns={columns} data={freelancers} onDelete={handleDelete as any} />
          </div>
        </main>
      </div>
    </div>

}