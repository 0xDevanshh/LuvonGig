'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Hackathon {
  title: string;
  subtitle: string;
  prizePool: string;
  registrationDays: number;
  techStack: string;
  level: string;
  bannerImage: string;
}

interface InfoRowProps {
  label: string;
  value: string | number;
}

interface FeaturedHackathonProps {
  hackathon: Hackathon;
  className?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <>
    <div className="text-white/80">{label}</div>
    <div className="text-white/90 font-medium">{value}</div>
  </>
);

export const FeaturedHackathon: React.FC<FeaturedHackathonProps> = ({
  hackathon,
  className
}) => {
  const router = useRouter();
  
  const handleRegister = () => {
    router.push('/hackathon-registration');
  };

  return (
    <div className={cn("relative w-full h-64 md:h-80 rounded-xl overflow-hidden bg-blue-600", className)}>
      {/* Background image */}
      <div className="relative w-full h-full">
        <Image
          src={hackathon.bannerImage}
          alt={`${hackathon.title} hackathon banner`}
          fill
          className="object-cover opacity-90"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      {/* Content overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent flex flex-col justify-center px-8 md:px-12">
        <div className="max-w-md">
          <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full mb-3">
            Featured
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {hackathon.title}
          </h2>
          <p className="text-lg text-white/90 mb-4">{hackathon.subtitle}</p>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-6">
            <InfoRow label="Registration close" value={`${hackathon.registrationDays} days left`} />
            <InfoRow label="Tech stack" value={hackathon.techStack} />
            <InfoRow label="Level" value={hackathon.level} />
            <InfoRow label="Total prize" value={hackathon.prizePool} />
          </div>
          
          <button
            type="button"
            onClick={handleRegister}
            className="bg-white hover:bg-gray-100 text-blue-800 font-medium px-5 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
            aria-label={`Register for ${hackathon.title} hackathon`}
          >
            Start Register →
          </button>
        </div>
      </div>
    </div>
  );
};