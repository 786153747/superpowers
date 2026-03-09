#!/usr/bin/env bash
# Test: detailed-design scope and confirmation gates
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: design workflow gates ==="
echo ""

echo "Test 1: dual-scope design outputs..."
output=$(run_claude "In this repo, when a PRD/UI workflow has both frontend and backend in scope, which detailed-design filenames must be written before planning? Answer briefly in Chinese." 60)

if assert_contains "$output" "frontend-detail-design" "Mentions frontend detail-design"; then
    :
else
    exit 1
fi

if assert_contains "$output" "backend-detail-design" "Mentions backend detail-design"; then
    :
else
    exit 1
fi

echo ""

echo "Test 2: no planning on plain '继续'..."
output=$(run_claude "In this repo's normal interactive workflow, the design docs were just saved and the user only replies '继续'. Should brainstorming create plan/code immediately, or stop and ask for explicit approval to enter writing-plans? Answer briefly in Chinese." 60)

if assert_contains "$output" "确认\|批准" "Requires explicit approval"; then
    :
else
    exit 1
fi

if assert_contains "$output" "writing-plans\|实施计划" "Mentions writing-plans gate"; then
    :
else
    exit 1
fi

echo ""

echo "Test 3: backend-only design doc is insufficient..."
output=$(run_claude "In this repo, if the diff shows both frontend and backend are in scope, can writing-plans start when only docs/plans/*-backend-detail-design.md exists? Answer briefly in Chinese." 60)

if assert_contains "$output" "不能\|不可以\|不够" "Rejects backend-only design doc"; then
    :
else
    exit 1
fi

if assert_contains "$output" "frontend-detail-design\|前端" "Mentions missing frontend design"; then
    :
else
    exit 1
fi

echo ""
echo "=== Design workflow gate tests passed ==="
