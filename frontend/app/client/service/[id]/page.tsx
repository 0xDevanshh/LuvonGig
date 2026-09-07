'use client'
import React, { useState, useEffect } from 'react';
import { getUserProfileByEmail } from '@/lib/user-profile';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Save, Share2, Star, CreditCard, PackageSearch } from 'lucide-react';
import { useBookPackage } from '@/hooks/usePackages';
import { formatMoney, toMajorUnits } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
export default function ServiceDetails() {
  const navigate = useRouter();
  const { id } = useParams<{ id: string }>();
  const [selectedTier, setSelectedTier] = useState('basic');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingNotes, setBookingNotes] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [freelancerProfile, setFreelancerProfile] = useState<any>(null);
  const [activeBookingsCount, setActiveBookingsCount] = useState<number>(0);

  // Fetch current user session
  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await fetch('/api/auth/session');

        if (!response.ok) {
          console.warn('Session API returned error:', response.status);
          return;
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
          console.warn('Empty response from session API');
          return;
        }

        const data = JSON.parse(text);

        if (data.success && data.session && data.session.email) {
          setCurrentUserEmail(data.session.email);
        } else {
          // If no session, you might want to redirect to login or show a message
          console.warn('No active user session found');
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    fetchUserSession();
  }, []);

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/marketplace/services/${id}`);

        if (!response.ok) {
          console.error('Service API returned error:', response.status);
          setLoading(false);
          return;
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
          console.error('Empty response from service API');
          setLoading(false);
          return;
        }

        const data = JSON.parse(text);

        if (data.success) {
          setService(data.data);

          // Fetch freelancer profile data
          if (data.data.freelancer_email) {
            fetchFreelancerProfile(data.data.freelancer_email);
            fetchActiveBookingsCount(data.data.freelancer_email);
          }
        } else {
          console.error('Failed to fetch service:', data.error);
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id]);

  // Fetch freelancer profile data
  const fetchFreelancerProfile = async (email: string) => {
    try {
      const profile = await getUserProfileByEmail(email);
      if (profile) {
        setFreelancerProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching freelancer profile:', error);
    }
  };

  // Fetch active bookings count for freelancer
  const fetchActiveBookingsCount = async (freelancerEmail: string) => {
    try {
      // Use correct API parameters: user_id and user_type
      const response = await fetch(
        `/api/marketplace/bookings?user_id=${encodeURIComponent(freelancerEmail)}&user_type=freelancer&status=Active`
      );

      if (!response.ok) {
        console.warn('Bookings API returned error:', response.status);
        // Try to fetch all bookings as fallback
        try {
          const allBookingsResponse = await fetch(
            `/api/marketplace/bookings?user_id=${encodeURIComponent(freelancerEmail)}&user_type=freelancer`
          );

          if (allBookingsResponse.ok) {
            const text = await allBookingsResponse.text();
            if (text && text.trim() !== '') {
              const allBookingsData = JSON.parse(text);
              if (allBookingsData.success && allBookingsData.data) {
                const activeCount = allBookingsData.data.filter((b: any) =>
                  b.status === 'Active' || b.status === 'InProgress' || b.status === 'Pending'
                ).length;
                setActiveBookingsCount(activeCount);
              }
            }
          }
        } catch (fallbackError) {
          console.error('Error in fallback bookings fetch:', fallbackError);
        }
        return;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('Empty response from bookings API');
        return;
      }

      const data = JSON.parse(text);

      if (data.success && data.data) {
        setActiveBookingsCount(data.data.length || 0);
      } else {
        // If API fails, try to count from all bookings
        try {
          const allBookingsResponse = await fetch(
            `/api/marketplace/bookings?user_id=${encodeURIComponent(freelancerEmail)}&user_type=freelancer`
          );

          if (allBookingsResponse.ok) {
            const fallbackText = await allBookingsResponse.text();
            if (fallbackText && fallbackText.trim() !== '') {
              const allBookingsData = JSON.parse(fallbackText);
              if (allBookingsData.success && allBookingsData.data) {
                const activeCount = allBookingsData.data.filter((b: any) =>
                  b.status === 'Active' || b.status === 'InProgress' || b.status === 'Pending'
                ).length;
                setActiveBookingsCount(activeCount);
              }
            }
          }
        } catch (fallbackError) {
          console.error('Error in fallback bookings fetch:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error fetching active bookings count:', error);
    }
  };

  // Packages are now embedded in service data, no separate fetch needed

  // Book package hook
  const { bookPackage, loading: bookingLoading } = useBookPackage();

  const handleBookPackage = async (packageId: string) => {
    if (!packageId) {
      alert('Please select a package');
      return;
    }

    // Check if user is authenticated
    if (!currentUserEmail) {
      alert('Please log in to book a service');
      return;
    }

    const result = await bookPackage(currentUserEmail, packageId, bookingNotes.trim());

    if (result.success) {
      // Check chat initiation status
      const chatData = result.data?.chat;
      const chatInitiated = chatData?.success;
      const freelancerEmail = result.data?.participants?.freelancer;
      const serviceTitle = result.data?.serviceTitle;

      console.log('📊 Booking result:', {
        chatInitiated,
        chatData,
        freelancerEmail,
        serviceTitle
      });

      let message = '🎉 Package booked successfully!';

      if (chatInitiated) {
        message += ' Chat session has been created with the freelancer.';

        // Show enhanced success dialog with chat option
        const goToChat = window.confirm(
          `${message}\n\nService: ${serviceTitle}\n\nWould you like to start chatting with the freelancer now?`
        );

        if (goToChat && freelancerEmail) {
          navigate.push(`/client/chat?with=${encodeURIComponent(freelancerEmail)}`);
          return;
        }
      } else {
        // Handle chat initiation failure gracefully
        console.warn('⚠️ Chat initiation failed:', chatData);

        if (chatData?.canisterOffline) {
          // Chat canister is offline - provide helpful guidance
          const tryChatLater = window.confirm(
            `🎉 Package booked successfully!\n\nService: ${serviceTitle}\n\n${chatData.details}\n\nWould you like to navigate to the chat page anyway? You can start chatting when the service is back online.`
          );

          if (tryChatLater && freelancerEmail) {
            navigate.push(`/client/chat?with=${encodeURIComponent(freelancerEmail)}`);
            return;
          }
        } else if (chatData?.error) {
          message += ` \n\n⚠️ Chat setup failed: ${chatData.error}`;
          message += ' \nYou can still contact the freelancer through your projects page.';
        } else {
          message += ' \nYou can contact the freelancer through your projects page.';
        }
      }

      alert(message);
      navigate.push('/client/projects');
    } else {
      alert('❌ Failed to book package: ' + result.error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <EmptyState
          icon={PackageSearch}
          title="Service not found"
          description="The service you're looking for doesn't exist or may have been removed."
          action={
            <Button asChild>
              <Link href="/client/browse-services">Browse other services</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Get joined year from service creation date (as proxy for user join date)
  const getJoinedYear = () => {
    if (service?.created_at) {
      // created_at is in milliseconds, convert to year
      const year = new Date(service.created_at).getFullYear();
      return year.toString();
    }
    // Fallback to current year if no date available
    return new Date().getFullYear().toString();
  };

  // Get profile image from freelancer profile or use default
  const getProfileImage = () => {
    if (freelancerProfile?.profileImage) {
      return freelancerProfile.profileImage;
    }
    // Generate a default avatar based on email initial
    const initial = service.freelancer_email ? service.freelancer_email.charAt(0).toUpperCase() : 'U';
    return `https://ui-avatars.com/api/?name=${initial}&background=random&color=fff&size=300`;
  };

  // Get location from freelancer profile
  const getLocation = () => {
    if (freelancerProfile?.location) {
      return freelancerProfile.location;
    }
    return 'Remote';
  };

  // Prepare real service data for display
  const serviceData = {
    id: service.service_id,
    title: service.title,
    seller: {
      name: freelancerProfile?.displayName ||
        (freelancerProfile?.firstName && freelancerProfile?.lastName
          ? `${freelancerProfile.firstName} ${freelancerProfile.lastName}`.trim()
          : `Freelancer ${service.freelancer_email ? service.freelancer_email.split('@')[0] : 'Unknown'}`),
      location: getLocation(),
      joinedYear: getJoinedYear(),
      avatar: getProfileImage(),
      rating: service.rating_avg,
      reviews: `${service.total_orders}+`
    },
    images: service.portfolio_images.length > 0 ? service.portfolio_images : [service.cover_image_url || "/default-service.svg"],
    description: service.description,
    features: service.whats_included ? service.whats_included.split(',').map((item: string) => item.trim()) : [],
    additionalInfo: service.description ? [service.description] : [],
    tiers: service.packages ? service.packages.reduce((acc: any, pkg: any) => {
      acc[pkg.tier.toLowerCase()] = {
        name: pkg.tier,
        price: toMajorUnits(pkg.price_minor, pkg.currency),
        priceLabel: formatMoney(pkg.price_minor, pkg.currency),
        description: pkg.description,
        deliveryDays: pkg.delivery_days,
        deliveryTimeline: pkg.delivery_timeline || `${pkg.delivery_days} days`,
        revisions: pkg.revisions_included,
        packageId: pkg.package_id
      };
      return acc;
    }, {}) : {},
    tierComparison: generateTierComparison(service.packages || []),
    faqs: service.faqs || [],
    similarServices: service.similarServices || [],
    comments: [], // TODO: Implement real reviews later
    ratings: {
      average: service.rating_avg || 0,
      total: service.total_orders || 0,
      distribution: generateRatingDistribution(service.rating_avg || 0, service.total_orders || 0)
    }
  };

  // Helper function to generate tier comparison from real package data
  function generateTierComparison(packages: any[]) {
    const tiers = packages.map(pkg => pkg.tier);
    const headers = ['Service Tiers', ...tiers];

    const rows = [];

    // Delivery timeline row
    rows.push([
      'Delivery Timeline',
      ...packages.map(pkg => pkg.delivery_timeline || `${pkg.delivery_days} Days`)
    ]);

    // Revisions row
    rows.push([
      'Revisions Included',
      ...packages.map(pkg => `${pkg.revisions_included}`)
    ]);

    // Features comparison
    const allFeatures = new Set<string>();
    packages.forEach(pkg => {
      pkg.features.forEach((feature: string) => allFeatures.add(feature));
    });

    allFeatures.forEach(feature => {
      rows.push([
        feature,
        ...packages.map(pkg => pkg.features.includes(feature) ? '✓' : '')
      ]);
    });

    return { headers, rows };
  }

  // Helper function to generate rating distribution
  function generateRatingDistribution(averageRating: number, totalRatings: number) {
    if (totalRatings === 0) {
      return [
        { stars: 5, percentage: 0 },
        { stars: 4, percentage: 0 },
        { stars: 3, percentage: 0 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 }
      ];
    }

    // Simple distribution based on average rating
    const basePercentage = averageRating * 20;
    return [
      { stars: 5, percentage: Math.round(basePercentage) },
      { stars: 4, percentage: Math.round((100 - basePercentage) * 0.6) },
      { stars: 3, percentage: Math.round((100 - basePercentage) * 0.3) },
      { stars: 2, percentage: Math.round((100 - basePercentage) * 0.08) },
      { stars: 1, percentage: Math.round((100 - basePercentage) * 0.02) }
    ];
  }
  const handleContinue = async () => {
    // Find the selected package from embedded data
    const selectedPackage = service.packages ? service.packages.find((pkg: any) => pkg.tier.toLowerCase() === selectedTier) : null;

    if (!selectedPackage) {
      alert('Please select a package');
      return;
    }

    // Redirect to payment page with package details
    const paymentUrl = `/client/payment/${id}?packageId=${selectedPackage.package_id}&tier=${selectedTier}&instructions=${encodeURIComponent(bookingNotes.trim())}`;
    navigate.push(paymentUrl);
  };
  const handleBack = () => {
    navigate.push('/client/browse-services');
  };
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };
  const goToPreviousImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? serviceData.images.length - 1 : prev - 1);
  };
  const goToNextImage = () => {
    setCurrentImageIndex(prev => prev === serviceData.images.length - 1 ? 0 : prev + 1);
  };
  return <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-6">
      <button onClick={handleBack} className="mb-4 flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="mb-4 font-heading text-h1 font-semibold text-foreground">
            {serviceData.title}
          </h1>
          <div className="mb-6 flex items-center">
            <img src={serviceData.seller.avatar} alt={serviceData.seller.name} className="mr-3 size-10 rounded-full" />
            <div>
              <p className="font-medium text-foreground">{serviceData.seller.name}</p>
              <div className="flex flex-wrap items-center text-sm text-muted-foreground">
                <span>
                  {serviceData.seller.location} - {serviceData.seller.joinedYear}
                </span>
                <div className="ml-2 flex items-center">
                  <Star className="size-3.5 fill-warning text-warning" />
                  <span className="ml-1 text-foreground">{serviceData.seller.rating}</span>
                  <span className="ml-1">({serviceData.seller.reviews})</span>
                </div>
                {activeBookingsCount > 0 && (
                  <span className="ml-2">
                    {activeBookingsCount} {activeBookingsCount === 1 ? 'contract' : 'contracts'} in queue
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Image gallery */}
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-lg">
              <img src={serviceData.images[currentImageIndex]} alt="Service preview" className="h-64 w-full object-cover md:h-96" />
              {serviceData.images.length > 1 && <>
                <button onClick={goToPreviousImage} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card p-2 shadow-md hover:bg-accent" aria-label="Previous image">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={goToNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card p-2 shadow-md hover:bg-accent" aria-label="Next image">
                  <ChevronRight size={20} />
                </button>
                {/* Image pagination dots */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
                  {serviceData.images.map((_: any, index: number) => <button key={index} onClick={() => setCurrentImageIndex(index)} className={cn('size-2 rounded-full', currentImageIndex === index ? 'bg-card' : 'bg-card/50')} aria-label={`Go to image ${index + 1}`} />)}
                </div>
              </>}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {serviceData.images.map((image: any, index: number) => <button key={index} onClick={() => setCurrentImageIndex(index)} className={cn('overflow-hidden rounded-lg border-2', currentImageIndex === index ? 'border-primary' : 'border-transparent')}>
                <img src={image} alt={`Thumbnail ${index + 1}`} className="h-16 w-full object-cover" />
              </button>)}
            </div>
          </div>
          {/* Description */}
          <div className="mb-8">
            <h2 className="mb-4 font-heading text-h2 font-semibold text-foreground">Description</h2>
            <p className="mb-4 text-foreground">{serviceData.description}</p>
            <ul className="mb-6 list-disc space-y-1 pl-5">
              {serviceData.features.map((feature: any, index: number) => <li key={index} className="text-foreground">
                {feature}
              </li>)}
            </ul>
            {serviceData.additionalInfo.map((info: any, index: number) => <p key={index} className="mb-2 text-foreground">
              {info}
            </p>)}
          </div>
          {/* Tier Comparison */}
          <div className="mb-8">
            <h2 className="mb-4 font-heading text-h2 font-semibold text-foreground">Tier Comparison</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {serviceData.tierComparison.headers.map((header: any, index: number) => <th key={index} className="border border-border bg-secondary px-4 py-2 text-left text-foreground">
                      {header}
                    </th>)}
                  </tr>
                </thead>
                <tbody>
                  {serviceData.tierComparison.rows.map((row: any, rowIndex: number) => <tr key={rowIndex}>
                    {row.map((cell: any, cellIndex: number) => <td key={cellIndex} className="border border-border px-4 py-2 text-foreground">
                      {cell}
                    </td>)}
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
          {/* FAQ */}
          <div className="mb-8">
            <h2 className="mb-4 font-heading text-h2 font-semibold text-foreground">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {serviceData.faqs.length > 0 ? (
                serviceData.faqs.map((faq: any, index: number) => <div key={index} className="overflow-hidden rounded-lg border border-border">
                  <button className="flex w-full items-center justify-between bg-card px-4 py-3 text-left" onClick={() => toggleFaq(index)}>
                    <span className={cn('font-medium', expandedFaq === index ? 'text-primary' : 'text-foreground')}>
                      {faq.question}
                    </span>
                    {expandedFaq === index ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-muted-foreground" />}
                  </button>
                  {expandedFaq === index && <div className="border-t border-border bg-secondary px-4 py-3">
                    <p className="text-foreground">{faq.answer}</p>
                  </div>}
                </div>)
              ) : (
                <p className="text-muted-foreground">No FAQs available for this service.</p>
              )}
            </div>
          </div>
          {/* Comments and Rating */}
          <div className="mb-8">
            <h2 className="mb-4 font-heading text-h2 font-semibold text-foreground">
              Comments And Rating
            </h2>
            <div className="mb-4 flex items-center">
              <span className="mr-2 text-xl font-bold text-foreground">
                {serviceData.ratings.average}
              </span>
              <div className="flex">
                {'★★★★★'.split('').map((_, i) => <span key={i} className={i < Math.floor(serviceData.ratings.average) ? 'text-warning' : 'text-muted'}>
                  ★
                </span>)}
              </div>
              <span className="ml-2 text-muted-foreground">
                ({serviceData.ratings.total} ratings)
              </span>
            </div>
            {/* Rating distribution */}
            <div className="mb-6 space-y-2">
              {serviceData.ratings.distribution.map((dist: any) => <div key={dist.stars} className="flex items-center">
                <span className="w-8 text-foreground">{dist.stars} ★</span>
                <div className="mx-2 h-2 flex-1 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{
                    width: `${dist.percentage}%`
                  }}></div>
                </div>
                <span className="w-8 text-right text-muted-foreground">
                  {dist.percentage}%
                </span>
              </div>)}
            </div>
            {/* Comments */}
            <div className="space-y-4">
              {serviceData.comments.length > 0 ? (
                serviceData.comments.map((comment: any, index: number) => <div key={index} className="border-b border-border pb-4">
                  <div className="mb-2 flex items-center">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop" alt={comment.user} className="mr-3 size-10 rounded-full" />
                    <div>
                      <p className="font-medium text-foreground">{comment.user}</p>
                      <div className="flex text-warning">
                        {'★'.repeat(comment.rating)}
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground">{comment.comment}</p>
                </div>)
              ) : (
                <p className="text-muted-foreground">No reviews yet for this service. Be the first to leave a review!</p>
              )}
            </div>
          </div>
          {/* Similar Services */}
          <div>
            <h2 className="mb-4 font-heading text-h2 font-semibold text-foreground">
              Explore Similar Services
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {serviceData.similarServices.length > 0 ? (
                serviceData.similarServices.map((similar: any) => <div key={similar.service_id} className="overflow-hidden rounded-lg border border-border">
                  <div className="relative h-48">
                    <img
                      src={similar.cover_image_url || (similar.portfolio_images && similar.portfolio_images.length > 0 ? similar.portfolio_images[0] : "/default-service.svg")}
                      alt={similar.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-center">
                      <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop" alt={similar.freelancer_email} className="mr-2 size-8 rounded-full" />
                      <span className="text-foreground">{similar.freelancer_email ? similar.freelancer_email.split('@')[0] : 'Unknown'}</span>
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm text-foreground">
                      {similar.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="size-3.5 fill-warning text-warning" />
                        <span className="ml-1 text-foreground">{similar.rating_avg}</span>
                        <span className="ml-1 text-muted-foreground">
                          ({similar.total_orders})
                        </span>
                      </div>
                      <div className="font-bold text-foreground">
                        {similar.packages && similar.packages.length > 0
                          ? formatMoney(
                              Math.min(...similar.packages.map((p: any) => Number(p.price_minor))),
                              similar.packages[0]?.currency,
                            )
                          : '—'
                        }
                      </div>
                    </div>
                    <Link href={`/client/service/${similar.service_id}`} className="mt-2 flex items-center text-primary hover:underline">
                      <span>View</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </Link>
                  </div>
                </div>)
              ) : (
                <p className="col-span-3 text-muted-foreground">No similar services found.</p>
              )}
            </div>
          </div>
        </div>
        {/* Right sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex justify-between">
              <button className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <Save size={16} className="mr-1" />
                <span>Save</span>
              </button>
              <button className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <Share2 size={16} className="mr-1" />
                <span>Share</span>
              </button>
            </div>
            <h3 className="mb-4 font-heading text-h3 font-semibold text-foreground">Select service tier</h3>
            <div className="mb-6 space-y-3">
              {service.packages && service.packages.length > 0 ? (
                service.packages.map((pkg: any) => {
                  const tierName = pkg.tier.toLowerCase();
                  return (
                    <button
                      key={pkg.package_id}
                      className={cn(
                        'w-full rounded-full border px-4 py-2 text-sm transition-colors',
                        selectedTier === tierName
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground hover:bg-accent',
                      )}
                      onClick={() => setSelectedTier(tierName)}
                    >
                      {pkg.tier} ({formatMoney(pkg.price_minor, pkg.currency)})
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No packages available for this service.</p>
              )}
            </div>
            <div className="space-y-4 border-t border-border pt-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="shrink-0 text-foreground">Service</span>
                <span className="break-words text-right text-muted-foreground">
                  {serviceData.title}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">Description</span>
                <p className="whitespace-normal break-words text-muted-foreground">
                  {serviceData.tiers[selectedTier as keyof typeof serviceData.tiers]?.description || 'Service package'}
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">Delivery Timeline</span>
                <span className="text-right text-muted-foreground">
                  {serviceData.tiers[selectedTier as keyof typeof serviceData.tiers]?.deliveryTimeline || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">Revisions</span>
                <span className="text-muted-foreground">
                  {serviceData.tiers[selectedTier as keyof typeof serviceData.tiers]?.revisions || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">Amount</span>
                <span className="font-semibold text-foreground">
                  {serviceData.tiers[selectedTier as keyof typeof serviceData.tiers]?.priceLabel || '—'}
                </span>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-4 border-t border-border pt-4">
              <div>
                <label htmlFor="specialInstructions" className="mb-2 block text-sm font-medium text-foreground">
                  Special Instructions <span className="text-muted-foreground">(Optional)</span>
                </label>
                <Textarea
                  id="specialInstructions"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Please provide any special requirements, deadlines, or specific instructions for the freelancer... (Optional)"
                  className="resize-none"
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional: Help the freelancer understand your specific requirements
                </p>
              </div>
            </div>

            <Button onClick={handleContinue} className="mt-6 w-full" size="lg">
              <CreditCard size={18} />
              <span>
                Continue to Payment (
                {serviceData.tiers[selectedTier as keyof typeof serviceData.tiers]?.priceLabel || '—'})
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>;
}