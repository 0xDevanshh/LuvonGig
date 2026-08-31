"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProgressStepper } from '@/components/progress-stepper'
import { ProfilePreview } from '@/components/ProfilePreview'
import { ChevronDown } from 'lucide-react'
import { useOnboardingSession as useOnboarding } from '@/hooks/useOnboardingSession'
export function AddressDetails() {
  const {
    address,
    profile,
    skills,
    error,
    setError,
    updateAddress,
    goToNextStep,
    goToPreviousStep,
    isLoading,
    fullLocation
  } = useOnboarding()

  // Log current onboarding progress when component mounts
  React.useEffect(() => {
    console.log('=== ONBOARDING STEP 3: ADDRESS - CURRENT PROGRESS ===');
    console.log('📊 Progress Summary:');
    console.log('  • Profile Complete:', !!(profile.firstName && profile.lastName));
    console.log('  • Address Complete:', !!(address.city && address.state && address.zipCode));
    console.log('  • Skills Count:', skills.length);
    console.log('  • Current Data:', { profile, address, skills });
    console.log('================================================');
  }, [])

  // State for location data
  const [countries, setCountries] = useState<any[]>([])
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries()
  }, [])

  // Fetch states when country changes
  useEffect(() => {
    if (address.country) {
      fetchStates(address.country)
      // Reset state and city when country changes
      updateAddress({ state: '', city: '' })
      setStates([])
      setCities([])
    }
  }, [address.country])

  // Fetch cities when state changes
  useEffect(() => {
    if (address.country && address.state) {
      fetchCities(address.country, address.state)
      // Reset city when state changes
      updateAddress({ city: '' })
      setCities([])
    }
  }, [address.country, address.state])

  const fetchCountries = async () => {
    setLoadingCountries(true)
    try {
      const response = await fetch('/api/location/countries')
      const data = await response.json()
      if (data.success) {
        setCountries(data.countries)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoadingCountries(false)
    }
  }

  const fetchStates = async (countryCode: string) => {
    setLoadingStates(true)
    try {
      const response = await fetch(`/api/location/states?countryCode=${countryCode}`)
      const data = await response.json()
      if (data.success) {
        setStates(data.states)
      }
    } catch (error) {
      console.error('Error fetching states:', error)
    } finally {
      setLoadingStates(false)
    }
  }

  const fetchCities = async (countryCode: string, stateCode: string) => {
    setLoadingCities(true)
    try {
      const response = await fetch(`/api/location/cities?countryCode=${countryCode}&stateCode=${stateCode}`)
      const data = await response.json()
      if (data.success) {
        setCities(data.cities)
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    } finally {
      setLoadingCities(false)
    }
  }

  const handleFieldChange = (field: string, value: string | boolean) => {
    updateAddress({ [field]: value })
  }

  const getFormattedLocation = useMemo(() => {
    const locationParts = []
    
    // Add street address if available
    if (address.streetAddress) {
      locationParts.push(address.streetAddress)
    }
    
    // Add city if available
    if (address.city) {
      locationParts.push(address.city)
    }
    
    // Add state if available
    if (address.state) {
      const stateName = states.find(s => s.id === address.state)?.name || address.state
      locationParts.push(stateName)
    }
    
    // Add zip code if available
    if (address.zipCode) {
      locationParts.push(address.zipCode)
    }
    
    // Add country if available
    if (address.country) {
      const countryName = countries.find(c => c.iso2 === address.country)?.name || address.country
      locationParts.push(countryName)
    }
    
    return locationParts.length > 0 ? locationParts.join(', ') : ''
  }, [address.streetAddress, address.city, address.state, address.zipCode, address.country, states, countries])

  const handleNext = async () => {
    // Validate required fields
    if (!address.state || !address.city || !address.zipCode) {
      setError('Please fill in all required fields')
      return
    }

    // Log address step completion
    console.log('=== ONBOARDING STEP 3: ADDRESS COMPLETED ===');
    console.log('📍 Address Data:');
    console.log('  • Country:', address.country);
    console.log('  • State:', address.state);
    console.log('  • City:', address.city);
    console.log('  • ZIP Code:', address.zipCode);
    console.log('  • Street Address:', address.streetAddress || 'Not provided');
    console.log('  • Private Profile:', address.isPrivate ? 'Yes' : 'No');
    console.log('  • Formatted Location:', getFormattedLocation);
    console.log('==========================================');

    await goToNextStep(3)
  }

  const handleBack = () => {
    goToPreviousStep(3)
  }
  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc]">
     
      <div className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="mb-8">
                <ProgressStepper currentStep={3} totalSteps={5} />
              </div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-[#161616]">
                  Your Address Details
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${!address.isPrivate ? 'text-gray-500' : 'text-[#161616]'}`}
                  >
                    Private
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!address.isPrivate}
                      onChange={() => handleFieldChange('isPrivate', !address.isPrivate)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2ba24c]"></div>
                  </label>
                  <span
                    className={`text-sm ${address.isPrivate ? 'text-gray-500' : 'text-[#161616]'}`}
                  >
                    Public
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-xs text-gray-500 mb-1 ml-1">
                    SELECT COUNTRY
                  </label>
                  <div className="relative">
                    <select
                      value={address.country}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      disabled={loadingCountries}
                      className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#161616] disabled:opacity-50"
                    >
                      <option value="">Select Country</option>
                      {countries.length > 0 ? (
                        countries.map((country) => (
                          <option key={country.iso2} value={country.iso2}>
                            {country.emoji} {country.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {loadingCountries ? 'Loading countries...' : 'No countries available'}
                        </option>
                      )}
                    </select>
                    <ChevronDown
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs text-gray-500 mb-1 ml-1">
                    STATE
                  </label>
                  <div className="relative">
                    <select
                      value={address.state}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                      disabled={!address.country || loadingStates}
                      className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#161616] disabled:opacity-50"
                    >
                      <option value="">Select State</option>
                      {states.length > 0 ? (
                        states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {loadingStates ? 'Loading states...' : 'No states available'}
                        </option>
                      )}
                    </select>
                    <ChevronDown
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-xs text-gray-500 mb-1 ml-1">
                    CITY
                  </label>
                  <div className="relative">
                    <select
                      value={address.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      disabled={!address.state || loadingCities}
                      className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#161616] disabled:opacity-50"
                    >
                      <option value="">Select City</option>
                      {cities.length > 0 ? (
                        cities.map((city) => (
                          <option key={city.id} value={city.name}>
                            {city.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {loadingCities ? 'Loading cities...' : 'No cities available'}
                        </option>
                      )}
                    </select>
                    <ChevronDown
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">
                    ZIP POSTAL CODE
                  </label>
                  <input
                    type="text"
                    placeholder="121341"
                    value={address.zipCode}
                    onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                    className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#161616]"
                  />
                </div>
              </div>
              <div className="mb-8">
                <label className="block text-xs text-gray-500 mb-1 ml-1">
                  STREET ADDRESS
                </label>
                <input
                  type="text"
                  placeholder="Enter Address Line 1"
                  value={address.streetAddress}
                  onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
                  className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#161616]"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="px-12 py-3 border border-[#000000] rounded-full font-bold text-[#161616] hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="px-12 py-3 bg-[#000000] text-white rounded-full font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Next'}
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <ProfilePreview
                firstName={profile.firstName}
                lastName={profile.lastName}
                bio={profile.bio}
                phone={profile.phone}
                location={getFormattedLocation}
                website={profile.website}
                linkedin={profile.linkedin}
                github={profile.github}
                twitter={profile.twitter}
                skills={skills.length > 0 ? skills : []}
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
