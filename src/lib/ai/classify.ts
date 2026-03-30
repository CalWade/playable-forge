import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel } from './provider';

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

请根据文件名、尺寸、MIME 类型等信息进行分类。`;

const classificationSchema = z.object({
  assets: z.array(
    z.object({
      fileName: z.string(),
      category: z.enum([
        'reference',
        'background',
        'popup',
        'button',
        'icon',
        'audio',
        'unrecognized',
      ]),
      confidence: z.number().min(0).max(1),
      suggestedSlotName: z.string().optional(),
      suggestedVariantRole: z.enum(['variant', 'fixed', 'excluded']),
      suggestedVariantGroup: z.string().optional(),
    })
  ),
});

interface AssetInfo {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
}

export async function classifyAssets(assets: AssetInfo[]) {
  const assetDescriptions = assets
    .map(
      (a) =>
        `- ${a.originalName} (${a.mimeType}, ${a.fileSize} bytes${
          a.width && a.height ? `, ${a.width}x${a.height}` : ''
        })`
    )
    .join('\n');

  try {
    const result = await generateObject({
      model: getModel(),
      schema: classificationSchema,
      system: CLASSIFY_SYSTEM_PROMPT,
      prompt: `请对以下 ${assets.length} 个素材文件进行分类：\n\n${assetDescriptions}`,
    });

    return result.object.assets;
  } catch (error) {
    console.error('AI classification failed:', error);
    // Fallback: return all as unrecognized
    return assets.map((a) => ({
      fileName: a.fileName,
      category: 'unrecognized' as const,
      confidence: 0,
      suggestedSlotName: undefined,
      suggestedVariantRole: 'fixed' as const,
      suggestedVariantGroup: undefined,
    }));
  }
}
