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
  slotAssets.forEach((asset, slotName) => {
    // Match: data-variant-slot="slotName" ... src="data:...;base64,PLACEHOLDER"
    const pattern = new RegExp(
      `(data-variant-slot="${escapeRegex(slotName)}"[^>]*?src=")data:[^;]*;base64,PLACEHOLDER"`,
      'g'
    );

    const before = html;
    html = html.replace(pattern, `$1${asset.base64DataUri}"`);

    if (html !== before) {
      replacedSlots.push(slotName);
    }
  });

  // Check for remaining PLACEHOLDERs
  const unreplacedMatches = html.match(/data-variant-slot="([^"]+)"[^>]*?PLACEHOLDER/g);
  const unreplacedSlots: string[] = [];
  if (unreplacedMatches) {
    for (const m of unreplacedMatches) {
      const nameMatch = m.match(/data-variant-slot="([^"]+)"/);
      if (nameMatch && !unreplacedSlots.includes(nameMatch[1])) {
        unreplacedSlots.push(nameMatch[1]);
      }
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

  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, html, 'utf-8');

  const size = Buffer.byteLength(html, 'utf-8');
  return { filePath, size };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
