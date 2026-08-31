import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './declarations/user/user.did.js';
import { idlFactory as escrowIdlFactory } from './declarations/escrow/escrow.did.js';

// Type imports from generated declarations
type _SERVICE = any;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  isVerified: boolean;
  createdAt: number;
  lastLoginAt: number | null;
  profile: ProfileData | null;
  otpData: OTPData | null;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  profileImageUrl: string | null;
  resumeUrl: string | null;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  current: boolean;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
  gpa: string | null;
  description: string | null;
}

export interface OTPData {
  code: string;
  expiresAt: number;
  attempts: number;
}

// IC Agent configuration
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:4943';
const USER_CANISTER_ID = process.env.NEXT_PUBLIC_USER_CANISTER_ID || '';
const ESCROW_CANISTER_ID = process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID || '';

let agent: HttpAgent | null = null;
let userActor: _SERVICE | null = null;
let escrowActor: _SERVICE | null = null;

export async function getICAgent(): Promise<HttpAgent> {
  if (!agent) {
    // Validate environment before attempting connection
    if (!IC_HOST) {
      throw new Error('IC_HOST environment variable is not configured');
    }

    try {
      console.log('Creating IC agent with host:', IC_HOST);

      // Add timeout to the agent creation
      const agentPromise = new Promise<HttpAgent>((resolve, reject) => {
        try {
          const newAgent = new HttpAgent({
            host: IC_HOST,
            verifyQuerySignatures: false // Set to true in production
          });

          // In development, fetch the root key with timeout
          if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
            console.log('Fetching root key for localhost development');
            const rootKeyPromise = newAgent.fetchRootKey();
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Root key fetch timed out')), 10000);
            });

            Promise.race([rootKeyPromise, timeoutPromise])
              .then(() => {
                console.log('IC agent created successfully');
                resolve(newAgent);
              })
              .catch(reject);
          } else {
            console.log('IC agent created successfully (production mode)');
            resolve(newAgent);
          }
        } catch (error) {
          reject(error);
        }
      });

      agent = await agentPromise;
    } catch (error) {
      console.error('Failed to create IC agent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // More specific error messages
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        throw new Error(`Unable to connect to Internet Computer at ${IC_HOST}. Please ensure the local replica is running.`);
      } else if (errorMessage.includes('timed out')) {
        throw new Error(`Connection to Internet Computer timed out. Please check your network connection and try again.`);
      } else {
        throw new Error(`Failed to connect to Internet Computer: ${errorMessage}`);
      }
    }
  }
  return agent;
}

export async function getUserActor(): Promise<_SERVICE> {
  if (!userActor) {
    // Validate canister ID before attempting connection
    if (!USER_CANISTER_ID) {
      throw new Error('USER_CANISTER_ID environment variable is not configured');
    }

    try {
      console.log('Creating user actor with canister ID:', USER_CANISTER_ID);

      // Add timeout to actor creation
      const actorPromise = new Promise<_SERVICE>((resolve, reject) => {
        try {
          const principal = Principal.fromText(USER_CANISTER_ID);
          getICAgent()
            .then(agent => {
              const actor = Actor.createActor(idlFactory, {
                agent,
                canisterId: principal,
              });
              console.log('User actor created successfully');
              resolve(actor);
            })
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('User actor creation timed out')), 15000);
      });

      userActor = await Promise.race([actorPromise, timeoutPromise]);
    } catch (error) {
      console.error('Failed to create user actor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // More specific error messages
      if (errorMessage.includes('Cannot convert text to Principal')) {
        throw new Error(`Invalid canister ID format: ${USER_CANISTER_ID}. Please check your environment configuration.`);
      } else if (errorMessage.includes('timed out')) {
        throw new Error(`User actor creation timed out. The backend service may be temporarily unavailable.`);
      } else {
        throw new Error(`Failed to connect to user canister: ${errorMessage}`);
      }
    }
  }
  return userActor;
}

export async function getEscrowActor(): Promise<_SERVICE> {
  if (!escrowActor) {
    // Validate canister ID before attempting connection
    if (!ESCROW_CANISTER_ID) {
      throw new Error('ESCROW_CANISTER_ID environment variable is not configured');
    }

    try {
      console.log('Creating escrow actor with canister ID:', ESCROW_CANISTER_ID);

      // Add timeout to actor creation
      const actorPromise = new Promise<_SERVICE>((resolve, reject) => {
        try {
          const principal = Principal.fromText(ESCROW_CANISTER_ID);
          getICAgent()
            .then(agent => {
              const actor = Actor.createActor(escrowIdlFactory, {
                agent,
                canisterId: principal,
              });
              console.log('Escrow actor created successfully');
              resolve(actor);
            })
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Escrow actor creation timed out')), 15000);
      });

      escrowActor = await Promise.race([actorPromise, timeoutPromise]);
    } catch (error) {
      console.error('Failed to create escrow actor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // More specific error messages
      if (errorMessage.includes('Cannot convert text to Principal')) {
        throw new Error(`Invalid canister ID format: ${ESCROW_CANISTER_ID}. Please check your environment configuration.`);
      } else if (errorMessage.includes('timed out')) {
        throw new Error(`Escrow actor creation timed out. The backend service may be temporarily unavailable.`);
      } else {
        throw new Error(`Failed to connect to escrow canister: ${errorMessage}`);
      }
    }
  }
  return escrowActor;
}

// Helper function to create a real actor with IDL
export async function createActorWithIDL<T>(
  canisterId: string,
  idlFactory: any
): Promise<T> {
  const agent = await getICAgent();
  const principal = Principal.fromText(canisterId);
  return Actor.createActor(idlFactory, { agent, canisterId: principal });
}

// Environment variables validation
export function validateICConfig(): void {
  if (!process.env.NEXT_PUBLIC_USER_CANISTER_ID) {
    throw new Error('NEXT_PUBLIC_USER_CANISTER_ID environment variable is required');
  }
  if (!process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID) {
    throw new Error('NEXT_PUBLIC_ESCROW_CANISTER_ID environment variable is required');
  }
}

// Initialize IC connection
export async function initializeIC(): Promise<void> {
  validateICConfig();
  await getICAgent();
  await getUserActor();
}
