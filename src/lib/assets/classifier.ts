import type { AssetCategory, VariantRole } from '@/types';

interface FileInfo {
  originalName: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
}

interface InferResult {
  category: AssetCategory;
  slotName: string;
  variantRole: VariantRole;
  variantGroup?: string;
}

/**
 * Infer asset category, slot name, and variant role from filename, mime type, and dimensions.
 * Single source of truth for all filename-based classification.
 */
export function inferFromFile(file: FileInfo): InferResult {
  const name = file.originalName.toLowerCase();
  const mime = file.mimeType.toLowerCase();

  // Audio
  if (mime.startsWith('audio/')) {
    return { category: 'audio', slotName: 'bgm', variantRole: 'fixed' };
  }

  // Background
  if (name.includes('背景') || name.includes('bg') || name.includes('background')) {
    return { category: 'background', slotName: 'background', variantRole: 'variant', variantGroup: 'background' };
  }

  // Popup / dialog
  if (name.includes('弹窗') || name.includes('popup') || name.includes('dialog') || name.includes('win') || name.includes('card')) {
    return { category: 'popup', slotName: 'popup', variantRole: 'variant', variantGroup: 'popup' };
  }

  // Button / CTA
  if (name.includes('按钮') || name.includes('btn') || name.includes('button') || name.includes('cta') || name.includes('download') || name.includes('play')) {
    return { category: 'button', slotName: 'button', variantRole: 'fixed' };
  }

  // Icon / decoration
  if (name.includes('icon') || name.includes('图标') || name.includes('star') || name.includes('logo') || name.includes('finger') || name.includes('手指')) {
    return { category: 'icon', slotName: 'icon', variantRole: 'fixed' };
  }

  // Dimension-based inference for images
  if (mime.startsWith('image/') && file.width && file.height) {
    if (file.width >= 750) {
      return { category: 'background', slotName: 'background', variantRole: 'variant', variantGroup: 'background' };
    }
    if (file.width < 200 && file.height < 200) {
      return { category: 'icon', slotName: 'icon', variantRole: 'fixed' };
    }
  }

  return { category: 'unrecognized', slotName: 'background', variantRole: 'fixed' };
}

/**
 * Infer just the slot name (used by AI orchestrator when slotName is 'unrecognized')
 */
export function inferSlotName(file: FileInfo): string {
  return inferFromFile(file).slotName;
}
