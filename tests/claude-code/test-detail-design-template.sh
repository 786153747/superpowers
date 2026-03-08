#!/usr/bin/env bash
# Test: detailed-design template routing and session-start spec bootstrap
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: detail-design template routing ==="
echo ""

echo "Test 1: Backend template guidance..."
output=$(run_claude "In this repo, if the user asks for backend detailed design, which template should be used and where should the document be saved? Answer briefly in Chinese." 60)

if assert_contains "$output" "spec/backend/java/detail-design-template.md" "Mentions backend template"; then
    :
else
    exit 1
fi

if assert_contains "$output" "docs/plans" "Mentions docs/plans save path"; then
    :
else
    exit 1
fi

if assert_contains "$output" "detail-design" "Mentions detail-design filename"; then
    :
else
    exit 1
fi

echo ""

echo "Test 2: Frontend template guidance..."
output=$(run_claude "In this repo, if the user asks for frontend detailed design, which template should be used and where should the document be saved? Answer briefly in Chinese." 60)

if assert_contains "$output" "spec/frontend/vue/detail-design-template.md" "Mentions frontend template"; then
    :
else
    exit 1
fi

if assert_contains "$output" "docs/plans" "Mentions frontend docs/plans save path"; then
    :
else
    exit 1
fi

if assert_contains "$output" "detail-design" "Mentions frontend detail-design filename"; then
    :
else
    exit 1
fi

echo ""

echo "Test 3: Split frontend and backend docs..."
output=$(run_claude "If both frontend and backend detailed design are needed in this repo, should they be merged into one file or written separately? Answer briefly in Chinese." 60)

if assert_contains "$output" "两份" "Separates frontend and backend docs"; then
    :
else
    exit 1
fi

echo ""

echo "Test 4: session-start copies spec into empty project..."
TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"' EXIT

pushd "$TEST_PROJECT" > /dev/null
HOOK_OUTPUT=$(bash "$REPO_ROOT/hooks/session-start")
popd > /dev/null

if [ -f "$TEST_PROJECT/spec/index.md" ]; then
    echo "  [PASS] spec/index.md copied"
else
    echo "  [FAIL] spec/index.md copied"
    exit 1
fi

if [ -f "$TEST_PROJECT/spec/backend/java/detail-design-template.md" ]; then
    echo "  [PASS] backend template copied"
else
    echo "  [FAIL] backend template copied"
    exit 1
fi

if [ -f "$TEST_PROJECT/spec/frontend/vue/detail-design-template.md" ]; then
    echo "  [PASS] frontend template copied"
else
    echo "  [FAIL] frontend template copied"
    exit 1
fi

if assert_contains "$HOOK_OUTPUT" "spec/backend/java/detail-design-template.md" "Hook context mentions backend template"; then
    :
else
    exit 1
fi

if assert_contains "$HOOK_OUTPUT" "docs/plans" "Hook context mentions docs/plans"; then
    :
else
    exit 1
fi

echo ""
echo "=== All detail-design template tests passed ==="
