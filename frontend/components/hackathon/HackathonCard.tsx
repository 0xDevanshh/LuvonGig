'use client'
import React from 'react';
import { Clock, Globe } from 'lucide-react';
interface HackathonCardProps {
  hackathon: {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    prizePool: string;
    date: string;
    registrationDays?: number;
    image: string;
    tags: string[];
    mode?: string;
    isLive?: boolean;
    isVoting?: boolean;
    isEnded?: boolean;
    techStack: string;
    level: string;
  };
  onClick: () => void;
}
export function HackathonCard({
  hackathon,
  onClick
}: HackathonCardProps) {
  return <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative">
        <img src={hackathon.image} alt={hackathon.title} className="w-full h-48 object-cover" />
        {hackathon.isLive && <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded">
            LIVE
          </span>}
        {hackathon.isVoting && <span className="absolute top-3 left-3 bg-purple-500 text-white text-xs px-2 py-1 rounded">
            VOTING
          </span>}
        {hackathon.isEnded && <span className="absolute top-3 left-3 bg-gray-500 text-white text-xs px-2 py-1 rounded">
            ENDED
          </span>}
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold mb-1">{hackathon.title}</h3>
            <p className="text-sm text-gray-600">{hackathon.subtitle}</p>
          </div>
          <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            {hackathon.prizePool}
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {hackathon.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {hackathon.tags.map((tag, index) => <span key={index} className={`px-2 py-1 text-xs rounded ${index % 2 === 0 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {tag}
            </span>)}
        </div>
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-gray-600">
            <Globe size={16} className="mr-1" />
            <span>{hackathon.mode || 'Virtual'}</span>
          </div>
          {hackathon.registrationDays !== undefined && <div className="flex items-center text-gray-600">
              <Clock size={16} className="mr-1" />
              <span>Registration: {hackathon.registrationDays} days left</span>
            </div>}
          <div className="text-gray-600 text-xs">{hackathon.date}</div>
        </div>
      </div>
    </div>;
}