'use client'
import React from 'react';

interface FreelancerProfileLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  progress?: string;
  detailsType?: string;
}

export function FreelancerProfileLayout({ children }: FreelancerProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}