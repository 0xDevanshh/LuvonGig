'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useServiceForm } from '@/context/ServiceFormContext';
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Service } from '@/hooks/useServices';

export default function ServicePreview() {
  const navigate = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    formData,
    updateFormData
  } = useServiceForm();

  const [isLoading, setIsLoading] = useState(!formData.serviceTitle || formData.id !== id);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Memoize service data transformation (copy from main page for consistency)
  const transformServiceData = useCallback((service: Service) => {
    const packages = service.packages || []
    const basicPkg = packages.find((p) => p.tier === 'Basic')
    const advancedPkg = packages.find((p) => p.tier === 'Standard' || p.tier === 'Advanced')
    const premiumPkg = packages.find((p) => p.tier === 'Premium')

    return {
      id: service.service_id,
      serviceTitle: service.title,
      mainCategory: service.main_category,
      subCategory: service.sub_category,
      description: service.description,
      whatsIncluded: service.whats_included,
      coverImage: service.cover_image_url || '/default-service.svg',
      portfolioImages: service.portfolio_images || [],
      tierMode: (service.tier_mode || '3tier') as '1tier' | '3tier',

      basicTitle: basicPkg?.title || 'Basic Package',
      basicDescription: basicPkg?.description || service.whats_included,
      basicDeliveryDays: String(basicPkg?.delivery_days || service.delivery_time_days || '3'),
      basicPrice: String(basicPkg?.price_minor ? Number(basicPkg.price_minor) / 100 : '99'),

      advancedTitle: advancedPkg?.title || 'Standard Package',
      advancedDescription: advancedPkg?.description || 'Enhanced service package',
      advancedDeliveryDays: String(advancedPkg?.delivery_days || '5'),
      advancedPrice: String(advancedPkg?.price_minor ? Number(advancedPkg.price_minor) / 100 : '199'),

      premiumTitle: premiumPkg?.title || 'Premium Package',
      premiumDescription: premiumPkg?.description || 'Priority service package',
      premiumDeliveryDays: String(premiumPkg?.delivery_days || '7'),
      premiumPrice: String(premiumPkg?.price_minor ? Number(premiumPkg.price_minor) / 100 : '349'),

      packages: packages.map((pkg: any) => ({
        ...pkg,
        price_minor: Number(pkg.price_minor),
        delivery_days: Number(pkg.delivery_days),
        revisions_included: Number(pkg.revisions_included || 0)
      })),

      clientQuestions: service.client_questions || [],
      faqs: service.faqs || []
    }
  }, [])

  // Fetch service data if not present or ID mismatch
  useEffect(() => {
    if (formData.serviceTitle && formData.id === id) {
      setIsLoading(false);
      return;
    }

    const fetchService = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/marketplace/services/${id}`);
        const data = await response.json();
        if (data.success && data.data) {
          const transformed = transformServiceData(data.data);
          updateFormData(transformed);
        } else {
          setError(data.error || 'Failed to load service preview');
        }
      } catch (err) {
        setError('Failed to fetch service data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id, formData.id, formData.serviceTitle, transformServiceData, updateFormData]);

  // Get all images for the carousel
  const allImages = useMemo(() => {
    return formData.coverImage ? [formData.coverImage, ...formData.portfolioImages] : formData.portfolioImages;
  }, [formData.coverImage, formData.portfolioImages]);

  const handleGoBack = () => {
    navigate.push(`/freelancer/update-service/${id}/overview`);
  };

  const handlePublish = () => {
    navigate.push('/freelancer/my-services');
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
  };
  const goToNextImage = () => {
    setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
  };
  const selectImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="py-4 px-6 flex justify-end">
          <div className="flex gap-4">
            <div className="w-32 h-10 bg-gray-100 animate-pulse rounded-lg"></div>
            <div className="w-24 h-10 bg-gray-100 animate-pulse rounded-lg"></div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="w-48 h-10 bg-gray-100 animate-pulse mx-auto mb-10 rounded-md"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2">
              <div className="w-full aspect-video bg-gray-50 animate-pulse rounded-2xl mb-8 border border-gray-100"></div>
              <div className="space-y-6">
                <div className="w-40 h-8 bg-gray-100 animate-pulse rounded-md"></div>
                <div className="space-y-3">
                  <div className="w-full h-4 bg-gray-50 animate-pulse rounded"></div>
                  <div className="w-full h-4 bg-gray-50 animate-pulse rounded"></div>
                  <div className="w-5/6 h-4 bg-gray-50 animate-pulse rounded"></div>
                  <div className="w-4/6 h-4 bg-gray-50 animate-pulse rounded"></div>
                </div>
                <div className="pt-4 space-y-3">
                  <div className="w-48 h-6 bg-gray-100 animate-pulse rounded"></div>
                  <div className="w-full h-4 bg-gray-50 animate-pulse rounded"></div>
                  <div className="w-3/4 h-4 bg-gray-50 animate-pulse rounded"></div>
                </div>
              </div>
            </div>
            <div className="md:col-span-1 space-y-8">
              <div className="w-48 h-8 bg-gray-100 animate-pulse rounded-md"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="border border-gray-100 rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div className="w-24 h-6 bg-gray-100 animate-pulse rounded"></div>
                    <div className="w-16 h-8 bg-blue-50 animate-pulse rounded-lg"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-gray-50 animate-pulse rounded"></div>
                    <div className="w-3/4 h-4 bg-gray-50 animate-pulse rounded"></div>
                  </div>
                  <div className="pt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <div className="w-24 h-4 bg-gray-50 animate-pulse rounded"></div>
                      <div className="w-12 h-4 bg-gray-50 animate-pulse rounded"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-20 h-4 bg-gray-50 animate-pulse rounded"></div>
                      <div className="w-10 h-4 bg-gray-50 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">Preview Unavailable</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={handleGoBack}
            className="w-full bg-[#0F1E36] text-white px-6 py-3 rounded-xl hover:bg-black transition-colors"
          >
            Go Back To Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="py-4 px-6 flex justify-end">
        <div className="flex gap-4">
          <button onClick={handleGoBack} className="flex items-center text-gray-700 hover:text-black font-medium transition-colors">
            <ArrowLeft size={18} className="mr-2" />
            <span>Go Back And Edit</span>
          </button>
          <button onClick={handlePublish} className="bg-[#0F1E36] text-white px-6 py-2.5 rounded-xl hover:bg-black transition-all shadow-sm">
            Publish
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2">
            {/* Image Carousel */}
            <div className="mb-10 relative group">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-gray-100 shadow-lg bg-gray-50">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[currentImageIndex]}
                    alt="Service Preview"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-400 font-medium">No images available for preview</p>
                  </div>
                )}
                {/* Navigation arrows */}
                {allImages.length > 1 && (
                  <>
                    <button onClick={goToPreviousImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={24} className="text-gray-800" />
                    </button>
                    <button onClick={goToNextImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                      <ChevronRight size={24} className="text-gray-800" />
                    </button>
                  </>
                )}
              </div>
              {/* Thumbnail navigation */}
              {allImages.length > 1 && (
                <div className="flex justify-center mt-6 space-x-3 overflow-x-auto pb-2">
                  {allImages.map((image, index) => (
                    <div
                      key={index}
                      onClick={() => selectImage(index)}
                      className={`w-20 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${index === currentImageIndex ? 'border-[#0F1E36] ring-2 ring-gray-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">Description</h2>
              <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                {formData.description || 'No description provided.'}
              </div>

              {formData.whatsIncluded && (
                <div className="mt-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
                    <div className="w-1.5 h-6 bg-[#0F1E36] mr-3 rounded-full"></div>
                    What's Included:
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {formData.whatsIncluded}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Service Packages
            </h2>

            <div className="space-y-6">
              {/* Basic Package */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold uppercase tracking-wider text-sm text-gray-500">{formData.tierMode === '1tier' ? 'Service Package' : 'Basic Tier'}</h3>
                  <div className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-gray-100">
                    ${formData.basicPrice || '0'}
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <p className="font-bold text-lg mb-2 text-gray-900">
                    {formData.basicTitle || 'Package Title'}
                  </p>
                  <p className="text-sm text-gray-600 mb-6 italic leading-relaxed">
                    {formData.basicDescription || 'No description provided for this package.'}
                  </p>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Delivery Time</span>
                      <span className="font-bold text-gray-900">{formData.basicDeliveryDays || '-'} days</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Revisions</span>
                      <span className="font-bold text-gray-900">{formData.packages?.find(p => p.tier === 'Basic')?.revisions_included || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {formData.tierMode === '3tier' && (
                <>
                  {/* Standard Package */}
                  <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold uppercase tracking-wider text-sm text-gray-500">Standard Tier</h3>
                      <div className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-gray-100">
                        ${formData.advancedPrice || '0'}
                      </div>
                    </div>
                    <div className="p-6 bg-white">
                      <p className="font-bold text-lg mb-2 text-gray-900">
                        {formData.advancedTitle || 'Package Title'}
                      </p>
                      <p className="text-sm text-gray-600 mb-6 italic leading-relaxed">
                        {formData.advancedDescription || 'No description provided for this package.'}
                      </p>
                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Delivery Time</span>
                          <span className="font-bold text-gray-900">{formData.advancedDeliveryDays || '-'} days</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Revisions</span>
                          <span className="font-bold text-gray-900">{formData.packages?.find(p => p.tier === 'Standard' || p.tier === 'Advanced')?.revisions_included || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Premium Package */}
                  <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ring-2 ring-gray-50">
                    <div className="bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold uppercase tracking-wider text-sm text-gray-400">Premium Tier</h3>
                      <div className="bg-white/10 text-white px-3 py-1 rounded-full text-sm font-bold border border-white/20 backdrop-blur-md">
                        ${formData.premiumPrice || '0'}
                      </div>
                    </div>
                    <div className="p-6 bg-white">
                      <p className="font-bold text-lg mb-2 text-gray-900">
                        {formData.premiumTitle || 'Package Title'}
                      </p>
                      <p className="text-sm text-gray-600 mb-6 italic leading-relaxed">
                        {formData.premiumDescription || 'No description provided for this package.'}
                      </p>
                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Delivery Time</span>
                          <span className="font-bold text-gray-900">{formData.premiumDeliveryDays || '-'} days</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Revisions</span>
                          <span className="font-bold text-gray-900">{formData.packages?.find(p => p.tier === 'Premium')?.revisions_included || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Features check */}
            <div className="mt-10 bg-[#f8fafc] p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#0F1E36]/5 rounded-full -mr-12 -mt-12"></div>
              <h3 className="font-bold mb-6 text-gray-900 flex items-center relative z-10">
                <div className="bg-green-100 p-1.5 rounded-lg mr-3">
                  <Check className="text-green-600" size={18} />
                </div>
                Key Features
              </h3>
              <div className="space-y-4 relative z-10">
                {(formData.packages?.[0]?.features || []).length > 0 ? (
                  formData.packages[0].features.map((feature, i) => (
                    <div key={i} className="flex items-start group">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3 group-hover:scale-125 transition-transform"></div>
                      <span className="text-sm text-gray-700 font-medium leading-tight">{feature}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Professional quality and timely delivery guaranteed with every order.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}