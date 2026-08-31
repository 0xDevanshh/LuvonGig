'use client'
import React from 'react';
import { Calendar, DollarSign, Users, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    budget: string;
    deadline: string;
    teamSize: number;
    status: 'active' | 'completed' | 'pending' | 'cancelled';
    rating?: number;
    tags?: string[];
    client?: {
      name: string;
      avatar?: string;
    };
  };
  className?: string;
  onClick?: () => void;
}

export function ProjectCard({ project, className, onClick }: ProjectCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {project.title}
        </h3>
        <span className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          statusColors[project.status]
        )}>
          {project.status}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {project.description}
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <DollarSign className="w-4 h-4 mr-2" />
          <span>{project.budget}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{project.deadline}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Users className="w-4 h-4 mr-2" />
          <span>{project.teamSize} members</span>
        </div>
        
        {project.rating && (
          <div className="flex items-center text-sm text-gray-500">
            <Star className="w-4 h-4 mr-2 text-yellow-400" />
            <span>{project.rating}</span>
          </div>
        )}
      </div>
      
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {project.client && (
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {project.client.avatar ? (
              <img
                src={project.client.avatar}
                alt={project.client.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{project.client.name}</p>
            <p className="text-xs text-gray-500">Client</p>
          </div>
        </div>
      )}
    </div>
  );
}