import React, { useState, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';

// Storage key for localStorage
const STORAGE_KEY = 'hackathon_form_data';

// TypeScript interfaces
export interface Prize {
  id: string;
  position: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  type: 'cash' | 'non-cash';
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  bio: string;
  expertise: string[];
  avatar?: string;
  status?: 'pending' | 'accepted' | 'declined';
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  location?: string;
  type: 'opening' | 'workshop' | 'presentation' | 'break' | 'judging' | 'awards' | 'closing' | 'other';
  speakers?: string[];
  isRequired: boolean;
}

export interface HackathonFormData {
  // Basic Information
  title: string;
  tagline: string;
  description: string;
  theme: string;
  bannerImage: string;

  // Event Details
  mode: 'Online' | 'Offline' | 'Hybrid';
  location: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;

  // Participation Settings
  maxParticipants: number;
  minTeamSize: number;
  maxTeamSize: number;
  registrationFee: number;

  // Content
  prizes: Prize[];
  judges: Judge[];
  schedule: ScheduleItem[];
  rules: string;

  // Additional Details
  tags: string[];
  socialLinks: Array<{ platform: string; url: string }>;

  // Status & Metadata
  status: 'draft' | 'published' | 'cancelled';
  publishedAt?: string;
  createdAt: number;
  updatedAt: number;
}

export interface HackathonFormContextType {
  formData: HackathonFormData;
  updateFormData: (data: Partial<HackathonFormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isSaved: { [key: string]: boolean };
  setSaved: (field: string, value: boolean) => void;
  submitHackathon: (userEmail: string) => Promise<{ success: boolean; hackathonId?: string; error?: string }>;
  isSubmitting: boolean;
  submissionError: string | null;
  clearFormData: () => void;
  resetForm: () => void;
  saveDraft: () => Promise<boolean>;
  loadDraft: () => boolean;
  isAutoSaving: boolean;
  lastSavedAt: number | null;
}

const defaultFormData: HackathonFormData = {
  // Basic Information
  title: '',
  tagline: '',
  description: '',
  theme: '',
  bannerImage: '',

  // Event Details
  mode: 'Online',
  location: '',
  startDate: '',
  endDate: '',
  registrationStart: '',
  registrationEnd: '',

  // Participation Settings
  maxParticipants: 100,
  minTeamSize: 1,
  maxTeamSize: 4,
  registrationFee: 0,

  // Content
  prizes: [],
  judges: [],
  schedule: [],
  rules: '',

  // Additional Details
  tags: [],
  socialLinks: [{ platform: 'x.com', url: '' }],

  // Status & Metadata
  status: 'draft',
  createdAt: Date.now() * 1000000,
  updatedAt: Date.now() * 1000000
};

export const HackathonFormContext = createContext<HackathonFormContextType>({
  formData: defaultFormData,
  updateFormData: () => {},
  currentStep: 0,
  setCurrentStep: () => {},
  isSaved: {},
  setSaved: () => {},
  submitHackathon: async () => ({ success: false, error: 'Context not initialized' }),
  isSubmitting: false,
  submissionError: null,
  clearFormData: () => {},
  resetForm: () => {},
  saveDraft: async () => false,
  loadDraft: () => false,
  isAutoSaving: false,
  lastSavedAt: null
});

export const useHackathonForm = () => useContext(HackathonFormContext);

// Load data from localStorage
const loadFromStorage = (): HackathonFormData => {
  if (typeof window === 'undefined') return defaultFormData;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultFormData, ...parsed };
    }
  } catch (error) {
    console.error('Error loading hackathon form data from localStorage:', error);
  }
  return defaultFormData;
};

// Save data to localStorage
const saveToStorage = (data: HackathonFormData): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving hackathon form data to localStorage:', error);
  }
};

// Clear data from localStorage
const clearStorage = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing hackathon form data from localStorage:', error);
  }
};

export const HackathonFormProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [formData, setFormData] = useState<HackathonFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaved, setIsSaved] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedData = loadFromStorage();
    setFormData(loadedData);
  }, []);

  // Auto-save to localStorage whenever formData changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsAutoSaving(true);
      saveToStorage(formData);
      setLastSavedAt(Date.now());
      setIsAutoSaving(false);
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [formData]);

  const updateFormData = useCallback((data: Partial<HackathonFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      updatedAt: Date.now() * 1000000
    }));
  }, []);

  const clearFormData = useCallback(() => {
    setFormData(defaultFormData);
    clearStorage();
    setSubmissionError(null);
    setLastSavedAt(null);
  }, []);

  const resetForm = useCallback(() => {
    clearFormData();
    setCurrentStep(0);
    setIsSaved({});
  }, [clearFormData]);

  const setSaved = useCallback((field: string, value: boolean) => {
    setIsSaved(prev => ({
      ...prev,
      [field]: value
    }));
    // Auto clear saved indicator after 2 seconds
    if (value) {
      setTimeout(() => {
        setIsSaved(prev => ({
          ...prev,
          [field]: false
        }));
      }, 2000);
    }
  }, []);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    try {
      setIsAutoSaving(true);

      // Save to localStorage
      saveToStorage(formData);
      setLastSavedAt(Date.now());

      setIsAutoSaving(false);
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      setIsAutoSaving(false);
      return false;
    }
  }, [formData]);

  const loadDraft = useCallback((): boolean => {
    try {
      const savedData = loadFromStorage();
      setFormData(savedData);
      return true;
    } catch (error) {
      console.error('Error loading draft:', error);
      return false;
    }
  }, []);

  const submitHackathon = useCallback(async (userEmail: string) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Hackathon title is required');
      }

      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }

      if (!formData.startDate || !formData.endDate) {
        throw new Error('Start and end dates are required');
      }

      if (!formData.registrationStart || !formData.registrationEnd) {
        throw new Error('Registration start and end dates are required');
      }

      // Validate dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const regStart = new Date(formData.registrationStart);
      const regEnd = new Date(formData.registrationEnd);

      if (start >= end) {
        throw new Error('End date must be after start date');
      }

      if (regStart >= regEnd) {
        throw new Error('Registration end date must be after start date');
      }

      if (regEnd > start) {
        throw new Error('Registration must end before hackathon starts');
      }

      // Call the API to create hackathon
      const response = await fetch('/api/hackathons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          hackathonData: formData
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create hackathon');
      }

      // Update form data with published status
      const updatedData = {
        ...formData,
        status: 'published' as const,
        publishedAt: new Date().toISOString()
      };
      updateFormData(updatedData);

      // Clear form data after successful submission
      setTimeout(() => {
        clearFormData();
      }, 2000);

      return {
        success: true,
        hackathonId: result.hackathon_id
      };

    } catch (error) {
      console.error('Error submitting hackathon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSubmissionError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, updateFormData, clearFormData]);

  return (
    <HackathonFormContext.Provider value={{
      formData,
      updateFormData,
      currentStep,
      setCurrentStep,
      isSaved,
      setSaved,
      submitHackathon,
      isSubmitting,
      submissionError,
      clearFormData,
      resetForm,
      saveDraft,
      loadDraft,
      isAutoSaving,
      lastSavedAt
    }}>
      {children}
    </HackathonFormContext.Provider>
  );
};