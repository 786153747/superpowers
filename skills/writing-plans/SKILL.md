---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

## Prerequisites (HARD-GATE)

Before writing any plan, you MUST verify prerequisite documents exist. Use Glob to check:

1. **If a PRD / requirement doc was provided in this session:**
   - Check: `docs/plans/*-diff.md`
   - If missing: STOP. Output "❌ 缺少差异扫描文档。请先完成 brainstorming 中的 PRD 差异扫描步骤，生成 `docs/plans/*-diff.md` 后再来。" Do NOT proceed.

2. **Read the diff document and determine scope before checking design docs:**
   - Frontend is in scope when the diff or session mentions UI projects, page paths, page interactions, or frontend gaps/blockers.
   - Backend is in scope when the diff or session mentions APIs, controllers/services/mappers, database work, SAP/mock integration, or backend gaps/blockers.

3. **Required design documents:**
   - Frontend in scope → require `docs/plans/*-frontend-detail-design.md` or a general `docs/plans/*-design.md` that explicitly covers frontend.
   - Backend in scope → require `docs/plans/*-backend-detail-design.md` or a general `docs/plans/*-design.md` that explicitly covers backend.
   - If both frontend and backend are in scope, both sides must be covered before planning. A single backend design doc is NOT enough.

4. **If any required design document is missing:**
   - STOP. Output a precise missing-doc message and do NOT proceed.
   - If frontend is missing, tell the user to finish brainstorming and generate `docs/plans/*-frontend-detail-design.md`.
   - If backend is missing, tell the user to finish brainstorming and generate `docs/plans/*-backend-detail-design.md`.

If all required checks pass, read the design document(s) and diff document to use as input for the plan.

Never treat a generic `继续` as approval to bypass the design gate. In normal interactive mode, planning starts only after the saved design docs have been explicitly approved.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans
