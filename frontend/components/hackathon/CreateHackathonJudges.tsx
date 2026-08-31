'use client'
import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  User,
  Mail,
  FileText,
  Award,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Star,
  Briefcase,
  GraduationCap,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHackathonForm } from '@/context/HackathonFormContext';
import { Judge } from '@/context/HackathonFormContext';

interface CreateHackathonJudgesProps {
  className?: string;
}

export default function CreateHackathonJudges({ className }: CreateHackathonJudgesProps) {
  const { formData, updateFormData, setSaved } = useHackathonForm();

  const expertiseAreas = [
    'Artificial Intelligence',
    'Machine Learning',
    'Web Development',
    'Mobile Development',
    'Blockchain/Web3',
    'UI/UX Design',
    'Product Management',
    'Data Science',
    'Cybersecurity',
    'Cloud Computing',
    'DevOps',
    'Game Development',
    'IoT',
    'Robotics',
    'Startups',
    'Venture Capital'
  ];

  const predefinedJudges = [
    {
      name: 'Dr. Sarah Chen',
      bio: 'AI Research Scientist with 10+ years in machine learning and neural networks.',
      expertise: ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
      avatar: ''
    },
    {
      name: 'Michael Rodriguez',
      bio: 'Full-stack developer and tech entrepreneur who has built multiple successful startups.',
      expertise: ['Web Development', 'Startups', 'Product Management'],
      avatar: ''
    },
    {
      name: 'Emily Johnson',
      bio: 'Award-winning UX designer focused on creating intuitive and accessible digital experiences.',
      expertise: ['UI/UX Design', 'Product Management', 'Web Development'],
      avatar: ''
    },
    {
      name: 'David Kim',
      bio: 'Blockchain expert and smart contract developer with deep DeFi knowledge.',
      expertise: ['Blockchain/Web3', 'DevOps', 'Cloud Computing'],
      avatar: ''
    }
  ];

  const addJudge = (template?: any) => {
    const newJudge: Judge = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: template?.name || '',
      email: template?.email || '',
      bio: template?.bio || '',
      expertise: template?.expertise || [],
      avatar: template?.avatar || '',
      status: 'pending'
    };
    updateFormData({ judges: [...formData.judges, newJudge] });
    setSaved('judges', true);
  };

  const updateJudge = (id: string, field: keyof Judge, value: any) => {
    const updatedJudges = formData.judges.map(judge =>
      judge.id === id ? { ...judge, [field]: value } : judge
    );
    updateFormData({ judges: updatedJudges });
    setSaved('judges', true);
  };

  const removeJudge = (id: string) => {
    updateFormData({ judges: formData.judges.filter(judge => judge.id !== id) });
    setSaved('judges', true);
  };

  const moveJudge = (index: number, direction: 'up' | 'down') => {
    const newJudges = [...formData.judges];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newJudges.length) {
      [newJudges[index], newJudges[targetIndex]] = [newJudges[targetIndex], newJudges[index]];
      updateFormData({ judges: newJudges });
      setSaved('judges', true);
    }
  };

  const addExpertise = (judgeId: string, expertise: string) => {
    if (!expertise.trim()) return;

    const judge = formData.judges.find(j => j.id === judgeId);
    if (judge && !judge.expertise.includes(expertise.trim())) {
      updateJudge(judgeId, 'expertise', [...judge.expertise, expertise.trim()]);
    }
  };

  const removeExpertise = (judgeId: string, expertiseToRemove: string) => {
    const judge = formData.judges.find(j => j.id === judgeId);
    if (judge) {
      updateJudge(judgeId, 'expertise', judge.expertise.filter(exp => exp !== expertiseToRemove));
    }
  };

  const handleAvatarUpload = (judgeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, create a preview URL
      const preview = URL.createObjectURL(file);
      updateJudge(judgeId, 'avatar', preview);
    }
  };

  const removeAvatar = (judgeId: string) => {
    updateJudge(judgeId, 'avatar', '');
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <X className="w-4 h-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const getJudgeStats = () => {
    return {
      total: formData.judges.length,
      pending: formData.judges.filter(j => j.status === 'pending').length,
      accepted: formData.judges.filter(j => j.status === 'accepted').length,
      declined: formData.judges.filter(j => j.status === 'declined').length
    };
  };

  const stats = getJudgeStats();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Judges & Evaluation</h3>
        <p className="text-gray-600">Add judges who will evaluate the hackathon projects.</p>
      </div>

      {/* Judge Stats */}
      {formData.judges.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Judges</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            <div className="text-sm text-gray-600">Declined</div>
          </div>
        </div>
      )}

      {/* Quick Add Predefined Judges */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Quick Add Example Judges</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {predefinedJudges.map((template, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => addJudge(template)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900">{template.name}</h5>
                  <p className="text-sm text-gray-600">{template.expertise.slice(0, 2).join(', ')}</p>
                </div>
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Judge List */}
      <div className="space-y-4">
        {formData.judges.map((judge, index) => (
          <div
            key={judge.id}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            {/* Judge Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  {index > 0 && (
                    <button
                      onClick={() => moveJudge(index, 'up')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronUp size={16} />
                    </button>
                  )}
                  {index < formData.judges.length - 1 && (
                    <button
                      onClick={() => moveJudge(index, 'down')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(judge.status)}
                  <span className="font-semibold text-gray-900">
                    {judge.name || 'New Judge'}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({getStatusText(judge.status)})
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeJudge(judge.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Avatar
                </label>
                <div className="flex items-center space-x-4">
                  {judge.avatar ? (
                    <div className="relative">
                      <img
                        src={judge.avatar}
                        alt="Judge avatar"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <button
                        onClick={() => removeAvatar(judge.id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarUpload(judge.id, e)}
                      className="hidden"
                      id={`avatar-${judge.id}`}
                    />
                    <label
                      htmlFor={`avatar-${judge.id}`}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:border-gray-400 cursor-pointer"
                    >
                      Upload Photo
                    </label>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={judge.status || 'pending'}
                  onChange={(e) => updateJudge(judge.id, 'status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={judge.name}
                  onChange={(e) => updateJudge(judge.id, 'name', e.target.value)}
                  placeholder="Judge's full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={judge.email}
                  onChange={(e) => updateJudge(judge.id, 'email', e.target.value)}
                  placeholder="judge@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Bio & Experience
                </label>
                <textarea
                  value={judge.bio}
                  onChange={(e) => updateJudge(judge.id, 'bio', e.target.value)}
                  placeholder="Brief description of the judge's background, experience, and qualifications..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Expertise */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Award className="w-4 h-4 inline mr-1" />
                  Areas of Expertise
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {judge.expertise.map((exp, expIndex) => (
                      <span
                        key={expIndex}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1"
                      >
                        <span>{exp}</span>
                        <button
                          onClick={() => removeExpertise(judge.id, exp)}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addExpertise(judge.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select expertise area...</option>
                      {expertiseAreas.filter(area => !judge.expertise.includes(area)).map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or add custom expertise..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addExpertise(judge.id, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Judge Button */}
      <div className="flex justify-center">
        <button
          onClick={() => addJudge()}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Custom Judge</span>
        </button>
      </div>

      {/* Empty State */}
      {formData.judges.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Judges Added Yet</h3>
          <p className="text-gray-500 mb-4">Add judges to evaluate projects and provide valuable feedback to participants.</p>
          <button
            onClick={() => addJudge(predefinedJudges[0])}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Judge
          </button>
        </div>
      )}
    </div>
  );
}