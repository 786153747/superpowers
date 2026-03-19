---
name: playwright-e2e
description: "Design-driven Playwright E2E testing: generate test cases doc from frontend detail design, then generate and run Playwright tests. Also handles running, triaging existing tests."
---

# Playwright E2E

## Overview

Browser end-to-end validation needs repeatability, scope control, and evidence.

**Core principle:** 先设计测试用例（落盘 `e2e-test-cases.md`）、经用户确认、再生成代码。不允许跳过用例设计直接写测试代码。

If you report a browser issue without exact commands, failing tests, or artifacts, you have not finished the job.

## When to Use

Use this skill when:
- The user asks to进行 E2E 测试（提供了前端详细设计文档）
- The user asks to run existing E2E tests
- The user asks to add Playwright E2E to a frontend project
- A browser bug needs reproduction
- A UI acceptance flow needs validation
- A Playwright suite is failing and needs triage

Do not use this skill for:
- Pure API or backend-only validation
- Unit-test-only changes
- Browser automation with no intention to keep or reuse the result

## Mode Detection

根据用户输入自动判断模式：

| 条件 | 模式 |
|------|------|
| 提供了 `frontend-detail-design.md`（通过 `@` 引用或路径） | **Mode A: 设计驱动 E2E**（两步式完整流程） |
| 已存在 `e2e-test-cases.md`，要求生成/运行测试代码 | **Mode B: 从用例生成代码**（跳过 Step 1） |
| 只要求运行/排查已有测试 | **Mode C: 运行与排查** |
| 未提供任何设计文档，也没有已有测试 | **提问获取路径**（见下方） |

### 提问获取前端详细设计路径

如果用户要求进行 E2E 测试但**未提供** `frontend-detail-design.md` 路径：

1. 使用 `AskUserQuestion` 询问：
   - "请提供前端详细设计文档的路径（`frontend-detail-design.md`），以便生成 E2E 测试用例。"
   - 选项：提供常见的 `docs/plans/` 下的候选路径（通过 Glob 搜索 `**/frontend-detail-design.md` 获取）
2. 获取路径后进入 **Mode A**

---

## Mode A: 设计驱动 E2E（完整两步式流程）

**触发条件**: 用户提供了 `frontend-detail-design.md`

### Step 1: 生成 e2e-test-cases.md

1. **读取前端详细设计文档**，从以下内容提取测试场景：
   - 页面路由 → 页面加载测试
   - 控件矩阵 → 表格、表单、按钮交互测试
   - 查询参数 → 搜索/筛选测试
   - 对话框流程 → 新增/编辑/删除测试
   - 分页配置 → 分页测试
   - 权限控制 → 按钮可见性测试
   - 导出功能 → 导出测试

2. **按优先级分级**：
   - **P0**：主流程（页面加载、列表显示、基本查询、分页）
   - **P1**：核心操作（新增、编辑、删除、导出）
   - **P2**：边界场景（表单校验、权限控制、空列表、特殊字符）

3. **每个测试用例必须包含**：用例编号、优先级、场景描述、前置条件、操作步骤、预期结果

4. **确定输出路径**：
   - 如果详细设计文档在 `docs/plans/<task>/<page-slug>/frontend-detail-design.md`，则输出到同目录：`docs/plans/<task>/<page-slug>/e2e-test-cases.md`
   - 否则输出到详细设计文档的同级目录

5. **生成 `e2e-test-cases.md`**，使用以下格式：

```markdown
# <页面名称> E2E 测试用例

> 基于 `frontend-detail-design.md` 生成，经用户确认后作为 Playwright 测试代码的 source of truth。

## 页面信息

- **路由**: `/path/to/page`
- **前端设计文档**: `./frontend-detail-design.md`

## P0: 主流程

### TC-01: 页面正常加载

- **前置条件**: 用户已登录且有页面访问权限
- **操作步骤**:
  1. 导航到 `/path/to/page`
  2. 等待页面加载完成
- **预期结果**:
  - 页面标题正确显示
  - 查询表单可见
  - 表格组件已渲染

### TC-02: ...
（根据详细设计文档的实际内容生成具体用例）

## 脚本映射表

> 用例生成时留空，测试代码生成后回填。

| 用例编号 | 优先级 | 场景 | 脚本文件 | 测试方法 | 状态 |
|---------|--------|------|---------|---------|------|
| TC-01 | P0 | 页面正常加载 | — | — | 待生成 |
```

6. **等待用户确认** ⚠️ **必须停下来**
   - 展示生成的用例摘要（总数、P0/P1/P2 分布）
   - 明确告知用户："请确认测试用例，确认后将生成 Playwright 测试代码。"
   - 用户可能要求增删改用例 → 修改后再次确认
   - **用户确认前不得进入 Step 2**

### Step 2: 生成 Playwright 测试代码并运行

用户确认 `e2e-test-cases.md` 后，进入代码生成阶段。

1. **确定前端项目目录**：
   - 从用户上下文或详细设计文档中推断
   - 如果无法确定，使用 `AskUserQuestion` 询问

2. **发现已有 Playwright 配置**：
   - 检查 `playwright.config.*`、`tests/e2e/`、package scripts、auth fixtures
   - 优先复用已有配置

3. **如果没有 Playwright 配置，脚手架最小基线**：
   - `playwright.config.ts`
   - `tests/e2e/` 目录
   - Package scripts: `e2e`, `e2e:headed`, `e2e:report`
   - Auth setup（如需登录）

4. **生成测试代码**（一个 spec 文件对应一个页面）：
   - 文件路径：`tests/e2e/<page-slug>.spec.ts`
   - `e2e-test-cases.md` 中每个用例 → 一个 test 函数
   - 函数名必须包含用例编号：`test('TC-01: 页面应正常加载', ...)`

5. **测试代码规范**（必须遵守）：
   - 所有注释使用**中文**
   - 每个 test 函数上方写中文块注释：对应用例编号、测试目标、关键验证点
   - 关键操作步骤旁加行内中文注释
   - **详细日志输出**：每个操作步骤必须输出 `console.log` 日志
     - 日志格式：`[TC-XX] 操作描述`
     - 断言前先打印实际值
     - 页面导航、弹窗、API 响应等关键节点都要打日志
   - 使用 `test.describe` 按页面分组
   - 优先使用 `data-testid` 选择器，回退到 text/role 选择器
   - 使用 `test.beforeEach` 处理公共导航/认证

   日志示例：
   ```typescript
   /**
    * TC-05: 新增订单记录
    * 验证：点击新增按钮 → 填写表单 → 提交 → 列表中出现新记录
    */
   test('TC-05: 应该能新增订单', async ({ page }) => {
     console.log('[TC-05] 开始执行：新增订单记录');
     console.log('[TC-05] 点击「新增」按钮');
     await page.getByRole('button', { name: '新增' }).click();
     console.log('[TC-05] 等待新增对话框弹出');
     await expect(page.getByRole('dialog')).toBeVisible();
     console.log('[TC-05] 对话框已弹出');
     // ...
     console.log('[TC-05] ✅ 用例通过');
   });
   ```

6. **运行测试**：
   - 优先使用项目已有脚本（`npm run e2e`）
   - 回退：`npx playwright test`
   - 失败处理：
     - 选择器/时序问题 → 修复测试代码（不改应用代码），最多重试 3 次
     - 应用行为不符合设计 → 报告为产品问题，不修复应用

7. **回填脚本映射表**：
   - 测试运行完成后，**必须回填** `e2e-test-cases.md` 末尾的脚本映射表
   - 填入：脚本文件、测试方法名、通过/失败状态

8. **输出报告**（使用标准 Output Format）

---

## Mode B: 从已有用例生成代码

**触发条件**: 已存在 `e2e-test-cases.md`，用户要求生成测试代码

直接从 Step 2 开始执行。读取 `e2e-test-cases.md` 作为 source of truth，流程同 Mode A Step 2。

---

## Mode C: 运行与排查

**触发条件**: 用户要求运行或排查已有测试

### 1. Discover before changing
- Check for `playwright.config.*`, package scripts, existing `tests/e2e/`, auth fixtures, and report directories.
- Prefer reusing existing scripts and config.

### 2. Choose the narrowest scope first
- Prefer a single spec, project, or grep filter before a full-suite run.
- Escalate scope only when the narrower run is insufficient.

### 3. Separate setup from product behavior
- Missing dependencies, browsers, ports, or servers are setup issues.
- Assertion mismatches, broken selectors caused by UI change, and incorrect page behavior are product or test issues.
- Do not blur these categories in your report.

### 4. Run & Report
- Find the preferred script: `npm run e2e` / `pnpm e2e` / `yarn e2e` / fallback: `npx playwright test`
- Run the smallest command that answers the question
- If it fails: identify first meaningful failure, inspect artifacts, classify failure type
- If it passes: say what was covered and what was not

---

## The Rules (applies to all modes)

1. **Evidence is mandatory**
   - Record the exact command you ran.
   - Record pass/fail and exit code.
   - Surface artifact paths for traces, screenshots, videos, and HTML reports.

2. **Do not scaffold unless needed**
   - If the user asked to run or triage tests, do not silently add Playwright infrastructure.
   - Only scaffold when generating new tests (Mode A/B) and no setup exists.

3. **Test cases doc is the source of truth**
   - Mode A/B: 测试代码必须 1:1 对应 `e2e-test-cases.md` 中的用例，不得自行发明用例或跳过用例。

4. **User confirmation is mandatory before code generation**
   - Mode A: Step 1 生成 `e2e-test-cases.md` 后必须等用户确认，不得自动进入 Step 2。

## Failure Classification

Use these buckets:

- **Product regression** — The application behavior is wrong under a valid test.
- **Test issue** — The selector, assertion, fixture, or expectation is stale or incorrect.
- **Flaky test** — Timing, async rendering, unstable network, or race conditions produce intermittent failures.
- **Environment issue** — Missing dependency, browser binary, wrong port, startup failure, or permission problem.

When uncertain, say what is observed and what is inferred.

## Output Format

Use this structure for the final report:

```md
Status: PASS | FAIL | BLOCKED

Command:
- `...`

Scope:
- What tests or flows were exercised

Evidence:
- exit code
- failing test name(s)
- artifact paths

Assessment:
- product regression | test issue | flaky test | environment issue
- note any inference explicitly

Next action:
- rerun narrower/wider
- fix app
- fix test
- repair environment
```

## Agent-Aware Note

If your platform supports named agents from `agents/`, you may dispatch `superpowers:e2e-runner` after inputs are clear and the task is well-scoped.

If your platform is skill-only, follow this skill directly.
