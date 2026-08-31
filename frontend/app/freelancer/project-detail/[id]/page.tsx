'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProjectTabs } from '@/components/project/ProjectTabs';
import { ChevronLeft, Edit, Share2, Star, Globe, Twitter, Heart } from 'lucide-react';
import { TeamMember } from '@/components/project/TeamMember';
import { cn } from '@/lib/utils';

// TypeScript interfaces
interface TeamMemberData {
  id: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  skills: string[];
  image: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  longDescription: string;
  image: string;
  hackathon: string;
  hackathonDescription: string;
  tags: string[];
  status: string;
  daysLeft: string;
  githubLink: string;
  demoVideo: string;
  pitchVideo: string;
  techStack: string[];
  prizeTrack: string;
  submissionType: string;
  team: TeamMemberData[];
}


interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
}

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

// Extracted components
const ProjectCard: React.FC<ProjectCardProps> = ({ title, description, image }) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div>
        <h4 className="font-bold">{title}</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
      </div>
    </div>
  </div>
);

const SocialLink: React.FC<SocialLinkProps> = ({ href, icon, label }) => (
  <a
    href={href}
    className={cn(
      "w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center",
      "hover:bg-gray-200 transition-colors duration-200",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    )}
    aria-label={label}
    target="_blank"
    rel="noopener noreferrer"
  >
    {icon}
  </a>
);

export default function ProjectDetailPage() {
  const router = useRouter();
  const urlParams = useParams();
  const id = urlParams.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [isStarred, setIsStarred] = useState(false);

  // Mock project data - in a real app, you would fetch this based on the ID
  const project: Project = {
    id: parseInt(id || '1'),
    name: 'Openwave',
    description: 'Openwave is a decentralized platform rewarding GitHub contributions with crypto, enabling bounties, transparent tracking.',
    longDescription: `
      OpenWave is a web platform built with Next.js and TypeScript, designed to foster a more vibrant and collaborative open-source ecosystem. It addresses the common challenges faced by both project maintainers and potential contributors.
      For Maintainers: OpenWave provides a streamlined process to submit and showcase their open-source projects. They can detail project goals, required skills, and contribution guidelines, making it easier to attract the right talent. A dedicated "My Projects" dashboard allows maintainers to manage their listings effectively.
      For Contributors: Developers can easily discover projects through intuitive "Discover" and "Browse" sections. OpenWave aims to offer personalized "Recommendations" (potentially AI-driven) based on user skills and interests. Contributors can track their "Contributions" across different projects and view a consolidated list of "Projects" they are involved in.
      Unique Value: OpenWave explores the integration of a "Rewards" system, offering a novel way to acknowledge and potentially compensate contributors for their valuable work, going beyond traditional contribution tracking.
      Vision: The platform aims to become a central hub for open-source collaboration, simplifying project discovery, contribution tracking, and potentially introducing sustainable funding or reward models for the community.
    `,
    image: "/screencapture-hackquest-io-projects-VietBUIDL-Hackathon-Openwave-2025-10-15-15_06_33.png",
    hackathon: 'VietBUIDL Hackathon',
    hackathonDescription: "Rising to shape blockchain's dawn",
    tags: ['DeFi', 'SocialFi', 'AI'],
    status: 'Live',
    daysLeft: '3 days left',
    githubLink: 'https://github.com/openwave/openwave',
    demoVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    pitchVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    techStack: ['Next.js', 'Web3', 'Solidity', 'Node.js'],
    prizeTrack: 'User application: DeFi / GameFi / SocialFi',
    submissionType: 'Team project',
    team: [
      {
        id: '1',
        name: 'Lovepreet Singh',
        role: 'Team Leader',
        location: 'New Del',
        bio: 'Pursuing Undergraduate in Computer Science || Won 5+ Hackathons || Full Stack Developer || Web3 Developer',
        skills: ['React', 'Next.js', 'Javascript'],
        image: 'https://via.placeholder.com/80'
      },
      {
        id: '2',
        name: 'GURSAGAR Singh',
        role: 'Team Member',
        location: 'Quack planet',
        bio: 'I forgot to write any personal introduction',
        skills: ['HackQuest lover', 'HQQuack owner'],
        image: 'https://via.placeholder.com/80'
      }
    ]
  };

  const handleBack = () => {
    router.push('/submitted-projects');
  };

  const handleEdit = () => {
    router.push(`/project-edit/${id}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.name,
          text: project.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleStar = () => {
    setIsStarred(!isStarred);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4">{project.name}</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {project.longDescription}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Videos</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="mb-2 font-medium">Demo Video</p>
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                    <iframe
                      src={project.demoVideo}
                      className="w-full h-full"
                      title="Demo Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-medium">Pitch Video</p>
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                    <iframe
                      src={project.pitchVideo}
                      className="w-full h-full"
                      title="Pitch Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, index) => (
                  <span
                    key={index}
                    className={cn(
                      "px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm",
                      "hover:bg-gray-200 transition-colors duration-200"
                    )}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Builders Also Viewed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectCard
                  title="Dunk Verse"
                  description="A Mobile Dapp which offers AI-Driven Quizzes, NFT-Powered Social Media, and Blockchain Gaming."
                  image="https://via.placeholder.com/64"
                />
                <ProjectCard
                  title="SafeSend"
                  description="Secure and authenticated transfers of Ether, Erc20 NFTs, and SCROM tokens, relief from phishing scams."
                  image="https://via.placeholder.com/64"
                />
              </div>
            </div>
          </div>
        );

      case 'hackathon':
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                <img
                  src="/screencapture-hackquest-io-projects-VietBUIDL-Hackathon-Openwave-2025-10-15-15_06_53.png"
                  alt={project.hackathon}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{project.hackathon}</h2>
                <p className="text-gray-600">{project.hackathonDescription}</p>
                <div className="flex items-center mt-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full mr-2",
                      project.status === 'Live'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    )}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs text-gray-500">{project.daysLeft}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Prize Track</h3>
                <p className="text-gray-700">{project.prizeTrack}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Submission Type</h3>
                <p className="text-gray-700">{project.submissionType}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Schedule</h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Registration Period',
                    date: 'Jun 17, 2024 19:00 - Jul 19, 2024 19:00',
                    status: 'Completed',
                    statusColor: 'bg-green-100 text-green-700'
                  },
                  {
                    title: 'Kickoff Meeting',
                    date: 'Jun 26, 2024 15:00',
                    status: 'Completed',
                    statusColor: 'bg-green-100 text-green-700'
                  },
                  {
                    title: 'Project Submission Period',
                    date: 'Jul 19, 2024 19:00 - Jul 30, 2024 19:00',
                    status: 'In Progress',
                    statusColor: 'bg-yellow-100 text-yellow-700'
                  },
                  {
                    title: 'Winners Announcement',
                    date: 'Aug 3, 2024 19:00',
                    status: 'Upcoming',
                    statusColor: 'bg-gray-100 text-gray-700'
                  }
                ].map((event, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.date}</p>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-xs", event.statusColor)}>
                      {event.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-6">Team Intro</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <div className="bg-white border border-gray-200 rounded px-4 py-2 inline-block mb-4">
                      NCVyd425
                    </div>
                    <div className="bg-yellow-100 border border-yellow-200 rounded px-4 py-2 inline-flex items-center gap-2 mb-4">
                      <span>Invite Link</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-2">Team Leader:</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                        <img src="https://via.placeholder.com/32" alt="Team Leader" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-medium">Lovepreet Singh</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-gray-500">
                    No team introductions at the moment
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-6">Team Members</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.team.map((member) => (
                  <TeamMember key={member.id} member={member} />
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-center py-8 text-gray-500">Content not available</div>;
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={handleBack}
          className={cn(
            "flex items-center text-gray-600 hover:text-gray-900 mb-6",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
          )}
          aria-label="Go back to submitted projects"
        >
          <ChevronLeft size={16} className="mr-1" />
          <span>Back</span>
        </button>

        {/* Project header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-purple-100 rounded-lg overflow-hidden flex items-center justify-center mr-4 shadow-sm">
              <img
                src="/screencapture-hackquest-io-projects-VietBUIDL-Hackathon-Openwave-2025-10-15-15_06_33.png"
                alt={project.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/64';
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleStar}
              className={cn(
                "p-2 rounded-full transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isStarred
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 focus:ring-yellow-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-500'
              )}
              aria-label={isStarred ? "Remove from favorites" : "Add to favorites"}
            >
              <Star size={18} fill={isStarred ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={handleShare}
              className={cn(
                "p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              )}
              aria-label="Share project"
            >
              <Share2 size={18} />
            </button>

            <button
              onClick={handleEdit}
              className={cn(
                "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600",
                "flex items-center gap-2 transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
              aria-label="Edit project"
            >
              <Edit size={16} />
              <span>Edit Project</span>
            </button>
          </div>
        </div>

        {/* Tabs navigation */}
        <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main content area */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left content - Tab content */}
          <div className="md:col-span-2">
            {renderTabContent()}
          </div>

          {/* Right sidebar - Project info */}
          <div className="space-y-6">
            {/* GitHub info */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="text-lg font-medium mb-4">GitHub</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium">GitHub Link</h4>
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                  >
                    {project.githubLink.replace('https://github.com/', '')}
                  </a>
                </div>
              </div>
            </div>

            {/* Tech stack */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="text-lg font-medium mb-4">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, index) => (
                  <span
                    key={index}
                    className={cn(
                      "px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm",
                      "hover:bg-gray-200 transition-colors duration-200"
                    )}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <h3 className="text-lg font-medium mb-4">Links</h3>
              <div className="flex gap-2">
                <SocialLink href="#" icon={<Twitter size={16} />} label="Twitter" />
                <SocialLink href="#" icon={<Globe size={16} />} label="Website" />
              </div>
            </div>

            {/* Like button */}
            <button
              className={cn(
                "flex items-center justify-center gap-2 w-full",
                "border border-gray-300 rounded-lg py-3 px-4",
                "text-gray-700 hover:bg-gray-50 transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              )}
              aria-label="Like this project"
            >
              <Heart size={18} />
              <span>Like Project</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
