"use client"
import React, { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProgressStepper } from '@/components/progress-stepper'
import { ProfilePreview } from '@/components/ProfilePreview'
import { useRouter } from 'next/navigation'
import { User, Globe, Wallet } from 'lucide-react'
import { useOnboardingSession as useOnboarding } from '@/hooks/useOnboardingSession'

export function ProfileSetup() {
  const navigate = useRouter()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletInfo, setWalletInfo] = useState<{principal: string; accountId: string} | null>(null)

  const {
    profile,
    error,
    setError,
    updateProfile,
    goToNextStep,
    goToPreviousStep,
    isLoading
  } = useOnboarding()
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateProfile({ [name]: value });
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image size must be less than 5MB');
        return;
      }

      setIsUploadingImage(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/profile-image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          updateProfile({ profileImage: result.fileUrl });
          setError('');
        } else {
          setError(result.error || 'Failed to upload profile image');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setError('Failed to upload profile image. Please try again.');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.firstName || !profile.lastName) {
      setError('First name and last name are required');
      return;
    }

    // Log profile step completion
    console.log('=== ONBOARDING STEP 2: PROFILE COMPLETED ===');
    console.log('📝 Profile Data:');
    console.log('  • First Name:', profile.firstName);
    console.log('  • Last Name:', profile.lastName);
    console.log('  • Bio:', profile.bio || 'Not provided');
    console.log('  • Phone:', profile.phone || 'Not provided');
    console.log('  • Location:', profile.location || 'Not provided');
    console.log('  • Website:', profile.website || 'Not provided');
    console.log('  • LinkedIn:', profile.linkedin || 'Not provided');
    console.log('  • GitHub:', profile.github || 'Not provided');
    console.log('  • Twitter:', profile.twitter || 'Not provided');
    console.log('  • Profile Image:', profile.profileImage ? '✓ Uploaded' : 'Not uploaded');
    console.log('==========================================');

    const success = await goToNextStep(2);
    if (success) {
      navigate.push('/onboarding/address');
    }
  };

  const handleBack = () => {
    goToPreviousStep(2);
  }

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWallet = async () => {
      try {
        const response = await fetch('/api/user/wallet', {
          method: 'GET',
        });
        const result = await response.json();
        
        if (result.success && result.data) {
          setWalletConnected(true);
          setWalletInfo({
            principal: result.data.principal,
            accountId: result.data.accountId,
          });
        }
      } catch (err) {
        // Wallet not connected yet, ignore error
        console.log('No wallet found or error checking wallet:', err);
      }
    };

    checkWallet();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc]">
      
      <div className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="mb-8">
                <ProgressStepper currentStep={2} totalSteps={5} />
              </div>
              <h1 className="text-3xl font-bold text-[#161616] mb-8">
                Complete Your Profile
              </h1>
              <p className="text-gray-600 mb-8">
                Tell us more about yourself to get the most out of our platform
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-[#161616] mb-4 flex items-center">
                    <User size={20} className="mr-2 text-blue-600" />
                    Profile Picture
                  </h2>

                  <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="text-gray-400" size={32} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer">
                        <span
                          className={`${
                            isUploadingImage
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                        >
                          {isUploadingImage ? 'Uploading...' : 'Upload Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageChange}
                          disabled={isUploadingImage}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG or GIF (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-[#161616] mb-4 flex items-center">
                    <User size={20} className="mr-2 text-blue-600" />
                    Basic Information
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleChange}
                        required
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="First name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleChange}
                        required
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={profile.location}
                        onChange={handleChange}
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                </div>

                {/* Online Presence */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-[#161616] mb-4 flex items-center">
                    <Globe size={20} className="mr-2 text-blue-600" />
                    Online Presence
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={profile.website}
                        onChange={handleChange}
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        name="linkedin"
                        value={profile.linkedin}
                        onChange={handleChange}
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GitHub
                      </label>
                      <input
                        type="url"
                        name="github"
                        value={profile.github}
                        onChange={handleChange}
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://github.com/yourusername"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter
                      </label>
                      <input
                        type="url"
                        name="twitter"
                        value={profile.twitter}
                        onChange={handleChange}
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://twitter.com/yourusername"
                      />
                    </div>
                  </div>
                </div>

                {/* Wallet Connection */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-[#161616] mb-4 flex items-center">
                    <Wallet size={20} className="mr-2 text-purple-600" />
                    Wallet Connection
                  </h2>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Connect your Plug wallet to enable secure escrow payments and receive funds from completed projects.
                    </p>
                    {walletConnected && walletInfo && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-sm text-green-800">
                          <div className="font-medium mb-1">✓ Wallet Connected & Saved</div>
                          <div className="text-xs font-mono text-green-600">
                            {walletInfo.principal.substring(0, 20)}...{walletInfo.principal.substring(walletInfo.principal.length - 10)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-12 py-3 border border-[#000000] rounded-full font-bold text-[#161616] hover:bg-gray-100 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-12 py-3 bg-[#000000] text-white rounded-full font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Next'}
                  </button>
                </div>
              </form>
            </div>
            <div className="hidden md:block">
              <ProfilePreview
                firstName={profile.firstName}
                lastName={profile.lastName}
                bio={profile.bio}
                phone={profile.phone}
                location={profile.location}
                website={profile.website}
                linkedin={profile.linkedin}
                github={profile.github}
                twitter={profile.twitter}
                profileImage={profile.profileImage}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
