#!/usr/bin/env bash
# Test: prd-diff-scan skill routing and PRD vs implementation guidance
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: prd-diff-scan skill ==="
echo ""

# Test 1: Skill guidance should mention PRD vs current implementation handling
echo "Test 1: PRD vs current implementation guidance..."

output=$(run_claude "In the prd-diff-scan skill, what does it compare and what evidence must be captured? Answer briefly." 60)

if assert_contains "$output" "PRD\|需求\|requirement" "Mentions PRD"; then
    :
else
    exit 1
fi

if assert_contains "$output" "实现\|implementation\|代码\|code" "Mentions current implementation"; then
    :
else
    exit 1
fi

if assert_contains "$output" "Blocker\|阻塞\|待确认\|差异" "Uses blocker for unverifiable behavior"; then
    :
else
    exit 1
fi

echo ""

# Test 2: Chinese routing intent should map to prd-diff-scan
echo "Test 2: Chinese routing intent..."

output=$(run_claude "If a user says '帮我对照 PRD 看看差异，再决定要不要改页面' in this repo, which skill should run first and what file must it create?" 60)

if assert_contains "$output" "prd-diff-scan" "Routes to prd-diff-scan"; then
    :
else
    exit 1
fi

if assert_contains "$output" "docs/plans\|diff.md\|差异扫描文档" "Mentions diff document output"; then
    :
else
    exit 1
fi

echo ""

# Test 3: PRD-only logic that cannot be confirmed must not be invented
echo "Test 3: Evidence limits..."

output=$(run_claude "When only a PRD is available, can prd-diff-scan invent hidden data sources, permissions, or backend logic not mentioned in the PRD? What should it do instead?" 60)

if assert_contains "$output" "not\|cannot\|don't\|不能\|不得\|不要" "Does not invent hidden logic"; then
    :
else
    exit 1
fi

if assert_contains "$output" "Blocker\|待确认\|未核对\|无法判断" "Marks unclear logic as blocker or unknown"; then
    :
else
    exit 1
fi

echo ""

# Test 4: Natural prompt should auto-trigger prd-diff-scan in Claude CLI
echo "Test 4: Claude CLI auto-routing..."

TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"' EXIT

mkdir -p "$TEST_PROJECT/prd" "$TEST_PROJECT/docs/plans"
cat > "$TEST_PROJECT/prd/sample-prd.md" <<'EOF'
# 库存页面需求

- 页面需要展示库存列表
- 顶部有筛选条件：仓库、SKU、状态
- 表格列：SKU、商品名、可用库存、锁定库存、状态
- 行操作：查看、调整库存
EOF

cat > "$TEST_PROJECT/CLAUDE.md" <<'EOF'
# Test Routing Rules

If the user provides a PRD or asks for 差异分析:

1. First invoke `Skill("superpowers:prd-diff-scan")`
2. Do not use `Read`, `Glob`, `Grep`, or `brainstorming` first
3. Only after `docs/plans/*-diff.md` exists may you proceed to brainstorming
EOF

LOG_FILE="$TEST_PROJECT/claude-stream.jsonl"

pushd "$TEST_PROJECT" > /dev/null
timeout 180 claude -p "我提供了 prd/sample-prd.md，先帮我对照 PRD 做差异分析，再决定设计方案。" \
  --plugin-dir "$REPO_ROOT" \
  --dangerously-skip-permissions \
  --max-turns 2 \
  --verbose \
  --output-format stream-json \
  > "$LOG_FILE" 2>&1 || true
popd > /dev/null

LOG_CONTENT=$(cat "$LOG_FILE")

if assert_contains "$LOG_CONTENT" '"name":"Skill"' "Claude used Skill tool"; then
    :
else
    exit 1
fi

if assert_contains "$LOG_CONTENT" 'prd-diff-scan' "Auto-triggered prd-diff-scan"; then
    :
else
    exit 1
fi

echo ""

# Test 5: Standalone diff-scan must stop after saving
echo "Test 5: Standalone diff-scan boundary..."

output=$(run_claude "If the user explicitly says: only do the diff scan, save the diff document, and do not continue to brainstorming, planning, or coding — what must prd-diff-scan do after saving the file?" 60)

if assert_contains "$output" "stop\|wait\|停止\|等待" "Stops after saving in standalone mode"; then
    :
else
    exit 1
fi

if assert_not_contains "$output" "automatically continue to brainstorming\|自动进入 brainstorming\|直接进入 brainstorming" "Does not auto-continue to brainstorming"; then
    :
else
    exit 1
fi

echo ""

# Test 6: Path-only request should still route to prd-diff-scan
echo "Test 6: Path-only routing..."

output=$(run_claude "If the user says: '需求文档在 prd/后市场订单库存功能需求规格说明书.md，UI 项目在 ruoyi-ui/' and asks to run a difference analysis, which skill must run first?" 60)

if assert_contains "$output" "prd-diff-scan" "Path-only request routes to prd-diff-scan"; then
    :
else
    exit 1
fi

echo ""
echo "=== All prd-diff-scan tests passed ==="
