'use client'
import React, { useState, useRef } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Upload,
  X,
  Plus,
  Globe,
  Monitor,
  Building,
  Hash,
  FileText,
  Target,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHackathonForm } from '@/context/HackathonFormContext';

interface CreateHackathonOverviewProps {
  className?: string;
}

export function CreateHackathonOverview({ className }: CreateHackathonOverviewProps) {
  const { formData, updateFormData, setSaved } = useHackathonForm();
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof typeof formData, value: any) => {
    updateFormData({ [field]: value });
    setSaved(field, true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        // Create a preview URL for immediate display
        const preview = URL.createObjectURL(file);
        setBannerPreview(preview);
        
        // Upload to Tebi S3
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'hackathons');
        
        const response = await fetch('/api/upload/s3', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success && result.url) {
          console.log('✅ Banner image uploaded to Tebi:', result.url);
          updateField('bannerImage', result.url);
          setSaved('bannerImage', true);
        } else {
          console.error('❌ Failed to upload banner image:', result.error);
          // Keep the blob URL as fallback
          updateField('bannerImage', preview);
          setSaved('bannerImage', true);
        }
      } catch (error) {
        console.error('Error uploading banner image:', error);
        // Keep the blob URL as fallback
        const preview = URL.createObjectURL(file);
        updateField('bannerImage', preview);
        setSaved('bannerImage', true);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeBanner = () => {
    setBannerPreview('');
    updateField('bannerImage', '');
    setSaved('bannerImage', true);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateField('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateField('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const addSocialLink = () => {
    updateField('socialLinks', [...formData.socialLinks, { platform: '', url: '' }]);
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updatedLinks = [...formData.socialLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    updateField('socialLinks', updatedLinks);
  };

  const removeSocialLink = (index: number) => {
    updateField('socialLinks', formData.socialLinks.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Hackathon Overview</h3>
        <p className="text-gray-600">Provide the essential details about your hackathon event.</p>
      </div>

      {/* Banner Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Upload className="w-4 h-4 inline mr-1" />
          Banner Image
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          {bannerPreview || formData.bannerImage ? (
            <div className="relative">
              <img
                src={bannerPreview || formData.bannerImage}
                alt="Hackathon banner"
                className="w-full h-48 object-cover rounded-lg"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Uploading to Tebi...</p>
                  </div>
                </div>
              )}
              <button
                onClick={removeBanner}
                disabled={isUploading}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="banner-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">Upload a banner image</span>
                  <input
                    id="banner-upload"
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={isUploading}
                  />
                </label>
                <p className="text-gray-500">PNG, JPG up to 10MB</p>
                {isUploading && (
                  <p className="text-blue-600 text-sm mt-1">Uploading to Tebi...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Target className="w-4 h-4 inline mr-1" />
            Hackathon Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Enter a catchy title for your hackathon"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Sparkles className="w-4 h-4 inline mr-1" />
            Tagline
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            placeholder="A short, memorable tagline (e.g., 'Innovate. Collaborate. Celebrate.')"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4 inline mr-1" />
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe your hackathon, its goals, what participants will learn, and what makes it special..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme
          </label>
          <input
            type="text"
            value={formData.theme}
            onChange={(e) => updateField('theme', e.target.value)}
            placeholder="e.g., 'Sustainability Tech', 'AI for Good', 'Web3 Innovation'"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Event Details</h4>

        {/* Event Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Event Mode *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'Online', icon: Monitor, label: 'Online' },
              { value: 'Offline', icon: Building, label: 'Offline' },
              { value: 'Hybrid', icon: Users, label: 'Hybrid' }
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateField('mode', value as any)}
                className={cn(
                  'flex flex-col items-center p-4 border-2 rounded-lg transition-colors',
                  formData.mode === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                )}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder={
              formData.mode === 'Online' ? "Platform (e.g., Zoom, Discord, Gather)" :
              formData.mode === 'Hybrid' ? "Physical venue + online platform" :
              "Physical address or venue"
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Hackathon Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Registration Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Registration Start *
            </label>
            <input
              type="datetime-local"
              value={formData.registrationStart}
              onChange={(e) => updateField('registrationStart', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Registration End *
            </label>
            <input
              type="datetime-local"
              value={formData.registrationEnd}
              onChange={(e) => updateField('registrationEnd', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Participation Settings */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Participation Settings</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Max Participants
            </label>
            <input
              type="number"
              value={formData.maxParticipants}
              onChange={(e) => updateField('maxParticipants', Number(e.target.value))}
              placeholder="100"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Team Size
            </label>
            <input
              type="number"
              value={formData.minTeamSize}
              onChange={(e) => updateField('minTeamSize', Number(e.target.value))}
              placeholder="1"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Team Size
            </label>
            <input
              type="number"
              value={formData.maxTeamSize}
              onChange={(e) => updateField('maxTeamSize', Number(e.target.value))}
              placeholder="4"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Registration Fee ($)
          </label>
          <input
            type="number"
            value={formData.registrationFee}
            onChange={(e) => updateField('registrationFee', Number(e.target.value))}
            placeholder="0"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Hash className="w-4 h-4 inline mr-1" />
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1"
            >
              <span>{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag (e.g., AI, Web3, Mobile, Design)"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Social Links
        </label>
        <div className="space-y-2">
          {formData.socialLinks.map((link, index) => (
            <div key={index} className="flex space-x-2">
              <select
                value={link.platform}
                onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select platform</option>
                <option value="x.com">X (Twitter)</option>
                <option value="linkedin.com">LinkedIn</option>
                <option value="github.com">GitHub</option>
                <option value="discord.com">Discord</option>
                <option value="slack.com">Slack</option>
                <option value="instagram.com">Instagram</option>
                <option value="facebook.com">Facebook</option>
                <option value="youtube.com">YouTube</option>
              </select>
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                placeholder="https://"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.socialLinks.length > 1 && (
                <button
                  onClick={() => removeSocialLink(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addSocialLink}
          className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          <Plus size={16} className="inline mr-1" />
          Add Social Link
        </button>
      </div>
    </div>
  );
}