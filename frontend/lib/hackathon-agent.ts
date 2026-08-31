import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '@/lib/declarations/hackathon/hackathon.did.js';

// Type imports from generated declarations
import type { _SERVICE } from '@/lib/declarations/hackathon/hackathon.did.d';

export interface Hackathon {
  hackathon_id: string;
  title: string;
  tagline: string;
  description: string;
  theme: string;
  mode: {
    Online: null;
    Offline: null;
    Hybrid: null;
  };
  location: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  min_team_size: number;
  max_team_size: number;
  prize_pool: string;
  rules: string;
  status: {
    Upcoming: null;
    Ongoing: null;
    Completed: null;
    Cancelled: null;
  };
  created_at: string;
  updated_at: string;
}

export interface Participant {
  participant_id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  year_of_study: string;
  skills: string[];
  created_at: string;
}

export interface Team {
  team_id: string;
  team_name: string;
  leader_id: string;
  hackathon_id: string;
  project_title: string;
  project_idea: string;
  created_at: string;
  member_ids: string[];
}

export interface Registration {
  registration_id: string;
  hackathon_id: string;
  participant_id: [string] | [];
  team_id: [string] | [];
  status: {
    Pending: null;
    Approved: null;
    Rejected: null;
    Cancelled: null;
  };
  payment_status: {
    Free: null;
    Paid: null;
    Pending: null;
    Failed: null;
  };
  transaction_id: string;
  registration_date: string;
}

export interface CreateHackathonRequest {
  title: string;
  tagline: string;
  description: string;
  theme: string;
  mode: {
    Online: null;
    Offline: null;
    Hybrid: null;
  };
  location: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  min_team_size: number;
  max_team_size: number;
  prize_pool: string;
  rules: string;
}

export interface CreateParticipantRequest {
  full_name: string;
  email: string;
  phone: string;
  college: string;
  year_of_study: string;
  skills: string[];
}

export interface CreateTeamRequest {
  team_name: string;
  leader_id: string;
  hackathon_id: string;
  project_title: string;
  project_idea: string;
}

export interface CreateRegistrationRequest {
  hackathon_id: string;
  participant_id: [string] | [];
  team_id: [string] | [];
}

// IC Agent configuration
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:4943';
const HACKATHON_CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID || '';

let agent: HttpAgent | null = null;
let hackathonActor: _SERVICE | null = null;

export async function getHackathonAgent(): Promise<_SERVICE> {
  if (!hackathonActor) {
    agent = new HttpAgent({
      host: IC_HOST,
      verifyQuerySignatures: false // Set to true in production
    });

    // In development, we don't need to fetch the root key
    if (IC_HOST.includes('localhost')) {
      await agent.fetchRootKey();
    }
  }

  if (!hackathonActor && agent) {
    const canisterId = Principal.fromText(HACKATHON_CANISTER_ID);
    hackathonActor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });
  }

  return hackathonActor!;
}

// Helper function to create a real actor with IDL
export async function createHackathonActor<T>(
  canisterId: string,
  idlFactory: any
): Promise<T> {
  const agent = await getHackathonAgent();
  const principal = Principal.fromText(canisterId);
  return Actor.createActor(idlFactory, { agent: agent as any, canisterId: principal });
}

// Environment variables validation
export function validateHackathonConfig(): void {
  if (!process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID) {
    throw new Error('NEXT_PUBLIC_HACKATHON_CANISTER_ID environment variable is required');
  }
}

// Initialize hackathon connection
export async function initializeHackathon(): Promise<void> {
  validateHackathonConfig();
  await getHackathonAgent();
}

// Test function
export async function testHackathonCanister(): Promise<string> {
  try {
    const agent = await getHackathonAgent();
    if (!agent) {
      throw new Error('Failed to get hackathon agent');
    }

    // Try to call a simple query function if available
    const result = await (agent as any).hello();
    return result || "Hackathon canister is working";
  } catch (error) {
    console.error('Error testing hackathon canister:', error);
    throw error;
  }
}