import { generateText } from 'ai';
import { getModel } from './provider';
import { inferFromFile } from '@/lib/assets/classifier';
import type { AssetMetadata, ClassificationResult } from '@/types';

const CLASSIFY_SYSTEM_PROMPT = `你是一个 Playable Ad 素材分类专家。根据给定的素材文件信息，判断每个素材在广告中的角色。

分类规则：
- reference (效果图/参考图)：通常是完整的广告截图或设计稿，尺寸较大，内容丰富
- background (背景图)：全屏背景素材，通常尺寸大(>= 750px 宽)，风景/场景类
- popup (弹窗/卡片)：UI 弹窗、对话框、卡片，文件名可能含 popup/dialog/card/win
- button (按钮/CTA)：下载按钮、操作按钮，通常较小且宽>高，文件名可能含 btn/button/cta/download/play
- icon (图标/装饰)：手指引导、Logo、星星、小图标，通常较小(< 200px)
- audio (音频)：MP3/WAV 文件
- unrecognized：无法判断

变体角色推断：
- 如果同类素材有多个(如多张背景图)，标为 variant
- 如果是唯一的按钮/CTA，标为 fixed
- 效果图/参考图标为 excluded(不参与最终 HTML)

请根据文件名、尺寸、MIME 类型等信息进行分类。

必须返回 JSON 格式（不要包含 markdown 代码块），格式如下：
{"assets":[{"fileName":"原始文件名","category":"background","confidence":0.9,"suggestedSlotName":"background","suggestedVariantRole":"variant","suggestedVariantGroup":"background"}]}

category 取值：reference, background, popup, button, icon, audio, unrecognized
suggestedVariantRole 取值：variant, fixed, excluded`;

type AssetInfo = Pick<AssetMetadata, 'originalName' | 'mimeType' | 'width' | 'height'> & {
  fileName: string;
  fileSize: number;
};

/**
 * Filename-based classification fallback using shared classifier
 */
function classifyByFilename(asset: AssetInfo): ClassificationResult {
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

export async function classifyAssets(assets: AssetInfo[]): Promise<ClassificationResult[]> {
  const assetDescriptions = assets
    .map(
      (a) =>
        `- ${a.originalName} (${a.mimeType}, ${a.fileSize} bytes${
          a.width && a.height ? `, ${a.width}x${a.height}` : ''
        })`
    )
    .join('\n');

  try {
    const result = await generateText({
      model: await getModel(),
      system: CLASSIFY_SYSTEM_PROMPT,
      prompt: `请对以下 ${assets.length} 个素材文件进行分类：\n\n${assetDescriptions}`,
      maxOutputTokens: 2000,
    });

    // Extract JSON from response
    let jsonText = result.text.trim();
    // Remove markdown code blocks if present
    const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) jsonText = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonText);
    if (parsed.assets && Array.isArray(parsed.assets)) {
      return parsed.assets;
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('AI classification failed, using filename-based fallback:', error);
    // Fallback: classify by filename patterns
    return assets.map(classifyByFilename);
  }
}
