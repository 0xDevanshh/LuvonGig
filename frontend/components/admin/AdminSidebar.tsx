'use client'
import React from 'react'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutGrid,
  Users,
  Building2,
  UserSquare,
  CreditCard,
} from 'lucide-react'
export function AdminSidebar() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path
  const navItems = [
    {
      icon: <LayoutGrid size={20} />,
      label: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      icon: <Users size={20} />,
      label: 'Freelancers',
      path: '/admin/freelancers',
    },
    {
      icon: <UserSquare size={20} />,
      label: 'Customers',
      path: '/admin/customers',
    },
    {
      icon: <Building2 size={20} />,
      label: 'Enterprise',
      path: '/admin/enterprise',
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Subscriptions',
      path: '/admin/subscriptions',
    },
  ]
  return (
    <div className="w-64 border-r border-gray-200 h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <Link href="/admin/dashboard" className="flex items-center">
          <div className="relative">
            <svg
              width="40"
              height="32"
              viewBox="0 0 40 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
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
          <span className="ml-2 font-bold text-xl text-[#161616]">Workbudd</span>
        </Link>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        {navItems.map((item, index) => (
          <Link
            key={index}
            href={item.path}
            className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${isActive(item.path) ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'hover:bg-gray-50'}`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center ${isActive(item.path) ? 'text-purple-500' : 'text-gray-600'}`}
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
    </div>
  )
}
