import React from 'react'

import { Sidebar } from '@/components/Sidebar'
import { Header1 } from '@/components/Header1'
interface FreelancerLayoutProps {
  children: React.ReactNode
}

export default function FreelancerLayout({
  children,
}: FreelancerLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
 
      <Sidebar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header1 />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

