'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServiceForm } from '@/context/ServiceFormContext';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export default function ServicePreview() {
  const navigate = useRouter();
  const {
    formData,
    submitService,
    isSubmitting,
    clearFormData
  } = useServiceForm();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Get all images for the carousel
  const allImages = formData.coverImage ? [formData.coverImage, ...formData.portfolioImages] : formData.portfolioImages;
  const handleGoBack = () => {
    navigate.push('/freelancer/add-service/others');
  };
  const handlePublish = async () => {
    // Get user email from session
    let userEmail: string | null = null;
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.session) {
        userEmail = data.session.email;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }

    if (!userEmail) {
      setNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to publish your service'
      });
      return;
    }

    // submitService already saves to marketplace canister via createService
    const result = await submitService(userEmail);

    if (result.success) {
      // Show success notification
      setNotification({
        type: 'success',
        title: 'Service Published Successfully!',
        message: `Your service "${formData.serviceTitle}" has been created and is now live on the marketplace.`
      });

      // Clear form data after successful submission
      clearFormData();

      // Redirect to services page after 3 seconds
      setTimeout(() => {
        navigate.push('/freelancer/my-services');
      }, 3000);
    } else {
      setNotification({
        type: 'error',
        title: 'Publication Failed',
        message: result.error || 'Failed to publish service. Please try again.'
      });
    }
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
  return <div className="min-h-screen bg-white">
    {/* Notification Toast */}
    {notification && (
      <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-top-2">
        <Alert className="bg-white" variant={notification.type === 'success' ? 'default' : 'destructive'}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{notification.title}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      </div>
    )}

    <header className="border-b border-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="flex gap-4 ml-auto">
          <button onClick={handleGoBack} className="flex items-center text-gray-700 hover:text-black">
            <ArrowLeft size={16} className="mr-1" />
            <span>Go Back And Edit</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={isSubmitting}
            className="bg-rainbow-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSubmitting ? 'Publishing...' : 'Publish Service'}
          </button>
        </div>
      </div>
    </header>
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{formData.serviceTitle || 'Service Title'}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            {formData.mainCategory}
          </span>
          {formData.subCategory && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
              {formData.subCategory}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Image Carousel */}
          <div className="mb-8 relative">
            <div className="relative overflow-hidden rounded-lg border border-gray-200">
              {allImages.length > 0 ? <img src={allImages[currentImageIndex]} alt="Service Preview" className="w-full h-auto" /> : <div className="h-64 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">No images available</p>
              </div>}
              {/* Navigation arrows */}
              {allImages.length > 1 && <>
                <button onClick={goToPreviousImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={goToNextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100">
                  <ChevronRight size={20} />
                </button>
              </>}
            </div>
            {/* Thumbnail navigation */}
            {allImages.length > 1 && <div className="flex justify-center mt-4 space-x-2 overflow-x-auto">
              {allImages.map((image, index) => <div key={index} onClick={() => selectImage(index)} className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${index === currentImageIndex ? 'border-blue-500' : 'border-transparent'}`}>
                <img src={image} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
              </div>)}
            </div>}
          </div>
          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Description</h2>
            {formData.description ? (
              <div className="text-gray-700 whitespace-pre-wrap mb-4">
                {formData.description}
              </div>
            ) : (
              <p className="text-gray-500 italic mb-4">
                No description provided
              </p>
            )}

            {formData.whatsIncluded && (
              <>
                <h3 className="text-lg font-semibold mb-2">What's Included:</h3>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {formData.whatsIncluded}
                </div>
              </>
            )}
          </div>

          {/* Client Questions Section */}
          {formData.clientQuestions && formData.clientQuestions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Client Questions</h2>
              <p className="text-gray-600 mb-4">Questions that will be asked to clients when they book this service:</p>
              <div className="space-y-4">
                {formData.clientQuestions.map((question: any) => (
                  <div key={question.id} className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-blue-600 font-medium">
                        {question.type === 'text' ? '📝' :
                          question.type === 'mcq' ? '🔘' :
                            question.type === 'checkbox' ? '☑️' :
                              question.type === 'dropdown' ? '📋' :
                                question.type === 'file' ? '📎' : '❓'}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {question.question}
                        </h4>
                        {question.required && (
                          <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Section */}
          {formData.faqs && formData.faqs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {formData.faqs.map((faq: any) => (
                  <div key={faq.id} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-start">
                      <span className="text-blue-600 mr-2">Q:</span>
                      {faq.question}
                    </h3>
                    <p className="text-gray-700 ml-6">
                      <span className="text-green-600 mr-2">A:</span>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <h2 className="text-xl font-bold mb-4">
            {formData.tierMode === '3tier' ? 'Choose Your Package' : 'Package Details'}
          </h2>

          {/* Display packages from array if available */}
          {formData.packages && formData.packages.length > 0 && (
            <div className="space-y-4">
              {formData.packages.map((pkg: any, index: number) => {
                const isPopular = formData.tierMode === '3tier' && index === 1; // Middle package is popular in 3-tier mode
                const priceInICP = parseFloat(pkg.price_e8s.toString()) / 100000000;

                return (
                  <div
                    key={pkg.package_id}
                    className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isPopular
                      ? 'border-2 border-blue-500'
                      : 'border border-gray-200'
                      }`}
                  >
                    <div className={`p-3 border-b ${isPopular ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">
                          {pkg.tier.toUpperCase()}
                        </h3>
                        {isPopular && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                            POPULAR
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-medium mb-2">{pkg.title}</p>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {pkg.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <span>Delivery Time</span>
                        <span className="font-medium">{pkg.delivery_timeline}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <span>Revisions</span>
                        <span className="font-medium">
                          {pkg.revisions_included === 1 ? '1 revision' : `${pkg.revisions_included} revisions`}
                        </span>
                      </div>
                      {pkg.features && pkg.features.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-2">Features:</div>
                          <div className="space-y-1">
                            {pkg.features.slice(0, 3).map((feature: string, idx: number) => (
                              <div key={idx} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                                • {feature}
                              </div>
                            ))}
                            {pkg.features.length > 3 && (
                              <div className="text-xs text-gray-500 italic">
                                +{pkg.features.length - 3} more features
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="text-right mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">Starting From</p>
                        <p className="font-bold text-xl">
                          ICP {priceInICP.toFixed(1)}
                        </p>
                        {/* USD conversion removed - showing only ICP */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback to old tier structure if packages array is empty */}
          {(!formData.packages || formData.packages.length === 0) && (
            <>
              {/* Basic Package */}
              {formData.basicPrice && (
                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-yellow-50 p-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">BASIC</h3>
                  </div>
                  <div className="p-4">
                    <p className="font-medium mb-2">
                      {formData.basicTitle || 'Basic Package'}
                    </p>
                    {formData.basicDescription && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {formData.basicDescription}
                      </p>
                    )}
                    {formData.basicDeliveryDays && (
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <span>Delivery Time</span>
                        <span className="font-medium">{formData.basicDeliveryDays} days</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                      <span>Revisions</span>
                      <span className="font-medium">Included</span>
                    </div>
                    <div className="text-right mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Starting From</p>
                      <p className="font-bold text-2xl text-blue-600">
                        {formData.basicPrice} ICP
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Package - Only show if 3 tier mode */}
              {formData.tierMode === '3tier' && formData.advancedPrice && (
                <div className="mb-6 border-2 border-blue-500 rounded-lg overflow-hidden shadow-md">
                  <div className="bg-green-50 p-3 border-b border-blue-500 relative">
                    <h3 className="font-bold text-gray-800">STANDARD</h3>
                    <span className="absolute top-1 right-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-medium mb-2">
                      {formData.advancedTitle || 'Standard Package'}
                    </p>
                    {formData.advancedDescription && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {formData.advancedDescription}
                      </p>
                    )}
                    {formData.advancedDeliveryDays && (
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <span>Delivery Time</span>
                        <span className="font-medium">{formData.advancedDeliveryDays} days</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                      <span>Revisions</span>
                      <span className="font-medium">Extended</span>
                    </div>
                    <div className="text-right mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Starting From</p>
                      <p className="font-bold text-2xl text-blue-600">
                        {formData.advancedPrice} ICP
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Premium Package - Only show if 3 tier mode */}
              {formData.tierMode === '3tier' && formData.premiumPrice && (
                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-purple-50 p-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">PREMIUM</h3>
                  </div>
                  <div className="p-4">
                    <p className="font-medium mb-2">
                      {formData.premiumTitle || 'Premium Package'}
                    </p>
                    {formData.premiumDescription && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {formData.premiumDescription}
                      </p>
                    )}
                    {formData.premiumDeliveryDays && (
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <span>Delivery Time</span>
                        <span className="font-medium">{formData.premiumDeliveryDays} days</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                      <span>Revisions</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="text-right mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Starting From</p>
                      <p className="font-bold text-2xl text-purple-600">
                        {formData.premiumPrice} ICP
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Service Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold mb-3 text-sm text-gray-700">Service Includes:</h3>
            <div className="space-y-2">
              <div className="flex items-start text-sm">
                <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Professional delivery</span>
              </div>
              <div className="flex items-start text-sm">
                <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Quality guaranteed</span>
              </div>
              <div className="flex items-start text-sm">
                <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Communication support</span>
              </div>
              {formData.portfolioImages.length > 0 && (
                <div className="flex items-start text-sm">
                  <Check size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{formData.portfolioImages.length}+ portfolio samples</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Detailed Package Comparison */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">Package Comparison</h2>

        {/* Display packages from array if available */}
        {formData.packages && formData.packages.length > 0 && (
          <div className={`grid grid-cols-1 gap-6 ${formData.tierMode === '3tier' ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-md mx-auto'}`}>
            {formData.packages.map((pkg: any, index: number) => {
              const isPopular = formData.tierMode === '3tier' && index === 1;
              const priceInICP = parseFloat(pkg.price_e8s.toString()) / 100000000;

              return (
                <div
                  key={pkg.package_id}
                  className={`border-2 rounded-lg p-6 transition-colors ${isPopular
                    ? 'border-blue-500 bg-blue-50 relative'
                    : 'border-gray-200 hover:border-blue-500'
                    }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{pkg.tier}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-blue-600">
                        ICP {priceInICP.toFixed(1)}
                      </span>
                    </div>
                    {/* USD conversion removed - showing only ICP */}
                    <p className="text-sm text-gray-600 mt-2">
                      {pkg.title}
                    </p>
                  </div>

                  {pkg.description && (
                    <div className="mb-6">
                      <p className="text-gray-700 text-sm">
                        {pkg.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>{pkg.delivery_timeline}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>{pkg.revisions_included} {pkg.revisions_included === 1 ? 'revision' : 'revisions'}</span>
                    </div>
                    {pkg.features && pkg.features.length > 0 && (
                      pkg.features.slice(0, 3).map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center text-sm">
                          <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))
                    )}
                    {pkg.features && pkg.features.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        +{pkg.features.length - 3} more features
                      </div>
                    )}
                  </div>

                  <button
                    disabled
                    className="w-full py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                  >
                    Preview Only
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Fallback to old tier structure if packages array is empty */}
        {(!formData.packages || formData.packages.length === 0) && (
          <div className={`grid grid-cols-1 gap-6 ${formData.tierMode === '3tier' ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-md mx-auto'}`}>
            {/* Basic Package */}
            {formData.basicPrice && (
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Basic</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-blue-600">
                      {formData.basicPrice} ICP
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.basicTitle || 'Basic Package'}
                  </p>
                </div>

                {formData.basicDescription && (
                  <div className="mb-6">
                    <p className="text-gray-700 text-sm">
                      {formData.basicDescription}
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {formData.basicDeliveryDays && (
                    <div className="flex items-center text-sm">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>{formData.basicDeliveryDays} days delivery</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Professional service</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Revisions included</span>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                >
                  Preview Only
                </button>
              </div>
            )}

            {/* Advanced Package - Only show if 3 tier mode */}
            {formData.tierMode === '3tier' && formData.advancedPrice && (
              <div className="border-2 border-blue-500 rounded-lg p-6 relative bg-blue-50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Standard</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-blue-600">
                      {formData.advancedPrice} ICP
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.advancedTitle || 'Standard Package'}
                  </p>
                </div>

                {formData.advancedDescription && (
                  <div className="mb-6">
                    <p className="text-gray-700 text-sm">
                      {formData.advancedDescription}
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {formData.advancedDeliveryDays && (
                    <div className="flex items-center text-sm">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>{formData.advancedDeliveryDays} days delivery</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>All Basic features</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Enhanced support</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>More revisions</span>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                >
                  Preview Only
                </button>
              </div>
            )}

            {/* Premium Package - Only show if 3 tier mode */}
            {formData.tierMode === '3tier' && formData.premiumPrice && (
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-500 transition-colors">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Premium</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-purple-600">
                      {formData.premiumPrice} ICP
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.premiumTitle || 'Premium Package'}
                  </p>
                </div>

                {formData.premiumDescription && (
                  <div className="mb-6">
                    <p className="text-gray-700 text-sm">
                      {formData.premiumDescription}
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {formData.premiumDeliveryDays && (
                    <div className="flex items-center text-sm">
                      <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                      <span>{formData.premiumDeliveryDays} days delivery</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>All Standard features</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Unlimited revisions</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Extended support period</span>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                >
                  Preview Only
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  </div>;
}