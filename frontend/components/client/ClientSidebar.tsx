'use client'
import React from 'react'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart2,
  Briefcase,
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  LayoutGrid,
  Search,
  User,
  Settings,
  HelpCircle,
  Bell,
  Trophy, // Keep Trophy as it's used
  Users, // Keep Users if it's used elsewhere, though not in the new import list
  PlusCircle, // Keep PlusCircle as it's used
  LogOut, // Keep LogOut as it's used
  Coffee, // Keep Coffee as it's used
  CreditCard, // Keep CreditCard as it's used
} from 'lucide-react'

export function ClientSidebar() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  const navItems = [
    {
      icon: <LayoutGrid size={20} />,
      label: 'Dashboard',
      path: '/client/dashboard',
    },
    {
      icon: <Trophy size={20} />,
      label: 'Manage Hackathons',
      path: '/client/hackathons',
    },
    {
      icon: <Search size={20} />,
      label: 'Find Experts',
      path: '/experts'
    },
    {
      icon: <MessageSquare size={20} />,
      label: 'Messages',
      path: '/client/chat',
    },
    {
      icon: <Calendar size={20} />,
      label: 'Browse Services',
      path: '/client/browse-services',
    },
    {
      icon: <Calendar size={20} />,
      label: 'My Projects',
      path: '/client/projects',
    },
    {
      icon: <PlusCircle size={20} />,
      label: 'Post a Job',
      path: '/client/post-job',
    },
    {
      icon: <Calendar size={20} />,
      label: 'My Job Posts',
      path: '/client/my-job-posts',
    },
    {
      icon: <User size={20} />,
      label: 'Profile',
      path: '/client/profile',
    },
    {
      icon: <Settings size={20} />,
      label: 'Settings',
      path: '/client/settings',
    },
    {
      icon: <Coffee size={20} />,
      label: 'Caffeine AI',
      path: '/client/caffeine-ai',
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Crypto Card',
      path: '/client/crypto-card',
    },
  ]

  const handleLogout = async () => {
    try {
      // Add logout logic here
      await fetch('/api/logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="w-64 border-r border-gray-200 h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/client/dashboard" className="flex items-center">
          <img src="/WB.png" alt="Workbudd Logo" className="h-6 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-2 flex-1 overflow-y-auto">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.path}
            className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${isActive(item.path)
              ? 'bg-gradient-to-r from-blue-50 to-purple-50'
              : 'hover:bg-gray-50'
              }`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center ${isActive(item.path) ? 'text-purple-500' : 'text-gray-600'
                }`}
            >
              {item.icon}
            </div>
            <span
              className={
                isActive(item.path)
                  ? 'font-medium text-purple-700'
                  : 'text-gray-700'
              }
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* User Actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-red-50 text-gray-700 hover:text-red-600"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <LogOut size={20} />
          </div>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}