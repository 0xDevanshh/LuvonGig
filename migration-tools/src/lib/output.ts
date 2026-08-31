import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EXPORT_DIR } from '../config.js';
import { jsonReplacer } from './candid.js';

export interface ExportFile<T> {
  exportedAt: string;
  source: { canister: string; canisterId: string; host: string };
  count: number;
  records: T[];
}

export async function writeExport<T>(
  name: string,
  meta: ExportFile<T>['source'],
  records: T[],
): Promise<string> {
  await mkdir(EXPORT_DIR, { recursive: true });
  const path = join(EXPORT_DIR, `${name}.json`);

  const payload: ExportFile<T> = {
    exportedAt: new Date().toISOString(),
    source: meta,
    count: records.length,
    records,
  };

  await writeFile(path, JSON.stringify(payload, jsonReplacer, 2), 'utf8');
  console.log(`  wrote ${records.length} record(s) -> exports/${name}.json`);
  return path;
}

export async function readExport<T>(name: string): Promise<ExportFile<T>> {
  const path = join(EXPORT_DIR, `${name}.json`);
  try {
    return JSON.parse(await readFile(path, 'utf8')) as ExportFile<T>;
  } catch (err) {
    throw new Error(
      `Could not read exports/${name}.json — run the export first.\n  ${String(err)}`,
    );
  }
}
