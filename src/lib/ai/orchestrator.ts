import { streamText, generateText } from 'ai';
import { getModel } from './provider';
import { GENERATE_SYSTEM_PROMPT, ITERATE_SYSTEM_PROMPT } from './prompts';
import { getSettings } from '@/lib/settings';
import { SAFETY_CLARIFICATION } from '@/lib/ai/response-validator';
import type { AssetMetadata } from '@/types';

interface GenerateParams {
  assets: AssetMetadata[];
  referenceImageBase64?: string[];
  description?: string;
  safetyClarification?: boolean;
}

/**
 * Get the slot name for an asset. Just returns Asset.slotName.
 * SlotName is assigned at upload time (s1, s2, s3...) and never changes.
 */
export function getSlotName(a: AssetMetadata): string {
  return a.slotName || 'unknown';
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
  // Group by category for summary
  const groups = new Map<string, AssetMetadata[]>();
  for (const a of assets) {
    const cat = a.category || 'unrecognized';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(a);
  }

  const summary = Array.from(groups.entries())
    .map(([cat, items]) => `- ${cat}: ${items.length} 个`)
    .join('\n');

  // Detailed list: short slot ID + category + dimensions (filename only for context)
  const details = assets
    .map((a) => {
      const slot = getSlotName(a);
      const size = a.width && a.height ? `${a.width}x${a.height}` : '尺寸未知';
      return `- slot="${slot}" | ${a.category} | ${size} | ${a.originalName}`;
    })
    .join('\n');

  return `### 素材概览\n${summary}\n\n### 素材详情（每个素材必须有对应的 data-variant-slot）\n${details}`;
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
    model: await getModel(),
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
  safetyClarification?: boolean;
}

export async function iterateSkeleton(params: IterateParams) {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Include recent conversation history (last 10 pairs)
  const recentHistory = params.conversationHistory.slice(-20);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  const systemPrompt = await getSystemPrompt(ITERATE_SYSTEM_PROMPT);
  let userPrompt = `当前 HTML 骨架：\n\`\`\`html\n${params.currentSkeleton}\n\`\`\`\n\n修改要求：${params.userMessage}`;

  if (params.safetyClarification) {
    userPrompt = `${SAFETY_CLARIFICATION}\n\n${userPrompt}`;
  }

  messages.push({ role: 'user', content: userPrompt });

  const result = streamText({
    model: await getModel(),
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
    model: await getModel(),
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
