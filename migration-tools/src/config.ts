import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error('Copy .env.example to .env and fill it in.');
    process.exit(1);
  }
  return value;
}

export const config = {
  icHost: process.env.IC_HOST || 'https://icp0.io',
  canisters: {
    user: required('USER_CANISTER_ID'),
    marketplace: required('MARKETPLACE_CANISTER_ID'),
    jobMarketplace: process.env.JOB_MARKETPLACE_CANISTER_ID || '',
    hackquest: process.env.HACKQUEST_CANISTER_ID || '',
  },
  databaseUrl: process.env.DATABASE_URL || '',
  importCurrency: (process.env.IMPORT_CURRENCY || 'USD').toUpperCase(),
} as const;

export const EXPORT_DIR = new URL('../exports/', import.meta.url).pathname;
