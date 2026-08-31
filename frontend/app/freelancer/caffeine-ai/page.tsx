'use client'
import React from 'react'
import { ComingSoon } from '@/components/ComingSoon'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
export default function CaffeineAIPage() {
  return (
    <div className="relative min-h-screen">
      {/* Blurred background overlay */}
     

      {/* Main content with ComingSoon component */}
      <div className="relative z-50">
        <ComingSoon />
      </div>
    </div>
  )
}