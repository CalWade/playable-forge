import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const DATA_DIR = process.env.DATA_DIR || './data';

interface ProcessResult {
  compressedPath: string;
  compressedSize: number;
  thumbnailPath: string;
  width: number;
  height: number;
}

export async function processImage(
  inputPath: string,
  projectId: string,
  assetId: string
): Promise<ProcessResult> {
  const projectDir = path.join(DATA_DIR, 'uploads', projectId);
  await fs.mkdir(projectDir, { recursive: true });

  const thumbDir = projectDir;
  const metadata = await sharp(inputPath).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Compress: keep format, reduce quality
  const ext = path.extname(inputPath).toLowerCase();
  const compressedPath = path.join(projectDir, `${assetId}-compressed${ext}`);

  const maxWidth = 1920;
  let pipeline = sharp(inputPath);

  if (width > maxWidth) {
    pipeline = pipeline.resize(maxWidth, undefined, { withoutEnlargement: true });
  }

  if (ext === '.png') {
    pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: 80 });
  } else if (ext === '.gif') {
    // GIF: just copy, sharp gif support is limited
    await fs.copyFile(inputPath, compressedPath);
  } else {
    // Default to JPEG
    pipeline = pipeline.jpeg({ quality: 80 });
  }

  if (ext !== '.gif') {
    await pipeline.toFile(compressedPath);
  }

  const compressedStats = await fs.stat(compressedPath);

  // Thumbnail: 200x200 max, JPEG
  const thumbnailPath = path.join(thumbDir, `${assetId}-thumbnail.jpg`);
  await sharp(inputPath)
    .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toFile(thumbnailPath);

  return {
    compressedPath,
    compressedSize: compressedStats.size,
    thumbnailPath,
    width,
    height,
  };
}

export async function processAudio(
  inputPath: string,
  projectId: string,
  assetId: string
): Promise<{ compressedPath: string; compressedSize: number; duration: number }> {
  const projectDir = path.join(DATA_DIR, 'uploads', projectId);
  await fs.mkdir(projectDir, { recursive: true });

  const compressedPath = path.join(projectDir, `${assetId}-compressed.mp3`);

  // Try FFmpeg compression: re-encode to MP3 128kbps mono
  try {
    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-ac', '1',           // mono
      '-ab', '128k',        // 128kbps
      '-ar', '44100',       // 44.1kHz sample rate
      '-y',                 // overwrite
      compressedPath,
    ]);
  } catch {
    // FFmpeg not installed or failed — fall back to copy
    const ext = path.extname(inputPath).toLowerCase();
    const fallbackPath = path.join(projectDir, `${assetId}-compressed${ext}`);
    await fs.copyFile(inputPath, fallbackPath);
    const stats = await fs.stat(fallbackPath);
    return {
      compressedPath: fallbackPath,
      compressedSize: stats.size,
      duration: await getAudioDuration(fallbackPath),
    };
  }

  const stats = await fs.stat(compressedPath);

  return {
    compressedPath,
    compressedSize: stats.size,
    duration: await getAudioDuration(compressedPath),
  };
}

async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath,
    ]);
    const seconds = parseFloat(stdout.trim());
    return isNaN(seconds) ? 0 : Math.round(seconds * 10) / 10;
  } catch {
    // ffprobe not installed or failed — return 0
    return 0;
  }
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}
