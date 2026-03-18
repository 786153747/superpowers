---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task. Compilation and review are **deferred** to after all tasks complete (CLAUDE.md Rule 5/6).

**Core principle:** Fresh subagent per task (fast implementation) + deferred compilation (Rule 5) + deferred review (Rule 6) = high quality, fast iteration

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
- Faster iteration (no human-in-loop between tasks)

## Controller Role Boundaries

CRITICAL: The controller (you) is an orchestrator, NOT an implementer.

### Controller MUST:
- Read plan, extract tasks, create TodoWrite
- Dispatch implementer subagent per task (via Agent tool)
- Answer subagent questions
- Update plan.md task status and index.md progress after each task
- After ALL tasks: run compilation, dispatch reviewers, output final gate evidence

### Controller MUST NOT:
- Write implementation code (that's the implementer subagent's job)
- Run compilation between tasks (CLAUDE.md Rule 5: defer until all tasks done)
- Dispatch reviewers between tasks (CLAUDE.md Rule 6: defer until compilation passes)
- Mark the feature as complete without passing all final gates

If you catch yourself writing implementation code instead of dispatching a subagent, STOP. You are violating the controller role boundary.

## The Process (Two Phases)

```dot
digraph process {
    rankdir=TB;

    subgraph cluster_phase1 {
        label="Phase 1: Implementation (per task — NO compilation, NO review)";
        style=dashed;
        "Dispatch implementer subagent (./implementer-prompt.md)" [shape=box];
        "Implementer asks questions?" [shape=diamond];
        "Answer questions" [shape=box];
        "Implementer implements + self-reviews" [shape=box];
        "Mark task complete, update plan.md + index.md" [shape=box];
        "More tasks?" [shape=diamond];
    }

    subgraph cluster_phase2 {
        label="Phase 2: Verification (ONCE after all tasks)";
        style=dashed;
        "Backend: mvn compile" [shape=box style=filled fillcolor=lightyellow];
        "Backend passes?" [shape=diamond];
        "Fix subagent fixes backend" [shape=box];
        "Frontend: npm run build" [shape=box style=filled fillcolor=lightyellow];
        "Frontend passes?" [shape=diamond];
        "Fix subagent fixes frontend" [shape=box];
        "Dispatch spec reviewer (./spec-reviewer-prompt.md)" [shape=box];
        "Spec passes?" [shape=diamond];
        "Fix subagent fixes spec gaps" [shape=box];
        "Ask user: run spec review?" [shape=diamond style=filled fillcolor=lightblue];
        "Ask user: run quality review?" [shape=diamond style=filled fillcolor=lightblue];
        "Dispatch quality reviewer (./code-quality-reviewer-prompt.md)" [shape=box];
        "Quality passes?" [shape=diamond];
        "Fix subagent fixes quality" [shape=box];
        "Coding standards feedback?" [shape=diamond style=filled fillcolor=lightblue];
        "Present to user + update spec docs" [shape=box style=filled fillcolor=lightblue];
        "Ask user: run E2E tests?" [shape=diamond style=filled fillcolor=lightblue];
        "Generate e2e-test-cases.md" [shape=box];
        "User confirms test cases?" [shape=diamond];
        "Dispatch E2E generator (./e2e-generator-prompt.md)" [shape=box];
        "E2E passes?" [shape=diamond];
        "Fix E2E test code" [shape=box];
        "Output final gate evidence" [shape=box];
    }

    "Read plan, extract tasks, create TodoWrite" [shape=box];
    "Use superpowers:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Read plan, extract tasks, create TodoWrite" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Dispatch implementer subagent (./implementer-prompt.md)" -> "Implementer asks questions?";
    "Implementer asks questions?" -> "Answer questions" [label="yes"];
    "Answer questions" -> "Dispatch implementer subagent (./implementer-prompt.md)";
    "Implementer asks questions?" -> "Implementer implements + self-reviews" [label="no"];
    "Implementer implements + self-reviews" -> "Mark task complete, update plan.md + index.md";
    "Mark task complete, update plan.md + index.md" -> "More tasks?";
    "More tasks?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
    "More tasks?" -> "Backend: mvn compile" [label="no — enter Phase 2"];

    "Backend: mvn compile" -> "Backend passes?";
    "Backend passes?" -> "Fix subagent fixes backend" [label="no"];
    "Fix subagent fixes backend" -> "Backend: mvn compile";
    "Backend passes?" -> "Frontend: npm run build" [label="yes"];
    "Frontend: npm run build" -> "Frontend passes?";
    "Frontend passes?" -> "Fix subagent fixes frontend" [label="no"];
    "Fix subagent fixes frontend" -> "Frontend: npm run build";
    "Frontend passes?" -> "Ask user: run spec review?" [label="yes"];
    "Ask user: run spec review?" -> "Dispatch spec reviewer (./spec-reviewer-prompt.md)" [label="yes (default)"];
    "Ask user: run spec review?" -> "Ask user: run quality review?" [label="skip"];
    "Dispatch spec reviewer (./spec-reviewer-prompt.md)" -> "Spec passes?";
    "Spec passes?" -> "Fix subagent fixes spec gaps" [label="no"];
    "Fix subagent fixes spec gaps" -> "Dispatch spec reviewer (./spec-reviewer-prompt.md)";
    "Spec passes?" -> "Ask user: run quality review?" [label="yes"];
    "Ask user: run quality review?" -> "Dispatch quality reviewer (./code-quality-reviewer-prompt.md)" [label="yes (default)"];
    "Ask user: run quality review?" -> "Coding standards feedback?" [label="skip"];
    "Dispatch quality reviewer (./code-quality-reviewer-prompt.md)" -> "Quality passes?";
    "Quality passes?" -> "Fix subagent fixes quality" [label="no"];
    "Fix subagent fixes quality" -> "Dispatch quality reviewer (./code-quality-reviewer-prompt.md)";
    "Quality passes?" -> "Coding standards feedback?" [label="yes"];
    "Coding standards feedback?" -> "Present to user + update spec docs" [label="yes — conventions found"];
    "Present to user + update spec docs" -> "Ask user: run E2E tests?";
    "Coding standards feedback?" -> "Ask user: run E2E tests?" [label="no — skip"];
    "Ask user: run E2E tests?" -> "Generate e2e-test-cases.md" [label="yes (default)"];
    "Ask user: run E2E tests?" -> "Output final gate evidence" [label="skip"];
    "Generate e2e-test-cases.md" -> "User confirms test cases?";
    "User confirms test cases?" -> "Generate e2e-test-cases.md" [label="revise"];
    "User confirms test cases?" -> "Dispatch E2E generator (./e2e-generator-prompt.md)" [label="confirmed"];
    "Dispatch E2E generator (./e2e-generator-prompt.md)" -> "E2E passes?";
    "E2E passes?" -> "Fix E2E test code" [label="no — test issue"];
    "Fix E2E test code" -> "Dispatch E2E generator (./e2e-generator-prompt.md)";
    "E2E passes?" -> "Output final gate evidence" [label="yes"];
    "Output final gate evidence" -> "Use superpowers:finishing-a-development-branch";
}
```

## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent (Phase 2 only)
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent (Phase 2 only)
- `./e2e-test-cases-template.md` - Controller generates e2e-test-cases.md per page (Gate 6 Step 1)
- `./e2e-generator-prompt.md` - Dispatch E2E test generator subagent (Gate 6 Step 2)

---

## Phase 1: Implementation

### Per-task flow

For each task in the plan:

1. **Dispatch implementer subagent** with full task text + context (paste task, don't make subagent read plan file)
2. **Answer questions** if implementer asks (before implementation begins)
3. **Implementer completes**: implements code, self-reviews, reports back
4. **Mark task complete**: update plan.md task status, update index.md progress
5. **Move to next task** — do NOT compile or review

### What controller does NOT do in Phase 1

- ❌ Run `mvn compile` or `npm run build` (Rule 5: defer)
- ❌ Dispatch spec reviewer or code quality reviewer (Rule 6: defer)
- ❌ Output gate evidence blocks per task
- ❌ Wait for human review between tasks

### Status updates after each task

1. Update `<page>/plan.md` 任务状态 table: set status to `已完成`
2. Update `index.md` 执行进度 table: increment `已完成` count
3. On first task of a page: update `index.md` page `实施状态` to `进行中`
4. When all tasks of a page complete: update `index.md` page `实施状态` to `已完成`

---

## Phase 2: Verification (after ALL tasks complete)

**Entry condition:** All tasks in all page plans are marked `已完成`.

### Gate 1: Backend Compilation

- Controller runs `mvn compile` directly (no subagent)
- MUST see actual build output with exit 0
- Failure → dispatch fix subagent → re-compile → loop until pass

### Gate 2: Frontend Compilation

- Controller runs `npm run build` in frontend directory
- MUST see actual build output with exit 0
- Failure → dispatch fix subagent → re-build → loop until pass

### Gate 3: Spec Compliance (可选，默认执行)

- 编译通过后，**询问用户**：「是否执行 Spec Compliance 审查？（默认执行，输入"跳过"则跳过）」
- 用户明确说"跳过"/"不执行"/"skip" 才跳过，其他任何回复（包括无回复、回车、"好"、"执行"等）均视为执行
- 执行时：dispatch spec-reviewer subagent via Agent tool
- Reviewer covers the **entire implementation** (all tasks, all pages), not just one task
- Controller reviewing code itself does NOT satisfy this gate
- Use `./spec-reviewer-prompt.md` template
- Failure → dispatch fix subagent → re-dispatch spec reviewer → loop until pass
- 跳过时：Final Gate Evidence 中标记为 ⏭️ Skipped

### Gate 4: Code Quality (可选，默认执行)

- Gate 3 完成或跳过后，**询问用户**：「是否执行 Code Quality 审查？（默认执行，输入"跳过"则跳过）」
- 用户明确说"跳过"/"不执行"/"skip" 才跳过，其他任何回复均视为执行
- 执行时：dispatch code-quality-reviewer subagent via Agent tool
- Reviewer covers the **entire implementation**
- Controller reviewing code itself does NOT satisfy this gate
- Use `./code-quality-reviewer-prompt.md` template
- Failure → dispatch fix subagent → re-dispatch quality reviewer → loop until pass
- 跳过时：Final Gate Evidence 中标记为 ⏭️ Skipped

### Gate 5: Coding Standards Feedback

After Gate 4 passes or is skipped, review all issues found during Gates 3-4 (if executed) and check if any relate to coding conventions/patterns that should be captured in the coding standards docs. If both Gate 3 and Gate 4 were skipped, skip Gate 5 silently.

**Controller does this directly (no subagent):**

1. Collect all issues found by spec reviewer (Gate 3) and code quality reviewer (Gate 4), including fixed ones
2. Filter for issues that represent **recurring patterns or conventions** (not one-off bugs), for example:
   - Naming inconsistencies (e.g., method should be `selectXxxList` not `getXxxList`)
   - Missing standard annotations or patterns
   - Code structure deviations from project conventions
   - Frontend/backend API calling pattern issues
3. If such issues exist, present them to the user:

```
### Coding Standards Feedback

The following issues from code review may indicate missing or unclear coding standards:

1. [Issue description] — suggested addition to [backend/frontend] coding standards
2. ...

Would you like to update the coding standards doc (`@spec/CODING_STANDARDS.md`) with these conventions?
```

4. Wait for user confirmation
5. If approved, update `@spec/CODING_STANDARDS.md`
6. If no convention-related issues found, skip this gate silently

### Gate 6: E2E Tests (可选，默认执行)

- Gate 5 完成或跳过后，**询问用户三个问题**：
  1. 「是否生成并运行 E2E 测试？（默认执行，输入"跳过"则跳过）」
  2. 如果执行：「使用哪种语言？TypeScript / Python（默认 TypeScript）」
  3. 如果执行：「使用有头模式还是无头模式？headed / headless（默认 headless）」
- 用户明确说"跳过"/"不执行"/"skip" 才跳过，其他任何回复均视为执行
- 用户选择语言后，将 `{E2E_LANGUAGE}` 设为 `typescript` 或 `python` 传给 subagent
- 用户选择模式后，将 `{E2E_HEADED}` 设为 `true` 或 `false` 传给 subagent
- **此 Gate 独立于 Gate 3/4/5**，即使前面的 Gate 全部跳过，仍然要询问用户

**执行分两步：**

**Step 1: 生成测试用例文档**
- Controller 读取每个页面的 `frontend-detail-design.md`，提取测试场景
- 按 `./e2e-test-cases-template.md` 模板生成 `e2e-test-cases.md` 到对应页面的计划目录：`docs/plans/<task>/<page-slug>/e2e-test-cases.md`
- 文档按 P0/P1/P2 分级，每个用例包含：用例编号、场景描述、前置条件、操作步骤、预期结果
- 文档末尾包含「脚本映射表」（此时留空，Step 2 完成后回填）
- 生成后**展示给用户确认**，用户可增删改用例
- 用户确认后进入 Step 2

**Step 2: 生成测试代码并运行**
- Dispatch e2e-generator subagent via Agent tool
- Use `./e2e-generator-prompt.md` template
- 提供：`e2e-test-cases.md` 路径、前端详细设计路径、前端目录、语言、浏览器模式
- subagent 根据 `e2e-test-cases.md`（而非自行推断场景）生成 Playwright 测试代码 → 运行测试 → 报告结果
- **脚本中所有注释必须使用中文**，每个测试函数上方写清楚对应用例编号和验证目标
- 如果测试因 app 行为问题失败：报告为潜在产品问题，不自动修复 app 代码
- 如果测试因选择器/时序失败：subagent 修复测试代码并重跑

**Step 2 完成后，controller 必须：**
1. 用 subagent 返回的脚本映射数据**回填**每个页面 `e2e-test-cases.md` 末尾的「脚本映射表」（用例编号 → 脚本文件 → 测试方法 → 通过/失败）
2. **更新 `index.md`**：
   - 执行追踪表新增 `e2e-tests` 行，备注填写总用例数和通过数
   - 页面清单表新增 `E2E 用例` 列，填入每个页面的用例数量

- 跳过时：Final Gate Evidence 中标记为 ⏭️ Skipped

### Final Gate Evidence Block (Mandatory)

After all gates pass, output this block once:

```
### Final Gate Evidence
| Gate | Status | Evidence |
|------|--------|----------|
| Backend Compilation | ✅/❌ | command: `mvn compile`, exit code: [0/non-zero] |
| Frontend Compilation | ✅/❌ | command: `npm run build`, exit code: [0/non-zero] |
| Spec Review | ✅/❌/⏭️ | subagent dispatched: yes/skipped, verdict: [pass/fail/skipped] |
| Code Quality | ✅/❌/⏭️ | subagent dispatched: yes/skipped, verdict: [pass/fail/skipped] |
| Coding Standards Feedback | ✅/⏭️ | [N conventions proposed / no conventions to add / skipped] |
| E2E Tests | ✅/❌/⏭️ | lang: [ts/py], N specs generated, M passed / skipped |

All gates ✅ → Implementation COMPLETE
Any gate ❌ → Fix and re-verify
```

---

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read index.md → find execution order]
[Read first page plan → extract all tasks with full text]
[Create TodoWrite]

--- Phase 1: Implementation ---

Task 1: Database tables
[Dispatch implementer subagent with full task text]
Implementer: Implemented, self-review done.
[Update plan.md: Task 1 已完成, update index.md]

Task 2: Order list API (full vertical slice)
[Dispatch implementer subagent with full task text]
Implementer: "Should the date range be inclusive or exclusive?"
You: "Inclusive on both ends."
Implementer: Implemented, self-review done.
[Update plan.md: Task 2 已完成, update index.md]

... (continue for all tasks) ...

Task N: Frontend diff fixes
[Dispatch implementer subagent]
Implementer: Done.
[Update plan.md + index.md: all pages 已完成]

--- Phase 2: Verification ---

[mvn compile]
Backend compilation: ✅ BUILD SUCCESS

[npm run build]
Frontend compilation: ❌ TS error in orderLedger.vue
[Dispatch fix subagent → fix type error]
[npm run build again]
Frontend compilation: ✅ Build successful

[Ask user: run spec review?]
User: "好" → execute

[Dispatch spec reviewer for entire implementation]
Spec reviewer: ❌ Missing D3 (internalRelatedPartyName filter in delivery-record)
[Dispatch fix subagent → add missing filter]
[Dispatch spec reviewer again]
Spec reviewer: ✅ All requirements met

[Ask user: run quality review?]
User: "执行" → execute

[Dispatch code quality reviewer]
Code reviewer: ✅ Approved. Minor: consider extracting shared date formatter.

[Coding Standards Feedback]
Review found: date formatter pattern should use `@JsonFormat(pattern = "yyyy-MM-dd")`
→ Present to user: "Should we add this to coding-standards.md?"
→ User approves → Update spec/backend/java/coding-standards.md

[Ask user: run E2E tests?]
User: "好" → execute
[Ask user: TypeScript or Python?]
User: "TypeScript"
[Ask user: headed or headless?]
User: "headed"

[Step 1: Generate e2e-test-cases.md for each page]
→ my-order/e2e-test-cases.md: 8 test cases (4 P0, 3 P1, 1 P2)
→ delivery-record/e2e-test-cases.md: 6 test cases
→ Present to user for confirmation
User: "TC-05 加一个空列表场景" → revise → confirmed

[Step 2: Dispatch E2E generator with test cases + frontend detail design paths, lang=typescript, headed=true]
E2E generator: Generated 3 spec files, 12 tests. 11 passed, 1 failed (product issue: filter not applied).
→ Report product issue to user

### Final Gate Evidence
| Gate | Status | Evidence |
|------|--------|----------|
| Backend Compilation | ✅ | command: `mvn compile`, exit code: 0 |
| Frontend Compilation | ✅ | command: `npm run build`, exit code: 0 (1 fix loop) |
| Spec Review | ✅ | subagent dispatched: yes, verdict: pass (1 fix loop) |
| Code Quality | ✅ | subagent dispatched: yes, verdict: pass |
| Coding Standards | ✅ | 1 convention added to backend spec |
| E2E Tests | ✅ | lang: ts, 3 specs generated, 12 tests, 11 passed, 1 product issue reported |

All gates ✅ → Implementation COMPLETE

[Use superpowers:finishing-a-development-branch]
Done!
```

## Advantages

**vs. Per-task compilation + review (old approach):**
- N tasks: N subagents instead of 3N (implementer + spec + quality per task)
- 1 compilation instead of N compilations
- 1 spec review instead of N spec reviews
- ~3x faster for typical plans

**vs. Manual execution:**
- Fresh context per task (no confusion)
- Subagent can ask questions (before AND during work)

**vs. Executing Plans (parallel session):**
- Same session (no handoff)
- Continuous progress (no waiting for human between batches)

**Efficiency gains:**
- No file reading overhead (controller provides full text)
- Controller curates exactly what context is needed
- No compilation interrupts during coding flow
- Review covers entire implementation at once (better cross-task consistency checks)

**Quality gates (Phase 2):**
- Compilation gate: code must compile before any review
- Optional two-stage review: spec compliance, then code quality (both default to execute, skip only if user explicitly declines)
- When executed, spec compliance covers entire implementation (catches cross-task inconsistencies)
- Review loops ensure fixes actually work

## Red Flags

**Never:**
- **Write implementation code as controller** (dispatch a subagent)
- **Compile or review during Phase 1** (CLAUDE.md Rule 5/6: defer)
- Start implementation on main/master branch without explicit user consent
- Skip Phase 2 reviews without asking user (must ask, only skip if user explicitly declines)
- Proceed with unfixed issues in Phase 2
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)

**If reviewer finds issues in Phase 2:**
- Dispatch fix subagent with specific instructions
- Re-dispatch reviewer after fix
- Repeat until approved
- Don't skip the re-review
- Don't try to fix manually (context pollution)

### Known Failure Modes (from real incidents)

**Failure Mode 1: Controller becomes implementer**
The controller read existing code, fixed compilation errors, wrote new files, and declared all tasks complete. NO subagents were dispatched.

How to detect: If you're writing implementation code (not build commands), you've become the implementer. STOP and dispatch a subagent instead.

**Failure Mode 2: Per-task compilation/review (old pattern)**
The controller compiled and reviewed after every single task, making execution 3x slower than necessary.

How to detect: If you're running `mvn compile` or dispatching reviewers before all tasks are done, you're in the old pattern. STOP — continue to next task, defer to Phase 2.

**Failure Mode 3: No plan status updates**
The controller completed work but never updated `plan.md` task status table or `index.md` progress table.

How to detect: After completing a task, if you haven't written to plan.md and index.md, the task tracking is broken.

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:requesting-code-review** - Code review template for reviewer subagents
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
- **superpowers:verification-before-completion** - REQUIRED: Evidence before any completion claims

**Subagents should use:**
- **superpowers:test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **superpowers:executing-plans** - Use for parallel session instead of same-session execution
