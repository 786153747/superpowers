---
name: subagent-driven-development
description: Use when executing implementation plans in the current session. Runs the `shared-plan.md` phase first, then immediately starts all page plans as parallel streaming lanes. Tasks remain serial within each page lane. Any cross-page dependency must be split into an explicit later task instead of blocking a whole page. A fresh implementer subagent is dispatched per task. Concurrency is capped by `max_concurrency` (default 5 for the whole run; do not rewrite it to the current dispatch size). Shared tasks may run in parallel when safe. Compilation and reviews are deferred until all tasks complete.
---

# Subagent-Driven Development

Execute saved plans in the current session with a streaming lane scheduler:

- `shared-plan.md` phase first (synchronized waves), then all pages enter independent streaming lanes immediately
- Shared tasks run in parallel when write sets are disjoint
- Page lanes advance independently — no waiting for other lanes
- Tasks stay serial within a page lane
- Cross-page dependency work must be split into explicit later tasks, not page-level gating
- Concurrency capped by `max_concurrency` (default 5)
- One active task per page lane; fresh implementer subagent per task
- Compilation and review deferred until all tasks complete

Use this skill when `writing-plans` has created plans and you want to execute in the current session. Prefer `executing-plans` for a separate parallel session.

## Controller Role

CRITICAL: The controller is an orchestrator, not an implementer.

### MUST

- Read `index.md`, `shared-plan.md`, and all page `plan.md` files before starting
- Treat `[DOC_ROOT]/spec/CODING_STANDARDS.md` as the sole source for project conventions and embed its full content into every implementer prompt
- Complete all `shared-plan.md` tasks before starting any page lane
- Establish the run's effective `max_concurrency` before the first dispatch. Default is `5`; only change it when the user explicitly requests a lower cap or the runtime limitation fallback forces `1`
- Parallelize ready shared tasks when write sets are disjoint — do NOT serially drain safe-to-parallelize tasks
- Before starting page phase, sanity-check multi-page plans: each page should have page-local work that can start immediately after `shared-plan.md`; if a page is blocked from `Task 1` by another page, stop and fix the plan decomposition instead of serializing whole pages
- On any subagent completion, immediately scan ALL lanes and dispatch every safe next task within `max_concurrency` — do NOT wait for other in-flight subagents (no wave regression)
- Output a **Dispatch Ticket** before every dispatch (see template below)
- Dispatch a fresh implementer subagent per task
- Keep at most one active task per page lane at any time
- In shared phase, enumerate every ready shared task in the ticket and dispatch the full safe wave up to `max_concurrency`
- In page phase, fill open slots from different ready pages in `index.md` order before waiting again
- Treat cross-page dependencies as explicit later tasks only; launch each page's independent tasks first
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
- Arbitrarily downgrade `max_concurrency` to `2` / `3` / `4` just because only that many tasks are currently ready
- Rewrite `max_concurrency` in tickets to equal the current dispatch count; dispatch size and concurrency cap are different values
- Wait for all in-flight subagents before dispatching new tasks (wave regression)
- Serially drain ready shared tasks after proving they are safe to parallelize
- Block a ready lane from advancing when concurrency allows and no safety conflict exists (lane starvation)
- Start page phase with only the first ready page when other ready pages could fill open slots
- Dispatch multiple ready tasks from the same page just because they are disjoint
- Treat a whole page as blocked just because one later task depends on another page
- Accept a multi-page plan where `Task 1` of a page depends on another page; that means the plan was decomposed incorrectly
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

### Concurrency Semantics

- `max_concurrency` means the actual cap in force for the current run, not the number of tasks selected in one ticket
- Default run cap is `5`
- Valid overrides are intentionally narrow:
  - User explicitly asks for a lower cap before or during Phase 1
  - Runtime limitation fallback forces `max_concurrency = 1`
- If only 3 tasks are ready/safe while the run cap is still 5, the dispatch size is 3 but `max_concurrency` remains 5
- Tickets must keep the real cap visible in `In-flight` / `Open slots`; explain unused slots via lane scan rows such as `not ready`, `unsafe`, or `no more lanes`
- There is no ad-hoc downgrade path to `2`, `3`, or `4`

## Page Lane Contract

For multi-page plans, the page phase assumes the following contract:

- After `shared-plan.md` completes, **all pages should be able to start immediately**
- Tasks inside one page remain serial and advance one by one
- Cross-page dependencies are allowed only on **explicitly extracted later tasks**
- A page's `Task 1` must not depend on another page; if it does, the page was serialized at the wrong level

Bad decomposition:

```markdown
# order-ledger/plan.md
Task 1: 接入复用的订单列表接口
依赖: my-order Task 2
```

Good decomposition:

```markdown
# order-ledger/plan.md
Task 1: 前端差异修复
Task 2: 页面本地交互与列表结构调整
Task 3: 接入复用的订单列表接口
依赖: my-order Task 2
```

The controller executes the good version by launching `Task 1` for every page in parallel after `shared-plan.md`, then holding only the extracted tail task until its upstream dependency is done.

## Phase 1: Implementation

### Algorithm

```
max_concurrency = 5   # default run cap
# Only valid overrides:
# - user explicitly requests a lower cap
# - runtime limitation fallback forces 1
# Dispatch size may be smaller than max_concurrency when fewer tasks are ready/safe.
# Never rewrite max_concurrency to match the number of tasks in the current batch.

# ── Shared Phase (wave sync) ──────────────────────────────
while shared-plan has unfinished tasks:
    ready = [t for t in shared_tasks_in_plan_order if deps_met(t)]
    wave = []
    for task in ready:
        if len(wave) >= max_concurrency: break
        if safe_with_all(task, wave):      # apply Safety Rules
            wave.append(task)
    # MUST dispatch the full safe wave, not just the first ready task
    dispatch_all(wave)                     # ALL Agent() calls in ONE response message — mandatory
    self_check(wave)                       # verify launched count == dispatched count
    wait_all(wave)                         # wave sync only in shared phase
    update_status(shared-plan, index.md)

# ── Page Phase (streaming lanes) ──────────────────────────
# Assumption: every page has page-local work that can start after shared phase.
# Cross-page dependencies must only appear on explicitly extracted later tasks.
in_flight = {}  # page → task

# Initial dispatch: fill up to max_concurrency from different pages
batch = []
for page in index.md_order:
    if len(batch) >= max_concurrency: break
    task = first_ready_task(page)
    if task and safe_with_all(task, batch):
        batch.append((page, task))
dispatch_all(batch)                        # ALL Agent() calls in ONE response message
self_check(batch)                          # verify launched count == dispatched count
for page, task in batch:
    in_flight[page] = task

# Streaming loop
while in_flight or any_lane_has_remaining_tasks:
    completed_page, completed_task = wait_for_any()
    update_status(completed_page, completed_task, plan.md, index.md)
    del in_flight[completed_page]

    # Immediately scan ALL lanes — dispatch every safe next task
    batch = []
    for page in all_pages_with_remaining_tasks:
        if len(in_flight) + len(batch) >= max_concurrency: break
        if page in in_flight: continue     # max 1 task per page
        task = first_ready_task(page)
        if task and safe_with_all(task, list(in_flight.values()) + batch):
            batch.append((page, task))
    dispatch_all(batch)                    # ALL Agent() calls in ONE response message
    self_check(batch)                      # verify launched count == dispatched count
    for page, task in batch:
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
- **Blocked page rows**: if a page has finished its local tasks and the next task is an extracted cross-page dependency task, mark that row as `blocked` with the exact upstream task name; do not retroactively block the whole page from the start
- **Ticket denominator**: the denominator in `M / max_concurrency` is the true cap in force for the run. Do not replace it with the number of tasks chosen for this ticket

### Common Misfires

Wrong:
- Shared phase sees `Task1`, `Task5` both ready and safe, but dispatches only `Task1`
- Page phase starts only `my-order:Task1` even though `delivery-record` and `consignment-inventory` are also ready
- `order-ledger` has local `Task 1` / `Task 2`, but controller holds the whole page because `Task 3` depends on `my-order`
- `my-order:Task1` finishes and controller dispatches `my-order:Task2` + `my-order:Task3` together
- **Ghost in-flight**: Ticket says dispatch 3 tasks, but only 1 `Agent(...)` call is made in that response; next turn claims the other 2 are "in-flight"
- **Fake downgrade**: run cap is still 5, but the ticket rewrites it to `3` just because 3 tasks are ready

Right:
- Shared phase dispatches the full ready safe wave — all `Agent(...)` calls in one response
- Page phase fills slots from different ready pages first — all `Agent(...)` calls in one response
- Launch each page's local tasks first; hold only the extracted tail task that truly depends on another page
- Same page gets its next task only after its current in-flight task completes
- After every dispatch, output Self-Check to verify launched count == dispatched count

### Hard Rule: Dispatch Must Be Real (No “Ghost In-Flight”)

If a ticket claims `**This dispatch**` has N tasks, you must **actually** dispatch N subagents **in the same response message**. Do not merely print the ticket and “assume” tasks are running.

**The single most common failure mode**: controller prints a ticket with 3 dispatches, then calls `Agent(...)` only once, then on the next turn treats the other 2 as “in-flight”. They were never started — they are ghosts. This is **forbidden**.

#### Mandatory Execution Pattern

Immediately after outputting the Dispatch Ticket, you MUST issue **all** `Agent(...)` calls **in one single response** so they run concurrently. Example for a 3-task dispatch:

```
### Dispatch Ticket #1
- **This dispatch**: [my-order:Task1, delivery-record:Task1, consignment-inventory:Task1]

(The controller’s very next action — in the SAME response — must be THREE parallel Agent calls:)

Agent(Implement my-order Task 1)        ← call 1
Agent(Implement delivery-record Task 1) ← call 2  ← ALL in the same message
Agent(Implement consignment-inventory Task 1) ← call 3
```

**Wrong** (serial / ghost):
```
Response 1: Ticket says dispatch 3 → Agent(my-order Task 1) only
Response 2: “delivery-record:Task1 and consignment-inventory:Task1 are still in-flight” ← GHOST! They were never started
```

**Right** (true parallel):
```
Response 1: Ticket says dispatch 3 → Agent(my-order Task 1) + Agent(delivery-record Task 1) + Agent(consignment-inventory Task 1) all in the same response
```

#### Rules

- **Same response, same message**: all N `Agent(...)` calls from one ticket go in one response. No splitting across turns.
- **Never list a task in `In-flight` unless you have truly started it** — you must have an agent handle/ID or explicit “agent started” record.
- **Runtime limitation fallback**: if your environment cannot keep multiple subagents running concurrently (e.g., the subagent call blocks until completion), then set `max_concurrency = 1` and run strictly serial — and the ticket must reflect that (no fake in-flight lanes).
- **No silent cap shrink**: absent an explicit user override or the runtime limitation fallback, `max_concurrency` stays at 5 for the whole run even when a given dispatch contains fewer tasks.

#### Post-Dispatch Self-Check (mandatory)

After all `Agent(...)` calls from a ticket have been issued, output a self-check block **before doing anything else**:

```markdown
#### Self-Check Ticket #N
- Ticket dispatched: [page1:taskA, page2:taskB, page3:taskC]  (count: 3)
- Agents actually launched: [agent-id-1, agent-id-2, agent-id-3] (count: 3)
- Match: ✅ 3 == 3
```

If the counts do not match → **STOP**. Do not proceed. Launch the missing agents immediately, or downgrade `max_concurrency` and re-issue the ticket.

（硬规则）票里写了几个 `This dispatch`，就必须在同一条回复里真的发出去几个子代理调用（Agent tool calls）。如果只发了 1 个就进入下一轮，其余的就是”幽灵 in-flight”——严禁。发完后必须输出 Self-Check 验证数量一致。

### Compact Example

```
Shared phase (max_concurrency=5):
  shared deps:
    T1 = no deps (create SQL DDL)
    T2 = no deps (create Entity — reads design doc, not T1's output)
    T3 = no deps (create DTO — reads design doc, not T1's output)
    T4 = no deps (create menu SQL — independent file)
    T5 = no deps (configure routes)
  Wave 1 ticket rows: shared:T1, shared:T2, shared:T3, shared:T4, shared:T5
    → ONE response with: Agent(shared:T1) + Agent(shared:T2) + Agent(shared:T3) + Agent(shared:T4) + Agent(shared:T5)
    → Self-Check: dispatched=5, launched=5, match ✅
  NOTE: T1-T5 all read from the same design doc but create independent files
        → no execution dependency → maximize parallelism

Page phase (max_concurrency=5, pages: my-order, delivery-record, consignment-inventory, order-ledger):
  order-ledger plan:
    T1 = frontend diff fix                     # no cross-page deps
    T2 = page-local interaction wiring         # no cross-page deps
    T3 = reuse order list response fields      # depends on my-order:T2

  Ticket #1 [shared complete]:
    → ONE response with: Agent(my-order:T1) + Agent(delivery-record:T1) + Agent(consignment-inventory:T1) + Agent(order-ledger:T1)
    → Self-Check: dispatched=4, launched=4, match ✅
    note: only 4 page lanes exist, so 1 slot remains unused even though max_concurrency is 5

  Ticket #2 [order-ledger:T1 done while other three still running]:
    → ONE response with: Agent(order-ledger:T2) only     ← 2 slots are open, but order-ledger is the only idle ready lane
    → Self-Check: dispatched=1, launched=1, match ✅
    do NOT dispatch order-ledger:T3 yet

  Ticket #3 [my-order:T1 done]:
    → ONE response with: Agent(my-order:T2)
    → Self-Check: dispatched=1, launched=1, match ✅
    keep scanning all lanes after every completion

  Ticket #4 [order-ledger:T2 done but my-order:T2 not done]:
    → order-ledger row = blocked on my-order:T2
    → do NOT block the page earlier than this extracted tail task
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

**Phase 2 = 5 sequential Gates. 编译通过 ≠ 完成。必须走完全部 Gate + 输出 Final Gate Evidence 才能宣布完成，也才能进入 `finishing-a-development-branch`。**

| Gate | Action | On failure |
|------|--------|------------|
| 1 | `mvn compile` | fix → recompile → loop |
| 2 | `npm run build` | fix → rebuild → loop |
| 3 | Spec Compliance — `AskUserQuestion` → dispatch `spec-reviewer-prompt.md` | fix → re-review |
| 4 | Code Quality — `AskUserQuestion` → dispatch `code-quality-reviewer-prompt.md` | fix → re-review |
| 5 | Coding Standards Feedback → propose updates to `CODING_STANDARDS.md` | user confirms |

Gate 3/4 only skipped when user explicitly says "跳过". Gate 5 is still a required terminal gate even when it results in `no conventions to add`. All gates done → output **Final Gate Evidence** table, then and only then continue to the finishing skill.

详见 [`shared/phase2-verification.md`](../shared/phase2-verification.md)。

## Integration

Required: `using-git-worktrees`, `writing-plans`, `finishing-a-development-branch`, `verification-before-completion`

Alternative: `executing-plans` (separate parallel session)
