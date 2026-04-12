// ==================== Asset ====================

export interface AssetMetadata {
  originalName: string;
  category: string;
  slotName: string | null;
  variantRole: string;
  variantGroup: string | null;
  width: number | null;
  height: number | null;
  mimeType: string;
}

export interface AssetRecord extends AssetMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  compressedSize: number | null;
  base64CachePath: string | null;
  thumbnailPath: string | null;
  categoryConfirmed: boolean;
  variantGroup: string | null;
}

export interface AssetListItem {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  compressedSize: number | null;
  width: number | null;
  height: number | null;
  category: string;
  categoryConfirmed: boolean;
  variantRole: string;
  variantGroup: string | null;
  slotName: string | null;
  thumbnailUrl: string | null;
}

// ==================== HTML / Validation ====================

export interface SlotAsset {
  slotName: string;
  base64DataUri: string;
  mimeType: string;
}

export interface SynthesisResult {
  html: string;
  size: number;
  unreplacedSlots: string[];
  replacedSlots: string[];
}

export interface ValidationCheckResult {
  id: string;
  name: string;
  level: 'error' | 'warning';
  passed: boolean;
  detail: string;
}

export interface ValidationResult {
  grade: string;
  results: ValidationCheckResult[];
  passedCount: number;
  failedCount: number;
  warningCount: number;
}

// ==================== Variant ====================

export interface VariantCombination {
  [slotName: string]: string; // slotName → assetId
}

export interface VariantDimension {
  name: string;
  label: string;
  assets: Array<{
    id: string;
    slotName: string;
    base64CachePath: string;
    mimeType: string;
    originalName: string;
    thumbnailUrl?: string | null;
    fileName?: string;
  }>;
  enabled: boolean;
}

// ==================== SSE ====================

export interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

// ==================== Classification ====================

export type AssetCategory =
  | 'background'
  | 'popup'
  | 'button'
  | 'icon'
  | 'audio'
  | 'unrecognized';

export type VariantRole = 'variant' | 'fixed' | 'excluded';

export interface ClassificationResult {
  fileName: string;
  category: AssetCategory;
  confidence: number;
}
