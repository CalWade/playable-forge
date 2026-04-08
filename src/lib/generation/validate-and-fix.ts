import { validate } from '@/lib/validation/engine';
import { autofixSkeleton } from '@/lib/ai/orchestrator';
import { validateAIResponse } from '@/lib/ai/response-validator';
import type { SSEWriter } from './types';

const MAX_AUTO_FIX = 3;

/**
 * Shared: validate skeleton + auto-fix loop (used by both generate and iterate)
 */
export async function validateAndAutoFix(
  skeleton: string,
  sse: SSEWriter
): Promise<{ skeleton: string; validation: ReturnType<typeof validate> }> {
  sse.write('status', { step: 'validating', message: '✅ 正在校验结果...' });
  let validation = validate(skeleton);

  const passed = validation.results.filter((r) => r.passed);
  const failed = validation.results.filter((r) => !r.passed);

  if (failed.length === 0) {
    sse.write('status', { step: 'validated', message: `✅ 校验全部通过 (${validation.grade} 级)` });
  } else {
    const failedList = failed.map((r) => `${r.level === 'error' ? '❌' : '⚠️'} ${r.name}: ${r.detail}`).join('\n');
    const errors = failed.filter((r) => r.level === 'error');
    sse.write('status', {
      step: 'validation_issues',
      message: `📋 校验结果 (${validation.grade} 级): ${passed.length} 通过, ${failed.length} 未通过\n${failedList}`
    });

    if (errors.length > 0) {
      sse.write('status', { step: 'will_fix', message: `🔧 发现 ${errors.length} 个必须修复的问题，将自动尝试修复（最多 ${MAX_AUTO_FIX} 次）` });
    }
  }

  let fixAttempt = 0;
  let currentSkeleton = skeleton;
  while (fixAttempt < MAX_AUTO_FIX && validation.results.some((r) => r.level === 'error' && !r.passed)) {
    fixAttempt++;
    const failedDescriptions = validation.results.filter((r) => !r.passed).map((r) => `${r.name}: ${r.detail}`);

    sse.write('status', {
      step: 'fixing',
      message: `🔧 自动修复 (${fixAttempt}/${MAX_AUTO_FIX})...\n修复目标:\n${failedDescriptions.map(f => `  - ${f}`).join('\n')}`
    });

    try {
      const fixResult = await autofixSkeleton(currentSkeleton, failedDescriptions);
      sse.write('debug', { type: `autofix_prompt_${fixAttempt}`, content: `[System Prompt]\n${fixResult.systemPrompt}\n\n[User Prompt]\n${fixResult.prompt}` });
      sse.write('debug', { type: `autofix_response_${fixAttempt}`, content: fixResult.rawResponse });

      const fixCheck = validateAIResponse(fixResult.html);
      if (fixCheck.status !== 'valid' && fixCheck.status !== 'truncated') {
        sse.write('status', { step: 'fix_failed', message: `⚠️ 修复尝试 ${fixAttempt} 返回无效结果，停止修复` });
        break;
      }
      currentSkeleton = fixResult.html;
      validation = validate(currentSkeleton);

      const newFailed = validation.results.filter((r) => !r.passed);
      if (newFailed.length === 0) {
        sse.write('status', { step: 'fix_success', message: `✅ 修复成功！校验全部通过 (${validation.grade} 级)` });
      } else {
        sse.write('status', { step: 'fix_progress', message: `🔄 修复后仍有 ${newFailed.length} 项未通过` });
      }
    } catch (e) {
      console.error(`Auto-fix attempt ${fixAttempt} failed:`, e);
      sse.write('status', { step: 'fix_error', message: `⚠️ 修复尝试 ${fixAttempt} 出错，停止修复` });
      break;
    }
  }

  return { skeleton: currentSkeleton, validation };
}
