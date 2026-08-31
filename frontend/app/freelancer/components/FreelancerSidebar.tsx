'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  Search, 
  MessageSquare, 
  DollarSign,
  Settings,
  LogOut
} from 'lucide-react'

const menuItems = [
  {
    name: 'Dashboard',
    href: '/freelancer/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'My Services',
    href: '/freelancer/my-services',
    icon: Briefcase
  },
  {
    name: 'My Bookings',
    href: '/freelancer/bookings',
    icon: Calendar
  },
  {
    name: 'Browse Jobs',
    href: '/freelancer/browse-jobs',
    icon: Search
  },
  {
    name: 'Messages',
    href: '/freelancer/messages',
    icon: MessageSquare
  },
  {
    name: 'Earnings',
    href: '/freelancer/earnings',
    icon: DollarSign
  }
]

export function FreelancerSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">FW</span>
          </div>
          <span className="ml-2 text-xl font-bold text-gray-800">FreelanceWork</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <Link
            href="/freelancer/settings"
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 mr-3" />
            <span className="font-medium">Settings</span>
          </Link>
          <button className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

