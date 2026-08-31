'use client'

import { useState, useEffect, useCallback } from 'react';

export interface Package {
  package_id: string;
  service_id: string;
  tier: string;
  title: string;
  description: string;
  price_e8s: number;
  delivery_days: number;
  features: string[];
  revisions_included: number;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface CreatePackageData {
  service_id: string;
  tier: string;
  title: string;
  description: string;
  price_e8s: number;
  delivery_days: number;
  features?: string[];
  revisions_included?: number;
  status?: string;
}

export interface UpdatePackageData {
  tier?: string;
  title?: string;
  description?: string;
  price_e8s?: number;
  delivery_days?: number;
  features?: string[];
  revisions_included?: number;
  status?: string;
}

export function usePackages(serviceId?: string) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    if (!serviceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/marketplace/packages?service_id=${serviceId}`);
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

  return { packages, loading, error, refetch: fetchPackages };
}

export function useCreatePackage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPackage = useCallback(async (userId: string, packageData: CreatePackageData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          packageData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        setError(data.error || 'Failed to create package');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPackage, loading, error };
}

export function useUpdatePackage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePackage = useCallback(async (userId: string, packageId: string, updates: UpdatePackageData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          updates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        setError(data.error || 'Failed to update package');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { updatePackage, loading, error };
}

export function useDeletePackage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePackage = useCallback(async (userId: string, packageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      } else {
        setError(data.error || 'Failed to delete package');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { deletePackage, loading, error };
}

export function useBookPackage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookPackage = useCallback(async (userId: string, packageId: string, clientNotes?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: userId,
          packageId,
          specialInstructions: clientNotes || '',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Enhanced booking response includes chat information
        console.log('🎉 Booking successful:', data.data);

        // Log chat initiation result if present
        if (data.data?.chat) {
          console.log('💬 Chat initiation result:', data.data.chat);
        }

        return { success: true, data: data.data };
      } else {
        setError(data.error || 'Failed to book package');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { bookPackage, loading, error };
}

