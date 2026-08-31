import fs from 'fs';
import path from 'path';

// Define the directory and file paths for storing additional hackathon data
const STORAGE_DIR = path.join(process.cwd(), 'tmp', 'hackathon-data');
const HACKATHONS_FILE = path.join(STORAGE_DIR, 'hackathons.json');

// Ensure storage directory exists
if (typeof window === 'undefined') {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch (error) {
    console.warn('Could not create hackathon storage directory:', error);
  }
}

export interface AdditionalHackathonData {
  hackathon_id: string;
  organizer_email: string;
  banner_image: string;
  registration_fee: number;
  max_participants: number;
  prizes: Array<{
    id: string;
    position: string;
    title: string;
    description: string;
    amount: number;
    currency: string;
    type: 'cash' | 'non-cash';
  }>;
  judges: Array<{
    id: string;
    name: string;
    email: string;
    bio: string;
    expertise: string[];
    avatar?: string;
    status?: 'pending' | 'accepted' | 'declined';
  }>;
  schedule: Array<{
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
  }>;
  tags: string[];
  social_links: Array<{ platform: string; url: string }>;
  created_at: number;
  updated_at: number;
}

export interface HackathonStorage {
  hackathons: AdditionalHackathonData[];
}

// Load all hackathons from storage
function loadStorage(): HackathonStorage {
  try {
    if (typeof window !== 'undefined') {
      return { hackathons: [] }; // No file system access in browser
    }

    if (fs.existsSync(HACKATHONS_FILE)) {
      const data = fs.readFileSync(HACKATHONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading hackathon storage:', error);
  }

  // Return empty storage if file doesn't exist or there's an error
  return { hackathons: [] };
}

// Save all hackathons to storage
function saveStorage(storage: HackathonStorage): void {
  try {
    if (typeof window !== 'undefined') {
      return; // No file system access in browser
    }

    fs.writeFileSync(HACKATHONS_FILE, JSON.stringify(storage, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving hackathon storage:', error);
    throw new Error('Failed to save hackathon data');
  }
}

// Save additional hackathon data
export function saveAdditionalHackathonData(data: AdditionalHackathonData): void {
  try {
    const storage = loadStorage();

    // Remove existing entry for this hackathon if it exists
    storage.hackathons = storage.hackathons.filter(hackathon => hackathon.hackathon_id !== data.hackathon_id);

    // Add new entry
    storage.hackathons.push(data);

    // Save to file
    saveStorage(storage);

    console.log(`Saved additional data for hackathon: ${data.hackathon_id}`);
  } catch (error) {
    console.error('Error saving additional hackathon data:', error);
    throw error;
  }
}

// Get additional hackathon data by hackathon ID
export function getAdditionalHackathonData(hackathonId: string): AdditionalHackathonData | null {
  try {
    const storage = loadStorage();
    const hackathon = storage.hackathons.find(h => h.hackathon_id === hackathonId);
    return hackathon || null;
  } catch (error) {
    console.error('Error getting additional hackathon data:', error);
    return null;
  }
}

// Get all hackathons for an organizer
export function getHackathonsByOrganizer(organizerEmail: string): AdditionalHackathonData[] {
  try {
    const storage = loadStorage();
    return storage.hackathons.filter(hackathon => hackathon.organizer_email === organizerEmail);
  } catch (error) {
    console.error('Error getting hackathons by organizer:', error);
    return [];
  }
}

// Update additional hackathon data
export function updateAdditionalHackathonData(hackathonId: string, updates: Partial<AdditionalHackathonData>): boolean {
  try {
    const storage = loadStorage();
    const hackathonIndex = storage.hackathons.findIndex(h => h.hackathon_id === hackathonId);

    if (hackathonIndex === -1) {
      return false;
    }

    // Update the hackathon data
    storage.hackathons[hackathonIndex] = {
      ...storage.hackathons[hackathonIndex],
      ...updates,
      updated_at: Date.now() * 1000000
    };

    saveStorage(storage);
    console.log(`Updated additional data for hackathon: ${hackathonId}`);
    return true;
  } catch (error) {
    console.error('Error updating additional hackathon data:', error);
    return false;
  }
}

// Delete additional hackathon data
export function deleteAdditionalHackathonData(hackathonId: string): boolean {
  try {
    const storage = loadStorage();
    const initialLength = storage.hackathons.length;

    storage.hackathons = storage.hackathons.filter(hackathon => hackathon.hackathon_id !== hackathonId);

    if (storage.hackathons.length < initialLength) {
      saveStorage(storage);
      console.log(`Deleted additional data for hackathon: ${hackathonId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting additional hackathon data:', error);
    return false;
  }
}