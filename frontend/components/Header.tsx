'use client'
import React from 'react';
import { Bell, ChevronDown, Search, Briefcase, User, Settings } from 'lucide-react';
import { useUserContext } from '@/contexts/UserContext';

interface HeaderProps {
  showSearch?: boolean
}

export function Header({
  showSearch = true
}: HeaderProps) {
  const { profile, isLoading, currentRole } = useUserContext();

  const displayName = profile.firstName || profile.email?.split('@')[0] || 'User';
  const fullName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : displayName;

  // Get role display text and icon based on current role
  const getRoleDisplay = () => {
    switch (currentRole) {
      case 'admin':
        return {
          text: 'Admin',
          icon: <Settings size={16} />,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700'
        };
      case 'freelancer':
        return {
          text: 'Freelancer',
          icon: <Briefcase size={16} />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700'
        };
      case 'client':
        return {
          text: 'Client',
          icon: <User size={16} />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700'
        };
      case 'both':
        return {
          text: 'Client & Freelancer',
          icon: <User size={16} />,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700'
        };
      default:
        return {
          text: 'Client',
          icon: <User size={16} />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700'
        };
    }
  };

  const roleDisplay = getRoleDisplay();

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
      {showSearch ? (
        <div className="relative flex-1 max-w-xl">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search your industry here..."
              className="w-full py-2 pl-4 pr-10 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-3 bg-green-500 rounded-full p-1">
              <Search size={18} className="text-white" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1"></div>
      )}

      <div className="flex items-center gap-4 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
            <Bell size={20} className="text-gray-600" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              1
            </div>
          </div>
        </div>

        {/* User Type/Role */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer hover:bg-opacity-80 transition-colors ${roleDisplay.bgColor}`}>
          <div className="flex items-center justify-center">
            {roleDisplay.icon}
          </div>
          <span className={`text-sm font-medium ${roleDisplay.textColor}`}>
            {isLoading ? 'Loading...' : roleDisplay.text}
          </span>
          <ChevronDown size={16} className={roleDisplay.textColor} />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-full px-2 py-1 transition-colors">
          {isLoading ? (
            // Loading skeleton
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          ) : profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="hidden md:flex flex-col items-start">
            {isLoading ? (
              <>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <span className="font-medium text-gray-900">
                  {fullName}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[150px]">
                  {profile.email}
                </span>
              </>
            )}
          </div>
          <ChevronDown size={16} className="hidden md:block text-gray-500" />
        </div>
      </div>
    </header>
  );
}
