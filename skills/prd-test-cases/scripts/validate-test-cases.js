#!/usr/bin/env node

/**
 * validate-test-cases.js
 * Validate prd-test-cases JSON before Excel generation.
 *
 * Usage:
 *   node scripts/validate-test-cases.js <json-file-path>
 */

const fs = require('fs');
const path = require('path');

const PRIORITIES = ['P0', 'P1', 'P2'];
const PRIORITY_SET = new Set(PRIORITIES);

const NEGATIVE_CATEGORIES = new Set([
  '反向校验 - 业务规则',
  '反向校验 - 状态流转',
  '反向校验 - 输入校验'
]);

const ALLOWED_CATEGORIES = new Set([
  '正向主流程',
  ...NEGATIVE_CATEGORIES,
  '边界场景',
  '权限控制',
  '异常场景'
]);

const STRICT_DIFF_PHRASES = [
  '页面标题',
  '固定列',
  '供应商证件号'
];

const BUSINESS_ACTION_KEYWORDS = [
  '新增',
  '编辑',
  '审核',
  '提交',
  '作废',
  '删除',
  '导出',
  '确认',
  '发货',
  '取消发货',
  '批量'
];

const IMPLEMENTATION_ONLY_PATTERNS = [
  { pattern: /(?:^|[\\/])src[\\/]/i, label: 'source path' },
  { pattern: /\bnode_modules\b/i, label: 'node_modules path' },
  { pattern: /\bimport\s+/i, label: 'import statement' },
  { pattern: /\.(?:ts|tsx|js|jsx|vue|java|xml|sql)\b/i, label: 'implementation filename' },
  { pattern: /模块未找到|module not found/i, label: 'module missing' },
  { pattern: /文件不存在|file not found/i, label: 'file missing' },
  { pattern: /控制台错误|console error/i, label: 'console error' },
  { pattern: /编译失败|构建失败|build failed|compile failed/i, label: 'build failure' },
  { pattern: /\bnpm install\b|\bnpm run\b|\bmvn compile\b/i, label: 'build command' }
];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function derivePageAbbreviation(pageSlug) {
  const parts = String(pageSlug || '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  const abbr = parts.map(part => part[0].toUpperCase()).join('');
  return (abbr || 'TC').slice(0, 3);
}

function parseRefList(rawValue) {
  if (!isNonEmptyString(rawValue)) {
    return [];
  }

  const refs = rawValue
    .split(/[，,]/)
    .map(item => item.trim())
    .filter(Boolean);

  return [...new Set(refs)];
}

function buildCaseText(testCase) {
  const stepText = toArray(testCase.steps)
    .map(step => `${step.action || ''} ${step.expected || ''}`)
    .join(' ');

  return [
    testCase.id,
    testCase.category,
    testCase.scenario,
    testCase.precondition,
    testCase.testData,
    testCase.relatedDiff,
    stepText
  ]
    .filter(Boolean)
    .join(' ');
}

function findImplementationPattern(testCase) {
  const text = buildCaseText(testCase);
  return IMPLEMENTATION_ONLY_PATTERNS.find(item => item.pattern.test(text));
}

function resolveReferencedFile(absJsonPath, targetPath) {
  if (!isNonEmptyString(targetPath)) {
    return null;
  }

  if (path.isAbsolute(targetPath)) {
    return fs.existsSync(targetPath) ? targetPath : null;
  }

  const candidates = [
    path.resolve(path.dirname(absJsonPath), targetPath),
    path.resolve(process.cwd(), targetPath)
  ];

  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function extractDiffEntries(diffText) {
  const entries = new Map();

  const tableRegex = /^\|\s*((?:D|B)\d+)\s*\|\s*([^|]+?)\s*\|/gm;
  let match = null;
  while ((match = tableRegex.exec(diffText)) !== null) {
    entries.set(match[1], match[2].trim());
  }

  const blockerRegexes = [
    /^\s*\d+\.\s+\*\*(B\d+)\*\*:\s*(.+)$/gm,
    /^\s*[-*]\s+\*\*(B\d+)\*\*:\s*(.+)$/gm
  ];

  for (const regex of blockerRegexes) {
    while ((match = regex.exec(diffText)) !== null) {
      entries.set(match[1], match[2].trim());
    }
  }

  return entries;
}

function getPageMentions(description, pageNames) {
  return pageNames.filter(pageName => description.includes(pageName));
}

function getDimensionKey(category) {
  if (category === '正向主流程') {
    return 'positive';
  }

  if (NEGATIVE_CATEGORIES.has(category)) {
    return 'negative';
  }

  if (category === '边界场景') {
    return 'boundary';
  }

  if (category === '权限控制') {
    return 'permission';
  }

  if (category === '异常场景') {
    return 'exception';
  }

  return null;
}

function pageContainsBusinessActions(page) {
  const text = page.testCases
    .map(testCase => buildCaseText(testCase))
    .join(' ');

  return BUSINESS_ACTION_KEYWORDS.some(keyword => text.includes(keyword));
}

function createCounts() {
  return { P0: 0, P1: 0, P2: 0, total: 0 };
}

function validateTestCasesData(data, options = {}) {
  const errors = [];
  const warnings = [];
  const pageStats = [];
  const referencedDiffs = new Set();
  const pageSpecificRefsByPage = new Map();

  const absJsonPath = options.absJsonPath || '';

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push('Top-level JSON must be an object.');
    return { data, errors, warnings, stats: { pageCount: 0, totalCases: 0, pages: [] } };
  }

  if (!isNonEmptyString(data.projectName)) {
    errors.push('Missing required top-level field: projectName.');
  }

  if (!isNonEmptyString(data.generatedAt)) {
    errors.push('Missing required top-level field: generatedAt.');
  }

  if (!data.source || typeof data.source !== 'object') {
    errors.push('Missing required top-level object: source.');
  }

  if (!isNonEmptyString(data.source?.prd)) {
    errors.push('Missing required source.prd.');
  }

  if (!isNonEmptyString(data.source?.diff)) {
    errors.push('Missing required source.diff.');
  }

  if (!Array.isArray(data.pages) || data.pages.length === 0) {
    errors.push('pages must be a non-empty array.');
    return { data, errors, warnings, stats: { pageCount: 0, totalCases: 0, pages: [] } };
  }

  const pageNames = data.pages
    .map(page => page.pageName)
    .filter(isNonEmptyString);

  const diffPath = resolveReferencedFile(absJsonPath, data.source?.diff);
  let diffEntries = new Map();

  if (diffPath) {
    diffEntries = extractDiffEntries(fs.readFileSync(diffPath, 'utf-8'));
  } else if (isNonEmptyString(data.source?.diff)) {
    warnings.push(`Diff file was not found on disk, skip diff-trace validation: ${data.source.diff}`);
  }

  let totalCases = 0;
  const seenPageSlugs = new Set();
  const seenPageNames = new Set();
  const seenCaseIds = new Set();

  for (const page of data.pages) {
    const pageScope = `Page ${page.pageSlug || '<missing-slug>'}`;
    const counts = createCounts();
    const dimensions = new Set();
    const refsUsedOnPage = new Set();

    if (!isNonEmptyString(page.pageSlug)) {
      errors.push(`${pageScope}: missing pageSlug.`);
      continue;
    }

    if (!isNonEmptyString(page.pageName)) {
      errors.push(`${pageScope}: missing pageName.`);
      continue;
    }

    if (seenPageSlugs.has(page.pageSlug)) {
      errors.push(`${pageScope}: duplicate pageSlug.`);
    }
    seenPageSlugs.add(page.pageSlug);

    if (seenPageNames.has(page.pageName)) {
      errors.push(`${pageScope}: duplicate pageName.`);
    }
    seenPageNames.add(page.pageName);

    if (!Array.isArray(page.testCases) || page.testCases.length === 0) {
      errors.push(`${pageScope}: testCases must be a non-empty array.`);
      continue;
    }

    const pageAbbr = derivePageAbbreviation(page.pageSlug);

    page.testCases.forEach((testCase, index) => {
      const caseScope = `${page.pageName}/${testCase.id || `case#${index + 1}`}`;
      const expectedId = `TC-${pageAbbr}-${pad2(index + 1)}`;
      const dimensionKey = getDimensionKey(testCase.category);

      if (testCase.id !== expectedId) {
        errors.push(`${caseScope}: expected id ${expectedId}, got ${testCase.id || '<missing>'}.`);
      }

      if (seenCaseIds.has(testCase.id)) {
        errors.push(`${caseScope}: duplicate test case id.`);
      }
      seenCaseIds.add(testCase.id);

      if (!PRIORITY_SET.has(testCase.priority)) {
        errors.push(`${caseScope}: invalid priority ${testCase.priority || '<missing>'}.`);
      } else {
        counts[testCase.priority] += 1;
      }

      counts.total += 1;
      totalCases += 1;

      if (!ALLOWED_CATEGORIES.has(testCase.category)) {
        errors.push(`${caseScope}: invalid category ${testCase.category || '<missing>'}.`);
      } else if (dimensionKey) {
        dimensions.add(dimensionKey);
      }

      ['scenario', 'precondition'].forEach(fieldName => {
        if (!isNonEmptyString(testCase[fieldName])) {
          errors.push(`${caseScope}: missing ${fieldName}.`);
        }
      });

      if (!Array.isArray(testCase.steps) || testCase.steps.length === 0) {
        errors.push(`${caseScope}: steps must be a non-empty array.`);
      } else {
        testCase.steps.forEach((step, stepIndex) => {
          const expectedStepNo = stepIndex + 1;

          if (step.stepNo !== expectedStepNo) {
            errors.push(`${caseScope}: expected stepNo ${expectedStepNo}, got ${step.stepNo}.`);
          }

          if (!isNonEmptyString(step.action)) {
            errors.push(`${caseScope}: step ${expectedStepNo} missing action.`);
          }

          if (!isNonEmptyString(step.expected)) {
            errors.push(`${caseScope}: step ${expectedStepNo} missing expected.`);
          }
        });
      }

      const implementationPattern = findImplementationPattern(testCase);
      if (implementationPattern) {
        errors.push(`${caseScope}: implementation-only content detected (${implementationPattern.label}).`);
      }

      const refs = parseRefList(testCase.relatedDiff);
      if (refs.length === 0) {
        errors.push(`${caseScope}: relatedDiff must contain at least one Dx/Bx reference.`);
      }

      const caseText = buildCaseText(testCase);
      for (const ref of refs) {
        if (!/^(?:D|B)\d+$/.test(ref)) {
          errors.push(`${caseScope}: invalid relatedDiff token ${ref}.`);
          continue;
        }

        referencedDiffs.add(ref);
        refsUsedOnPage.add(ref);

        if (diffEntries.size === 0) {
          continue;
        }

        const description = diffEntries.get(ref);
        if (!description) {
          errors.push(`${caseScope}: relatedDiff ${ref} does not exist in diff file.`);
          continue;
        }

        const pageMentions = getPageMentions(description, pageNames);
        if (pageMentions.length === 1 && pageMentions[0] !== page.pageName) {
          errors.push(`${caseScope}: relatedDiff ${ref} belongs to page "${pageMentions[0]}", not "${page.pageName}".`);
        }

        for (const phrase of STRICT_DIFF_PHRASES) {
          if (description.includes(phrase) && !caseText.includes(phrase)) {
            errors.push(`${caseScope}: relatedDiff ${ref} mentions "${phrase}" but the case text does not assert it explicitly.`);
          }
        }
      }
    });

    const requiredDimensions = [
      'positive',
      'negative',
      'boundary',
      'permission',
      'exception'
    ];

    for (const requiredDimension of requiredDimensions) {
      if (!dimensions.has(requiredDimension)) {
        errors.push(`${page.pageName}: missing required dimension ${requiredDimension}.`);
      }
    }

    if (pageContainsBusinessActions(page)) {
      const negativeCases = page.testCases.filter(testCase => NEGATIVE_CATEGORIES.has(testCase.category));
      const businessOrStateCases = page.testCases.filter(
        testCase =>
          testCase.category === '反向校验 - 业务规则' ||
          testCase.category === '反向校验 - 状态流转'
      );

      if (negativeCases.length < 2) {
        errors.push(`${page.pageName}: pages with business actions need at least 2 negative cases.`);
      }

      if (businessOrStateCases.length < 1) {
        errors.push(`${page.pageName}: pages with business actions need at least 1 business-rule or state-transition negative case.`);
      }
    }

    pageStats.push({
      pageSlug: page.pageSlug,
      pageName: page.pageName,
      counts
    });

    pageSpecificRefsByPage.set(page.pageName, refsUsedOnPage);
  }

  if (diffEntries.size > 0) {
    for (const [ref, description] of diffEntries.entries()) {
      const pageMentions = getPageMentions(description, pageNames);

      if (pageMentions.length !== 1) {
        continue;
      }

      const targetPageName = pageMentions[0];
      const usedRefs = pageSpecificRefsByPage.get(targetPageName) || new Set();

      if (!usedRefs.has(ref)) {
        warnings.push(`Page-specific diff ${ref} (${targetPageName}) is not referenced by any case on that page.`);
      }
    }
  }

  return {
    data,
    errors,
    warnings,
    stats: {
      pageCount: pageStats.length,
      totalCases,
      pages: pageStats,
      referencedDiffs: [...referencedDiffs].sort()
    }
  };
}

function validateTestCasesFile(jsonPath, options = {}) {
  if (!jsonPath) {
    throw new Error('Usage: node scripts/validate-test-cases.js <json-file-path>');
  }

  const absJsonPath = path.resolve(jsonPath);
  if (!fs.existsSync(absJsonPath)) {
    throw new Error(`JSON file not found: ${absJsonPath}`);
  }

  const raw = fs.readFileSync(absJsonPath, 'utf-8');
  const data = JSON.parse(raw);
  const report = validateTestCasesData(data, { ...options, absJsonPath });

  return { absJsonPath, data, report };
}

function formatValidationReport(report) {
  const lines = [];

  lines.push('Validation summary');
  lines.push(`- Pages: ${report.stats.pageCount}`);
  lines.push(`- Test cases: ${report.stats.totalCases}`);

  for (const page of report.stats.pages) {
    lines.push(
      `- ${page.pageName}: P0 ${page.counts.P0} / P1 ${page.counts.P1} / P2 ${page.counts.P2} / total ${page.counts.total}`
    );
  }

  if (report.stats.referencedDiffs.length > 0) {
    lines.push(`- Referenced diff ids: ${report.stats.referencedDiffs.join(', ')}`);
  }

  if (report.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings');
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  if (report.errors.length > 0) {
    lines.push('');
    lines.push('Errors');
    for (const error of report.errors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join('\n');
}

if (require.main === module) {
  try {
    const { report } = validateTestCasesFile(process.argv[2]);
    console.log(formatValidationReport(report));

    if (report.errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  validateTestCasesData,
  validateTestCasesFile,
  formatValidationReport,
  derivePageAbbreviation,
  parseRefList
};
