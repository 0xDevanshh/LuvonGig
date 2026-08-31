// Marketplace environment configuration and validation

export interface MarketplaceConfig {
  IC_HOST: string;
  MARKETPLACE_CANISTER_ID: string;
  isConfigured: boolean;
  isLocal: boolean;
}

export function getMarketplaceConfig(): MarketplaceConfig {
  const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:4943';
  const MARKETPLACE_CANISTER_ID = process.env.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID || '';

  return {
    IC_HOST,
    MARKETPLACE_CANISTER_ID,
    isConfigured: !!(IC_HOST && MARKETPLACE_CANISTER_ID),
    isLocal: IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')
  };
}

export function validateMarketplaceConfig(): void {
  const config = getMarketplaceConfig();

  if (!config.IC_HOST) {
    throw new Error('NEXT_PUBLIC_IC_HOST environment variable is required');
  }

  if (!config.MARKETPLACE_CANISTER_ID) {
    throw new Error('NEXT_PUBLIC_MARKETPLACE_CANISTER_ID environment variable is required');
  }

  // Basic canister ID format validation (ICP canister IDs: 5 chars, dash, 27 chars total including dashes)
  // Allow for different canister ID formats
  if (!config.MARKETPLACE_CANISTER_ID.match(/^[a-z0-9]{5}-[a-z0-9-]{21,27}$/) && 
      !config.MARKETPLACE_CANISTER_ID.match(/^[a-z0-9-]+$/)) {
    console.warn(`Marketplace canister ID format may be invalid: ${config.MARKETPLACE_CANISTER_ID}`);
  }

  console.log('✅ Marketplace configuration validated:', {
    IC_HOST: config.IC_HOST,
    MARKETPLACE_CANISTER_ID: config.MARKETPLACE_CANISTER_ID,
    isLocal: config.isLocal
  });
}

export function getMarketplaceCanisterId(): string {
  const config = getMarketplaceConfig();

  if (!config.isConfigured) {
    console.warn('⚠️  Marketplace not configured, using fallback canister ID');
    // Always return the configured ID even if invalid format
    // This allows the application to start and show better error messages
    return config.MARKETPLACE_CANISTER_ID;
  }

  return config.MARKETPLACE_CANISTER_ID;
}

// Fallback for development when canister is not available
export function isMarketplaceAvailable(): boolean {
  const config = getMarketplaceConfig();
  return config.isConfigured && config.isLocal;
}

// Timeout utility for canister calls
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}