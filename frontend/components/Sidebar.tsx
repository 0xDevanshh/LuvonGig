'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutGrid, Users, User,
  MessageSquare, Code, PlusCircle,
  List, Search, Zap, Settings
} from 'lucide-react';
import { useUserContext } from '@/contexts/UserContext';

export function Sidebar() {
  const { currentRole } = useUserContext();
  const location = usePathname();

  const isActive = (path: string) => {
    return location === path;
  };

  const freelancerItems = [
    {
      icon: <LayoutGrid size={20} />,
      label: 'Dashboard',
      path: '/freelancer/dashboard'
    },
    {
      icon: <Search size={20} />,
      label: 'Browse Jobs',
      path: '/freelancer/browse-jobs'
    },
    {
      icon: <Search size={20} />,
      label: 'Find Experts',
      path: '/experts'
    },
    {
      icon: <List size={20} />,
      label: 'My Services',
      path: '/freelancer/my-services'
    },
    {
      icon: <User size={20} />,
      label: 'My Projects',
      path: '/freelancer/my-projects'
    },
    {
      icon: <Zap size={20} />,
      label: 'Subscription',
      path: '/freelancer/subscription'
    },
    {
      icon: <MessageSquare size={20} />,
      label: 'Messages',
      path: '/freelancer/messages'
    },
    {
      icon: <Code size={20} />,
      label: 'Hackathons',
      path: '/freelancer/hackathons'
    },
    {
      icon: <User size={20} />,
      label: 'Profile',
      path: '/freelancer/profile'
    },
    {
      icon: <Settings size={20} />,
      label: 'Settings',
      path: '/freelancer/settings'
    }
  ];

  const clientItems = [
    {
      icon: <LayoutGrid size={20} />,
      label: 'Dashboard',
      path: '/client/dashboard'
    },
    {
      icon: <PlusCircle size={20} />,
      label: 'Post a Job',
      path: '/client/post-job'
    },
    {
      icon: <List size={20} />,
      label: 'My Job Posts',
      path: '/client/my-job-posts'
    },
    {
      icon: <MessageSquare size={20} />,
      label: 'Messages',
      path: '/client/messages'
    },
    {
      icon: <Users size={20} />,
      label: 'Hire Freelancers',
      path: '/client/browse-freelancers'
    }
  ];

  const expertItems = [
    {
      icon: <LayoutGrid size={20} />,
      label: 'Dashboard',
      path: '/expert/dashboard'
    },
    {
      icon: <User size={20} />,
      label: 'My Customers',
      path: '/expert/customers'
    },
    {
      icon: <Settings size={20} />,
      label: 'Profile Settings',
      path: '/expert/register'
    },
    {
      icon: <MessageSquare size={20} />,
      label: 'Messages',
      path: '/expert/messages'
    }
  ];

  const navItems = currentRole === 'freelancer' ? freelancerItems :
    currentRole === 'expert' ? expertItems :
      clientItems;
  return <div className="w-64 border-r border-gray-200 h-full flex flex-col">
    <div className="p-4 border-b border-gray-200">
      <Link href="/profile/dashboard" className="flex items-center">
        <img src="/WB.png" alt="Workbudd Logo" className="h-6 w-auto" />
      </Link>
    </div>
    <nav className="p-2 flex-1 overflow-y-auto">
      {navItems.map((item, index) => <Link key={index} href={item.path} className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${isActive(item.path) ? 'bg-gradient-to-r from-blue-50 to-purple-50' : 'hover:bg-gray-50'}`}>
        <div className={`w-5 h-5 flex items-center justify-center ${isActive(item.path) ? 'text-purple-500' : 'text-gray-600'}`}>
          {item.icon}
        </div>
        <span className={isActive(item.path) ? 'font-medium text-purple-700' : 'text-gray-700'}>
          {item.label}
        </span>
      </Link>)}
    </nav>
  </div>;
}