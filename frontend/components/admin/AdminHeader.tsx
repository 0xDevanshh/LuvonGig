'use client'
import React from 'react'
import { Bell, ChevronDown } from 'lucide-react'
interface AdminHeaderProps {
  title: string
  showSearch?: boolean
  onSearch?: (query: string) => void
}
export function AdminHeader({
  title,
  showSearch = true,
  onSearch,
}: AdminHeaderProps) {
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
      {showSearch ? (
        <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
          <div className="relative flex items-center">
            <input
              type="text"
              name="search"
              placeholder="Search for search here..."
              className="w-full py-2 pl-4 pr-24 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-0 bg-[#0F172A] text-white px-6 py-2 rounded-full"
            >
              Search
            </button>
          </div>
        </form>
      ) : (
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      )}
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer">
            <Bell size={20} className="text-gray-600" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="hidden md:flex items-center gap-1">
            <span>John Doe</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
    </header>
  )
}
