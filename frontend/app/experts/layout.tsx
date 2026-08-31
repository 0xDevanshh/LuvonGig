import React from 'react'
import { ExpertSidebar } from '@/components/expert/ExpertSidebar'
import { Header1 } from '@/components/Header1'

interface ExpertsMarketplaceLayoutProps {
    children: React.ReactNode
}

export default function ExpertsMarketplaceLayout({
    children,
}: ExpertsMarketplaceLayoutProps) {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <ExpertSidebar />

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
