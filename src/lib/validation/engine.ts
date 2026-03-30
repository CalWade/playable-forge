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

interface ValidationRule {
  id: string;
  name: string;
  level: 'error' | 'warning';
  check: (html: string) => { passed: boolean; detail: string };
}

const rules: ValidationRule[] = [
  {
    id: 'file-size',
    name: '文件体积',
    level: 'error',
    check: (html) => {
      const size = Buffer.byteLength(html, 'utf-8');
      return {
        passed: size <= 5 * 1024 * 1024,
        detail: `${(size / 1024).toFixed(0)}KB / 5120KB`,
      };
    },
  },
  {
    id: 'file-size-warn',
    name: '体积预警',
    level: 'warning',
    check: (html) => {
      const size = Buffer.byteLength(html, 'utf-8');
      return {
        passed: size <= 4 * 1024 * 1024,
        detail: `${(size / 1024).toFixed(0)}KB / 4096KB`,
      };
    },
  },
  {
    id: 'no-external-refs',
    name: '外部引用检查',
    level: 'error',
    check: (html) => {
      const patterns = [
        /src=["']https?:\/\//gi,
        /href=["']https?:\/\//gi,
        /<link[^>]+href=["'](?!data:)/gi,
        /<script[^>]+src=["'](?!data:)/gi,
      ];
      const found: string[] = [];
      for (const p of patterns) {
        const matches = html.match(p);
        if (matches) found.push(...matches);
      }
      return {
        passed: found.length === 0,
        detail: found.length === 0 ? '无外部引用' : `发现 ${found.length} 个外部引用`,
      };
    },
  },
  {
    id: 'mraid-open',
    name: 'MRAID 跳转',
    level: 'error',
    check: (html) => ({
      passed: /mraid\.open\s*\(/.test(html),
      detail: /mraid\.open\s*\(/.test(html) ? '包含 mraid.open()' : '缺少 mraid.open()',
    }),
  },
  {
    id: 'mraid-ready',
    name: 'MRAID 状态处理',
    level: 'warning',
    check: (html) => ({
      passed: /mraid[\s\S]*ready|addEventListener[\s\S]*ready/.test(html),
      detail: /mraid[\s\S]*ready|addEventListener[\s\S]*ready/.test(html)
        ? '有 MRAID ready 监听'
        : '缺少 MRAID ready 事件监听',
    }),
  },
  {
    id: 'orientation',
    name: '横竖屏适配',
    level: 'error',
    check: (html) => {
      const hasMediaQuery = /@media.*orientation/i.test(html);
      const hasOrientationJS = /orientation|innerWidth.*innerHeight|resize/i.test(html);
      const passed = hasMediaQuery || hasOrientationJS;
      return { passed, detail: passed ? '有横竖屏适配逻辑' : '缺少横竖屏适配' };
    },
  },
  {
    id: 'audio-autoplay',
    name: '音频自动播放检查',
    level: 'warning',
    check: (html) => ({
      passed: !/<audio[^>]*autoplay/i.test(html),
      detail: /<audio[^>]*autoplay/i.test(html)
        ? '检测到音频自动播放'
        : '无音频自动播放',
    }),
  },
  {
    id: 'html-structure',
    name: 'HTML 完整性',
    level: 'error',
    check: (html) => {
      const hasDoctype = /<!DOCTYPE\s+html/i.test(html);
      const hasHtmlTag = /<html[\s>]/i.test(html) && /<\/html>/i.test(html);
      const hasHead = /<head[\s>]/i.test(html) && /<\/head>/i.test(html);
      const hasBody = /<body[\s>]/i.test(html) && /<\/body>/i.test(html);
      const passed = hasDoctype && hasHtmlTag && hasHead && hasBody;
      return { passed, detail: passed ? '结构完整' : '结构不完整' };
    },
  },
  {
    id: 'asset-integrity',
    name: '素材完整性',
    level: 'error',
    check: (html) => {
      const placeholders = (html.match(/PLACEHOLDER/g) || []).length;
      return {
        passed: placeholders === 0,
        detail:
          placeholders === 0
            ? '所有素材已注入'
            : `${placeholders} 个素材未注入`,
      };
    },
  },
  {
    id: 'viewport',
    name: '移动端适配标签',
    level: 'warning',
    check: (html) => ({
      passed: /meta[^>]*viewport/i.test(html),
      detail: /meta[^>]*viewport/i.test(html)
        ? '有 viewport meta'
        : '缺少 viewport meta',
    }),
  },
];

export function validate(html: string): ValidationResult {
  const results: ValidationCheckResult[] = rules.map((rule) => {
    const { passed, detail } = rule.check(html);
    return {
      id: rule.id,
      name: rule.name,
      level: rule.level,
      passed,
      detail,
    };
  });

  const errors = results.filter((r) => r.level === 'error' && !r.passed);
  const warnings = results.filter((r) => r.level === 'warning' && !r.passed);

  let grade: string;
  if (errors.length === 0 && warnings.length === 0) grade = 'A';
  else if (errors.length === 0 && warnings.length <= 2) grade = 'B';
  else if (errors.length <= 1) grade = 'C';
  else grade = 'D';

  return {
    grade,
    results,
    passedCount: results.filter((r) => r.passed).length,
    failedCount: errors.length,
    warningCount: warnings.length,
  };
}
