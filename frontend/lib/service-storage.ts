import fs from 'fs';
import path from 'path';

// Define the directory and file paths for storing additional service data
const STORAGE_DIR = path.join(process.cwd(), 'tmp', 'service-data');
const SERVICES_FILE = path.join(STORAGE_DIR, 'services.json');

// Ensure storage directory exists (only in server environment)
if (typeof window === 'undefined') {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch (error) {
    console.warn('Could not create storage directory:', error);
  }
}

export interface PackageData {
  package_id: string;
  tier: string;
  title: string;
  description: string;
  price_e8s: number;
  delivery_days: number;
  delivery_timeline: string;
  features: string[];
  revisions_included: number;
  status: string;
}

export interface AdditionalServiceData {
  service_id: string;
  freelancer_email: string;
  cover_image_url: string;
  portfolio_images: string[];
  description_format: 'plain' | 'markdown';
  tier_mode: '1tier' | '3tier';
  packages: PackageData[];
  client_questions: Array<{
    id: string;
    type: string;
    question: string;
    required: boolean;
    options?: string[];
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  created_at: number;
  updated_at: number;
}

export interface ServiceStorage {
  services: AdditionalServiceData[];
}

// Load all services from storage
function loadStorage(): ServiceStorage {
  try {
    if (fs.existsSync(SERVICES_FILE)) {
      const data = fs.readFileSync(SERVICES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading service storage:', error);
  }

  // Return empty storage if file doesn't exist or there's an error
  return { services: [] };
}

// Save all services to storage
function saveStorage(storage: ServiceStorage): void {
  try {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(storage, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving service storage:', error);
    throw new Error('Failed to save service data');
  }
}

// Save additional service data
export function saveAdditionalServiceData(data: AdditionalServiceData): void {
  try {
    const storage = loadStorage();

    // Remove existing entry for this service if it exists
    storage.services = storage.services.filter(service => service.service_id !== data.service_id);

    // Add new entry
    storage.services.push(data);

    // Save to file
    saveStorage(storage);

    console.log(`Saved additional data for service: ${data.service_id}`);
  } catch (error) {
    console.error('Error saving additional service data:', error);
    throw error;
  }
}

// Get additional service data by service ID
export function getAdditionalServiceData(serviceId: string): AdditionalServiceData | null {
  try {
    const storage = loadStorage();
    const service = storage.services.find(s => s.service_id === serviceId);
    return service || null;
  } catch (error) {
    console.error('Error getting additional service data:', error);
    return null;
  }
}

// Get all services for a freelancer
export function getServicesByFreelancer(freelancerEmail: string): AdditionalServiceData[] {
  try {
    const storage = loadStorage();
    return storage.services.filter(service => service.freelancer_email === freelancerEmail);
  } catch (error) {
    console.error('Error getting services by freelancer:', error);
    return [];
  }
}

// Update additional service data
export function updateAdditionalServiceData(serviceId: string, updates: Partial<AdditionalServiceData>): boolean {
  try {
    const storage = loadStorage();
    const serviceIndex = storage.services.findIndex(s => s.service_id === serviceId);

    if (serviceIndex === -1) {
      return false;
    }

    // Update the service data
    storage.services[serviceIndex] = {
      ...storage.services[serviceIndex],
      ...updates,
      updated_at: Date.now() * 1000000
    };

    saveStorage(storage);
    console.log(`Updated additional data for service: ${serviceId}`);
    return true;
  } catch (error) {
    console.error('Error updating additional service data:', error);
    return false;
  }
}

// Get all services from storage
export function getAllServicesFromStorage(): AdditionalServiceData[] {
  try {
    const storage = loadStorage();
    return storage.services;
  } catch (error) {
    console.error('Error getting all services from storage:', error);
    return [];
  }
}

// Delete additional service data
export function deleteAdditionalServiceData(serviceId: string): boolean {
  try {
    const storage = loadStorage();
    const initialLength = storage.services.length;

    storage.services = storage.services.filter(service => service.service_id !== serviceId);

    if (storage.services.length < initialLength) {
      saveStorage(storage);
      console.log(`Deleted additional data for service: ${serviceId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting additional service data:', error);
    return false;
  }
}