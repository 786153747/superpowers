#!/usr/bin/env bash
# Test: end-to-end auto generation of diff + detail design docs in non-interactive mode
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: auto-generate detail design ==="
echo ""

TEST_PROJECT=$(create_test_project)
trap 'cleanup_test_project "$TEST_PROJECT"' EXIT

mkdir -p "$TEST_PROJECT/prd" "$TEST_PROJECT/ruoyi-ui/src/views/inventory" "$TEST_PROJECT/ruoyi-ui/src/api/inventory" "$TEST_PROJECT/docs/plans"

cat > "$TEST_PROJECT/prd/inventory-prd.md" <<'EOF'
# 寄售库存查询需求

## 页面

- 页面名称：寄售库存查询
- 菜单角色：系统管理员、供应商
- 查询条件：仓库、SKU、商品名称、库存状态
- 表格列：SKU、商品名称、仓库、可用库存、锁定库存、库存状态、更新时间
- 行为：查询、重置、导出、查看明细

## 后端要求

- 提供库存列表查询接口
- 提供库存明细接口
- 提供导出接口
- 查询结果需要按供应商权限过滤
EOF

cat > "$TEST_PROJECT/ruoyi-ui/src/views/inventory/index.vue" <<'EOF'
<template>
  <div class="app-container">
    <el-form :model="queryParams" :inline="true">
      <el-form-item label="SKU">
        <el-input v-model="queryParams.sku" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary">搜索</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="list">
      <el-table-column prop="sku" label="SKU" />
      <el-table-column prop="productName" label="商品名称" />
      <el-table-column prop="availableQty" label="可用库存" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
const queryParams = { sku: '' }
const list = []
</script>
EOF

cat > "$TEST_PROJECT/ruoyi-ui/src/api/inventory/index.ts" <<'EOF'
import request from '@/utils/request'

export function listInventory(params: Record<string, any>) {
  return request({
    url: '/inventory/list',
    method: 'get',
    params,
  })
}
EOF

pushd "$TEST_PROJECT" > /dev/null
claude -p "这是自动测试/非交互场景。需求文档在 prd/inventory-prd.md，UI 项目在 ruoyi-ui/。请先做差异扫描并落盘；如果没有 blocker，就自动继续到 brainstorming。我要前端和后端两份详细设计，必须使用 spec 里的对应模板，默认采用你的推荐方案，默认同意继续下一步，默认同意落盘。最终请把 diff、前端详细设计、后端详细设计都保存到 docs/plans/。" \
  --plugin-dir "$REPO_ROOT" \
  --dangerously-skip-permissions \
  --max-turns 30 \
  --verbose \
  --output-format stream-json \
  > "$TEST_PROJECT/run.jsonl" 2>&1 || true
popd > /dev/null

DIFF_COUNT=$(find "$TEST_PROJECT/docs/plans" -maxdepth 1 -name '*-diff.md' | wc -l | tr -d ' ')
BACKEND_COUNT=$(find "$TEST_PROJECT/docs/plans" -maxdepth 1 -name '*-backend-detail-design.md' | wc -l | tr -d ' ')
FRONTEND_COUNT=$(find "$TEST_PROJECT/docs/plans" -maxdepth 1 -name '*-frontend-detail-design.md' | wc -l | tr -d ' ')

if [ "$DIFF_COUNT" -ge 1 ]; then
  echo "  [PASS] diff doc generated"
else
  echo "  [FAIL] diff doc generated"
  tail -n 40 "$TEST_PROJECT/run.jsonl" || true
  exit 1
fi

if [ "$BACKEND_COUNT" -ge 1 ]; then
  echo "  [PASS] backend detail design generated"
else
  echo "  [FAIL] backend detail design generated"
  tail -n 40 "$TEST_PROJECT/run.jsonl" || true
  exit 1
fi

if [ "$FRONTEND_COUNT" -ge 1 ]; then
  echo "  [PASS] frontend detail design generated"
else
  echo "  [FAIL] frontend detail design generated"
  tail -n 40 "$TEST_PROJECT/run.jsonl" || true
  exit 1
fi

if [ -f "$TEST_PROJECT/spec/index.md" ]; then
  echo "  [PASS] spec auto-copied"
else
  echo "  [FAIL] spec auto-copied"
  exit 1
fi

echo ""
echo "=== Auto-generate detail design test passed ==="
