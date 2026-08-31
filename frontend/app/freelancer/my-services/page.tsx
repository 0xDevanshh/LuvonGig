'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Eye, Plus, MoreHorizontal } from 'lucide-react'
import { useServices, useDeleteService, useUpdateService } from '@/hooks/useServices'
import { usePackages } from '@/hooks/usePackages'
export default function MyServices() {
  const navigate = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Console logging for debugging
  console.log('🔍 MY-SERVICES PAGE - Component State Update');
  console.log('Current state:', { userId, userEmail, isCheckingAuth });

  // Date formatting utilities
  const formatDate = (timestamp: number | string | undefined | null) => {
    if (!timestamp) return 'Date not set';

    try {
      let date: Date;
      
      if (typeof timestamp === 'number') {
        // The API already converts from nanoseconds to milliseconds
        // So timestamp should already be in milliseconds
        // Nanoseconds are 16+ digits (> 1e15), milliseconds are 13 digits (e.g., 1704067200000)
        // So we only convert if it's > 1e15 (still in nanoseconds)
        if (timestamp > 1e15) {
          // Still in nanoseconds, convert to milliseconds
          date = new Date(timestamp / 1000000);
        } else {
          // Already in milliseconds, use directly
          date = new Date(timestamp);
        }
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date from timestamp:', timestamp);
        return 'Invalid date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Date format error';
    }
  };

  const getRelativeTime = (timestamp: number | string | undefined | null) => {
    if (!timestamp) return '';

    try {
      // Handle both millisecond and nanosecond timestamps
      let date: Date;
      let processedTimestamp: number;

      if (typeof timestamp === 'number') {
        // The API already converts from nanoseconds to milliseconds
        // So timestamp should already be in milliseconds
        // Nanoseconds are 16+ digits (> 1e15), milliseconds are 13 digits (e.g., 1704067200000)
        // So we only convert if it's > 1e15 (still in nanoseconds)
        if (timestamp > 1e15) {
          // Still in nanoseconds, convert to milliseconds
          processedTimestamp = timestamp / 1000000;
          date = new Date(processedTimestamp);
        } else {
          // Already in milliseconds, use directly
          processedTimestamp = timestamp;
          date = new Date(timestamp);
        }
      } else if (typeof timestamp === 'string') {
        // If it's a formatted date string, parse it
        const parsed = parseFloat(timestamp);
        if (!isNaN(parsed)) {
          // It's a number string, treat same as number
          if (parsed > 1e15) {
            processedTimestamp = parsed / 1000000;
          } else {
            processedTimestamp = parsed;
          }
          date = new Date(processedTimestamp);
        } else {
          // It's a date string, parse directly
        date = new Date(timestamp);
          processedTimestamp = date.getTime();
        }
      } else {
        console.warn('Invalid timestamp format:', timestamp);
        return 'Unknown';
      }

      if (isNaN(date.getTime())) {
        console.warn('Invalid date from timestamp:', timestamp, 'processed:', processedTimestamp);
        return 'Unknown';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      console.log('🕐 Relative time calculation:', {
        input: timestamp,
        processed: processedTimestamp,
        date: date.toISOString(),
        now: now.toISOString(),
        diffMs,
        diffDays,
        years: Math.floor(diffDays / 365)
      });

      if (diffDays < 0) return 'Today'; // Handle future dates
      if (diffDays < 1) return 'Today';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      console.warn('Relative time calculation error:', error);
      return '';
    }
  };

  // Get current user data from session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try the session endpoint first
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        
        console.log('🔐 Session Response Received:', data);

        if (data.success && data.session) {
          console.log('✅ Session successful - Setting user data:', data.session);
          setUserId(data.session.userId)
          setUserEmail(data.session.email)
        } else {
          // Fallback to /api/auth/me
          console.log('🔄 Session failed, trying /api/auth/me...');
          const meResponse = await fetch('/api/auth/me')
          const meData = await meResponse.json()
          
          console.log('🔐 Me Response Received:', meData);

          if (meData.success && meData.session) {
            console.log('✅ Me successful - Setting user data:', meData.session);
            setUserId(meData.session.userId)
            setUserEmail(meData.session.email)
          } else {
            console.log('❌ Both auth methods failed - Setting user data to null');
            setUserId(null)
            setUserEmail(null)
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setUserId(null)
        setUserEmail(null)
      } finally {
        console.log('🔍 Auth check completed');
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  // Fetch services using the hook with email filter only when userEmail is available
  // IMPORTANT: Don't fetch if userEmail is not available yet - this prevents showing all services
  const { services: fetchedServices, loading, error, refetch } = useServices(
    userEmail || undefined, 
    {
      freelancer_email: userEmail || undefined, // Filter by user's email - MUST be set to filter
    limit: 50
    }
  )
  
  // Log the filter being used
  console.log('🔍 My Services - Filter Configuration:', {
    userEmail,
    userId,
    isCheckingAuth,
    willFilter: !!userEmail
  });

  // Console log services data
  console.log('📋 Services Hook Data:', { fetchedServices, loading, error, userEmail });

  // Delete and update service hooks
  const { deleteService } = useDeleteService()
  const { updateService } = useUpdateService()

  // Format price to show up to 8 decimal places (ICP precision), removing trailing zeros
  const formatICPPrice = (price: number): string => {
    // Show up to 8 decimal places (ICP precision), remove trailing zeros
    const formatted = price.toFixed(8);
    // Remove trailing zeros and decimal point if not needed
    return formatted.replace(/\.?0+$/, '');
  };

  // Transform services data for UI display
  const transformServiceData = (service: any) => {
    // Date handling: API converts from nanoseconds to milliseconds by dividing by 1000000
    // So created_at should already be in milliseconds
    let createdDate: string;
    let createdTimestamp: number;

    if (!service.created_at) {
      // Fallback to current date for missing timestamps
      createdTimestamp = Date.now();
      createdDate = new Date().toISOString().split('T')[0];
    } else {
      try {
        // Convert to number regardless of type
        let rawTimestamp: number;
        
        if (typeof service.created_at === 'bigint') {
          rawTimestamp = Number(service.created_at);
        } else if (typeof service.created_at === 'number') {
          rawTimestamp = service.created_at;
        } else {
          // String or other type
          rawTimestamp = parseFloat(String(service.created_at));
          if (isNaN(rawTimestamp)) {
            throw new Error('Cannot parse timestamp');
          }
        }

        // The API already converted from nanoseconds to milliseconds
        // So rawTimestamp should be in milliseconds
        // However, if it's still very large (> 1e15), it might still be in nanoseconds
        // Normal millisecond timestamps are 13 digits (e.g., 1704067200000 for 2024)
        
        if (rawTimestamp > 1e15) {
          // Still in nanoseconds (very large), convert to milliseconds
          createdTimestamp = Math.round(rawTimestamp / 1000000);
        } else {
          // Already in milliseconds (API already converted)
          createdTimestamp = Math.round(rawTimestamp);
        }

        // Create date object
        const date = new Date(createdTimestamp);
        
        // Validate date
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date from timestamp');
        }

        // Check if date is reasonable (not before 2000)
        const year = date.getFullYear();
        if (year < 2000) {
          // Date seems too old, try alternative conversion
          // Maybe the timestamp wasn't converted correctly
          console.warn('⚠️ Date seems too old:', year, 'from timestamp:', service.created_at);
          
          // Try treating as microseconds (divide by 1000 instead of 1000000)
          const microsecondTimestamp = Math.round(rawTimestamp / 1000);
          const microsecondDate = new Date(microsecondTimestamp);
          
          if (!isNaN(microsecondDate.getTime())) {
            const microsecondYear = microsecondDate.getFullYear();
            if (microsecondYear >= 2000 && microsecondYear <= 2100) {
              console.log('✅ Using microsecond conversion (divide by 1000)');
              createdTimestamp = microsecondTimestamp;
              createdDate = microsecondDate.toISOString().split('T')[0];
            } else {
              // Fallback to current date
              console.warn('⚠️ Microsecond conversion also failed, using current date');
              createdTimestamp = Date.now();
        createdDate = new Date().toISOString().split('T')[0];
      }
          } else {
            // Fallback to current date
            createdTimestamp = Date.now();
        createdDate = new Date().toISOString().split('T')[0];
      }
    } else {
          // Date is valid
          createdDate = date.toISOString().split('T')[0];
        }

        console.log('📅 Date conversion:', {
          raw: service.created_at,
          rawType: typeof service.created_at,
          rawTimestamp: rawTimestamp,
          converted: createdTimestamp,
          date: new Date(createdTimestamp).toISOString(),
          year: new Date(createdTimestamp).getFullYear(),
          formatted: createdDate
        });
      } catch (error) {
        console.warn('Invalid timestamp format:', service.created_at, error);
        createdTimestamp = Date.now();
        createdDate = new Date().toISOString().split('T')[0];
      }
    }

    // Calculate minimum price from embedded packages
    // Store as number to preserve precision, format on display
    let minPrice = 0;
    if (service.packages && service.packages.length > 0) {
      try {
        const prices = service.packages
          .filter((pkg: any) => pkg.price_e8s && pkg.status === 'Available')
          .map((pkg: any) => {
            const price = typeof pkg.price_e8s === 'string'
              ? parseFloat(pkg.price_e8s) / 100000000
              : Number(pkg.price_e8s) / 100000000;
            return price;
          });

        if (prices.length > 0) {
          minPrice = Math.min(...prices);
        }
      } catch (error) {
        console.warn('Error calculating minimum price for service:', service.service_id, error);
        minPrice = 0;
      }
    }

    // Get cover image with better fallback logic
    const getCoverImage = (service: any) => {
      // Handle different image data formats from API
      if (service.cover_image_url) {
        // If cover_image_url is a string, use it directly
        if (typeof service.cover_image_url === 'string' && service.cover_image_url.trim()) {
          return service.cover_image_url;
        }
        // If cover_image_url is an array with items, use the first one
        if (Array.isArray(service.cover_image_url) && service.cover_image_url.length > 0) {
          return service.cover_image_url[0];
        }
      }

      // Try portfolio images as fallback
      if (service.portfolio_images && Array.isArray(service.portfolio_images) && service.portfolio_images.length > 0) {
        return service.portfolio_images[0];
      }

      // Use category-specific placeholder images (SVG format)
      const categoryPlaceholders: Record<string, string> = {
        'Web Development': '/images/web-dev-placeholder.svg',
        'Web Designer': '/images/web-design-placeholder.svg',
        'Mobile Development': '/images/web-dev-placeholder.svg',
        'UI/UX Design': '/images/web-design-placeholder.svg',
        'Backend Development': '/images/web-dev-placeholder.svg',
        'Full Stack Development': '/images/web-dev-placeholder.svg',
        'DevOps': '/images/web-dev-placeholder.svg',
        'Database Development': '/images/web-dev-placeholder.svg'
      };

      return categoryPlaceholders[service.main_category] || '/images/default-service-placeholder.svg';
    };

    return {
      id: service.service_id,
      title: service.title,
      category: service.main_category,
      subCategory: service.sub_category,
      price: minPrice, // Store as number
      priceFormatted: formatICPPrice(minPrice), // Formatted string for display
      coverImage: getCoverImage(service),
      coverImages: Array.isArray(service.portfolio_images) ? service.portfolio_images : [],
      // Status comes as 'Active' or 'Paused' from API, normalize to lowercase for comparison
      status: (() => {
        const rawStatus = service.status;
        const normalizedStatus = rawStatus ? (typeof rawStatus === 'string' ? rawStatus.toLowerCase() : 'active') : 'active';
        console.log(`📊 Service ${service.service_id} status:`, {
          raw: rawStatus,
          normalized: normalizedStatus,
          type: typeof rawStatus
        });
        return normalizedStatus;
      })(),
      views: 0, // Mock data doesn't include view count
      orders: service.total_orders || 0,
      rating: service.rating_avg || 0,
      createdAt: createdTimestamp, // Store timestamp for proper date calculations
      createdAtDisplay: createdDate, // Store formatted date for display
      description: service.description,

      // NEW FIELDS FOR DISPLAY
      tierMode: service.tier_mode || '3tier',
      clientQuestions: service.client_questions || [],
      faqs: service.faqs || [],
      packages: service.packages || [],
      freelancerEmail: service.freelancer_email || ''
    }
  }

  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Process services with embedded packages (no separate API calls needed)
  const processServicesWithEmbeddedData = (servicesData: any[]) => {
    console.log('💰 Processing services with embedded packages for', servicesData.length, 'services');

    const processedServices = servicesData
      .map((service) => {
      const transformedService = transformServiceData(service);

      // Log the complete service data including new fields
      console.log(`📊 Complete service data for ${service.service_id}:`, {
        title: transformedService.title,
        price: transformedService.price,
        tierMode: transformedService.tierMode,
        packagesCount: transformedService.packages.length,
        faqsCount: transformedService.faqs.length,
        clientQuestionsCount: transformedService.clientQuestions.length,
        freelancerEmail: transformedService.freelancerEmail
      });

      return transformedService;
    })
      .filter((service) => service.status !== 'deleted');

    console.log('✅ All services with embedded data processed:', processedServices);
    return processedServices
  }

  // Update services when fetched data changes
  useEffect(() => {
    console.log('🔄 Services data changed:', { loading, error, fetchedServicesLength: fetchedServices.length });

    if (loading) {
      console.log('⏳ Services loading...');
      setIsLoading(true)
    } else if (error) {
      console.error('❌ Error fetching services:', error)
      setServices([])
      setIsLoading(false)
    } else {
      if (fetchedServices.length > 0) {
        console.log('✅ Services loaded successfully:', fetchedServices.length, 'services');
        console.log('📊 Raw service data:', fetchedServices);

        // Process services with embedded packages and pricing
        const processedServices = processServicesWithEmbeddedData(fetchedServices)
        console.log('🔄 Processed services with embedded data:', processedServices);

        setServices(processedServices)
        setIsLoading(false)
      } else {
        console.log('ℹ️ No services found');
        setServices([])
        setIsLoading(false)
      }
    }
  }, [fetchedServices, loading, error])

  // Only set loading to false when userId is null and auth check is complete
  useEffect(() => {
    if (!isCheckingAuth && !userId) {
      setIsLoading(false)
    }
  }, [userId, isCheckingAuth])
  const handleAddService = () => {
    navigate.push('/freelancer/add-service/overview')
  }
  const handleEditService = (serviceId: string) => {
    navigate.push(`/freelancer/update-service/${serviceId}/overview`)
  }
  const handleViewService = (serviceId: string) => {
    navigate.push(`/freelancer/service-preview/${serviceId}`)
  }
  const handleDeleteService = async (serviceId: string) => {
    if (
      confirm(
        'Are you sure you want to delete this service? This action cannot be undone.',
      )
    ) {
      console.log('🗑️ Delete Service - Initiating deletion for service:', serviceId);

      try {
        // Make API call to delete from canister
        // The API will automatically get user info from the session
        const response = await fetch(`/api/marketplace/services/${serviceId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        const result = await response.json()
        console.log('📡 Delete Service - API Response:', result);

        if (result.success) {
          // Remove from local state
          setServices(services.filter((service) => service.id !== serviceId))
          // Refresh the data from server
          refetch()
          alert('Service deleted successfully!')
        } else {
          console.error('❌ Delete Service - API Error:', result.error);
          alert('Failed to delete service: ' + (result.error || 'Unknown error'))
        }
      } catch (error) {
        console.error('❌ Delete Service - Network Error:', error)
        alert('Failed to delete service. Please try again.')
      }
    }
  }

  const handleToggleStatus = async (serviceId: string, currentStatus: string) => {
    // Check if user email is available
    if (!userEmail) {
      console.error('❌ Cannot toggle status: userEmail is not available');
      alert('Failed to update service status: User email not found. Please log in again.');
      return;
    }

    // Normalize status for comparison (handle both 'active' and 'Active', 'paused' and 'Paused')
    const normalizedStatus = currentStatus?.toLowerCase() || 'active';
    const newStatus = normalizedStatus === 'active' ? 'Paused' : 'Active';

    console.log('🔄 Toggling service status:', {
      serviceId,
      currentStatus,
      normalizedStatus,
      newStatus,
      userEmail,
      userId
    });

    try {
      // Pass userId if available, otherwise it will be fetched in the hook
      const result = await updateService(userEmail, serviceId, { status: newStatus }, userId || undefined);
      
      console.log('📡 Update Service Status - API Response:', result);
      
      if (result.success) {
        // Update local state with new status
        setServices(
          services.map((service) =>
            service.id === serviceId
              ? {
                  ...service,
                  status: newStatus.toLowerCase(),
                }
              : service,
          ),
        );
        
        // Refresh data from server to ensure consistency
        refetch();
        
        alert(`Service status updated to ${newStatus} successfully!`);
      } else {
        console.error('❌ Update Service Status - API Error:', result.error);
        alert('Failed to update service status: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error updating service status:', error);
      alert('Failed to update service status. Please try again.');
    }
  }
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
              <p className="text-gray-600">
                Manage and update your service offerings
              </p>
            </div>
            <Button onClick={handleAddService} className="flex items-center bg-[linear-gradient(to_right,_#44B0FF,_#973EEE,_#F12AE6,_#FF7039,_#F3BC3B)] text-white">
              <Plus size={18} className="mr-2" />
              Add New Service
            </Button>
          </div>
          {isCheckingAuth || isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">
                  {isCheckingAuth ? 'Checking authentication...' : 'Loading your services...'}
                </p>
              </div>
            </div>
          ) : !userId ? (
            <Card className="text-center p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-yellow-600"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Please Log In</h2>
                <p className="text-gray-600 max-w-md">
                  You need to be logged in to view and manage your services.
                </p>
                <Button onClick={() => navigate.push('/login')} className="mt-2">
                  Log In to Continue
                </Button>
              </div>
            </Card>
          ) : error ? (
            <Card className="text-center p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-red-600"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Error Loading Services</h2>
                <p className="text-gray-600 max-w-md">
                  {error}
                </p>
                <Button onClick={() => refetch()} className="mt-2" variant="outline">
                  Try Again
                </Button>
              </div>
            </Card>
          ) : services.length === 0 ? (
            <Card className="text-center p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">No services yet</h2>
                <p className="text-gray-600 max-w-md">
                  You haven't created any services yet. Add your first service
                  to start selling your skills.
                </p>
                <Button onClick={handleAddService} className="mt-2">
                  <Plus size={18} className="mr-2" />
                  Add Your First Service
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 h-48 md:h-auto relative">
                      {/* Main cover image */}
                      <img
                        src={service.coverImage}
                        alt={service.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-service-placeholder.svg';
                        }}
                      />

                      {/* Show multiple images indicator */}
                      {service.coverImages && service.coverImages.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                          +{service.coverImages.length - 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                            {service.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <span>{service.category}</span>
                            <span className="mx-2">•</span>
                            <span>{service.priceFormatted || formatICPPrice(service.price || 0)} ICP</span>
                          </div>
                          <Badge
                            variant={
                              service.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                            className="mb-4"
                          >
                            {service.status === 'active' ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleToggleStatus(service.id, service.status)
                            }
                          >
                            {service.status === 'active' ? (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                              </svg>
                            ) : (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewService(service.id)}
                          >
                            <Eye size={16} />
                          </Button>
                        </div>
                      </div>
                      {/* Views, Orders, and Ratings - Commented out as requested */}
                      {/* <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Views</p>
                          <p className="font-medium">{service.views}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Orders</p>
                          <p className="font-medium">{service.orders}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rating</p>
                          <p className="font-medium flex items-center">
                            {service.rating}
                            <span className="text-yellow-400 ml-1">★</span>
                          </p>
                        </div>
                      </div> */}
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500">
                          <div className="flex flex-col gap-1">
                            <span>Created {formatDate(service.createdAt || service.createdAtDisplay)}</span>
                            <span className="text-gray-400">({getRelativeTime(service.createdAt)})</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleEditService(service.id)}
                          >
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
