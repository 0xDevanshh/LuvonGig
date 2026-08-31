'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MessageSquare,
  Activity
} from 'lucide-react';

interface ProjectDetailHeaderProps {
  project: any;
  onChatWithFreelancer: () => void;
}

// Helper function to convert status object to string
const getStatusString = (status: any): string => {
  if (typeof status === 'string') {
    return status;
  } else if (typeof status === 'object' && status !== null) {
    const statusKey = Object.keys(status)[0];
    return statusKey || 'Pending';
  }
  return 'Pending';
};

// Helper function to get status icon
const getStatusIcon = (status: any) => {
  const statusStr = getStatusString(status);
  switch (statusStr) {
    case 'Pending': return <Activity className="w-4 h-4 text-yellow-500" />;
    case 'InProgress': return <Activity className="w-4 h-4 text-blue-500" />;
    case 'Completed': return <Activity className="w-4 h-4 text-green-500" />;
    case 'Cancelled': return <Activity className="w-4 h-4 text-red-500" />;
    case 'Disputed': return <Activity className="w-4 h-4 text-orange-500" />;
    case 'Active': return <Activity className="w-4 h-4 text-blue-500" />;
    default: return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

export default function ProjectDetailHeader({
  project,
  onChatWithFreelancer
}: ProjectDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6">
      {/* Navigation and Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#161616]">
              {project.service_title || 'Project'}
            </h1>
            <p className="text-gray-600">
              Project #{project.booking_id?.slice(-8) || 'Unknown'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onChatWithFreelancer}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with Freelancer
          </Button>
        </div>
      </div>

      {/* Project Status Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {getStatusIcon(project.status)}
        <Badge
          variant={getStatusString(project.status) === 'Completed' ? 'default' : 'secondary'}
        >
          {getStatusString(project.status)}
        </Badge>
        <Badge
          variant={getStatusString(project.payment_status) === 'Completed' ? 'default' : 'outline'}
        >
          {getStatusString(project.payment_status)}
        </Badge>
        {project.payment_method && (
          <Badge variant="outline" className="text-xs">
            {project.payment_method.replace('-', ' ').toUpperCase()}
          </Badge>
        )}
      </div>
    </div>
  );
}