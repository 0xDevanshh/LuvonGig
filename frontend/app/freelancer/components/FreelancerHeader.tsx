'use client'

import React from 'react'
import { Bell, Search, User } from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'

interface FreelancerHeaderProps {
  title?: string
  showSearch?: boolean
  showCreateButton?: boolean
  onSearch?: (query: string) => void
  onCreateClick?: () => void
}

export function FreelancerHeader({
  title = 'Freelancer Dashboard',
  showSearch = false,
  showCreateButton = false,
  onSearch,
  onCreateClick
}: FreelancerHeaderProps) {
  const { profile, isLoading, currentRole } = useUserContext()

  const displayName = profile.firstName || profile.email?.split('@')[0] || 'User'
  const fullName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : displayName
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title and Search */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search services, clients..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {showCreateButton && (
            <button
              onClick={onCreateClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Service
            </button>
          )}
          
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Profile */}
          <div className="flex items-center space-x-3">
            {isLoading ? (
              // Loading skeleton
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden md:block">
              {isLoading ? (
                <>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900">{fullName}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-xs text-gray-500 capitalize">{currentRole}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

