'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare } from 'lucide-react';

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

export default function ProjectDetailHeader({
  project,
  onChatWithFreelancer
}: ProjectDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Back to projects
          </Button>
          <div>
            <h1 className="font-heading text-h2 font-semibold text-foreground">
              {project.service_title || 'Project'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Project #{project.booking_id?.slice(-8) || 'Unknown'}
            </p>
          </div>
        </div>
        <Button onClick={onChatWithFreelancer}>
          <MessageSquare className="size-4" />
          Chat with freelancer
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={getStatusString(project.status)} />
        <StatusBadge status={getStatusString(project.payment_status)} />
        {project.payment_method && (
          <Badge variant="outline" className="text-xs">
            {project.payment_method.replace('-', ' ').toUpperCase()}
          </Badge>
        )}
      </div>
    </div>
  );
}
