'use client'
import React from 'react';
  import Link from 'next/link';
import { useServiceForm } from '@/context/ServiceFormContext';
import { Search, FileText, DollarSign, Image, Settings } from 'lucide-react';
import { useParams } from 'next/navigation';
interface UpdateServiceNavigationProps {
  activeTab: 'overview' | 'projects' | 'pricing' | 'portfolio' | 'others';
}
export function UpdateServiceNavigation({
  activeTab
}: UpdateServiceNavigationProps) {
  const {
    formData
  } = useServiceForm();
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return null;
  }
    const tabs = [{
    id: 'overview',
    label: 'Overview',
    icon: <Search className="w-4 h-4" />,
    path: `/freelancer/update-service/${id}/overview`
  }, {
    id: 'projects',
    label: 'Projects',
    icon: <FileText className="w-4 h-4" />, 
    path: `/freelancer/update-service/${id}/projects`
  }, {
    id: 'pricing',
    label: 'Pricing',
    icon: <DollarSign className="w-4 h-4" />,
    path: `/freelancer/update-service/${id}/pricing`
  }, {
    id: 'portfolio',
    label: 'Portfolio',
    icon: <Image className="w-4 h-4" />,
    path: `/freelancer/update-service/${id}/portfolio`
  }, {
    id: 'others',
    label: 'Others',
    icon: <Settings className="w-4 h-4" />,
    path: `/freelancer/update-service/${id}/others`
  }];
  return <div className="border-b border-gray-200 overflow-x-auto">
      <div className="flex min-w-max">
          {tabs.map(tab => <Link key={tab.id} href={tab.path} className={`flex items-center py-3 px-4 md:px-6 relative ${activeTab === tab.id ? 'text-[#161616]' : 'text-gray-500'}`}>
            <span className="mr-2">{tab.icon}</span>
            <span>{tab.label}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400"></div>}
          </Link>)}
      </div>
    </div>;
}