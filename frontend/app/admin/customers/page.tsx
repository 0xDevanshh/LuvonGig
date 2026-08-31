'use client'
import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Trash2 } from 'lucide-react';
export default function CustomersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  // Mock data for customers
  const customers = Array(7).fill(null).map((_, index) => ({
    id: (index + 1).toString(),
    name: 'Hourglass',
    avatar: 'https://ui-avatars.com/api/?name=H&background=007AFF&color=fff',
    type: 'Customers',
    userId: '46332',
    subscriptionType: index % 2 === 0 ? 'Enterprise' : '-',
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
    setSearchQuery(query);
    // In a real app, you would filter data based on the query
    console.log('Searching for:', query);
  };
  const handleDelete = (id: string | number) => {
    console.log('Delete customer with id:', id);
    // In a real app, you would make an API call to delete the customer
  };
  return <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Customers Management" onSearch={handleSearch} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Browse Customers</h2>
          </div>
          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <DataTable columns={columns} data={customers} onDelete={handleDelete} />
          </div>
        </main>
      </div>
    </div>;
}