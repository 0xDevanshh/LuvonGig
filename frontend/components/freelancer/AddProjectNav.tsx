'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, FileText, DollarSign, Image, Settings } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

export function AddProjectNav() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      name: 'Overview',
      href: '/freelancer/add-service/overview',
      icon: <Search size={18} className="mr-2" />
    },
    {
      name: 'Projects',
      href: '/freelancer/add-service/projects',
      icon: <FileText size={18} className="mr-2" />
    },
    {
      name: 'Pricing',
      href: '/freelancer/add-service/pricing',
      icon: <DollarSign size={18} className="mr-2" />
    },
    {
      name: 'Portfolio',
      href: '/freelancer/add-service/portfolio',
      icon: <Image size={18} className="mr-2" />
    },
    {
      name: 'Others',
      href: '/freelancer/add-service/others',
      icon: <Settings size={18} className="mr-2" />
    }
  ]

  return (
    <div className="flex border-b border-gray-200 bg-white">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center py-3 px-4 border-b-2 border-transparent transition-colors ${
              isActive
                ? 'relative text-[#161616]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400"></div>
            )}
          </Link>
        )
      })}
    </div>
  )
}