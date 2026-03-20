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
- Current version directory under `DOC_ROOT`
- `index.md`
- `shared-plan.md` when it exists
- Every page `plan.md` referenced by `index.md`

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
- Provide the full task text, required context, `SOURCE_ROOT`, and `DOC_ROOT`
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

Then run the normal deferred verification flow:

1. Backend compilation
2. Frontend compilation
3. Spec review
4. Code quality review
5. Final gate evidence

Use [`shared/phase2-verification.md`](../shared/phase2-verification.md) for the full verification process.

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

[mvn compile]
[npm run build]
[dispatch spec reviewer]
[dispatch quality reviewer]
[output final gate evidence]
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
