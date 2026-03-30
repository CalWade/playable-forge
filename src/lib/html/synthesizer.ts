import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';

interface SlotAsset {
  slotName: string;
  base64DataUri: string; // full data URI: data:image/png;base64,...
  mimeType: string;
}

interface SynthesisResult {
  html: string;
  size: number;
  unreplacedSlots: string[];
  replacedSlots: string[];
}

/**
 * Synthesize full HTML by injecting base64 assets into skeleton PLACEHOLDER slots
 */
export function synthesize(
  skeleton: string,
  slotAssets: Map<string, SlotAsset>
): SynthesisResult {
  let html = skeleton;
  const replacedSlots: string[] = [];
  const allSlots: string[] = [];

  // Find all data-variant-slot occurrences
  const slotRegex = /data-variant-slot="([^"]+)"/g;
  let match;
  while ((match = slotRegex.exec(skeleton)) !== null) {
    const slotName = match[1];
    if (!allSlots.includes(slotName)) {
      allSlots.push(slotName);
    }
  }

  // Replace PLACEHOLDERs for each slot
  // Strategy: find each element with data-variant-slot, then replace its src containing PLACEHOLDER
  slotAssets.forEach((asset, slotName) => {
    const escapedSlot = escapeRegex(slotName);
    
    // Ensure base64DataUri is a proper data URI
    let dataUri = asset.base64DataUri;
    if (!dataUri.startsWith('data:')) {
      dataUri = `data:${asset.mimeType};base64,${dataUri}`;
    }

    // Pattern 1: src="data:...;base64,PLACEHOLDER"
    const pattern1 = new RegExp(
      `(data-variant-slot="${escapedSlot}"[^>]*?src=")data:[^;]*;base64,PLACEHOLDER"`,
      'g'
    );
    // Pattern 2: src="PLACEHOLDER" (AI might use simple placeholder)
    const pattern2 = new RegExp(
      `(data-variant-slot="${escapedSlot}"[^>]*?src=")PLACEHOLDER"`,
      'g'
    );
    // Pattern 3: src attribute comes before data-variant-slot
    const pattern3 = new RegExp(
      `(src=")data:[^;]*;base64,PLACEHOLDER("[^>]*?data-variant-slot="${escapedSlot}")`,
      'g'
    );
    const pattern4 = new RegExp(
      `(src=")PLACEHOLDER("[^>]*?data-variant-slot="${escapedSlot}")`,
      'g'
    );

    const before = html;
    html = html.replace(pattern1, `$1${dataUri}"`);
    html = html.replace(pattern2, `$1${dataUri}"`);
    html = html.replace(pattern3, `$1${dataUri}$2`);
    html = html.replace(pattern4, `$1${dataUri}$2`);

    if (html !== before) {
      replacedSlots.push(slotName);
    }
  });

  // Check for remaining PLACEHOLDERs
  const unreplacedSlots: string[] = [];
  const unreplacedRegex = /data-variant-slot="([^"]+)"/g;
  let umatch;
  while ((umatch = unreplacedRegex.exec(html)) !== null) {
    const name = umatch[1];
    // Check if there's still a PLACEHOLDER near this slot
    const surrounding = html.substring(
      Math.max(0, umatch.index - 200),
      Math.min(html.length, umatch.index + 200)
    );
    if (surrounding.includes('PLACEHOLDER') && !unreplacedSlots.includes(name)) {
      unreplacedSlots.push(name);
    }
  }

  const size = Buffer.byteLength(html, 'utf-8');

  return { html, size, unreplacedSlots, replacedSlots };
}

/**
 * Save synthesized HTML to disk
 */
export async function saveHtml(
  html: string,
  projectId: string,
  fileName: string
): Promise<{ filePath: string; size: number }> {
  const dir = path.join(DATA_DIR, 'html', projectId);
  await fs.mkdir(dir, { recursive: true });

  // Ensure parent dir for nested filenames like "variants/name.html"
  const filePath = path.join(dir, fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, html, 'utf-8');

  const size = Buffer.byteLength(html, 'utf-8');
  return { filePath, size };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
