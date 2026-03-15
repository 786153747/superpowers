---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** If a skill might apply (even partially), invoke it first. If it turns out to be wrong, you don't need to use it.

In Claude Code, use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

## Immediate Routing

**Do this before ANY tool call.** Routing rules are defined in CLAUDE.md §1. Key rules:

- User provides PRD / requirement doc + `docs/plans/*/diff.md` doesn't exist → **must invoke `prd-diff-scan` first**
- User provides PRD path or implementation directory → infer `prd-diff-scan` automatically
- "帮我出详细设计" → follow the full workflow: prd-diff-scan (if PRD) → brainstorming → save design using spec template

If the user also asks for design or implementation in the same message, routing still wins. Skipping routing = workflow failure.

## Skill Priority

When multiple skills could apply:

1. **Process skills first** (prd-diff-scan, brainstorming, debugging) — determine HOW to approach
2. **Implementation skills second** (executing-plans, subagent-driven-development) — guide execution

Quick reference:

| Signal | Skill |
|--------|-------|
| Has PRD / "差异分析" / "页面核对" | `prd-diff-scan` first |
| "Let's build X" + no PRD | `brainstorming` directly |
| "Fix this bug" | `systematic-debugging` first |
| "帮我出后端详细设计" | `brainstorming` (uses `spec/backend/java/detail-design-template.md`) |
| "帮我出前端详细设计" | `brainstorming` (uses `spec/frontend/vue/detail-design-template.md`) |
| "写计划" / "拆任务" | `writing-plans` — **但必须先有 design docs 和 index.md** |

**writing-plans 不是入口 skill。** 它只能在 brainstorming 产出设计文档之后使用。如果 `docs/plans/*/index.md` 不存在，不要选 writing-plans，应该先走 brainstorming。

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I'll just read the PRD first" | `prd-diff-scan` must be invoked before `Read`/`Glob`. |
| "I remember this skill" | Skills evolve. Read current version via Skill tool. |

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
