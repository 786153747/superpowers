# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Agent tool (general-purpose):
  description: "Review code quality for [feature/page name]"
  prompt: |
    You are reviewing code quality for a completed implementation.

    ## What Was Implemented

    [DESCRIPTION from implementer's report]

    ## Requirements/Plan

    [PLAN_OR_REQUIREMENTS: Full text of relevant tasks from plan]

    ## Working Directories

    Read implementation code from [SOURCE_ROOT] (the worktree directory).
    Read design docs and diff docs from [VERSION_DIR] (the exact current version directory).
    Read coding standards from [WORKSPACE_ROOT]/spec/CODING_STANDARDS.md.

    ## 文件读取范围（严格限制）

    你**只允许**读取以下文件，禁止扫描代码库：
    1. **git diff 涉及的文件**：在 `[SOURCE_ROOT]` 下执行 `git diff --name-only [BASE_SHA]..[HEAD_SHA]`
    2. **代码规范**：`[WORKSPACE_ROOT]/spec/CODING_STANDARDS.md`
    3. **设计文档**（如需对照）：`[VERSION_DIR]` 下的相关文件
    4. **差异决议文档**（如需对照）：`[VERSION_DIR]/diff.md`

    禁止：
    - 用 Glob/Grep 扫描 `src/`、`com/` 等目录
    - 读取 changed files 之外的代码
    - 读取基类、工具类、框架类 — 信任 CODING_STANDARDS.md
    - 在 `[WORKSPACE_ROOT]/docs/plans/` 下重新扫描其他 commit 版本目录

    ## Git Range to Review

    **Base:** [BASE_SHA]
    **Head:** [HEAD_SHA]

    ```bash
    cd [SOURCE_ROOT]
    git diff --stat [BASE_SHA]..[HEAD_SHA]
    git diff [BASE_SHA]..[HEAD_SHA]
    ```

    ## Review Checklist

    **Code Quality:**
    - Clean separation of concerns?
    - Proper error handling?
    - Type safety (if applicable)?
    - DRY principle followed?
    - Edge cases handled?

    **Architecture:**
    - Sound design decisions?
    - Performance implications?
    - Security concerns?

    **Requirements:**
    - All plan requirements met?
    - Implementation matches spec?
    - No scope creep?

    ## Output Format

    ### Strengths
    [What's well done? Be specific with file:line references.]

    ### Issues

    #### Critical (Must Fix)
    [Bugs, security issues, data loss risks, broken functionality]

    #### Important (Should Fix)
    [Architecture problems, missing features, poor error handling, test gaps]

    #### Minor (Nice to Have)
    [Code style, optimization opportunities]

    **For each issue:**
    - File:line reference
    - What's wrong
    - Why it matters
    - How to fix (if not obvious)

    ### Assessment

    **Ready to proceed?** [Yes/No/With fixes]
    **Reasoning:** [Technical assessment in 1-2 sentences]
```
