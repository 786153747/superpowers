---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with compilation gate + two-stage review after each: compilation check first, then spec compliance review, then code quality review.

**Core principle:** Fresh subagent per task + compilation gate + two-stage review (spec then quality) = high quality, fast iteration

## When to Use

```dot
digraph when_to_use {
    "Have implementation plan?" [shape=diamond];
    "Tasks mostly independent?" [shape=diamond];
    "Stay in this session?" [shape=diamond];
    "subagent-driven-development" [shape=box];
    "executing-plans" [shape=box];
    "Manual execution or brainstorm first" [shape=box];

    "Have implementation plan?" -> "Tasks mostly independent?" [label="yes"];
    "Have implementation plan?" -> "Manual execution or brainstorm first" [label="no"];
    "Tasks mostly independent?" -> "Stay in this session?" [label="yes"];
    "Tasks mostly independent?" -> "Manual execution or brainstorm first" [label="no - tightly coupled"];
    "Stay in this session?" -> "subagent-driven-development" [label="yes"];
    "Stay in this session?" -> "executing-plans" [label="no - parallel session"];
}
```

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Compilation gate + two-stage review after each task: compile first, then spec compliance, then code quality
- Faster iteration (no human-in-loop between tasks)

## Controller Role Boundaries

CRITICAL: The controller (you) is an orchestrator, NOT an implementer.

### Controller MUST:
- Read plan, extract tasks, create TodoWrite
- Dispatch implementer subagent per task (via Agent tool)
- Answer subagent questions
- Run compilation check (controller runs build command directly)
- Dispatch spec reviewer subagent (via Agent tool)
- Dispatch code quality reviewer subagent (via Agent tool)
- Output gate evidence block before marking each task complete
- Update plan.md task status and index.md progress

### Controller MUST NOT:
- Write implementation code (that's the implementer subagent's job)
- Review code itself and claim it replaces subagent review
- Mark a task complete without all 3 gates passing
- Skip dispatching any subagent (even if "code looks fine")
- Proceed to next task with open review issues

If you catch yourself writing implementation code instead of dispatching a subagent, STOP. You are violating the controller role boundary.

## The Process

### Startup (once)

1. Read `index.md` → find first page with 实施状态 = 未开始
2. Read that page's `plan.md` (or `shared-plan.md`)
3. Extract ALL tasks with full text — do not make subagents read plan files
4. Create TodoWrite with all tasks

### Per-Task Loop (MANDATORY — every task, no exceptions)

**You MUST execute steps 1→2→3→4→5→6 in order. Skipping any step = process failure.**

**Step 1: Dispatch implementer subagent**
- Use Agent tool with `model: "sonnet"` and prompt from `./implementer-prompt.md`
- If subagent asks questions → answer → let subagent continue
- Wait for subagent to report back (implementation + self-review + commit)

**Step 2: Gate 1 — Compilation check (controller runs directly)**
- Run build command: `mvn compile -q -pl <modules>` (or equivalent)
- MUST see exit code 0
- Failure → dispatch implementer subagent to fix → re-compile

<STOP-CHECK>
STOP. Compilation passed, but you are NOT done. You have completed 1 of 3 gates.
If you are about to update plan.md or move to the next task, YOU ARE SKIPPING 2 GATES.
You MUST now proceed to Step 3 (spec review).
</STOP-CHECK>

**Step 3: Gate 2 — Dispatch spec reviewer subagent**
- Use Agent tool with `model: "sonnet"` and prompt from `./spec-reviewer-prompt.md`
- Controller reviewing code itself does NOT count — you MUST dispatch a subagent
- Wait for subagent verdict
- If ❌ → dispatch implementer subagent to fix → re-dispatch spec reviewer
- If ✅ → proceed to Step 4

**Step 4: Gate 3 — Dispatch code quality reviewer subagent**
- Use Agent tool with `model: "sonnet"` and prompt from `./code-quality-reviewer-prompt.md`
- Only after Gate 2 passes
- Controller reviewing code itself does NOT count — you MUST dispatch a subagent
- Wait for subagent verdict
- If ❌ → dispatch implementer subagent to fix → re-dispatch code quality reviewer
- If ✅ → proceed to Step 5

**Step 5: Output Gate Evidence Block**
- Output the Gate Evidence Block (see format below)
- ALL 4 rows must show ✅ and "subagent dispatched: yes" (except Compilation which has no subagent)
- If ANY row is missing or shows ❌ → go back and fix it before proceeding

**Step 6: Mark task complete**
- Only after Step 5 is output with all gates ✅
- Update plan.md task status → ✅
- Update index.md progress
- Proceed to next task (back to Step 1)

### After All Tasks

1. Dispatch final code reviewer subagent for entire implementation
2. Use `superpowers:finishing-a-development-branch`

## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent

## Subagent Model Policy

Controller (you) runs on the user's chosen model (typically Opus). Subagents use **Sonnet** by default for cost efficiency:

| Subagent | Model | Agent tool `model` param |
|----------|-------|--------------------------|
| Implementer | sonnet | `model: "sonnet"` |
| Spec reviewer | sonnet | `model: "sonnet"` |
| Code quality reviewer | sonnet | `model: "sonnet"` |

**Dispatching时必须在 Agent 工具调用中显式传 `model: "sonnet"` 参数。** 不传则子 agent 继承 controller 的模型（Opus），浪费成本。

如果用户明确要求子 agent 用其他模型（如 `opus`），按用户指定执行。

## Hard Gates (Non-Negotiable)

These 3 gates are sequential. Each MUST pass before proceeding to the next. **Skipping ANY gate = process failure.**

**Self-check: Count your Agent tool calls per task. Correct count = 3 minimum (1 implementer + 1 spec reviewer + 1 code quality reviewer). If you only dispatched 1 subagent + 1 compile, you skipped 2 gates.**

### Gate 1: Compilation
- Controller runs build command directly (no subagent needed)
- MUST see actual build output with exit 0
- Failure → dispatch implementer subagent to fix → re-compile

### Gate 2: Spec Compliance (MUST dispatch subagent)
- Use Agent tool: `model: "sonnet"`, prompt from `./spec-reviewer-prompt.md`
- Controller reviewing code itself does NOT satisfy this gate
- Subagent must independently read code and verify against design docs
- Failure → implementer subagent fixes → re-dispatch spec reviewer

### Gate 3: Code Quality (MUST dispatch subagent)
- Use Agent tool: `model: "sonnet"`, prompt from `./code-quality-reviewer-prompt.md`
- Only after Gate 2 passes
- Controller reviewing code itself does NOT satisfy this gate
- Failure → implementer subagent fixes → re-dispatch code quality reviewer

### Gate Evidence Block (Hard Gate — blocks task completion)

**You CANNOT mark a task complete without outputting this block first.** If you are about to update plan.md without this block, STOP — you are skipping gates.

```
### Task N Gate Evidence
| Gate | Status | Model | Evidence |
|------|--------|-------|----------|
| Implementation | ✅/❌ | sonnet | subagent dispatched: [yes/no], report: [summary] |
| Compilation | ✅/❌ | — | command: [cmd], exit code: [0/non-zero] |
| Spec Review | ✅/❌ | sonnet | subagent dispatched: [yes/no], verdict: [pass/fail + issues] |
| Code Quality | ✅/❌ | sonnet | subagent dispatched: [yes/no], verdict: [pass/fail + issues] |

All gates ✅ → Task N COMPLETE
Any gate ❌ → Task N remains IN PROGRESS
```

**Validation rules:**
- Any row with "subagent dispatched: no" = gate NOT satisfied, regardless of any other claim
- If Spec Review or Code Quality row is missing = task NOT complete
- Model column must reflect the actual `model` parameter passed to the Agent tool

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read index.md: docs/plans/<task>/index.md]
[Read first page plan: docs/plans/<task>/shared-plan.md or <page>/plan.md]
[Extract all tasks from current page plan with full text and context]
[Create TodoWrite with current page tasks]

Task 1: Hook installation script

[Get Task 1 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "User level (~/.config/superpowers/hooks/)"

Implementer: "Got it. Implementing now..."
[Later] Implementer:
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Self-review: Found I missed --force flag, added it
  - Committed

[Run compilation check - controller runs build command directly]
Compilation: ✅ Build successful

[Dispatch spec compliance reviewer]
Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

[Get git SHAs, dispatch code quality reviewer]
Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.

### Task 1 Gate Evidence
| Gate | Status | Model | Evidence |
|------|--------|-------|----------|
| Implementation | ✅ | sonnet | subagent dispatched: yes, report: Implemented install-hook command, 5/5 tests passing |
| Compilation | ✅ | — | command: `npm run build`, exit code: 0 |
| Spec Review | ✅ | sonnet | subagent dispatched: yes, verdict: pass - all requirements met |
| Code Quality | ✅ | sonnet | subagent dispatched: yes, verdict: pass - clean code, good tests |

All gates ✅ → Task 1 COMPLETE

[Mark Task 1 complete]

Task 2: Recovery modes

[Get Task 2 text and context (already extracted)]
[Dispatch implementation subagent with full task text + context]

Implementer: [No questions, proceeds]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Self-review: All good
  - Committed

[Run compilation check]
Compilation: ✅ Build successful

[Dispatch spec compliance reviewer]
Spec reviewer: ❌ Issues:
  - D1 (Requirements): Missing progress reporting (spec says "report every 100 items")
  - D1 (Requirements): Extra - Added --json flag (not requested)

[Implementer fixes issues]
Implementer: Removed --json flag, added progress reporting

[Spec reviewer reviews again]
Spec reviewer: ✅ Spec compliant now

[Dispatch code quality reviewer]
Code reviewer: Strengths: Solid. Issues (Important): Magic number (100)

[Implementer fixes]
Implementer: Extracted PROGRESS_INTERVAL constant

[Code reviewer reviews again]
Code reviewer: ✅ Approved

[Mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```

## Advantages

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Parallel-safe (subagents don't interfere)
- Subagent can ask questions (before AND during work)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Efficiency gains:**
- No file reading overhead (controller provides full text)
- Controller curates exactly what context is needed
- Subagent gets complete information upfront
- Questions surfaced before work begins (not after)

**Quality gates:**
- Self-review catches issues before handoff
- Compilation gate: code must compile before any review (hard gate, no subagent)
- Two-stage review: spec compliance, then code quality
- Spec compliance checks: business logic vs detailed design, backend↔frontend params, SQL↔backend fields
- Review loops ensure fixes actually work
- Spec compliance prevents over/under-building
- Code quality ensures implementation is well-built

**Cost:**
- More subagent invocations (implementer + 2 reviewers per task)
- Controller does more prep work (extracting all tasks upfront)
- Review loops add iterations
- But catches issues early (cheaper than debugging later)

## Red Flags

**Never:**
- **Write implementation code as controller** (you are the orchestrator, not the implementer — dispatch a subagent)
- **Mark a task complete without outputting the Gate Evidence Block** (no evidence block = not complete)
- Start implementation on main/master branch without explicit user consent
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (spec reviewer found issues = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- **Start code quality review before spec compliance is ✅** (wrong order)
- **Start spec compliance review before compilation passes** (wrong order)
- Move to next task while either review has open issues

**If subagent asks questions:**
- Answer clearly and completely
- Provide additional context if needed
- Don't rush them into implementation

**If reviewer finds issues:**
- Implementer (same subagent) fixes them
- Reviewer reviews again
- Repeat until approved
- Don't skip the re-review

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

### Known Failure Modes (from real incidents)

**Failure Mode 1: Controller becomes implementer**
The controller read existing code, fixed compilation errors, wrote new files, compiled successfully, and declared all tasks complete. NO subagents were dispatched — not for implementation, not for spec review, not for code quality review. The controller did everything itself and skipped all review gates.

How to detect: If you're writing implementation code (not build commands), you've become the implementer. STOP and dispatch a subagent instead.

**Failure Mode 2: Compilation-only quality gate (MOST COMMON)**
The per-task loop was: `Agent(implementer) → Bash(compile) → update plan.md → next task`. The controller dispatched implementer subagents and ran compilation checks, but NEVER dispatched spec reviewer or code quality reviewer subagents. Compilation only proves syntax — it says nothing about business logic or code quality. Result: 16 tasks "completed" with zero reviews, final verification found compilation errors the task-level checks missed.

How to detect: **Count your Agent tool calls per task.** If you only called Agent once (implementer) + Bash once (compile) + Edit (update status), you skipped 2 gates. Correct minimum = 3 Agent calls per task (implementer + spec reviewer + code quality reviewer).

**Failure Mode 3: No plan status updates**
The controller completed work but never updated `plan.md` task status table or `index.md` progress table. There's no record of what was done.

How to detect: After completing a task, if you haven't written to plan.md and index.md, the task tracking is broken.

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:requesting-code-review** - Code review template for reviewer subagents
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
- **superpowers:verification-before-completion** - REQUIRED: Evidence before any completion claims. Applies to each gate.

**Subagents should use:**
- **superpowers:test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **superpowers:executing-plans** - Use for parallel session instead of same-session execution
