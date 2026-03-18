---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Directory Selection Process

Follow this priority order:

### 1. Check Existing Directories

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory. If both exist, `.worktrees` wins.

### 2. Check CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no CLAUDE.md preference:

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

## Safety Verification

### For Project-Local Directories (.worktrees or worktrees)

**MUST verify directory is ignored before creating worktree:**

```bash
# Check if directory is ignored (respects local, global, and system gitignore)
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:**

Per Jesse's rule "Fix broken things immediately":
1. Add appropriate line to .gitignore
2. Commit the change
3. Proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to repository.

### For Global Directory (~/.config/superpowers/worktrees)

No .gitignore verification needed - outside project entirely.

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Worktree

```bash
# Determine full path
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# Create worktree with new branch
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. Run Project Setup (Optional — Skip for Java/Maven Projects)

Auto-detect and run appropriate setup **only if necessary**. For Java/Maven projects, worktree shares the same `.m2` repository cache — skip this step. For frontend projects, `node_modules` is usually gitignored and won't be in the worktree, but `npm install` should be deferred to when it's actually needed (e.g., before `npm run build` in Phase 2).

```bash
# Only run if the project requires local dependency installation AND
# the dependency directory is missing in the worktree:

# Node.js — only if node_modules is missing and needed now
if [ -f package.json ] && [ ! -d node_modules ]; then npm install; fi

# Other ecosystems — skip unless user requests
```

### 4. Verify Clean Baseline (Optional — Skip by Default)

Running the full test suite on an unmodified worktree is low-value: the code hasn't changed yet. **Skip by default.** Only run baseline tests if:
- The user explicitly requests it
- The base branch is suspected to be broken

```bash
# Only if explicitly requested:
# npm test / cargo test / pytest / go test ./...
```

**Default behavior:** Skip directly to Step 5 (Report Location).

### 5. Report Location

```
Worktree ready at <full-path>
Ready to implement <feature-name>
```

## Path Handoff Contract

After creating the worktree, downstream execution skills must receive and preserve the exact absolute worktree path.

- Record the worktree absolute path as `SOURCE_ROOT`
- If plan/status documents remain in the original checkout, record that path separately as `DOC_ROOT`
- All subsequent source edits, subagent work, and verification commands must use `SOURCE_ROOT`
- Do not silently fall back to the main repository root once a worktree has been selected

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check CLAUDE.md → Ask user |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > CLAUDE.md > ask

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

### Losing worktree path context

- **Problem:** Docs get updated in one checkout while code changes land in another
- **Fix:** Hand off the exact absolute `SOURCE_ROOT` to downstream skills and keep using it consistently

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Check .worktrees/ - exists]
[Verify ignored - git check-ignore confirms .worktrees/ is ignored]
[Create worktree: git worktree add .worktrees/auth -b feature/auth]
[Run npm install]
[Run npm test - 47 passing]

Worktree ready at /Users/jesse/myproject/.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## Red Flags

**Never:**
- Create worktree without verifying it's ignored (project-local)
- Proceed with failing tests without asking (if tests were run)
- Assume directory location when ambiguous
- Skip CLAUDE.md check
- Lose the selected worktree path after creation

**Always:**
- Follow directory priority: existing > CLAUDE.md > ask
- Verify directory is ignored for project-local
- Auto-detect project type; only run setup when needed (skip for Java/Maven)
- Skip baseline tests by default; only run if user requests or branch suspected broken
- Pass the exact absolute worktree path to downstream execution skills

## Integration

**Called by:**
- **subagent-driven-development** - REQUIRED before executing any tasks
- **executing-plans** - REQUIRED before executing any tasks
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-a-development-branch** - REQUIRED for cleanup after work complete

---

## 强制调用规则（CLAUDE.md Section 8）

### 必须调用此 skill 的场景

| 场景 | 说明 |
|------|------|
| 执行 `executing-plans` 前 | 执行任何实施计划前必须创建隔离工作区 |
| 执行 `subagent-driven-development` 前 | 子代理执行任务前必须创建隔离工作区 |
| 修改源码前 | 任何功能开发、bug 修复涉及源码修改 |
| CLAUDE.md 合规检查 | `using-superpowers` 检查清单第 1 项 |

### 例外情况（可跳过）

- **仅文档修改** - 修改 `docs/plans/` 下的设计文档、计划文档
- **用户明确豁免** - 用户明确说明不需要 git 隔离

### 违反后果

违反强制调用规则 = 流程失败，必须：
1. 回退相关代码修改
2. 重新执行完整流程（包括 worktree + subagent + 时间追踪）
