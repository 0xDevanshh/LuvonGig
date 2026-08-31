'use client'  
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'Swap';
  from: string;
  fromAmount: string;
  to: string;
  toAmount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  txHash?: string;
}

interface TransactionHistoryProps {
  activeTab: string;
}

export function TransactionHistory({ activeTab }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('swapTransactions');
    if (savedTransactions) {
      try {
        const parsed = JSON.parse(savedTransactions);
        setTransactions(parsed);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    }
  }, []);

  // Listen for new transactions from storage events
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTransactions = localStorage.getItem('swapTransactions');
      if (savedTransactions) {
        try {
          const parsed = JSON.parse(savedTransactions);
          setTransactions(parsed);
        } catch (error) {
          console.error('Error loading transactions:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for updates from same window
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Filter transactions based on active tab
  const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
  const completedTransactions = transactions.filter(tx => tx.status === 'completed' || tx.status === 'failed');

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="mt-4">
      {activeTab === 'pending' && (
        <div>
          {pendingTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending transactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTransactions.map(tx => (
                <div key={tx.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-yellow-500" />
                      <span className="font-medium">{tx.type}</span>
                    </div>
                    <div className="text-yellow-500 text-sm flex items-center">
                      <span>Pending</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        {tx.fromAmount} {tx.from} → {tx.toAmount} {tx.to}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(tx.timestamp)}
                      </p>
                      {tx.txHash && (
                        <p className="text-xs text-gray-400 mt-1">
                          Hash: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                        </p>
                      )}
                    </div>
                    {tx.txHash && (
                      <button
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        onClick={() => {
                          // Open transaction in explorer (you can customize this)
                          window.open(`https://explorer.ic0.app/transaction/${tx.txHash}`, '_blank');
                        }}
                      >
                        <span>View</span>
                        <ArrowUpRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'history' && (
        <div>
          {completedTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transaction history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTransactions.map(tx => (
                <div key={tx.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {tx.status === 'completed' ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : (
                        <AlertTriangle size={18} className="text-red-500" />
                      )}
                      <span className="font-medium">{tx.type}</span>
                    </div>
                    <div
                      className={`text-sm flex items-center ${
                        tx.status === 'completed' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      <span>
                        {tx.status === 'completed' ? 'Completed' : 'Failed'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        {tx.fromAmount} {tx.from} → {tx.toAmount} {tx.to}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(tx.timestamp)}
                      </p>
                      {tx.txHash && (
                        <p className="text-xs text-gray-400 mt-1">
                          Hash: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                        </p>
                      )}
                    </div>
                    {tx.txHash && (
                      <button
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        onClick={() => {
                          // Open transaction in explorer
                          window.open(`https://explorer.ic0.app/transaction/${tx.txHash}`, '_blank');
                        }}
                      >
                        <span>View</span>
                        <ArrowUpRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
