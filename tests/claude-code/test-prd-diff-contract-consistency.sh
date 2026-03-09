#!/usr/bin/env bash
# Static contract check: PRD diff output structure must stay aligned across top-level instructions and spec docs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Test: prd diff contract consistency ==="

grep -q '字段对比表.*不计入.*9 大维度' "$REPO_ROOT/skills/prd-diff-scan/SKILL.md"
echo "  [PASS] skill clarifies field table vs 9 dimensions"

grep -q '页面名称] — 控件矩阵' "$REPO_ROOT/skills/prd-diff-scan/SKILL.md"
echo "  [PASS] skill requires control matrix"

grep -q '不可访问的 URL 型原型图，只记录，不参与页面级对比表' "$REPO_ROOT/skills/prd-diff-scan/SKILL.md"
echo "  [PASS] skill excludes inaccessible prototype URLs from page-level comparison"

grep -q '页面级验收点' "$REPO_ROOT/spec/frontend/vue/requirement-clarification.md"
echo "  [PASS] frontend spec includes acceptance section"

grep -q '页面级控件矩阵' "$REPO_ROOT/spec/frontend/vue/requirement-clarification.md"
echo "  [PASS] frontend spec includes control matrix"

grep -q '原型仅为不可访问 URL' "$REPO_ROOT/spec/frontend/vue/requirement-clarification.md"
echo "  [PASS] frontend spec downgrades inaccessible prototype URLs"

grep -q '字段类项不计入 9 维度' "$REPO_ROOT/CLAUDE.md"
echo "  [PASS] top-level CLAUDE contract matches skill"

grep -q '每个页面的控件矩阵' "$REPO_ROOT/CLAUDE.md"
echo "  [PASS] top-level CLAUDE requires control matrix"

grep -q '如果所谓“原型图”只是.*不可访问的图片引用.*只能做 .*PRD ↔ 当前实现' "$REPO_ROOT/CLAUDE.md"
echo "  [PASS] top-level CLAUDE excludes inaccessible prototype URLs"

echo ""
echo "=== PRD diff contract consistency test passed ==="
