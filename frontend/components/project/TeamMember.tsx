'use client'
import React from 'react';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMemberProps {
  member: {
    id: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    location?: string;
    avatar?: string;
    skills?: string[];
    bio?: string;
  };
  className?: string;
}

export function TeamMember({ member, className }: TeamMemberProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {member.role}
            </span>
          </div>
          
          {member.bio && (
            <p className="mt-2 text-sm text-gray-600">{member.bio}</p>
          )}
          
          <div className="mt-3 space-y-2">
            {member.email && (
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="w-4 h-4 mr-2" />
                <span>{member.email}</span>
              </div>
            )}
            
            {member.phone && (
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="w-4 h-4 mr-2" />
                <span>{member.phone}</span>
              </div>
            )}
            
            {member.location && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{member.location}</span>
              </div>
            )}
          </div>
          
          {member.skills && member.skills.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}