// Local storage for stages data when marketplace canister is not available
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const STORAGE_DIR = '/tmp/marketplace-storage';
const STAGES_FILE = join(STORAGE_DIR, 'stages.json');

// Ensure storage directory exists
try {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Could not create storage directory:', error);
}

// Stage interfaces
export interface Stage {
  stage_id: string;
  booking_id: string;
  stage_number: number;
  title: string;
  description: string;
  amount_e8s: number;
  status: 'Pending' | 'InProgress' | 'Submitted' | 'Approved' | 'Rejected' | 'Released';
  created_at: number;
  updated_at: number;
  submitted_at?: number;
  approved_at?: number;
  rejected_at?: number;
  released_at?: number;
  submission_notes?: string;
  submission_artifacts?: string[];
  rejection_reason?: string;
}

export interface StageStatus {
  status: 'Pending' | 'InProgress' | 'Submitted' | 'Approved' | 'Rejected' | 'Released';
  timestamp?: number;
  notes?: string;
}

export interface BookingTimeline {
  booking_id: string;
  events: Array<{
    type: 'created' | 'payment_completed' | 'stage_created' | 'stage_updated' | 'stage_approved' | 'stage_rejected' | 'completed';
    timestamp: number;
    description: string;
    metadata?: any;
  }>;
}

// Stage storage functions
export function getStages(): Stage[] {
  try {
    if (existsSync(STAGES_FILE)) {
      const data = readFileSync(STAGES_FILE, 'utf8');
      const stagesData = JSON.parse(data);
      return Object.values(stagesData);
    }
    return [];
  } catch (error) {
    console.error('Error reading stages:', error);
    return [];
  }
}

export function getStagesByBooking(bookingId: string): Stage[] {
  try {
    const allStages = getStages();
    return allStages.filter(stage => stage.booking_id === bookingId)
      .sort((a, b) => a.stage_number - b.stage_number);
  } catch (error) {
    console.error('Error getting stages by booking:', error);
    return [];
  }
}

export function getStageById(stageId: string): Stage | null {
  try {
    if (existsSync(STAGES_FILE)) {
      const data = readFileSync(STAGES_FILE, 'utf8');
      const stagesData = JSON.parse(data);
      return stagesData[stageId] || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting stage by ID:', error);
    return null;
  }
}

export function saveStage(stage: Stage): void {
  try {
    let stagesData: Record<string, Stage> = {};

    if (existsSync(STAGES_FILE)) {
      const data = readFileSync(STAGES_FILE, 'utf8');
      stagesData = JSON.parse(data);
    }

    stagesData[stage.stage_id] = stage;
    writeFileSync(STAGES_FILE, JSON.stringify(stagesData, null, 2));
  } catch (error) {
    console.error('Error saving stage:', error);
  }
}

export function saveStages(stages: Stage[]): void {
  try {
    const stagesData: Record<string, Stage> = {};
    stages.forEach(stage => {
      stagesData[stage.stage_id] = stage;
    });
    writeFileSync(STAGES_FILE, JSON.stringify(stagesData, null, 2));
  } catch (error) {
    console.error('Error saving stages:', error);
  }
}

export function updateStageStatus(stageId: string, status: Stage['status'], notes?: string): boolean {
  try {
    const stage = getStageById(stageId);
    if (!stage) {
      console.error('Stage not found:', stageId);
      return false;
    }

    const now = Date.now() * 1000000; // Convert to nanoseconds

    stage.status = status;
    stage.updated_at = now;

    // Update timestamp based on status
    switch (status) {
      case 'Submitted':
        stage.submitted_at = now;
        break;
      case 'Approved':
        stage.approved_at = now;
        break;
      case 'Rejected':
        stage.rejected_at = now;
        stage.rejection_reason = notes || '';
        break;
      case 'Released':
        stage.released_at = now;
        break;
    }

    if (notes && status !== 'Rejected') {
      stage.submission_notes = notes;
    }

    saveStage(stage);
    return true;
  } catch (error) {
    console.error('Error updating stage status:', error);
    return false;
  }
}

// Timeline functions
export function getBookingTimeline(bookingId: string): BookingTimeline | null {
  try {
    const timelineFile = join(STORAGE_DIR, `timeline-${bookingId}.json`);
    if (existsSync(timelineFile)) {
      const data = readFileSync(timelineFile, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error getting booking timeline:', error);
    return null;
  }
}

export function addTimelineEvent(
  bookingId: string,
  type: BookingTimeline['events'][0]['type'],
  description: string,
  metadata?: any
): void {
  try {
    const timelineFile = join(STORAGE_DIR, `timeline-${bookingId}.json`);
    let timeline: BookingTimeline = {
      booking_id: bookingId,
      events: []
    };

    if (existsSync(timelineFile)) {
      const data = readFileSync(timelineFile, 'utf8');
      timeline = JSON.parse(data);
    }

    timeline.events.push({
      type,
      timestamp: Date.now() * 1000000, // Convert to nanoseconds
      description,
      metadata
    });

    // Sort events by timestamp
    timeline.events.sort((a, b) => a.timestamp - b.timestamp);

    writeFileSync(timelineFile, JSON.stringify(timeline, null, 2));
  } catch (error) {
    console.error('Error adding timeline event:', error);
  }
}

// Create default stages for a booking
export function createDefaultStages(bookingId: string, totalAmountE8s: number): Stage[] {
  const stages: Stage[] = [];
  const now = Date.now() * 1000000; // Convert to nanoseconds

  // Create 3 default stages for most services
  const stageConfigs = [
    { number: 1, title: 'Initial Planning & Requirements', percentage: 0.3 },
    { number: 2, title: 'Development & Implementation', percentage: 0.5 },
    { number: 3, title: 'Final Review & Delivery', percentage: 0.2 }
  ];

  stageConfigs.forEach(config => {
    const stage: Stage = {
      stage_id: `ST_${bookingId}_${config.number}_${Date.now()}`,
      booking_id: bookingId,
      stage_number: config.number,
      title: config.title,
      description: `Stage ${config.number}: ${config.title}`,
      amount_e8s: Math.floor(totalAmountE8s * config.percentage),
      status: 'Pending',
      created_at: now,
      updated_at: now
    };
    stages.push(stage);
  });

  saveStages(stages);

  // Add timeline events
  stages.forEach(stage => {
    addTimelineEvent(bookingId, 'stage_created', `Created stage: ${stage.title}`, {
      stage_id: stage.stage_id,
      stage_number: stage.stage_number
    });
  });

  return stages;
}

// Utility functions for time formatting
export function formatNanoseconds(nanoseconds: number): string {
  // Convert nanoseconds to milliseconds (divide by 1,000,000)
  const milliseconds = nanoseconds / 1000000;
  return new Date(milliseconds).toLocaleString();
}

export function formatRelativeTime(nanoseconds: number): string {
  // Convert nanoseconds to milliseconds
  const milliseconds = nanoseconds / 1000000;
  const now = Date.now();
  const diffMs = now - milliseconds;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return new Date(milliseconds).toLocaleDateString();
}

export function calculateTimeRemaining(deadlineNanoseconds: number): string {
  const deadlineMs = deadlineNanoseconds / 1000000;
  const now = Date.now();
  const diffMs = deadlineMs - now;

  if (diffMs < 0) return 'Overdue';

  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor((diffMs % 86400000) / 3600000);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
  return 'Less than 1 hour remaining';
}