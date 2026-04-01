import { streamText, generateText } from 'ai';
import { getModel } from './provider';
import { GENERATE_SYSTEM_PROMPT, ITERATE_SYSTEM_PROMPT } from './prompts';
import { inferSlotName } from '@/lib/assets/classifier';
import { getSettings } from '@/lib/settings';
import { SAFETY_CLARIFICATION } from '@/lib/ai/response-validator';
import type { AssetMetadata } from '@/types';

interface GenerateParams {
  assets: AssetMetadata[];
  referenceImageBase64?: string[];
  description?: string;
  safetyClarification?: boolean;
}

function getSlotName(a: AssetMetadata): string {
  if (a.slotName && a.slotName !== 'unrecognized') return a.slotName;
  if (a.category && a.category !== 'unrecognized') return a.category;
  return inferSlotName(a);
}

async function getSystemPrompt(defaultPrompt: string): Promise<string> {
  try {
    const settings = await getSettings();
    if (settings.ai.systemPromptOverride?.trim()) {
      return settings.ai.systemPromptOverride;
    }
  } catch { /* use default */ }
  return defaultPrompt;
}

function buildAssetList(assets: AssetMetadata[]): string {
  return assets
    .filter((a) => a.variantRole !== 'excluded')
    .map(
      (a) =>
        `- ${a.originalName} | 分类: ${a.category} | slot: ${getSlotName(a)} | ${
          a.width && a.height ? `${a.width}x${a.height}` : '尺寸未知'
        } | ${a.mimeType}`
    )
    .join('\n');
}

export async function generateSkeleton(params: GenerateParams) {
  const assetList = buildAssetList(params.assets);

  let textPrompt = `请根据以下素材生成 Playable Ad HTML 骨架。\n\n## 素材列表\n${assetList}`;

  if (params.description) {
    textPrompt += `\n\n## 用户描述\n${params.description}`;
  }

  if (params.referenceImageBase64 && params.referenceImageBase64.length > 0) {
    textPrompt += `\n\n## 效果图\n已提供 ${params.referenceImageBase64.length} 张效果图作为布局参考，请仔细观察效果图中的元素布局、颜色搭配和整体风格。`;
  }

  if (params.safetyClarification) {
    textPrompt = `${SAFETY_CLARIFICATION}\n\n${textPrompt}`;
  }

  const systemPrompt = await getSystemPrompt(GENERATE_SYSTEM_PROMPT);

  // Build multimodal message content
  const userContent: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
    { type: 'text', text: textPrompt },
  ];

  // Add reference images as image parts (multimodal)
  if (params.referenceImageBase64 && params.referenceImageBase64.length > 0) {
    for (const imgB64 of params.referenceImageBase64) {
      // imgB64 is already a data URI like "data:image/png;base64,..."
      // Vercel AI SDK accepts data URIs directly
      userContent.push({ type: 'image', image: imgB64 });
    }
  }

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages: [{ role: 'user' as const, content: userContent }],
    maxOutputTokens: 16000,
  });

  return { stream: result, prompt: textPrompt + (params.referenceImageBase64?.length ? `\n[+ ${params.referenceImageBase64.length} 张效果图]` : ''), systemPrompt };
}

interface IterateParams {
  currentSkeleton: string;
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function iterateSkeleton(params: IterateParams) {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Include recent conversation history (last 10 pairs)
  const recentHistory = params.conversationHistory.slice(-20);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  const systemPrompt = await getSystemPrompt(ITERATE_SYSTEM_PROMPT);
  const userPrompt = `当前 HTML 骨架：\n\`\`\`html\n${params.currentSkeleton}\n\`\`\`\n\n修改要求：${params.userMessage}`;

  messages.push({ role: 'user', content: userPrompt });

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages,
    maxOutputTokens: 16000,
  });

  return { stream: result, prompt: userPrompt, systemPrompt };
}

export async function autofixSkeleton(
  skeleton: string,
  failedItems: string[]
): Promise<{ html: string; prompt: string; systemPrompt: string; rawResponse: string }> {
  const systemPrompt = await getSystemPrompt(ITERATE_SYSTEM_PROMPT);
  const prompt = `以下 HTML 校验未通过，请修复这些问题：\n\n校验失败项：\n${failedItems
    .map((f) => `- ${f}`)
    .join('\n')}\n\n当前 HTML：\n\`\`\`html\n${skeleton}\n\`\`\`\n\n请仅返回修复后的完整 HTML 代码。`;

  const result = await generateText({
    model: getModel(),
    system: systemPrompt,
    prompt,
    maxOutputTokens: 16000,
  });

  return {
    html: extractHtml(result.text),
    prompt,
    systemPrompt,
    rawResponse: result.text,
  };
}

/**
 * Extract HTML from AI response (strip markdown code blocks if present)
 */
export function extractHtml(text: string): string {
  const match = text.match(/```html?\s*\n?([\s\S]*?)\n?```/);
  if (match) return match[1].trim();

  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    return text.trim();
  }

  return text.trim();
}
