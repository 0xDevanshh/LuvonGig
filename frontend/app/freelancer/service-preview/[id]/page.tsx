'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Eye, Star, Clock, Package, Users, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Service } from '@/hooks/useServices';
import { useUpdateService } from '@/hooks/useServices';
import { usePackages } from '@/hooks/usePackages';

interface ServicePreviewPageProps { }

export default function ServicePreviewPage({ }: ServicePreviewPageProps) {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const { updateService } = useUpdateService();
  const { packages } = usePackages(serviceId);

  // Check authentication and get user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.success && data.session) {
          setUserEmail(data.session.email);
          setUserId(data.session.userId);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuth();
  }, []);

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/marketplace/services/${serviceId}`);
        const data = await response.json();

        if (data.success) {
          setService(data.data);

          // Check if current user is the owner
          if (userEmail && data.data.freelancer_email === userEmail) {
            setIsOwner(true);
          }
        } else {
          setError(data.error || 'Service not found');
        }
      } catch (err) {
        setError('Failed to load service');
        console.error('Error fetching service:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId, userEmail]);

  // Check ownership after user data is loaded
  useEffect(() => {
    if (service && userEmail) {
      setIsOwner(service.freelancer_email === userEmail);
    }
  }, [service, userEmail]);

  // Get all images for carousel (filter out empty strings and invalid URLs)
  const allImages = [
    ...(service?.cover_image_url ? [service.cover_image_url] : []),
    ...(service?.portfolio_images || [])
  ].filter(url => typeof url === 'string' && url.trim() !== '');

  const handleGoBack = () => {
    router.push('/freelancer/my-services');
  };

  const handleEditService = () => {
    router.push(`/freelancer/update-service/${serviceId}/overview`);
  };

  const handleToggleStatus = async () => {
    if (!isOwner || !service) return;

    setIsUpdating(true);
    setNotification(null);

    const newStatus = service.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const result = await updateService(userEmail!, serviceId, { status: newStatus });

      if (result.success) {
        setService(prev => prev ? { ...prev, status: newStatus } : null);
        setNotification({
          type: 'success',
          title: 'Service Updated',
          message: `Service status changed to ${newStatus}`
        });
      } else {
        setNotification({
          type: 'error',
          title: 'Update Failed',
          message: result.error || 'Failed to update service status'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'An error occurred while updating the service'
      });
    } finally {
      setIsUpdating(false);
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

  // Format date — the API already converts nanoseconds to milliseconds
  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return 'N/A';
    // If timestamp looks like nanoseconds (>1e15), convert; otherwise treat as milliseconds
    const ms = timestamp > 1e15 ? timestamp / 1e6 : (timestamp > 1e12 ? timestamp : timestamp * 1000);
    const date = new Date(ms);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-4">
            <Button onClick={handleGoBack} variant="outline">
              Go Back
            </Button>
            <Link href="/freelancer/my-services">
              <Button>My Services</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Service not found
  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <p className="text-gray-600 mb-8">The service you're looking for doesn't exist or has been removed.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleGoBack} variant="outline">
              Go Back
            </Button>
            <Link href="/freelancer/my-services">
              <Button>My Services</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>{notification.title}</AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 py-4 px-6 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleGoBack}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {service.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Badge variant={service.status === 'Active' ? 'default' : 'secondary'}>
                  {service.status}
                </Badge>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {service.main_category}
                </span>
                {service.sub_category && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {service.sub_category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isOwner && (
              <>
                <Button
                  onClick={handleToggleStatus}
                  disabled={isUpdating}
                  variant="outline"
                  size="sm"
                >
                  {isUpdating ? 'Updating...' : `Mark as ${service.status === 'Active' ? 'Inactive' : 'Active'}`}
                </Button>
                <Button
                  onClick={handleEditService}
                  className="bg-rainbow-gradient text-white hover:opacity-90"
                  size="sm"
                >
                  <Edit size={16} className="mr-1" />
                  Edit Service
                </Button>
              </>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link href={`/client/service/${serviceId}`}>
                <Eye size={16} className="mr-1" />
                View as Client
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Notification when not owner */}
        {!isOwner && (
          <Alert className="mb-8">
            <Eye className="h-4 w-4" />
            <AlertTitle>Public View</AlertTitle>
            <AlertDescription>
              This is how clients see your service. You can edit this service from your dashboard.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            {allImages.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Service Gallery</h2>
                  <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={allImages[currentImageIndex]}
                      alt={`${service.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: '400px' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />

                    {/* Image Navigation */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={goToPreviousImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={goToNextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    {/* Image Indicators */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {allImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => selectImage(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex
                              ? 'bg-blue-600'
                              : 'bg-white/70 hover:bg-white'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image Counter */}
                  <div className="text-center mt-2 text-sm text-gray-600">
                    {currentImageIndex + 1} of {allImages.length}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About This Service</h2>
                <div className="prose max-w-none text-gray-700">
                  <p>{service.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">What's Included</h2>
                <div className="prose max-w-none text-gray-700">
                  <p>{service.whats_included}</p>
                </div>
              </CardContent>
            </Card>

            {/* Packages */}
            {(service.packages || (packages && packages.length > 0)) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 mb-6">Packages</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(service.packages || packages).map((pkg: any, index: number) => {
                      const isPopular = service.packages ?
                        service.packages.length === 3 && index === 1 :
                        packages.length === 3 && index === 1;

                      return (
                        <Card key={pkg.package_id || index} className="relative">
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-blue-600 text-white">
                                Most Popular
                              </Badge>
                            </div>
                          )}

                          <CardHeader>
                            <h3 className="text-lg font-semibold">{pkg.title}</h3>
                            <div className="text-2xl font-bold text-gray-900">
                              ${(parseFloat(pkg.price_minor.toString()) / 100).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {pkg.delivery_timeline || `${pkg.delivery_days} days delivery`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {pkg.revisions_included} {pkg.revisions_included === 1 ? 'revision' : 'revisions'} included
                            </div>
                          </CardHeader>

                          <CardContent>
                            <div className="space-y-2">
                              {(pkg.features || []).length > 0 && (
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {(pkg.features || []).slice(0, 5).map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                  {(pkg.features || []).length > 5 && (
                                    <li className="text-xs text-gray-500 italic">
                                      +{(pkg.features || []).length - 5} more features
                                    </li>
                                  )}
                                </ul>
                              )}

                              <Button
                                className="w-full mt-4 bg-rainbow-gradient text-white hover:opacity-90"
                                asChild
                              >
                                <Link href={`/client/service/${service.service_id}?package=${pkg.package_id}`}>
                                  Select Package
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client Questions */}
            {service.client_questions && service.client_questions.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Client Questions</h2>
                  <p className="text-gray-600 mb-4">Questions that will be asked to clients when they book this service:</p>
                  <div className="space-y-3">
                    {service.client_questions.map((question: any) => (
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
                </CardContent>
              </Card>
            )}

            {/* FAQs */}
            {service.faqs && service.faqs.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {service.faqs.map((faq: any) => (
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Service Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Service Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Rating
                    </span>
                    <span className="font-medium">
                      {service.rating_avg.toFixed(1)} ({service.review_count || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Orders
                    </span>
                    <span className="font-medium">{service.total_orders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      Created
                    </span>
                    <span className="font-medium">{formatDate(service.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Freelancer Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Service Provider</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Email</span>
                    <p className="font-medium text-gray-900 break-all">
                      {service.freelancer_email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {isOwner && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push(`/freelancer/update-service/${serviceId}/overview`)}
                      className="w-full bg-rainbow-gradient text-white hover:opacity-90"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Details
                    </Button>
                    <Button
                      onClick={() => router.push(`/freelancer/update-service/${serviceId}/pricing`)}
                      variant="outline"
                      className="w-full"
                    >
                      <Package size={16} className="mr-2" />
                      Edit Packages
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Contact & Support</h3>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600">
                    Have questions about this service? Feel free to reach out!
                  </p>
                  <Button className="w-full" asChild>
                    <Link href={`/client/service/${service.service_id}`}>
                      <Eye size={16} className="mr-2" />
                      Contact Provider
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}