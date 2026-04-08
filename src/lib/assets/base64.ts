import { DATA_DIR } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';



/**
 * Generate base64 data URI from a file and cache it
 */
export async function generateBase64(
  filePath: string,
  mimeType: string,
  projectId: string,
  assetId: string
): Promise<string> {
  const cacheDir = path.join(DATA_DIR, 'base64', projectId);
  await fs.mkdir(cacheDir, { recursive: true });

  const cachePath = path.join(cacheDir, `${assetId}.b64`);

  const fileBuffer = await fs.readFile(filePath);
  const base64 = fileBuffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;

  // Write cache file
  await fs.writeFile(cachePath, dataUri, 'utf-8');

  return cachePath;
}

/**
 * Read cached base64 content
 */
export async function readBase64(cachePath: string): Promise<string> {
  return fs.readFile(cachePath, 'utf-8');
}
