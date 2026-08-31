'use client'
import React, { useState, useCallback, useMemo } from 'react';
import { Header1 } from '@/components/Header1';
import { Sidebar } from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  Check,
  Download,
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Shield,
  CreditCard,
  Bell,
  Lock,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

// TypeScript Interfaces
interface Transaction {
  id: number;
  title: string;
  amount: string;
  status: 'Completed' | 'Pending' | 'Failed';
  from: string;
  to?: string;
  date: string;
  type: 'incoming' | 'outgoing';
  category: 'payment' | 'refund' | 'fee' | 'bonus';
  description?: string;
  transactionHash?: string;
}

interface EscrowItem {
  id: number;
  projectTitle: string;
  amount: string;
  client: string;
  freelancer: string;
  status: 'active' | 'disputed' | 'released' | 'cancelled';
  createdDate: string;
  releaseDate?: string;
  milestones: Milestone[];
  description: string;
}

interface Milestone {
  id: number;
  title: string;
  amount: string;
  status: 'pending' | 'completed' | 'approved';
  dueDate: string;
}

interface PaymentSettings {
  preferredCurrency: 'ICP' | 'ckBTC' | 'USD';
  autoWithdraw: boolean;
  withdrawThreshold: number;
  twoFactorAuth: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  withdrawalAddress: string;
  defaultPaymentMethod?: string;
  currency?: string;
  autoRelease?: boolean;
  sessionTimeout?: number;
}

interface FilterOptions {
  status: string;
  type: string;
  dateRange: string;
  category: string;
}
export default function PayAndLoans() {
  const [activeTab, setActiveTab] = useState('payments');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    category: 'all'
  });

  // Enhanced transactions data
  const allTransactions: Transaction[] = [
    {
      id: 1,
      title: 'Payment for DeFi Dashboard project',
      amount: '+1250 ICP',
      status: 'Completed',
      from: 'client@example.com',
      to: 'freelancer@example.com',
      date: 'Jan 15, 2024 16:00',
      type: 'incoming',
      category: 'payment',
      description: 'Final milestone payment for DeFi dashboard development',
      transactionHash: '0x1234...5678'
    },
    {
      id: 2,
      title: 'Platform Fee',
      amount: '-120 ICP',
      status: 'Completed',
      from: 'platform@icp.com',
      date: 'Jan 15, 2024 16:05',
      type: 'outgoing',
      category: 'fee',
      description: 'Platform service fee (4%)',
      transactionHash: '0x2345...6789'
    },
    {
      id: 3,
      title: 'Payment for Mobile App UI',
      amount: '+850 ICP',
      status: 'Pending',
      from: 'startup@example.com',
      date: 'Jan 16, 2024 10:30',
      type: 'incoming',
      category: 'payment',
      description: 'UI/UX design for mobile application'
    },
    {
      id: 4,
      title: 'Refund - Cancelled Project',
      amount: '+300 ICP',
      status: 'Completed',
      from: 'platform@icp.com',
      date: 'Jan 14, 2024 14:20',
      type: 'incoming',
      category: 'refund',
      description: 'Refund for cancelled blockchain project'
    },
    {
      id: 5,
      title: 'Bonus Payment',
      amount: '+100 ICP',
      status: 'Completed',
      from: 'client@tech.com',
      date: 'Jan 13, 2024 09:15',
      type: 'incoming',
      category: 'bonus',
      description: 'Performance bonus for early delivery'
    }
  ];

  // Escrow data
  const escrowItems: EscrowItem[] = [
    {
      id: 1,
      projectTitle: 'E-commerce Platform Development',
      amount: '2500 ICP',
      client: 'TechCorp Ltd.',
      freelancer: 'John Developer',
      status: 'active',
      createdDate: 'Jan 10, 2024',
      description: 'Full-stack e-commerce platform with payment integration',
      milestones: [
        {
          id: 1,
          title: 'Frontend Development',
          amount: '1000 ICP',
          status: 'completed',
          dueDate: 'Jan 20, 2024'
        },
        {
          id: 2,
          title: 'Backend API',
          amount: '1000 ICP',
          status: 'pending',
          dueDate: 'Jan 30, 2024'
        },
        {
          id: 3,
          title: 'Testing & Deployment',
          amount: '500 ICP',
          status: 'pending',
          dueDate: 'Feb 5, 2024'
        }
      ]
    },
    {
      id: 2,
      projectTitle: 'Smart Contract Audit',
      amount: '800 ICP',
      client: 'DeFi Startup',
      freelancer: 'Security Expert',
      status: 'disputed',
      createdDate: 'Jan 5, 2024',
      description: 'Security audit for DeFi smart contracts',
      milestones: [
        {
          id: 4,
          title: 'Initial Audit Report',
          amount: '800 ICP',
          status: 'completed',
          dueDate: 'Jan 15, 2024'
        }
      ]
    }
  ];

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    preferredCurrency: 'ICP',
    autoWithdraw: false,
    withdrawThreshold: 100,
    twoFactorAuth: true,
    emailNotifications: true,
    smsNotifications: false,
    withdrawalAddress: 'rrkah-fqaaa-aaaaa-aaaaq-cai'
  });

  // Callback functions
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((filterType: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  }, []);

  const handleEscrowAction = useCallback(async (escrowId: number, action: 'release' | 'dispute' | 'cancel') => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`${action} action for escrow ${escrowId}`);
    } catch (error) {
      console.error('Escrow action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSettingsUpdate = useCallback(async (newSettings: Partial<PaymentSettings>) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPaymentSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Settings update failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filtered and paginated data
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      const matchesSearch = transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.from.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || transaction.status.toLowerCase() === filters.status;
      const matchesType = filters.type === 'all' || transaction.type === filters.type;
      const matchesCategory = filters.category === 'all' || transaction.category === filters.category;

      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [allTransactions, searchTerm, filters]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const activeEscrowItems = useMemo(() => {
    return escrowItems.filter(item => item.status === 'active' || item.status === 'disputed');
  }, [escrowItems]);
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        <main className="flex-1 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Payments & Loans</h1>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <Download size={16} />
                <span>Export</span>
              </button>
              <button className="flex items-center gap-2 bg-rainbow-gradient text-white px-4 py-2 rounded-lg">
                <Plus size={16} />
                <span>Add Funds</span>
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex">
              <button onClick={() => setActiveTab('payments')} className={`py-2 px-4 relative ${activeTab === 'payments' ? 'text-black font-medium' : 'text-gray-500'}`}>
                Payments
                {activeTab === 'payments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
              </button>
              <button onClick={() => setActiveTab('loans')} className={`py-2 px-4 relative ${activeTab === 'loans' ? 'text-black font-medium' : 'text-gray-500'}`}>
                Loans
                {activeTab === 'loans' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
              </button>
            </div>
          </div>
          {/* Balances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">Total Earnings</div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-xl font-bold">$17,500.90</h3>
              </div>
              <div className="text-xs text-gray-500">USD EQUIVALENT</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">ICP Balance</div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-xl font-bold">2.45 ICP</h3>
              </div>
              <div className="text-xs text-gray-500">≈$2,205 USD</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">CkBTC Balance</div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-xl font-bold">0.025 ckBTC</h3>
              </div>
              <div className="text-xs text-gray-500">≈$1,085 USD</div>
            </div>
          </div>
          {/* Transactions section */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
            {/* Sub tabs */}
            <div className="border-b border-gray-200 px-4">
              <div className="flex">
                <button onClick={() => setActiveSubTab('overview')} className={`py-3 px-4 relative text-sm ${activeSubTab === 'overview' ? 'text-black font-medium' : 'text-gray-500'}`}>
                  Overview
                  {activeSubTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
                </button>
                <button onClick={() => setActiveSubTab('transactions')} className={`py-3 px-4 relative text-sm ${activeSubTab === 'transactions' ? 'text-black font-medium' : 'text-gray-500'}`}>
                  Transactions
                  {activeSubTab === 'transactions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
                </button>
                <button onClick={() => setActiveSubTab('escrow')} className={`py-3 px-4 relative text-sm ${activeSubTab === 'escrow' ? 'text-black font-medium' : 'text-gray-500'}`}>
                  Escrow
                  {activeSubTab === 'escrow' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
                </button>
                <button onClick={() => setActiveSubTab('settings')} className={`py-3 px-4 relative text-sm ${activeSubTab === 'settings' ? 'text-black font-medium' : 'text-gray-500'}`}>
                  Settings
                  {activeSubTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
                </button>
              </div>
            </div>

            {/* Overview Tab Content */}
            {activeSubTab === 'overview' && (
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {allTransactions.slice(0, 3).map(transaction => (
                    <div key={transaction.id} className="flex items-center border-b border-gray-100 pb-4">
                      <div className={`mr-4 rounded-lg w-12 h-12 flex items-center justify-center text-white ${transaction.type === 'incoming' ? 'bg-green-500' : 'bg-orange-500'}`}>
                        {transaction.type === 'incoming' ? <Check size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{transaction.title}</h4>
                        <div className="text-xs text-gray-500">
                          From: {transaction.from}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`flex items-center ${transaction.type === 'incoming' ? 'text-green-500' : 'text-orange-500'}`}>
                          <span>{transaction.amount}</span>
                          <div className={`ml-2 text-xs px-2 py-0.5 rounded ${transaction.status === 'Completed' ? 'bg-green-100 text-green-700' : transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {transaction.status}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {transaction.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Tab Content */}
            {activeSubTab === 'transactions' && (
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>

                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="incoming">Incoming</option>
                      <option value="outgoing">Outgoing</option>
                    </select>

                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="payment">Payment</option>
                      <option value="refund">Refund</option>
                      <option value="fee">Fee</option>
                      <option value="bonus">Bonus</option>
                    </select>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-4 mb-6">
                  {paginatedTransactions.map(transaction => (
                    <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-lg w-12 h-12 flex items-center justify-center text-white ${transaction.type === 'incoming' ? 'bg-green-500' : 'bg-orange-500'}`}>
                            {transaction.type === 'incoming' ? <Check size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{transaction.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>From: {transaction.from}</span>
                              {transaction.to && <span>To: {transaction.to}</span>}
                              <span>{transaction.date}</span>
                            </div>
                            {transaction.transactionHash && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">Hash:</span>
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{transaction.transactionHash}</code>
                                <button className="text-blue-500 hover:text-blue-700">
                                  <Eye size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${transaction.type === 'incoming' ? 'text-green-600' : 'text-orange-600'}`}>
                            {transaction.amount}
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {transaction.status === 'Completed' && <CheckCircle size={12} className="mr-1" />}
                            {transaction.status === 'Pending' && <Clock size={12} className="mr-1" />}
                            {transaction.status === 'Failed' && <AlertCircle size={12} className="mr-1" />}
                            {transaction.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 border rounded ${currentPage === page
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white mr-2">
                    <Check size={16} />
                  </div>
                  <h3 className="text-lg font-bold">This Month</h3>
                </div>
                <div className="text-2xl font-bold mb-1">$3,250</div>
                <div className="text-xs text-green-500">+15% FROM LAST MONTH</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white mr-2">
                    <ArrowUpRight size={16} />
                  </div>
                  <h3 className="text-lg font-bold">ICP Platform Fees</h3>
                </div>
                <div className="text-2xl font-bold mb-1">$32.50</div>
                <div className="text-xs text-gray-500">STARTING FROM 3% FEE</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12H16L14 15H10L8 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.45 5.11L2 12V18C2 18.5304 2.21071 19.0391 2.58579 19.4142C2.96086 19.7893 3.46957 20 4 20H20C20.5304 20 21.0391 19.7893 21.4142 19.4142C21.7893 19.0391 22 18.5304 22 18V12L18.55 5.11C18.3844 4.77679 18.1292 4.49637 17.813 4.30028C17.4967 4.10419 17.1321 4.0002 16.76 4H7.24C6.86792 4.0002 6.50326 4.10419 6.18704 4.30028C5.87083 4.49637 5.61558 4.77679 5.45 5.11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold">Pending</h3>
                </div>
                <div className="text-2xl font-bold mb-1">$750</div>
                <div className="text-xs text-gray-500">IN ESCROW</div>
              </div>
            </div>


            {/* Settings Section */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Settings</h3>
                  <p className="text-sm text-gray-600">Manage your payment preferences and security settings</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Payment Preferences */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Payment Preferences
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Payment Method
                        </label>
                        <select
                          value={paymentSettings.defaultPaymentMethod}
                          onChange={(e) => handleSettingsUpdate({ defaultPaymentMethod: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="credit_card">Credit Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="paypal">PayPal</option>
                          <option value="crypto">Cryptocurrency</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          value={paymentSettings.currency}
                          onChange={(e) => handleSettingsUpdate({ currency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Auto-release payments</label>
                          <p className="text-xs text-gray-600">Automatically release milestone payments after completion</p>
                        </div>
                        <button
                          onClick={() => handleSettingsUpdate({ autoRelease: !paymentSettings.autoRelease })}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                            paymentSettings.autoRelease ? "bg-blue-600" : "bg-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              paymentSettings.autoRelease ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email notifications</label>
                          <p className="text-xs text-gray-600">Receive email alerts for payment activities</p>
                        </div>
                        <button
                          onClick={() => handleSettingsUpdate({ emailNotifications: !paymentSettings.emailNotifications })}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                            paymentSettings.emailNotifications ? "bg-blue-600" : "bg-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              paymentSettings.emailNotifications ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Security Settings
                    </h4>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Two-factor authentication</label>
                          <p className="text-xs text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <button
                          onClick={() => handleSettingsUpdate({ twoFactorAuth: !paymentSettings.twoFactorAuth })}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                            paymentSettings.twoFactorAuth ? "bg-blue-600" : "bg-gray-200"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              paymentSettings.twoFactorAuth ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment PIN
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Enter new PIN"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                            Update
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Use a 4-6 digit PIN for payment verification</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session timeout
                        </label>
                        <select
                          value={paymentSettings.sessionTimeout}
                          onChange={(e) => handleSettingsUpdate({ sessionTimeout: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={0}>Never</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <button className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                          Download Security Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-purple-600" />
                    Payment Methods
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                          <p className="text-xs text-gray-600">Expires 12/25</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Default</span>
                        <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">john.doe@example.com</p>
                          <p className="text-xs text-gray-600">PayPal Account</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                        <button className="text-sm text-red-600 hover:text-red-800">Remove</button>
                      </div>
                    </div>

                    <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
                      + Add New Payment Method
                    </button>
                  </div>
                </div>

                {/* Save Changes */}
                <div className="flex justify-end">
                  <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}