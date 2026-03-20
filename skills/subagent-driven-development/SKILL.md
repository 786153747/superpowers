---
name: subagent-driven-development
description: Use when executing implementation plans in the current session. Runs the `shared-plan.md` phase first, then executes page plans with page-parallel / task-serial waves using a fresh implementer subagent per task. Shared tasks may run in parallel when safe. Compilation and reviews are deferred until all tasks complete.
---

# Subagent-Driven Development

Execute saved plans in the current session with a staged scheduler:

- Run the `shared-plan.md` phase first.
- Inside the shared phase, run ready shared tasks in parallel when their write sets are disjoint.
- After shared work completes, run page plans in parallel.
- Inside each page, execute tasks serially.
- Dispatch a fresh implementer subagent per task.
- Defer compilation and review until all implementation tasks are complete.

This skill is the same-session executor. It is optimized for steady progress with strong controller discipline and low context pollution.

## When To Use

Use this skill when:

- `writing-plans` has already created `shared-plan.md`, page `plan.md` files, and `index.md`
- You want to execute the plan in the current conversation
- The work can benefit from safe page-level parallelism

Prefer `executing-plans` when you want a separate parallel execution session instead of continuing in the current one.

## Core Principle

`shared-plan.md` phase first + shared-task parallelism when safe + page-parallel / task-serial waves + fresh subagent per task + deferred compilation + deferred review = fast execution with clearer ownership and fewer missed pages.

## Controller Role Boundaries

CRITICAL: The controller is an orchestrator, not an implementer.

### Controller MUST

- Read `index.md`, `shared-plan.md`, and page `plan.md` files
- Treat `[DOC_ROOT]/spec/CODING_STANDARDS.md` as the only source for project-wide module layout, package conventions, controller placement, entity placement, and coding standards
- Create a TodoWrite plan for the execution session
- Execute the `shared-plan.md` phase to completion before starting any page lane
- Parallelize ready shared tasks when their write sets are disjoint
- Dispatch a fresh implementer subagent per task
- Keep at most one active task per page at any time
- Answer subagent questions before the subagent proceeds
- Track and pass the same absolute `SOURCE_ROOT` to every implementer and verification command
- Track and use the same absolute `DOC_ROOT` for all design and plan reads plus status write-backs
- Update `plan.md` and `index.md` after each completed task or wave
- Run compilation and review only after all implementation tasks are complete

### Controller MUST NOT

- Write implementation code directly
- Scan the repository to rediscover Maven/module structure, controller package layout, entity locations, or other project-wide conventions already defined in `CODING_STANDARDS.md`
- Start any page task before `shared-plan.md` is complete
- Dispatch two tasks from the same page in the same wave
- Compile between tasks
- Dispatch reviewers between tasks
- Treat timeout, missing exit code, missing agent handle, or `No task found with ID` as success
- Batch-mark multiple `未开始` tasks as `已完成`
- Mix source edits between the main repository root and the selected worktree after a worktree is chosen
- Declare completion before all final gates pass

If you catch yourself writing implementation code instead of dispatching a subagent, stop and dispatch the appropriate task.

## Required Inputs

Before Phase 1, the controller must have:

- `DOC_ROOT`: absolute path to the docs workspace
- `PROJECT_ROOT`: absolute path to the main source repository
- `SOURCE_ROOT`: absolute path to the selected worktree
- `VERSION_DIR`: absolute path to the current version directory (e.g., `[DOC_ROOT]/docs/plans/2026-03-20-xxx/abc123/`)
- `CODING_STANDARDS` content: controller must read `[DOC_ROOT]/spec/CODING_STANDARDS.md` once and cache its content for embedding into every implementer prompt
- `index.md`
- `shared-plan.md` when it exists
- Every page `plan.md` referenced by `index.md`

## Frontend Execution Mode (前端执行模式)

当 plan 中包含前端 Task 时，Phase 1 开始前必须用 `AskUserQuestion` 询问用户：

- 问题：`前端 Task 的执行模式：`
- 选项 1：**复制原型 + 适配**（推荐） — 直接从原型目录复制前端文件到项目，按 CODING_STANDARDS 做最小适配（import 路径、API 调用等）。速度快，适合原型可直接使用的场景
- 选项 2：**根据设计文档生成** — 基于前端详细设计文档全新生成代码。完整但较慢，适合原型与实际需求差异较大的场景

### 复制原型模式

选择复制原型时：

1. **提取原型目录**：从 `VERSION_DIR/diff.md` 的「比对基线」节读取 `原型目录` 路径
2. **构建文件映射**：根据 diff.md 的变更文件清单，建立原型文件路径 → 开发项目目标路径的映射表（注意 `开发项目路径前缀`，如 `frontend/`）
3. **传给 implementer**：在 implementer prompt 中增加以下信息：
   - `PROTOTYPE_DIR`: 原型目录绝对路径
   - `FRONTEND_MODE: copy` 标记
   - 当前 Task 涉及的原型源文件路径 → 目标文件路径映射
4. **Implementer 行为**：读取原型文件 → 按 CODING_STANDARDS 适配（import 路径、API 前缀、组件注册方式等）→ 写入目标路径。不从设计文档重新生成

### 设计文档生成模式

选择生成模式时，按正常流程执行：implementer 根据前端详细设计文档编写代码，不读取原型文件。

## Prompt Templates

- `./implementer-prompt.md`: implementer subagent
- `./spec-reviewer-prompt.md`: spec compliance reviewer in Phase 2
- `./code-quality-reviewer-prompt.md`: code quality reviewer in Phase 2

## Phase 1: Implementation

### Scheduler Model

This skill uses a staged scheduler. That scheduler is authoritative and replaces a global ready-queue model.

1. Execute the `shared-plan.md` phase first.
2. Inside the shared phase, dispatch one or more ready shared tasks in parallel when they do not touch the same files.
3. Do not start any page task until the entire shared phase is complete.
4. After shared work completes, treat each page `plan.md` as one execution lane.
5. In each wave, pick at most one next ready task from each ready page.
6. Dispatch those per-page next tasks in parallel.
7. Wait for the whole wave to finish.
8. Update task status and progress tracking.
9. Advance each page lane to its next ready task.
10. Repeat until all page lanes are complete.

The unit of parallelism is not "all ready tasks everywhere". It is "the next ready task from each ready page".

### Shared Work First

`shared-plan.md` owns all cross-page bootstrap work, including examples such as:

- shared tables
- shared entities or DTOs
- menu and route bootstrap
- one-time infrastructure

If `shared-plan.md` exists:

- its tasks may run in parallel when their write sets are disjoint
- conflicting shared tasks must downgrade to serial
- the shared phase must fully finish before any page lane starts

### Page Lanes

After shared work:

- Each page listed in `index.md` becomes one lane
- Only one task in a page lane may be active at a time
- A page lane advances only after its current task is explicitly completed
- Different pages may progress in the same wave

### Determining The Next Ready Task

For each page lane:

1. Read its `plan.md` task table and task dependency declarations
2. Find the first unfinished task whose dependencies are satisfied
3. Select only that single task for the current wave

If no task in a page is ready, that page does not participate in the current wave.

### Page-Wave Safety Rules

Two pages may run in the same wave only when all of the following are true:

- Their selected tasks do not modify the same files
- Their selected tasks do not compete for shared API ownership
- Their selected tasks do not depend on each other
- `index.md` execution order does not require one page to wait for the other

Downgrade to serial when any of the following are true:

- The selected tasks touch the same file
- One page reuses a shared controller/service/mapper that is still being created by another page
- A page-level dependency or execution-order prerequisite is not yet satisfied
- The controller cannot prove the write sets are disjoint

Conservative serialization is correct behavior.

### Shared-Phase Safety Rules

Two shared tasks may run in the same shared wave only when all of the following are true:

- They do not modify the same files
- They do not compete for shared ownership of the same controller, service, mapper, entity, DTO, route, or menu seed
- They do not depend on each other

Downgrade shared work to serial when the controller cannot prove the shared write sets are disjoint.

### Per-Task Dispatch

Even though the scheduler is page-oriented, the implementer unit is still task-oriented:

- Dispatch a fresh implementer subagent per task
- Provide the full task text, required context, `SOURCE_ROOT`, `DOC_ROOT`, and `VERSION_DIR`
- **Controller 必须在 prompt 中嵌入 `spec/CODING_STANDARDS.md` 的完整内容**，implementer 不再需要自行读取此文件
- **Controller 必须传入 `VERSION_DIR`**（精确到 commit 版本目录的绝对路径，如 `[DOC_ROOT]/docs/plans/2026-03-20-xxx/abc123/`），implementer 用此路径直接读取设计文档，不需要自行拼接
- Task 的参考文件中引用设计文档时，controller 替换为 `VERSION_DIR` 下的绝对路径
- Answer clarifying questions
- Wait for an explicit completion report

Do not dispatch one long-running implementer for the entire page. Fresh subagent per task remains the default.

### Phase 1 Loop

Repeat the following loop:

1. If `shared-plan.md` has unfinished work, build a shared-task wave from all ready shared tasks with disjoint write sets
2. Dispatch the shared wave and wait for every shared subagent
3. Update `shared-plan.md` and the `shared` row in `index.md`
4. Repeat shared waves until the shared phase is complete
5. Then build the page wave by selecting at most one next ready task per ready page
6. Dispatch the page wave
7. Wait for every subagent in the page wave
8. For each successful task, update status and progress
9. For any failed or incomplete task, keep that page in place and do not advance it
10. Recompute the next wave
11. When no shared task and no page task remain, enter Phase 2

### Status Updates After Each Task

After each completed task:

1. Update the relevant task row in `<page>/plan.md` or `shared-plan.md` to `已完成`
2. Update the `index.md` execution progress table
3. On the first completed task of a page, set that page's `实施状态` to `进行中`
4. When all tasks of a page are complete, set that page's `实施状态` to `已完成`
5. For `shared-plan.md`, update only the `shared` row in execution progress; do not mark any page `进行中` or `已完成` because of shared work alone

Status write-backs always target the docs workspace under `DOC_ROOT`, never the worktree.

### Hard Rules For Marking Completion

A task may be marked `已完成` only when all of the following are true:

1. The implementer subagent explicitly returns `STATUS: COMPLETE`
2. The result includes the actual modified file list
3. The result clearly says the task is implemented with no unhandled blocker
4. The `plan.md` and `index.md` write-backs both succeed

**不在单个 Task 中检查编译**：编译错误（import 缺失、类型不匹配等）统一由 Phase 2 Gate 1/2 检查，不作为 Task 完成条件。

Never mark `已完成` when any of the following happens:

- agent handle lost
- `No task found with ID`
- command timeout
- `Error editing file`
- completion inferred only from file existence
- task was never actually dispatched

If a status update fails:

- Keep the task in its prior state or mark it `进行中`
- Do not advance that page to the next task until the write-back problem is fixed

## Worktree Binding

After creating a worktree:

- Record its absolute path as `SOURCE_ROOT`
- Record the docs workspace absolute path as `DOC_ROOT`
- Use `SOURCE_ROOT` for all code edits, build commands, and implementer working directories
- Use `DOC_ROOT` for spec reads, design reads, `index.md`, and `plan.md` writes

Do not switch source editing back and forth between the main repository and the worktree without an explicit reason.

## Phase 2: Verification

Entry condition:

- all tasks in `shared-plan.md` are complete, if `shared-plan.md` exists
- all tasks in all page `plan.md` files are complete

**Phase 2 是 5 个 Gate 的顺序流水线，编译通过不等于 Phase 2 完成。必须走完全部 Gate 并输出 Final Gate Evidence 才能宣布完成。**

### Gate 流程（严格按序执行）

1. **Gate 1: Backend Compilation** — `mvn compile`，失败则 fix → 重编 → 循环
2. **Gate 2: Frontend Compilation** — `npm run build`，失败则 fix → 重编 → 循环
3. **Gate 3: Spec Compliance** — 编译通过后，用 `AskUserQuestion` 询问用户是否执行（默认执行）。执行时 dispatch spec-reviewer subagent（用 `./spec-reviewer-prompt.md`），审查**全部已实现代码**
4. **Gate 4: Code Quality** — Gate 3 完成后，用 `AskUserQuestion` 询问用户是否执行（默认执行）。执行时 dispatch code-quality-reviewer subagent（用 `./code-quality-reviewer-prompt.md`），审查**全部已实现代码**
5. **Gate 5: Coding Standards Feedback** — 收集 Gate 3/4 发现的规范类问题，呈现给用户确认是否更新 `spec/CODING_STANDARDS.md`

### Hard Gate Rules

- **编译通过 ≠ Phase 2 完成**。Gate 1/2 通过后必须继续 Gate 3/4/5
- **不得跳过 Final Gate Evidence**。5 个 Gate 全部执行（或用户明确跳过）后，必须输出 Final Gate Evidence 表格
- **不得在 Final Gate Evidence 输出前宣布"实施完成"或"可以部署"**
- Gate 3/4 只有用户明确说"跳过"才能跳过，其他任何回复均视为执行

详见 [`shared/phase2-verification.md`](../shared/phase2-verification.md)。

If a Phase 2 gate fails:

- dispatch a fresh fix subagent for the failing issue
- rerun the failed gate
- repeat until the gate passes or a real blocker remains

## Example Workflow

```text
You: I'm using Subagent-Driven Development to execute this plan.

[Read index.md -> find execution order]
[Read shared-plan.md -> extract shared tasks]
[Read page plans -> build page lanes: my-order, delivery-record, consignment-inventory, order-ledger]

--- Phase 1: Implementation ---

Wave 0a: shared phase
  shared Task 1
  shared Task 2
  [Dispatch 2 implementer subagents in parallel]
  [All returned]
  [Update shared-plan.md + shared row in index.md]

Wave 0b: remaining shared work
  [Detect shared Task 3 touches the same bootstrap files]
  [Run shared Task 3 serially]
  [Shared phase complete]

Wave 1: one ready task per page
  my-order Task 1
  delivery-record Task 1
  consignment-inventory Task 1
  [Dispatch 3 implementer subagents in parallel]
  [All returned]
  [Update page plans + index.md]

Wave 2: advance each page by one task
  my-order Task 2
  delivery-record Task 2
  [Detect order-ledger Task 1 touches shared OrderController]
  [Hold order-ledger for now]
  [Dispatch my-order + delivery-record]
  [Update page plans + index.md]

Wave 3:
  my-order Task 3
  order-ledger Task 1
  [Now safe to run together]
  [Dispatch 2 implementer subagents]
  [Update page plans + index.md]

[Repeat until shared row and all page rows are complete]

--- Phase 2: Verification ---

[Gate 1: mvn compile → pass]
[Gate 2: npm run build → pass]
[Gate 3: AskUserQuestion "是否执行 Spec Compliance 审查？" → 用户确认 → dispatch spec-reviewer subagent → pass]
[Gate 4: AskUserQuestion "是否执行 Code Quality 审查？" → 用户确认 → dispatch code-quality-reviewer subagent → pass]
[Gate 5: collect convention issues → present to user → update CODING_STANDARDS if approved]
[Output Final Gate Evidence table]
[All gates ✅ → invoke finishing-a-development-branch]
```

## Advantages

### Compared To A Global Ready Queue

- Easier to reason about progress page by page
- Shared bootstrap still gets useful parallelism before page work starts
- Lower chance of missing a page entirely
- Lower chance of dispatching two conflicting tasks from the same page
- Better alignment with `index.md`, per-page `plan.md`, and per-page implementation status

### Compared To Full Page Serialization

- Multiple pages can still make progress in the same wave
- The controller keeps useful parallelism without losing page ownership clarity

### Compared To Per-Task Compilation And Review

- One compilation phase instead of compiling between tasks
- One review phase over the full implementation
- Better cross-task consistency checks in review

## Red Flags

Never:

- start page tasks before `shared-plan.md` completes
- run unsafe shared tasks in parallel when they touch the same shared files
- dispatch two tasks from the same page at once
- run two pages in parallel when their next tasks share write targets
- compile or review during Phase 1
- skip status write-backs
- ignore subagent questions
- let a page advance after a `NOT COMPLETE` task
- fix implementation code manually as controller
- **declare "实施完成" or "可以部署" after compilation passes without completing Gate 3/4/5 and outputting Final Gate Evidence**

## Known Failure Modes

### Failure Mode 1: Controller Becomes Implementer

The controller reads code, edits source files, fixes build errors, and declares tasks complete without dispatching implementers.

Detection:

- If you are writing implementation code instead of dispatching a subagent, you have violated the controller role.

### Failure Mode 2: Shared Work Is Bypassed

The controller starts page work before the cross-page bootstrap is done.

Detection:

- A page task is running while `shared-plan.md` still contains unfinished tasks.

### Failure Mode 3: Unsafe Shared Parallelism

The controller runs two shared tasks in parallel even though they modify the same shared files or compete for the same shared ownership.

Detection:

- Two in-flight shared tasks touch the same bootstrap file, shared controller, shared service, shared mapper, shared entity, shared DTO, route, or menu seed.

### Failure Mode 4: Two Tasks From The Same Page Run Together

The controller dispatches parallel tasks that both belong to the same page.

Detection:

- More than one in-flight subagent is working on the same page lane in the same wave.

### Failure Mode 5: No Status Updates

Implementation finishes, but `plan.md` and `index.md` were never updated.

Detection:

- A task result exists, but the corresponding task row and execution progress are stale.

### Failure Mode 6: Phase 2 Truncated After Compilation

The controller runs Gate 1/2 (compilation), sees them pass, then declares "实施完成" or "可以部署" without executing Gate 3 (Spec Review), Gate 4 (Code Quality), Gate 5 (Coding Standards Feedback), and without outputting Final Gate Evidence.

Detection:

- Compilation passed but no spec-reviewer or code-quality-reviewer subagent was dispatched.
- No Final Gate Evidence table was output.
- Controller said "完成" or "下一步可以部署" immediately after compilation.

## Integration

Required workflow skills:

- `superpowers:using-git-worktrees`
- `superpowers:writing-plans`
- `superpowers:finishing-a-development-branch`
- `superpowers:verification-before-completion`

Phase 2 reviewer prompts:

- `./spec-reviewer-prompt.md`
- `./code-quality-reviewer-prompt.md`

Subagents should use:

- `superpowers:test-driven-development`

Alternative workflow:

- `superpowers:executing-plans` for a separate parallel execution session
