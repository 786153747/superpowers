---
name: subagent-driven-development
description: Use when executing implementation plans in the current session. Runs the `shared-plan.md` phase first, then executes page plans with streaming lanes — each page lane advances independently upon task completion, no wave synchronization barrier. A fresh implementer subagent is dispatched per task. Concurrency is capped by max_concurrency (default 3). Shared tasks may run in parallel when safe. Compilation and reviews are deferred until all tasks complete.
---

# Subagent-Driven Development

Execute saved plans in the current session with a streaming lane scheduler:

- `shared-plan.md` phase first (synchronized waves), then each page as an independent streaming lane
- Shared tasks run in parallel when write sets are disjoint
- Page lanes advance independently — no waiting for other lanes
- Concurrency capped by `max_concurrency` (default 3)
- One active task per page lane; fresh implementer subagent per task
- Compilation and review deferred until all tasks complete

Use this skill when `writing-plans` has created plans and you want to execute in the current session. Prefer `executing-plans` for a separate parallel session.

## Controller Role

CRITICAL: The controller is an orchestrator, not an implementer.

### MUST

- Read `index.md`, `shared-plan.md`, and all page `plan.md` files before starting
- Treat `[DOC_ROOT]/spec/CODING_STANDARDS.md` as the sole source for project conventions and embed its full content into every implementer prompt
- Complete all `shared-plan.md` tasks before starting any page lane
- Parallelize ready shared tasks when write sets are disjoint — do NOT serially drain safe-to-parallelize tasks
- On any subagent completion, immediately scan ALL lanes and dispatch every safe next task within `max_concurrency` — do NOT wait for other in-flight subagents (no wave regression)
- Output a **Dispatch Ticket** before every dispatch (see template below)
- Dispatch a fresh implementer subagent per task
- Keep at most one active task per page lane at any time
- In shared phase, enumerate every ready shared task in the ticket and dispatch the full safe wave up to `max_concurrency`
- In page phase, fill open slots from different ready pages in `index.md` order before waiting again
- Pass the same absolute `SOURCE_ROOT`, `DOC_ROOT`, and `VERSION_DIR` to every implementer
- Update `plan.md` and `index.md` after each completed task
- Answer subagent questions before the subagent proceeds

### MUST NOT

**Role boundaries:**
- Write implementation code directly — if you catch yourself doing this, stop and dispatch a subagent
- Scan the repository to rediscover conventions already in `CODING_STANDARDS.md`

**Scheduling discipline:**
- Start any page task before `shared-plan.md` is complete
- Dispatch two tasks from the same page concurrently
- Exceed `max_concurrency` limit
- Wait for all in-flight subagents before dispatching new tasks (wave regression)
- Serially drain ready shared tasks after proving they are safe to parallelize
- Block a ready lane from advancing when concurrency allows and no safety conflict exists (lane starvation)
- Start page phase with only the first ready page when other ready pages could fill open slots
- Dispatch multiple ready tasks from the same page just because they are disjoint
- Collapse multiple ready shared tasks into a single shared row and dispatch only the first one
- Skip Dispatch Ticket output before any dispatch

**Build/review discipline:**
- Compile or dispatch reviewers during Phase 1
- Pass unsanitized Task text containing `验证:` or `mvn compile` to an implementer (CLAUDE.md Rule 6)

**Status discipline:**
- Treat timeout, missing exit code, agent handle lost, or `No task found with ID` as success
- Batch-mark multiple `未开始` tasks as `已完成`
- Let a page advance after a `NOT COMPLETE` task
- Mix source edits between main repo and worktree after worktree is chosen
- Declare "实施完成" or "可以部署" before all Phase 2 gates pass and Final Gate Evidence is output

## Required Inputs (Hard Gate)

Before Phase 1, **all** of the following must exist. Any missing = STOP.

| Input | Description |
|-------|-------------|
| `DOC_ROOT` | Absolute path to docs workspace (= CWD) |
| `PROJECT_ROOT` | Absolute path to main source repository |
| `SOURCE_ROOT` | Absolute path to worktree — **must** be created via `using-git-worktrees` (CLAUDE.md Rule 9). Must ≠ `PROJECT_ROOT`. |
| `VERSION_DIR` | Absolute path to current version directory (e.g., `[DOC_ROOT]/docs/plans/2026-03-20-xxx/abc123/`) |
| `CODING_STANDARDS` | Content of `[DOC_ROOT]/spec/CODING_STANDARDS.md`, read once and cached |
| Plan files | `index.md`, `shared-plan.md` (if exists), all page `plan.md` |

### Pre-Phase-1 Checklist

```
☐ Worktree created? → SOURCE_ROOT recorded, SOURCE_ROOT ≠ PROJECT_ROOT
☐ DOC_ROOT, VERSION_DIR set?
☐ CODING_STANDARDS.md read and cached?
☐ index.md + all plan.md files read?
```

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

- `./implementer-prompt.md` · `./spec-reviewer-prompt.md` · `./code-quality-reviewer-prompt.md`

## Dispatch Safety Rules

Two tasks (shared or page) may run concurrently only when **all** are true:

- Do not modify the same files
- Do not compete for shared ownership (controller, service, mapper, entity, DTO, route, menu seed)
- Do not depend on each other
- `index.md` execution order does not require one to wait for the other

When the controller cannot prove write sets are disjoint → downgrade to serial.

## Phase 1: Implementation

### Algorithm

```
max_concurrency = 3

# ── Shared Phase (wave sync) ──────────────────────────────
while shared-plan has unfinished tasks:
    ready = [t for t in shared_tasks_in_plan_order if deps_met(t)]
    wave = []
    for task in ready:
        if len(wave) >= max_concurrency: break
        if safe_with_all(task, wave):      # apply Safety Rules
            wave.append(task)
    # MUST dispatch the full safe wave, not just the first ready task
    dispatch_all(wave)                     # multiple Agent calls in one message
    wait_all(wave)                         # wave sync only in shared phase
    update_status(shared-plan, index.md)

# ── Page Phase (streaming lanes) ──────────────────────────
in_flight = {}  # page → task

# Initial dispatch: fill up to max_concurrency from different pages
for page in index.md_order:
    if len(in_flight) >= max_concurrency: break
    task = first_ready_task(page)
    if task and safe_with_all(task, in_flight.values()):
        dispatch(page, task)
        in_flight[page] = task

# Streaming loop
while in_flight or any_lane_has_remaining_tasks:
    completed_page, completed_task = wait_for_any()
    update_status(completed_page, completed_task, plan.md, index.md)
    del in_flight[completed_page]

    # Immediately scan ALL lanes — dispatch every safe next task
    for page in all_pages_with_remaining_tasks:
        if len(in_flight) >= max_concurrency: break
        if page in in_flight: continue     # max 1 task per page
        task = first_ready_task(page)
        if task and safe_with_all(task, in_flight.values()):
            dispatch(page, task)
            in_flight[page] = task

# All lanes complete → enter Phase 2
```

### Dispatch Ticket (mandatory before every dispatch)

Before dispatching any shared wave or page task(s), output this ticket. **Skipping the ticket = invalid dispatch.**

```markdown
### Dispatch Ticket #N
- **Trigger**: [initial | shared_wave | task_completed(page=X, task=Y)]
- **In-flight**: [page:task, ...] (M / max_concurrency)
- **Open slots**: max_concurrency - M = ?
- **Lane scan**:
  | Page / Lane | Status | Next ready task | Safe? | Dispatch? |
  |-------------|--------|-----------------|-------|-----------|
  | ... | idle/in-flight/done | Task N / none | ✅/❌(reason) | yes/no |
- **This dispatch**: [page1:taskA, page2:taskB, ...]
```

The ticket forces you to:
1. List ALL lanes (prevents lane starvation)
2. Count open slots (prevents wave regression)
3. Safety-check each idle lane (prevents skipped dispatches)
4. Record decisions (auditable)

Ticket construction rules:
- **Shared phase**: one row per ready shared task, e.g. `shared:Task1`, `shared:Task5`; do not collapse them into one generic `shared` row
- **Page phase**: one row per page lane, including blocked / in-flight / done lanes; do not show only the page that just completed
- **Page phase dispatch**: if `my-order` already has an in-flight task, `my-order` must show `in-flight` and cannot receive another dispatch in the same ticket

### Common Misfires

Wrong:
- Shared phase sees `Task1`, `Task5` both ready and safe, but dispatches only `Task1`
- Page phase starts only `my-order:Task1` even though `delivery-record` and `consignment-inventory` are also ready
- `my-order:Task1` finishes and controller dispatches `my-order:Task2` + `my-order:Task3` together

Right:
- Shared phase dispatches the full ready safe wave
- Page phase fills slots from different ready pages first
- Same page gets its next task only after its current in-flight task completes

### Compact Example

```
Shared phase (max_concurrency=3):
  shared deps:
    T1 = no deps
    T5 = no deps
    T2/T3/T4 = depend on T1
  Wave 1 ticket rows: shared:T1, shared:T5
    → dispatch shared:T1 + shared:T5
  Wave 2 ticket rows: shared:T2, shared:T3, shared:T4
    → dispatch shared:T2 + shared:T3 + shared:T4

Page phase (max_concurrency=3, pages: my-order, delivery-record, consignment-inventory, order-ledger):
  Ticket #1 [shared complete]:
    dispatch my-order:T1, delivery-record:T1, consignment-inventory:T1
    hold order-ledger (depends on my-order)

  Ticket #2 [my-order:T1 done while other two still running]:
    dispatch my-order:T2 only
    do NOT dispatch my-order:T3 in the same ticket

  Ticket #3 [delivery-record:T1 done]:
    dispatch delivery-record:T2
    keep scanning all lanes after every completion
```

## Per-Task Dispatch

- Dispatch a fresh implementer subagent per task (never one agent for the whole page)
- Provide: task text, `SOURCE_ROOT`, `DOC_ROOT`, `VERSION_DIR`, embedded `CODING_STANDARDS` content
- Replace design doc references in task text with `VERSION_DIR`-based absolute paths
- Make the task's file ownership explicit so the implementer knows its expected write set
- Tell every implementer it is not alone in the worktree: do not revert unrelated edits, and raise conflicts instead of silently overwriting them

### Sanitize Task Text Before Dispatch

1. Strip `验证:` / `**验证**:` subsections entirely
2. Delete lines containing: `mvn`, `mvn compile`, `npm run build`, `gradle build`, `tsc`, `编译无错误`, `无 import 错误`, `无类型不匹配`
3. Note any stripping in dispatch log; do not block dispatch

## Status Updates

After each completed task:

1. Update task row in `plan.md` / `shared-plan.md` to `已完成`
2. Update `index.md` execution progress
3. First completed task of a page → set `实施状态` to `进行中`
4. All tasks of a page complete → set `实施状态` to `已完成`
5. Shared tasks only update the `shared` row — not any page

Status write-backs always target `DOC_ROOT`, never the worktree.

### Completion Rules

Mark `已完成` only when ALL are true:
1. Implementer returns `STATUS: COMPLETE`
2. Result includes actual modified file list
3. No unhandled blocker
4. `plan.md` and `index.md` write-backs succeed

**编译不是 Task 完成条件** — 编译错误统一由 Phase 2 检查。

Never mark `已完成` on: agent handle lost, `No task found with ID`, timeout, `Error editing file`, completion inferred from file existence, or undispatched task.

If status write-back fails → keep prior state, do not advance the lane.

## Worktree Binding

- `SOURCE_ROOT` = worktree path → all code edits, builds, implementer working dirs
- `DOC_ROOT` = docs workspace → spec reads, design reads, `index.md`/`plan.md` writes
- Do not switch editing between main repo and worktree without explicit reason

## Phase 2: Verification

Entry: all tasks in `shared-plan.md` + all page `plan.md` files complete.

**Phase 2 = 5 sequential Gates. 编译通过 ≠ 完成。必须走完全部 Gate + 输出 Final Gate Evidence 才能宣布完成。**

| Gate | Action | On failure |
|------|--------|------------|
| 1 | `mvn compile` | fix → recompile → loop |
| 2 | `npm run build` | fix → rebuild → loop |
| 3 | Spec Compliance — `AskUserQuestion` → dispatch `spec-reviewer-prompt.md` | fix → re-review |
| 4 | Code Quality — `AskUserQuestion` → dispatch `code-quality-reviewer-prompt.md` | fix → re-review |
| 5 | Coding Standards Feedback → propose updates to `CODING_STANDARDS.md` | user confirms |

Gate 3/4 only skipped when user explicitly says "跳过". All gates done → output **Final Gate Evidence** table.

详见 [`shared/phase2-verification.md`](../shared/phase2-verification.md)。

## Integration

Required: `using-git-worktrees`, `writing-plans`, `finishing-a-development-branch`, `verification-before-completion`

Alternative: `executing-plans` (separate parallel session)
