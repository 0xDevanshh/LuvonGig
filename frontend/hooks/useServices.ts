'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface Service {
  service_id: string;
  freelancer_id: string;
  freelancer_email: string;
  title: string;
  main_category: string;
  sub_category: string;
  description: string;
  description_format?: 'plain' | 'markdown';
  whats_included: string;
  cover_image_url?: string;
  portfolio_images: string[];
  status: string;
  rating_avg: number;
  total_orders: number;
  created_at: number;
  updated_at: number;
  delivery_time_days: number;
  starting_from_e8s: number;
  total_rating: number;
  review_count: number;
  tags: string[];
  // Timeline information from packages
  min_delivery_days?: number;
  max_delivery_days?: number;
  delivery_timeline?: string;
  // Package information
  tier_mode: '1tier' | '3tier';
  packages: Array<{
    package_id: string;
    tier: string;
    title: string;
    description: string;
    price_minor: number;
    delivery_days: number;
    delivery_timeline: string;
    features: string[];
    revisions_included: number;
    status: string;
  }>;
  // Additional fields
  client_questions: Array<{
    id: string;
    type: string;
    question: string;
    required: boolean;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export interface ServiceFilters {
  category?: string;
  freelancer_email?: string;
  search_term?: string;
  limit?: number;
  offset?: number;
}

export interface CreateServiceData {
  title: string;
  main_category: string;
  sub_category: string;
  description: string;
  whats_included: string;
  cover_image_url?: string;
  portfolio_images?: string[];
  status?: string;
}

export interface UpdateServiceData {
  title?: string;
  main_category?: string;
  sub_category?: string;
  description?: string;
  whats_included?: string;
  cover_image_url?: string;
  portfolio_images?: string[];
  status?: string;
}

export function useServices(freelancerId?: string, filters?: ServiceFilters) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to prevent infinite re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters?.category,
    filters?.freelancer_email,
    filters?.search_term,
    filters?.limit,
    filters?.offset
  ]);

  const fetchServices = useCallback(async () => {
    // If we're trying to filter by freelancer_email but don't have one, skip fetching
    // This prevents showing all services when the user email isn't loaded yet
    if (memoizedFilters?.freelancer_email === undefined && freelancerId === undefined) {
      // If freelancer_email is explicitly set to undefined in filters, don't fetch
      // This is a signal that we're waiting for the email
      if (memoizedFilters && 'freelancer_email' in memoizedFilters && memoizedFilters.freelancer_email === undefined) {
        console.log('⏸️ Skipping service fetch - waiting for freelancer_email');
        setServices([]);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (memoizedFilters?.category) queryParams.append('category', memoizedFilters.category);
      // Use freelancer_email from filters, or fallback to first parameter (freelancerId)
      const freelancerEmail = memoizedFilters?.freelancer_email || freelancerId;
      if (freelancerEmail) {
        queryParams.append('freelancer_email', freelancerEmail);
        console.log('🔍 useServices: Filtering by freelancer_email:', freelancerEmail);
      } else {
        console.log('⚠️ useServices: No freelancer_email filter - will fetch all services');
      }
      if (memoizedFilters?.search_term) queryParams.append('search_term', memoizedFilters.search_term);
      if (memoizedFilters?.limit) queryParams.append('limit', memoizedFilters.limit.toString());
      if (memoizedFilters?.offset) queryParams.append('offset', memoizedFilters.offset.toString());

      const url = `/api/marketplace/services?${queryParams.toString()}`;
      console.log('📡 useServices: Fetching services from:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        console.log(`✅ useServices: Received ${data.data.length} services`);
        setServices(data.data);
      } else {
        console.error('❌ useServices: Failed to fetch services:', data.error);
        setError(data.error || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('❌ useServices: Network error:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters, freelancerId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}

export function useCreateService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createService = useCallback(async (userEmail: string, serviceData: CreateServiceData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          serviceData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        setError(data.error || 'Failed to create service');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { createService, loading, error };
}

export function useUpdateService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateService = useCallback(async (userEmail: string, serviceId: string, updates: UpdateServiceData, userId?: string) => {
    setLoading(true);
    setError(null);

    try {
      // If userId is not provided, try to get it from session
      let effectiveUserId = userId;
      if (!effectiveUserId) {
        try {
          const sessionResponse = await fetch('/api/auth/session');
          const sessionData = await sessionResponse.json();
          if (sessionData.success && sessionData.session?.userId) {
            effectiveUserId = sessionData.session.userId;
          } else if (sessionData.success && sessionData.session?.email) {
            // Fallback: use email as userId if no userId in session
            effectiveUserId = sessionData.session.email;
          }
        } catch (sessionError) {
          console.warn('Could not fetch userId from session:', sessionError);
        }
      }

      // If still no userId, use email as fallback
      if (!effectiveUserId) {
        effectiveUserId = userEmail;
      }

      const response = await fetch(`/api/marketplace/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          userId: effectiveUserId,
          updates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        setError(data.error || 'Failed to update service');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateService, loading, error };
}

export function useDeleteService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteService = useCallback(async (userEmail: string, serviceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      } else {
        setError(data.error || 'Failed to delete service');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteService, loading, error };
}

export function useServicePackages(serviceId?: string, startingFromE8s?: number) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    if (!serviceId) {
      setPackages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/services/${serviceId}/packages`);
      const data = await response.json();

      if (data.success) {
        setPackages(data.data);
      } else {
        setError(data.error || 'Failed to fetch packages');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const getMinPrice = useCallback(() => {
    // Prices are stored as integer minor units (cents); divide by 100 for a dollar amount.
    if (packages.length > 0) {
      const prices = packages.map(pkg => {
        const priceMinor = typeof pkg.price_minor === 'string'
          ? parseInt(pkg.price_minor)
          : (typeof pkg.price_minor === 'number' ? pkg.price_minor : 0);
        return priceMinor / 100;
      });
      return Math.min(...prices);
    }
    if (startingFromE8s) {
      return startingFromE8s / 100;
    }
    return 0;
  }, [packages, startingFromE8s]);

  return { packages, loading, error, refetch: fetchPackages, getMinPrice };
}

