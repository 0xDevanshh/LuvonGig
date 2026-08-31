/**
 * Captures the JSON side-store at frontend/tmp/service-data/services.json.
 *
 * This is NOT canister data. frontend/lib/service-storage.ts wrote it because
 * the marketplace canister could not hold FAQs, client questions, tier mode,
 * cover images or the freelancer's email — so those live only in a file on the
 * web server's disk. On Vercel that filesystem is ephemeral, which means this
 * data is already being lost in production; the migration is what fixes it.
 *
 * Nothing else in the export can reconstruct these fields, so if the file is
 * missing, that content is simply gone and the import must proceed without it.
 */
import { readFile } from 'node:fs/promises';
import { writeExport } from '../lib/output.js';

const SIDE_STORE_PATH = new URL(
  '../../../frontend/tmp/service-data/services.json',
  import.meta.url,
).pathname;

export interface ExportedSideStoreEntry {
  serviceId: string;
  freelancerEmail: string | null;
  coverImageUrl: string | null;
  portfolioImages: string[];
  tierMode: string | null;
  descriptionFormat: string | null;
  faqs: unknown[];
  clientQuestions: unknown[];
  packages: unknown[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function exportSideStore(): Promise<void> {
  console.log('Capturing the service side-store...');

  let parsed: any;
  try {
    parsed = JSON.parse(await readFile(SIDE_STORE_PATH, 'utf8'));
  } catch {
    console.warn(
      '  frontend/tmp/service-data/services.json not found or unreadable.\n' +
        '  FAQs, client questions and tier mode will be absent from the import.\n' +
        '  This is expected if the app has only ever run on Vercel, where that\n' +
        '  file does not survive between deploys.',
    );
    await writeExport('service_side_store', { canister: 'n/a (local file)', canisterId: '-', host: '-' }, []);
    return;
  }

  // The file has been written in two shapes over its life: a bare array, and
  // an object keyed by service id.
  const rows: any[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.services)
      ? parsed.services
      : Object.values(parsed ?? {});

  const entries: ExportedSideStoreEntry[] = rows
    .filter((r) => r && (r.service_id || r.serviceId))
    .map((r) => ({
      serviceId: r.service_id ?? r.serviceId,
      freelancerEmail: r.freelancer_email ?? null,
      coverImageUrl: r.cover_image_url ?? null,
      portfolioImages: Array.isArray(r.portfolio_images) ? r.portfolio_images : [],
      tierMode: r.tier_mode ?? null,
      descriptionFormat: r.description_format ?? null,
      faqs: Array.isArray(r.faqs) ? r.faqs : [],
      clientQuestions: Array.isArray(r.client_questions) ? r.client_questions : [],
      packages: Array.isArray(r.packages) ? r.packages : [],
    }));

  console.log(`  ${entries.length} service(s) with side-store data`);
  await writeExport('service_side_store',
    { canister: 'n/a (local file)', canisterId: '-', host: '-' }, entries);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  exportSideStore().catch((err) => { console.error(err); process.exit(1); });
}
