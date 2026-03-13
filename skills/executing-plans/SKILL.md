---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan (via index.md)

1. Read `index.md` from the task directory (use Glob `docs/plans/*/index.md` to locate it)
2. Check the **执行顺序** section to determine execution order
3. Find the first page with `实施状态 = 未开始` or `进行中`
4. Read that page's `plan.md` (e.g., `shared-plan.md` or `<page-slug>/plan.md`)
5. Review the plan critically - identify any questions or concerns
6. If concerns: Raise them with your human partner before starting
7. If no concerns: Create TodoWrite for the current page's tasks and proceed

### Step 2: Execute Batch
**Default: First 3 tasks of the current page**

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed
5. **Update status tracking** after each task:
   - Update the task's status in `<page>/plan.md`'s 任务状态 table (set to `已完成` + write completion time)
   - Update `index.md` 执行进度 table: increment the `已完成` count for this page
   - On first task of a page: update `index.md` page `实施状态` to `进行中`

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
  1. Update `<page>/plan.md` 任务状态 table — all tasks `已完成`
  2. Update `index.md` page `实施状态` to `已完成`
  3. Report: "✅ 页面 `<page-slug>` 已完成。"
  4. Check `index.md` for next incomplete page (following 执行顺序)
  5. If more pages remain → read next page's `plan.md`, create new TodoWrite, continue execution
  6. If all pages done → proceed to Step 5
- Repeat until all pages complete

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

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
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
