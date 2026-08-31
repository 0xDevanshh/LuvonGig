'use client'
import React from 'react'
import { Bell, ChevronDown, Plus, User } from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'

interface ClientHeaderProps {
  title?: string
  showSearch?: boolean
  onSearch?: (query: string) => void
  showCreateButton?: boolean
  onCreateClick?: () => void
}

export function ClientHeader({
  title,
  showSearch = false,
  onSearch,
  showCreateButton = false,
  onCreateClick,
}: ClientHeaderProps) {
  const { profile, isLoading, currentRole } = useUserContext()

  const displayName = profile.firstName || profile.email?.split('@')[0] || 'User'
  const fullName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : displayName

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search') as string
    if (onSearch) {
      onSearch(query)
    }
  }

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
      {title && !showSearch ? (
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
      ) : showSearch ? (
        <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
          <div className="relative flex items-center">
            <input
              type="text"
              name="search"
              placeholder="Search hackathons, teams, participants..."
              className="w-full py-2 pl-4 pr-24 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="absolute right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-4 ml-auto">
        {showCreateButton && (
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span className="font-medium">Create</span>
          </button>
        )}

        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
            <Bell size={20} className="text-gray-600" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 cursor-pointer group">
          {isLoading ? (
            // Loading skeleton
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          ) : profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white group-hover:ring-purple-200 transition-all"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center ring-2 ring-white group-hover:ring-purple-200 transition-all">
              <span className="text-white font-semibold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="hidden md:flex flex-col items-start">
            {isLoading ? (
              <>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">
                  {fullName}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 capitalize">{currentRole}</span>
                </div>
              </>
            )}
          </div>
          {!isLoading && (
            <ChevronDown size={16} className="hidden md:block text-gray-500 group-hover:text-gray-700 transition-colors" />
          )}
        </div>
      </div>
    </header>
  )
}