---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## 延迟编译与延迟审查策略（关键）

**编码阶段不编译、不审查。** 这是本技能的核心原则。

### 延迟编译

- **编码阶段不编译** - 实现功能时专注于代码编写，不每模块单独编译
- **统一编译时机** - 所有页面功能编码完成后，再执行编译验证
- **编译顺序** - 先后端编译，再前端编译
- **编译修复循环** - 编译失败时需修复代码，修复后重新编译，直到编译通过才进入审查阶段
- **例外** - 用户明确要求或遇到阻塞性问题时才可编译

### 延迟代码审查

- **审查时机** - 所有页面功能编码完成后，进入 Phase 2 验证流程（[`shared/phase2-verification.md`](../shared/phase2-verification.md)）
- **审查范围** - Phase 2 的 Gate 3 (Spec Compliance) 和 Gate 4 (Code Quality) 覆盖整个功能模块
- **例外** - 用户明确要求对特定任务进行审查

### 工作流程

| 阶段 | 操作 | 说明 |
|------|------|------|
| 编码中 | 不编译、不审查 | 专注代码实现，按计划逐任务推进 |
| 所有页面编码完成 | Phase 2 验证流程 | 见 [`shared/phase2-verification.md`](../shared/phase2-verification.md) |

### 技能调用顺序

使用本技能执行计划时，必须按以下顺序集成其他技能：

| 阶段 | 技能 | 用途 |
|------|------|------|
| **开始前** | `superpowers:using-git-worktrees` | 创建隔离工作区（仅针对用户指定的**源码目录**） |
| **所有页面编码完成后** | [`shared/phase2-verification.md`](../shared/phase2-verification.md) | Phase 2 验证流程（Gate 1-5 + Final Gate Evidence） |
| **Phase 2 通过后** | `superpowers:finishing-a-development-branch` | 完成分支 |

> **注意**：Phase 2 验证流程已统一到 [`shared/phase2-verification.md`](../shared/phase2-verification.md)，包含编译、Spec Compliance、Code Quality、Coding Standards Feedback 等 Gate。

### 注意事项

- **编码阶段不审查** - 按计划逐任务推进，不每页暂停审查，直到所有页面编码完成
- **统一审查** - 编码完成后进入 Phase 2 验证流程，包含编译 + 分步审查（Gate 1-5）
- `using-git-worktrees` 在 `PROJECT_ROOT`（实际代码项目目录）下创建 worktree，产出 `SOURCE_ROOT`
- 文档目录（`docs/plans/`、`spec/`）在 CWD 下，用 CWD 相对路径读写，不经过 worktree
- `DOC_ROOT` = CWD 绝对路径，传给 subagent 读取设计文档和 spec
- 创建 worktree 后，所有源码修改、验证命令、子代理工作目录都使用 `SOURCE_ROOT`
- 计划进度回写（index.md、plan.md）始终在 CWD 下的 `docs/plans/`

### 无 Git 仓库例外

如果**源码目录**不是 git 仓库：

1. **先初始化 git 仓库**：
   ```bash
   cd <源码目录>
   git init
   git add .
   git commit -m "feat: 初始提交"
   ```

2. **配置 .gitignore**（可选但推荐）：
   - 添加常见的忽略规则（如 `node_modules/`, `*.log`, `.DS_Store` 等）
   - 在首次 commit 之前完成

3. **然后再执行 `using-git-worktrees`** 创建隔离工作区

4. 如果用户明确表示不需要 git 隔离，可以**跳过 worktree 步骤**，直接在当前目录修改代码

## The Process

### Version Directory Contract

- **任务目录**：`docs/plans/YYYY-MM-DD-<topic>/`
- **当前版本目录**：有 commit 时为 `docs/plans/YYYY-MM-DD-<topic>/<commitid>/`；无 commit 时可退化为任务目录本身
- 本 skill 中提到的 `index.md`、`shared-plan.md`、`<page-slug>/plan.md`，默认都指**当前版本目录**中的文件
- 当前版本目录必须先确定一次，再在整个执行阶段复用；不得从多个 commit 版本目录混读 `diff / index / plan`
- 版本目录在 CWD 下的 `docs/plans/` 中（`DOC_ROOT`），不在 worktree（`SOURCE_ROOT`）中
- 如果存在多个版本目录且无法唯一确定当前版本目录，必须停止并向用户确认，不能凭宽泛 Glob 结果自行挑选

### Step 1: Load and Review Plan (via index.md)

1. **确定当前版本目录**（不得使用 `docs/plans/**/index.md` glob 扫描）：
   - 如果用户或上游 skill 给出了确切版本目录路径 → 直接使用
   - 如果用户给出了任务目录（如 `docs/plans/2026-03-19-xxx/`）→ 列出子目录找最新 commit 版本目录
   - 如果存在多个候选且无法唯一确定 → **STOP**，用 `AskUserQuestion` 让用户选择
   - 确定后记录：`当前版本目录 = <确切路径>`，后续所有 index.md / plan.md / diff.md 引用均使用此路径
2. 用 Read 直接读取 `<当前版本目录>/index.md`
3. **验证内容**：确认 index.md 的功能名称、页面清单与当前任务一致（防止读错版本目录）
4. Check the **执行顺序** section to determine execution order
5. Find the first page with `实施状态 = 未开始` or `进行中`
6. Read that page's `plan.md` from the current version directory (e.g., `shared-plan.md` or `<page-slug>/plan.md`)
7. Review the plan critically - identify any questions or concerns
8. If concerns: Raise them with your human partner before starting
9. If no concerns: Create TodoWrite for the current page's tasks and proceed

### Step 2: Execute Batch
**Default: First 3 tasks of the current page**

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed
5. **Update status tracking** after each task:
   - Update the task's status in the current version directory's `<page>/plan.md` 任务状态 table (set to `已完成`)
   - Update the current version directory's `index.md` 执行进度 table: increment the `已完成` count for this page
   - On first task of a page: update the current version directory's `index.md` page `实施状态` to `进行中`

### 强制状态一致性规则

- 只有在以下条件全部满足时，Task 才能标记为 `已完成`:
  1. 该 Task 已实际执行
  2. 计划要求的验证已执行，且退出码明确为成功
  3. 当前版本目录中的 `<page>/plan.md` 与 `index.md` 的状态更新都成功
- 以下情况一律不得标记 `已完成`:
  - 命令超时
  - 命令无输出且未确认退出码
  - `Error editing file`
  - 仅凭文件存在性或推测认定任务完成
  - 尚未真正开始执行的 Task
- 禁止批量预标记:
  - 不得把多个 `未开始` Task 一次性更新为 `已完成`
  - 必须逐 Task 执行、逐 Task 更新状态
- 若状态文件更新失败:
  - 保持原状态或标记为 `进行中`
  - 先修复状态文件，再继续执行后续 Task

### Step 3: Report (with page context)
When batch complete:
- Show what was implemented
- Show verification output
- Show **page progress**: "页面 `<page-slug>`: N/M tasks completed"
- Show **overall progress**: "总进度: X/Y pages completed"
- Say: "Ready for feedback."

### Step 4: Continue / Page Transition
Based on feedback:
- Apply changes if needed
- Execute next batch of current page
- **When all tasks of current page are completed:**
  1. Update the current version directory's `<page>/plan.md` 任务状态 table — all tasks `已完成`
  2. Update the current version directory's `index.md` page `实施状态` to `已完成`
  3. Report: "✅ 页面 `<page-slug>` 已完成。"
  4. Check the current version directory's `index.md` for next incomplete page (following 执行顺序)
  5. If more pages remain → read next page's `plan.md` from the current version directory, create new TodoWrite, continue execution
  6. If all pages done → proceed to Step 5
- Repeat until all pages complete

### Resuming After Interruption

If the session was interrupted (context compressed, window closed, new session):

1. **重新确定当前版本目录**：按 Step 1 的规则确定确切路径（不得 glob 扫描），然后 Read `<当前版本目录>/index.md` — find the first page with `实施状态 = 进行中` or `未开始`
2. If `进行中` → read that page's `plan.md` task status table from the current version directory:
   - `已完成` tasks: first verify required outputs still exist on disk; if outputs are missing or clearly incomplete, downgrade to `未开始` or `进行中` before continuing
   - `进行中` task: check if the code changes exist on disk (use Glob/Read). If changes look complete, run verification; if incomplete or missing, re-execute the task
   - `未开始` tasks: proceed normally
3. If all pages `已完成` → proceed to Step 5

Do NOT assume a fresh start. Always check existing progress first.

### Step 5: Phase 2 Verification + Complete Development

After all pages' tasks complete:
1. Execute Phase 2 verification flow → [`shared/phase2-verification.md`](../shared/phase2-verification.md) (Gates 1-5 + Final Gate Evidence)
2. After all gates pass:
   - Announce: "I'm using the finishing-a-development-branch skill to complete this work."
   - **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
   - Follow that skill to verify tests, present options, execute choice

## 原型文件合并规则

当 Task 的「创建/修改文件」标注了合并策略（Copy / Overwrite / Merge）时，按以下方式执行。合并策略和 diff 编号（Fx）由 writing-plans 根据当前 diff 文档（`diff.md`）中的变更文件清单生成。

在执行任何 Task 前：
1. 先读取 `spec/CODING_STANDARDS.md`，将其作为技术栈、架构、代码规范的唯一来源
2. 仅在需要编辑、合并、验证某个具体文件时读取该文件当前内容
3. 禁止为了“探测规范”而扫描 `src/views/**`、`src/api/**`、`src/types/**` 或其他项目代码目录

### 合并模式判断（执行 Merge 任务前必读）

读取当前 diff 文档比对基线中的 `上次 diff Commit ID`：

- 不为"无" → 使用**三方合并**
- 为"无" 或 `比对模式 = 全量扫描` → 使用**两方合并**

### Copy（复制 + 适配）

适用于：原型新增的文件，开发项目中不存在。

1. 读取原型文件完整内容
2. 读取 `spec/CODING_STANDARDS.md`，按其中规范适配 import 路径、组件注册方式、API 调用方式、路由配置等
3. 适配后写入开发项目对应路径
4. 验证：文件能正常编译/运行

### Overwrite（直接覆盖）

适用于：原型修改的文件，开发项目有对应文件但开发者未做本地修改（与旧原型一致）。

1. 读取原型文件最新版本
2. 直接写入开发项目对应路径
3. 验证：文件能正常编译/运行

### Merge（智能合并）

适用于：原型修改的文件，开发项目有对应文件且开发者做了本地修改。

根据是否有旧基线，分为**三方合并**和**两方合并**两种模式：

#### 三方合并（有旧 Commit 时）

当前 diff 文档比对基线中的 `上次 diff Commit ID` 不为"无"时使用三方合并：

1. 读取原型旧版本：`git -C <原型目录> show <旧Commit>:<文件相对路径>`
2. 读取原型新版本：当前原型文件内容
3. 读取开发项目当前文件
4. 对比原型旧→新：理解原型改了什么（新增了哪些控件、修改了哪些字段、删除了什么）
5. 把原型的改动应用到开发项目文件上，同时保留开发项目的本地改动（如权限控制、本地 API 封装、自定义样式等）
6. 如果两边改动有冲突（改了同一区域），**停下来让用户决定**，不得自行拍板
7. 验证：文件能正常编译/运行

#### 两方合并（无旧 Commit / 全量扫描场景）

当前 diff 文档比对基线中 `上次 diff Commit ID` 为"无"或 `比对模式` 为"全量扫描"时，没有旧版本可做三方对比，降级为两方合并：

1. 读取原型文件（当前版本）：作为**目标状态**
2. 读取开发项目当前文件：作为**当前状态**
3. 逐区域对比两个文件，识别差异
4. 对于**只存在于原型**的内容（新控件、新字段、新逻辑）→ 合入开发项目文件
5. 对于**只存在于开发项目**的内容（本地适配、自定义逻辑）→ 保留
6. 对于**两边都有但不一致**的区域 → **停下来让用户决定**，展示两边差异让用户选择
7. 验证：合并后文件能正常编译/运行

> 两方合并比三方合并更保守：因为缺少旧基线，无法区分"原型新增"和"原型原有但开发项目删除"，所以对不确定的差异一律询问用户。

### 无合并策略标注时

如果 Task 的「创建/修改文件」没有标注合并策略（如纯后端 Task、非原型文件），按正常流程执行，不适用本规则。

---

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between batches: just report and wait
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **[`shared/phase2-verification.md`](../shared/phase2-verification.md)** - Phase 2 verification (Gates 1-5), shared with subagent-driven-development
- **superpowers:finishing-a-development-branch** - Complete development after all gates pass
