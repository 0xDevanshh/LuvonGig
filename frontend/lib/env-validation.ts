// Environment validation utilities

export interface EnvironmentConfig {
  NEXT_PUBLIC_IC_HOST?: string;
  NEXT_PUBLIC_USER_CANISTER_ID?: string;
  NEXT_PUBLIC_MARKETPLACE_CANISTER_ID?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

export function validateEnvironment(config: Partial<EnvironmentConfig> = {}): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: EnvironmentConfig;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Use provided config or process.env
  const envConfig = {
    NEXT_PUBLIC_IC_HOST: config.NEXT_PUBLIC_IC_HOST || process.env.NEXT_PUBLIC_IC_HOST,
    NEXT_PUBLIC_USER_CANISTER_ID: config.NEXT_PUBLIC_USER_CANISTER_ID || process.env.NEXT_PUBLIC_USER_CANISTER_ID,
    NEXT_PUBLIC_MARKETPLACE_CANISTER_ID: config.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID || process.env.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID,
    NEXT_PUBLIC_APP_URL: config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL,
  };

  // Validate IC Host
  if (!envConfig.NEXT_PUBLIC_IC_HOST) {
    errors.push('NEXT_PUBLIC_IC_HOST is required for ICP connectivity');
  } else {
    // Check if it's a valid URL or localhost
    try {
      if (!envConfig.NEXT_PUBLIC_IC_HOST.includes('localhost') &&
          !envConfig.NEXT_PUBLIC_IC_HOST.includes('127.0.0.1')) {
        new URL(envConfig.NEXT_PUBLIC_IC_HOST);
      }
    } catch {
      errors.push('NEXT_PUBLIC_IC_HOST must be a valid URL or localhost address');
    }
  }

  // Validate User Canister ID
  if (!envConfig.NEXT_PUBLIC_USER_CANISTER_ID) {
    errors.push('NEXT_PUBLIC_USER_CANISTER_ID is required for user management');
  } else {
    // Basic canister ID format validation (should be a text representation of Principal)
    if (envConfig.NEXT_PUBLIC_USER_CANISTER_ID.length < 10 ||
        envConfig.NEXT_PUBLIC_USER_CANISTER_ID.length > 100) {
      errors.push('NEXT_PUBLIC_USER_CANISTER_ID appears to be in invalid format');
    }
  }

  // Validate Marketplace Canister ID (optional but recommended)
  if (!envConfig.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID) {
    warnings.push('NEXT_PUBLIC_MARKETPLACE_CANISTER_ID is not set - marketplace features will be limited');
  } else if (envConfig.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID.length < 10 ||
             envConfig.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID.length > 100) {
    errors.push('NEXT_PUBLIC_MARKETPLACE_CANISTER_ID appears to be in invalid format');
  }

  // Validate App URL
  if (!envConfig.NEXT_PUBLIC_APP_URL) {
    warnings.push('NEXT_PUBLIC_APP_URL is not set - using default localhost:3000');
  } else {
    try {
      new URL(envConfig.NEXT_PUBLIC_APP_URL);
    } catch {
      errors.push('NEXT_PUBLIC_APP_URL must be a valid URL');
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    config: envConfig as EnvironmentConfig
  };
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();

  console.log('🔍 Environment Validation Results:');
  console.log(`   ✅ Valid: ${validation.isValid}`);

  if (validation.errors.length > 0) {
    console.log('   ❌ Errors:');
    validation.errors.forEach(error => console.log(`      - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('   ⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`      - ${warning}`));
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log('   🎉 Environment is fully configured!');
  }
}

export function isICPConfigured(): boolean {
  const validation = validateEnvironment();
  return !!(validation.config.NEXT_PUBLIC_IC_HOST && validation.config.NEXT_PUBLIC_USER_CANISTER_ID);
}

export function isMarketplaceConfigured(): boolean {
  const validation = validateEnvironment();
  return !!validation.config.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID;
}