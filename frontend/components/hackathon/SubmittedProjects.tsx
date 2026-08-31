'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// TypeScript interfaces
interface Project {
  id: number;
  name: string;
  description: string;
  lastEdited: string;
  builder: string;
  image: string;
  likes: number;
  tags: string[];
}

interface SubmittedProjectsProps {
  projects: Project[];
  className?: string;
}

interface ProjectCardProps {
  project: Project;
  onProjectClick: (projectId: number) => void;
  onLikeClick: (projectId: number, e: React.MouseEvent) => void;
}

// Extracted ProjectCard component for better organization
const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onProjectClick, 
  onLikeClick 
}) => (
  <div 
    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300 bg-white"
    onClick={() => onProjectClick(project.id)}
    role="button"
    tabIndex={0}
    aria-label={`View project ${project.name}`}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onProjectClick(project.id);
      }
    }}
  >
    <div className="flex">
      {/* Project Image */}
      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden mr-4 flex-shrink-0">
        <Image
          src={project.image}
          alt={`${project.name} project thumbnail`}
          width={80}
          height={80}
          className="w-full h-full object-cover"
          sizes="80px"
        />
      </div>
      
      {/* Project Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 truncate pr-2">
            {project.name}
          </h3>
          <button 
            className="flex items-center text-gray-500 hover:text-red-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded p-1"
            onClick={(e) => onLikeClick(project.id, e)}
            aria-label={`Like project ${project.name}. Currently has ${project.likes} likes`}
            type="button"
          >
            <Heart size={18} />
            <span className="ml-1 text-sm">{project.likes}</span>
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {project.description}
        </p>
        
        <div className="flex justify-between items-center">
          {/* Tags */}
          <div className="flex space-x-2 flex-wrap">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{project.tags.length - 3} more
              </span>
            )}
          </div>
          
          {/* Project Meta */}
          <div className="text-sm text-gray-500 flex-shrink-0 ml-4">
            <span>Last edited {project.lastEdited}</span>
            <span className="mx-2">•</span>
            <span>Builder: {project.builder}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState: React.FC = () => (
  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
    <div className="max-w-sm mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
        <Heart className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects submitted yet</h3>
      <p className="text-gray-500 text-sm">
        Projects will appear here once they are submitted to the hackathon.
      </p>
    </div>
  </div>
);

export const SubmittedProjects: React.FC<SubmittedProjectsProps> = ({
  projects,
  className
}) => {
  const router = useRouter();

  const handleProjectClick = (projectId: number) => {
    router.push(`/project-detail/${projectId}`);
  };

  const handleLikeClick = (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click event
    // In a real implementation, this would handle the like functionality
    console.log(`Liked project ${projectId}`);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Submitted Projects
        </h2>
        {projects.length > 0 && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onProjectClick={handleProjectClick}
              onLikeClick={handleLikeClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};