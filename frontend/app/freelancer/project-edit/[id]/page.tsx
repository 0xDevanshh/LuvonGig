'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// TypeScript interfaces
interface TeamMember {
  name: string;
  role: string;
  location: string;
  bio: string;
  skills: string[];
}

interface ProjectFormData {
  name: string;
  description: string;
  longDescription: string;
  githubLink: string;
  demoVideo: string;
  pitchVideo: string;
  techStack: string[];
  tags: string[];
  teamMembers: TeamMember[];
}


// Extracted components
interface TechStackInputProps {
  techStack: string[];
  onTechStackChange: (index: number, value: string) => void;
  onAddTechStack: () => void;
  onRemoveTechStack: (index: number) => void;
}

const TechStackInput: React.FC<TechStackInputProps> = ({
  techStack,
  onTechStackChange,
  onAddTechStack,
  onRemoveTechStack,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Tech Stack *
    </label>
    <div className="space-y-2">
      {techStack.map((tech, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={tech}
            onChange={(e) => onTechStackChange(index, e.target.value)}
            className={cn(
              "flex-1 px-4 py-2 border border-gray-300 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200"
            )}
            placeholder="e.g., React, Node.js, Solidity"
            required={index === 0}
            aria-label={`Technology ${index + 1}`}
          />
          {techStack.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveTechStack(index)}
              className={cn(
                "p-2 text-gray-400 hover:text-red-500",
                "transition-colors duration-200 rounded-md",
                "hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              )}
              aria-label={`Remove technology ${index + 1}`}
            >
              <X size={18} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onAddTechStack}
        className={cn(
          "flex items-center text-sm text-blue-500 hover:text-blue-600",
          "transition-colors duration-200 px-2 py-1 rounded-md",
          "hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        )}
        aria-label="Add new technology"
      >
        <Plus size={16} className="mr-1" />
        Add Technology
      </button>
    </div>
  </div>
);

interface TagsInputProps {
  tags: string[];
  onTagChange: (index: number, value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
}

const TagsInput: React.FC<TagsInputProps> = ({
  tags,
  onTagChange,
  onAddTag,
  onRemoveTag,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Tags *
    </label>
    <div className="space-y-2">
      {tags.map((tag, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={tag}
            onChange={(e) => onTagChange(index, e.target.value)}
            className={cn(
              "flex-1 px-4 py-2 border border-gray-300 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200"
            )}
            placeholder="e.g., DeFi, SocialFi, AI"
            required={index === 0}
            aria-label={`Tag ${index + 1}`}
          />
          {tags.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveTag(index)}
              className={cn(
                "p-2 text-gray-400 hover:text-red-500",
                "transition-colors duration-200 rounded-md",
                "hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              )}
              aria-label={`Remove tag ${index + 1}`}
            >
              <X size={18} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onAddTag}
        className={cn(
          "flex items-center text-sm text-blue-500 hover:text-blue-600",
          "transition-colors duration-200 px-2 py-1 rounded-md",
          "hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        )}
        aria-label="Add new tag"
      >
        <Plus size={16} className="mr-1" />
        Add Tag
      </button>
    </div>
  </div>
);

// Static data moved outside component
const initialFormData: ProjectFormData = {
  name: '',
  description: '',
  longDescription: '',
  githubLink: '',
  demoVideo: '',
  pitchVideo: '',
  techStack: [''],
  tags: [''],
  teamMembers: [{
    name: '',
    role: '',
    location: '',
    bio: '',
    skills: ['']
  }]
};

const mockProjectData: ProjectFormData = {
  name: 'Openwave',
  description: 'Openwave is a decentralized platform rewarding GitHub contributions with crypto, enabling bounties, transparent tracking.',
  longDescription: 'OpenWave is a web platform built with Next.js and TypeScript, designed to foster a more vibrant and collaborative open-source ecosystem. It addresses the common challenges faced by both project maintainers and potential contributors.',
  githubLink: 'https://github.com/openwave/openwave',
  demoVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  pitchVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  techStack: ['Next.js', 'Web3', 'Solidity', 'Node.js'],
  tags: ['DeFi', 'SocialFi', 'AI'],
  teamMembers: [{
    name: 'Lovepreet Singh',
    role: 'Team Leader',
    location: 'New Del',
    bio: 'Pursuing Undergraduate in Computer Science || Won 5+ Hackathons || Full Stack Developer || Web3 Developer',
    skills: ['React', 'Next.js', 'Javascript']
  }, {
    name: 'GURSAGAR Singh',
    role: 'Team Member',
    location: 'Quack planet',
    bio: 'I forgot to write any personal introduction',
    skills: ['HackQuest lover', 'HQQuack owner']
  }]
};

export default function ProjectEditPage() {
  const router = useRouter();
  const urlParams = useParams();
  const id = urlParams.id as string;

  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'technical' | 'team'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock loading project data
  useEffect(() => {
    setIsLoading(true);
    // In a real app, you would fetch project data based on the ID
    setTimeout(() => {
      setFormData(mockProjectData);
      setIsLoading(false);
    }, 500);
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTechStackChange = (index: number, value: string) => {
    const updatedTechStack = [...formData.techStack];
    updatedTechStack[index] = value;
    setFormData(prev => ({
      ...prev,
      techStack: updatedTechStack
    }));
  };

  const addTechStack = () => {
    setFormData(prev => ({
      ...prev,
      techStack: [...prev.techStack, '']
    }));
  };

  const removeTechStack = (index: number) => {
    const updatedTechStack = formData.techStack.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      techStack: updatedTechStack
    }));
  };

  const handleTagChange = (index: number, value: string) => {
    const updatedTags = [...formData.tags];
    updatedTags[index] = value;
    setFormData(prev => ({
      ...prev,
      tags: updatedTags
    }));
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
  };

  const removeTag = (index: number) => {
    const updatedTags = formData.tags.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      tags: updatedTags
    }));
  };

  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedTeamMembers = [...formData.teamMembers];
    if (field === 'skills') return; // Handle skills separately
    updatedTeamMembers[index] = {
      ...updatedTeamMembers[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
  };

  const handleTeamMemberSkillChange = (memberIndex: number, skillIndex: number, value: string) => {
    const updatedTeamMembers = [...formData.teamMembers];
    const updatedSkills = [...updatedTeamMembers[memberIndex].skills];
    updatedSkills[skillIndex] = value;
    updatedTeamMembers[memberIndex] = {
      ...updatedTeamMembers[memberIndex],
      skills: updatedSkills
    };
    setFormData(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
  };

  const addTeamMemberSkill = (memberIndex: number) => {
    const updatedTeamMembers = [...formData.teamMembers];
    updatedTeamMembers[memberIndex] = {
      ...updatedTeamMembers[memberIndex],
      skills: [...updatedTeamMembers[memberIndex].skills, '']
    };
    setFormData(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
  };

  const removeTeamMemberSkill = (memberIndex: number, skillIndex: number) => {
    const updatedTeamMembers = [...formData.teamMembers];
    const updatedSkills = updatedTeamMembers[memberIndex].skills.filter((_, i) => i !== skillIndex);
    updatedTeamMembers[memberIndex] = {
      ...updatedTeamMembers[memberIndex],
      skills: updatedSkills
    };
    setFormData(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, {
        name: '',
        role: '',
        location: '',
        bio: '',
        skills: ['']
      }]
    }));
  };

  const removeTeamMember = (index: number) => {
    const updatedTeamMembers = formData.teamMembers.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
  };

  const handleBack = () => {
    router.push(`/project-detail/${id}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // In a real app, you would send the updated data to your backend
    setTimeout(() => {
      setIsSaving(false);
      router.push(`/project-detail/${id}`);
    }, 1000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={cn(
                  "w-full px-4 py-2 border border-gray-300 rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-all duration-200"
                )}
                required
                aria-describedby="name-help"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Short Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={cn(
                  "w-full px-4 py-2 border border-gray-300 rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-all duration-200"
                )}
                required
                maxLength={150}
                aria-describedby="description-help"
              />
              <p id="description-help" className="text-xs text-gray-500 mt-1">
                A brief description of your project (max 150 characters)
              </p>
            </div>
            <div>
              <label htmlFor="longDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                id="longDescription"
                name="longDescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                rows={6}
                className={cn(
                  "w-full px-4 py-2 border border-gray-300 rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-all duration-200 resize-vertical"
                )}
                required
                aria-describedby="longDescription-help"
              />
              <p id="longDescription-help" className="text-xs text-gray-500 mt-1">
                Provide a comprehensive description of your project, its purpose, and how it works
              </p>
            </div>
            <div>
              <label htmlFor="githubLink" className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Repository URL
              </label>
              <input
                type="url"
                id="githubLink"
                name="githubLink"
                value={formData.githubLink}
                onChange={handleInputChange}
                className={cn(
                  "w-full px-4 py-2 border border-gray-300 rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-all duration-200"
                )}
                placeholder="https://github.com/username/repo"
                aria-describedby="githubLink-help"
              />
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="demoVideo" className="block text-sm font-medium text-gray-700 mb-1">
                Demo Video URL
              </label>
              <input
                type="url"
                id="demoVideo"
                name="demoVideo"
                value={formData.demoVideo}
                onChange={handleInputChange}
                className={cn(
                  "w-full px-4 py-2 border border-gray-300 rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-all duration-200"
                )}
                placeholder="https://www.youtube.com/embed/..."
                aria-describedby="demoVideo-help"
              />
              <p id="demoVideo-help" className="text-xs text-gray-500 mt-1">
                YouTube or Vimeo embed URL for your demo video
              </p>
            </div>
            <div>
              <label htmlFor="pitchVideo" className="block text-sm font-medium text-gray-700 mb-1">
                Pitch Video URL
              </label>
              <input
                type="url"
                id="pitchVideo"
                name="pitchVideo"
                value={formData.pitchVideo}
                onChange={handleInputChange}
                className={cn(
                  "w-full px-4 py-2 border border-gray-300 rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "transition-all duration-200"
                )}
                placeholder="https://www.youtube.com/embed/..."
                aria-describedby="pitchVideo-help"
              />
              <p id="pitchVideo-help" className="text-xs text-gray-500 mt-1">
                YouTube or Vimeo embed URL for your pitch video
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Images
              </label>
              <div className={cn(
                "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center",
                "hover:border-gray-400 transition-colors duration-200",
                "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20"
              )}>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="mt-2">
                  <span className="block text-sm font-medium text-gray-700">
                    Drag and drop files here, or click to browse
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  aria-label="Upload project images"
                />
                <button
                  type="button"
                  className={cn(
                    "mt-4 inline-flex items-center px-4 py-2 border border-gray-300",
                    "shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white",
                    "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                    "transition-all duration-200"
                  )}
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-6">
            <TechStackInput
              techStack={formData.techStack}
              onTechStackChange={handleTechStackChange}
              onAddTechStack={addTechStack}
              onRemoveTechStack={removeTechStack}
            />
            <TagsInput
              tags={formData.tags}
              onTagChange={handleTagChange}
              onAddTag={addTag}
              onRemoveTag={removeTag}
            />
          </div>
        );

      case 'team':
        return (
          <div className="space-y-8">
            {formData.teamMembers.map((member, memberIndex) => (
              <div
                key={memberIndex}
                className={cn(
                  "border border-gray-200 rounded-lg p-6 relative",
                  "hover:shadow-md transition-shadow duration-200"
                )}
              >
                {formData.teamMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTeamMember(memberIndex)}
                    className={cn(
                      "absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500",
                      "transition-colors duration-200 rounded-md",
                      "hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    )}
                    aria-label={`Remove team member ${memberIndex + 1}`}
                  >
                    <X size={18} />
                  </button>
                )}
                <h3 className="text-lg font-medium mb-4">
                  {memberIndex === 0 ? 'Team Leader' : `Team Member ${memberIndex}`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleTeamMemberChange(memberIndex, 'name', e.target.value)}
                      className={cn(
                        "w-full px-4 py-2 border border-gray-300 rounded-lg",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "transition-all duration-200"
                      )}
                      required
                      aria-label={`Team member ${memberIndex + 1} name`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => handleTeamMemberChange(memberIndex, 'role', e.target.value)}
                      className={cn(
                        "w-full px-4 py-2 border border-gray-300 rounded-lg",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "transition-all duration-200"
                      )}
                      required
                      aria-label={`Team member ${memberIndex + 1} role`}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={member.location}
                    onChange={(e) => handleTeamMemberChange(memberIndex, 'location', e.target.value)}
                    className={cn(
                      "w-full px-4 py-2 border border-gray-300 rounded-lg",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200"
                    )}
                    aria-label={`Team member ${memberIndex + 1} location`}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={member.bio}
                    onChange={(e) => handleTeamMemberChange(memberIndex, 'bio', e.target.value)}
                    rows={3}
                    className={cn(
                      "w-full px-4 py-2 border border-gray-300 rounded-lg",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200 resize-vertical"
                    )}
                    aria-label={`Team member ${memberIndex + 1} bio`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills
                  </label>
                  <div className="space-y-2">
                    {member.skills.map((skill, skillIndex) => (
                      <div key={skillIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={skill}
                          onChange={(e) => handleTeamMemberSkillChange(memberIndex, skillIndex, e.target.value)}
                          className={cn(
                            "flex-1 px-4 py-2 border border-gray-300 rounded-lg",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            "transition-all duration-200"
                          )}
                          placeholder="e.g., React, Node.js, Solidity"
                          aria-label={`Team member ${memberIndex + 1} skill ${skillIndex + 1}`}
                        />
                        {member.skills.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTeamMemberSkill(memberIndex, skillIndex)}
                            className={cn(
                              "p-2 text-gray-400 hover:text-red-500",
                              "transition-colors duration-200 rounded-md",
                              "hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            )}
                            aria-label={`Remove skill ${skillIndex + 1} from team member ${memberIndex + 1}`}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTeamMemberSkill(memberIndex)}
                      className={cn(
                        "flex items-center text-sm text-blue-500 hover:text-blue-600",
                        "transition-colors duration-200 px-2 py-1 rounded-md",
                        "hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      )}
                      aria-label={`Add skill to team member ${memberIndex + 1}`}
                    >
                      <Plus size={16} className="mr-1" />
                      Add Skill
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTeamMember}
              className={cn(
                "flex items-center text-sm text-blue-500 hover:text-blue-600",
                "transition-colors duration-200 px-2 py-1 rounded-md",
                "hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              aria-label="Add new team member"
            >
              <Plus size={16} className="mr-1" />
              Add Team Member
            </button>
          </div>
        );

      default:
        return <div>Content not available</div>;
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={handleBack}
          className={cn(
            "flex items-center text-gray-600 hover:text-gray-900 mb-6",
            "transition-colors duration-200 px-2 py-1 rounded-md",
            "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          )}
          aria-label="Go back to project details"
        >
          <ChevronLeft size={16} className="mr-1" />
          <span>Back to Project</span>
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Edit Project</h1>
            <p className="text-gray-600">
              Update your project details and information
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={cn(
              "px-6 py-2 bg-blue-500 text-white rounded-lg",
              "hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "shadow-sm hover:shadow-md"
            )}
            aria-label={isSaving ? "Saving changes" : "Save changes"}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

        {/* Edit tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px" role="tablist" aria-label="Project edit sections">
            {[
              { id: 'basic', label: 'Basic Information' },
              { id: 'media', label: 'Media & Assets' },
              { id: 'technical', label: 'Technical Details' },
              { id: 'team', label: 'Team Members' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "mr-4 py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <form onSubmit={handleSubmit} className="bg-white">
          <div
            role="tabpanel"
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
          >
            {renderTabContent()}
          </div>
        </form>
      </div>
    </main>
  );
}