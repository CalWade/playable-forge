import { generateText } from 'ai';
import { getModel } from './provider';
import { inferFromFile } from '@/lib/assets/classifier';
import type { ClassificationResult } from '@/types';
import fs from 'fs/promises';

const CLASSIFY_SYSTEM_PROMPT = `你是一个 Playable Ad 素材分类专家。根据给定的素材文件信息和图片内容，判断每个素材在广告中的角色。

分类规则：
- reference (效果图/参考图)：通常是完整的广告截图或设计稿，包含多种UI元素、文字叠加层、完整的广告布局
- background (背景图)：全屏背景素材，通常尺寸大(>= 750px 宽)，风景/场景/纯色渐变
- popup (弹窗/卡片)：UI 弹窗、对话框、获奖卡片，通常有圆角边框，内容区域集中在中间
- button (按钮/CTA)：下载按钮、操作按钮，通常较小且宽>高，有明显的点击引导样式
- icon (图标/装饰)：手指引导、Logo、星星、小图标，通常较小(< 200px)，可能有透明背景
- audio (音频)：MP3/WAV 文件
- unrecognized：无法判断

变体角色推断：
- 如果同类素材有多个(如多张背景图)，标为 variant
- 如果是唯一的按钮/CTA，标为 fixed
- 效果图/参考图标为 excluded(不参与最终 HTML)

请仔细观察每张图片的内容来分类，不要仅靠文件名。

必须返回 JSON 格式（不要包含 markdown 代码块），格式如下：
{"assets":[{"fileName":"原始文件名","category":"background","confidence":0.9,"suggestedSlotName":"background","suggestedVariantRole":"variant","suggestedVariantGroup":"background"}]}

category 取值：reference, background, popup, button, icon, audio, unrecognized
suggestedVariantRole 取值：variant, fixed, excluded`;

export interface AssetClassifyInfo {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  thumbnailPath?: string | null;
}

/**
 * Filename-based classification fallback using shared classifier
 */
function classifyByFilename(asset: AssetClassifyInfo): ClassificationResult {
  const inferred = inferFromFile(asset);
  return {
    fileName: asset.originalName,
    category: inferred.category,
    confidence: 0.5,
    suggestedSlotName: inferred.slotName,
    suggestedVariantRole: inferred.variantRole,
    suggestedVariantGroup: inferred.variantGroup,
  };
}

/**
 * Read thumbnail as base64 data URI. Returns null on any failure.
 */
async function readThumbnailBase64(thumbnailPath: string): Promise<string | null> {
  try {
    const buffer = await fs.readFile(thumbnailPath);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function classifyAssets(assets: AssetClassifyInfo[]): Promise<ClassificationResult[]> {
  // Build text description for each asset
  const assetDescriptions = assets
    .map(
      (a, i) =>
        `[${i + 1}] ${a.originalName} (${a.mimeType}, ${a.fileSize} bytes${
          a.width && a.height ? `, ${a.width}x${a.height}` : ''
        })`
    )
    .join('\n');

  // Build multimodal content: text + thumbnail images
  const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
    { type: 'text', text: `请对以下 ${assets.length} 个素材文件进行分类：\n\n${assetDescriptions}\n\n以下是每个素材的缩略图（按编号顺序，音频文件无缩略图）：` },
  ];

  // Add thumbnails for image assets
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    if (asset.thumbnailPath && asset.mimeType.startsWith('image/')) {
      const b64 = await readThumbnailBase64(asset.thumbnailPath);
      if (b64) {
        content.push({ type: 'text', text: `[${i + 1}] ${asset.originalName}:` });
        content.push({ type: 'image', image: b64 });
      }
    }
  }

  try {
    const result = await generateText({
      model: await getModel(),
      system: CLASSIFY_SYSTEM_PROMPT,
      messages: [{ role: 'user' as const, content }],
      maxOutputTokens: 2000,
    });

    // Extract JSON from response
    let jsonText = result.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) jsonText = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonText);
    if (parsed.assets && Array.isArray(parsed.assets)) {
      return parsed.assets;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('AI classification failed, using filename-based fallback:', error);
    return assets.map(classifyByFilename);
  }
}
