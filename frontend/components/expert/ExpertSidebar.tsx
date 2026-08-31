"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutGrid,
    Users,
    Settings,
    MessageSquare,
    ExternalLink,
    LogOut,
    Search,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExpertSidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    const navItems = [
        {
            icon: <LayoutGrid size={20} />,
            label: 'Dashboard',
            path: '/expert/dashboard'
        },
        {
            icon: <Settings size={20} />,
            label: 'Profile Settings',
            path: '/expert/register'
        },
        {
            icon: <Search size={20} />,
            label: 'Marketplace',
            path: '/experts'
        }
    ];

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="w-64 border-r border-gray-200 h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <Link href="/expert/dashboard" className="flex items-center">
                    <img src="/WB.png" alt="Workbudd Logo" className="h-6 w-auto" />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="p-2 flex-1 overflow-y-auto">
                {navItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.path}
                        className={cn(
                            "flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300",
                            isActive(item.path)
                                ? "bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600 shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 mx-1"
                        )}
                    >
                        <div
                            className={cn(
                                "w-5 h-5 flex items-center justify-center transition-transform duration-300",
                                isActive(item.path) ? "text-purple-600 scale-110" : "text-gray-400"
                            )}
                        >
                            {item.icon}
                        </div>
                        <span
                            className={cn(
                                "text-sm font-medium",
                                isActive(item.path) ? "font-bold" : ""
                            )}
                        >
                            {item.label}
                        </span>
                    </Link>
                ))}
            </nav>

            {/* User Actions */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-red-50 text-gray-600 hover:text-red-600"
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        <LogOut size={20} />
                    </div>
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
