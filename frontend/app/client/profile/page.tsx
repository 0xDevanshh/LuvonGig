'use client'
import React, { useState, useEffect, useRef } from 'react'
import { User, Mail, Phone, MapPin, Award, Edit3, Camera, Save, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useUserContext } from '@/contexts/UserContext'

export default function ProfilePage() {
  const { profile, isLoading: profileLoading } = useUserProfile()
  const { refreshProfile } = useUserContext()
  const [isEditing, setIsEditing] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Initialize profile data with real user data
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: [] as string[],
    github: '',
    linkedin: '',
    profileImage: '',
  })

  const [editData, setEditData] = useState(profileData)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [hackathonStats, setHackathonStats] = useState({
    totalParticipations: 0,
    teamsCreated: 0,
    prizesWon: 0,
    successRate: '0%',
    achievements: [] as Array<{ hackathonId: string; hackathonTitle: string; rewardTitle: string; rank: number }>,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Update profile data when user profile loads
  useEffect(() => {
    if (profile.isLoaded && !profileLoading) {
      const newProfileData = {
        fullName: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
        github: profile.github || '',
        linkedin: profile.linkedin || '',
        profileImage: profile.profileImage || '',
      }
      setProfileData(newProfileData)
      setEditData(newProfileData)
      setProfileImagePreview(null)
    }
  }, [profile, profileLoading])

  // Load hackathon stats
  useEffect(() => {
    const loadHackathonStats = async () => {
      if (!profile.email) return;

      try {
        setStatsLoading(true);
        const response = await fetch(`/api/hackquest/user-stats?email=${encodeURIComponent(profile.email)}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setHackathonStats(result.data);
          }
        }
      } catch (error) {
        console.error('Error loading hackathon stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (profile.isLoaded && profile.email) {
      loadHackathonStats();
    }
  }, [profile.email, profile.isLoaded])

  const handleSave = async () => {
    setSaveLoading(true)
    setSaveMessage(null)

    try {
      // Split full name into first and last name
      const nameParts = editData.fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const profileUpdateData = {
        firstName,
        lastName,
        email: editData.email,
        phone: editData.phone,
        location: editData.location,
        bio: editData.bio,
        github: editData.github,
        linkedin: editData.linkedin,
        skills: editData.skills,
        profileImageUrl: editData.profileImage || undefined,
      }

      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileUpdateData),
      })

      const result = await response.json()

      if (result.success) {
        setProfileData(editData)
        setProfileImagePreview(null)
        setIsEditing(false)
        setSaveMessage({
          type: 'success',
          text: result.message || 'Profile updated successfully!'
        })

        // Refresh user context to update profile across the app
        await refreshProfile()
      } else {
        setSaveMessage({
          type: 'error',
          text: result.error || 'Failed to update profile. Please try again.'
        })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setSaveLoading(false)

      // Clear message after 5 seconds
      if (saveMessage?.type === 'success') {
        setTimeout(() => setSaveMessage(null), 5000)
      }
    }
  }

  const handleCancel = () => {
    setEditData(profileData)
    setProfileImagePreview(null)
    setIsEditing(false)
  }

  const addSkill = (skill: string) => {
    if (skill && !editData.skills.includes(skill)) {
      setEditData({
        ...editData,
        skills: [...editData.skills, skill]
      })
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setEditData({
      ...editData,
      skills: editData.skills.filter(skill => skill !== skillToRemove)
    })
  }

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6 md:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="space-y-2">
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 md:p-8">
        {/* Save Message Notification */}
        {saveMessage && (
        <div
          className={`rounded-lg p-4 flex items-center gap-3 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Profile Picture */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <img
              src={
                profileImagePreview ||
                (isEditing ? editData.profileImage : profileData.profileImage) ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
              }
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) {
                      return
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      setSaveMessage({
                        type: 'error',
                        text: 'File too large. Maximum size is 5MB.',
                      })
                      return
                    }

                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setProfileImagePreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)

                    setUploadingImage(true)
                    setSaveMessage(null)
                    try {
                      const formData = new FormData()
                      formData.append('file', file)

                      const uploadResponse = await fetch('/api/upload/profile-image', {
                        method: 'POST',
                        body: formData,
                      })

                      const uploadResult = await uploadResponse.json()
                      if (!uploadResult.success || !uploadResult.fileUrl) {
                        throw new Error(uploadResult.error || 'Failed to upload image')
                      }

                      setEditData((prev) => ({
                        ...prev,
                        profileImage: uploadResult.fileUrl,
                      }))
                      setSaveMessage({
                        type: 'success',
                        text: 'Profile photo uploaded. Click save to apply.',
                      })
                    } catch (uploadError: any) {
                      console.error('Profile image upload error:', uploadError)
                      setSaveMessage({
                        type: 'error',
                        text: uploadError?.message || 'Failed to upload profile image. Please try again.',
                      })
                      setProfileImagePreview(null)
                    } finally {
                      setUploadingImage(false)
                      if (event.target) {
                        event.target.value = ''
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploadingImage}
                  aria-label="Upload profile photo"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                  <Camera className="w-4 h-4" />
                  )}
                </button>
              </>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{profileData.fullName}</h3>
            {profileData.github ? (
              <p className="text-gray-600">@{profileData.github}</p>
            ) : (
              <p className="text-gray-500">{profile.email}</p>
            )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Personal Information</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={isEditing ? editData.fullName : profileData.fullName}
                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={isEditing ? editData.email : profileData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={isEditing ? editData.phone : profileData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={isEditing ? editData.location : profileData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Bio & Skills */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">About & Skills</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={isEditing ? editData.bio : profileData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {(isEditing ? editData.skills : profileData.skills).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {skill}
                      {isEditing && (
                      <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-purple-900">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditing && (
                    <button
                      onClick={() => {
                      const newSkill = prompt('Add a new skill:');
                      if (newSkill) addSkill(newSkill);
                      }}
                      className="px-3 py-1 border-2 border-dashed border-purple-300 text-purple-600 rounded-full text-sm hover:border-purple-500 hover:text-purple-700"
                    >
                      + Add Skill
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                <input
                  type="text"
                  value={isEditing ? editData.github : profileData.github}
                onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="text"
                  value={isEditing ? editData.linkedin : profileData.linkedin}
                onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Stats & Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Hackathon Stats
            </h3>
            {statsLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Participations</span>
                  <span className="font-semibold">{hackathonStats.totalParticipations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Teams Created</span>
                  <span className="font-semibold">{hackathonStats.teamsCreated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prizes Won</span>
                  <span className="font-semibold">{hackathonStats.prizesWon}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold">{hackathonStats.successRate}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
            {statsLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ) : hackathonStats.achievements && hackathonStats.achievements.length > 0 ? (
              <div className="space-y-3">
                {hackathonStats.achievements.map((achievement, index) => (
                  <div
                    key={`${achievement.hackathonId}-${index}`}
                    className="flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{achievement.hackathonTitle}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {achievement.rewardTitle} - Rank #{achievement.rank}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No achievements yet</p>
                <p className="text-sm">Start participating in hackathons to earn achievements!</p>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}