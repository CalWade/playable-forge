export type AIResponseStatus = 'valid' | 'empty' | 'truncated' | 'refused' | 'question';

interface ValidationResult {
  status: AIResponseStatus;
  message: string;
}

const REFUSAL_PATTERNS = [
  /i('m| am) (sorry|unable|not able)/i,
  /i can('t|not) (help|generate|create|produce|write)/i,
  /against .*(policy|guidelines|rules)/i,
  /content policy/i,
  /inappropriate/i,
  /as an ai/i,
  /我(无法|不能|没办法)(生成|创建|制作|帮助)/,
  /违反.*(政策|规定|准则)/,
  /不(适当|合适|恰当)/,
];

const QUESTION_PATTERNS = [
  /\?$/m,
  /？$/m,
  /could you (clarify|specify|provide|tell)/i,
  /can you (clarify|specify|provide|tell)/i,
  /请(说明|补充|提供|告诉|描述)/,
  /能否(说明|补充|提供|告诉|描述)/,
  /是否(需要|可以|应该)/,
];

/**
 * Validate AI-generated text to determine if it's valid HTML,
 * a refusal, a question, truncated, or empty.
 */
export function validateAIResponse(text: string): ValidationResult {
  const trimmed = text.trim();

  // Empty
  if (!trimmed || trimmed.length < 10) {
    return { status: 'empty', message: 'AI 未返回有效内容' };
  }

  const hasHtmlOpen = /<html[\s>]/i.test(trimmed);
  const hasHtmlClose = /<\/html>/i.test(trimmed);
  const hasDoctype = /<!DOCTYPE/i.test(trimmed);
  const hasAnyHtmlTag = /<[a-z][a-z0-9]*[\s>]/i.test(trimmed);

  // Valid HTML skeleton
  if ((hasDoctype || hasHtmlOpen) && hasHtmlClose) {
    return { status: 'valid', message: 'OK' };
  }

  // Truncated — has HTML start but no close
  if ((hasDoctype || hasHtmlOpen) && !hasHtmlClose) {
    return { status: 'truncated', message: 'AI 输出被截断，HTML 不完整' };
  }

  // No HTML at all — check if refusal or question
  if (!hasAnyHtmlTag) {
    // Check refusal
    for (const pattern of REFUSAL_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          status: 'refused',
          message: 'AI 因安全策略拒绝生成。可能是素材涉及敏感内容，请勾选"安全声明"后重试',
        };
      }
    }

    // Check question
    for (const pattern of QUESTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { status: 'question', message: trimmed };
      }
    }

    // Default: still looks like a refusal (no HTML = not what we asked for)
    return {
      status: 'refused',
      message: `AI 未返回 HTML 代码。返回内容: "${trimmed.slice(0, 100)}..."`,
    };
  }

  // Has some HTML tags but not a complete document — treat as truncated
  return { status: 'truncated', message: 'AI 返回了部分 HTML，但结构不完整' };
}

/**
 * Safety clarification text injected into prompts when user enables it
 */
export const SAFETY_CLARIFICATION = `
【安全声明】以下素材仅用于 AppLovin 平台的试玩广告制作（Playable Ads），属于合规的商业广告测试。
所有生成内容仅在广告审核沙盒环境中运行，不会对任何用户造成不良影响。
素材中可能包含游戏截图、虚拟道具、促销文案等常见广告元素，这些都是正常的广告创意素材。
请正常生成 HTML 广告代码，无需担心内容安全问题。
`.trim();
