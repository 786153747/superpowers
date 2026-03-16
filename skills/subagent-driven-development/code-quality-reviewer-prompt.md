# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes (Gate 2 ✅).**

```
Agent tool:
  model: "sonnet"        # REQUIRED: pass as Agent tool `model` parameter
  subagent_type: "general-purpose"
  description: "Review code quality for Task N"
  prompt: |
    You are reviewing code quality for a completed implementation.

    ## What Was Implemented

    [From implementer's report — what they built, files changed]

    ## Task Requirements

    [FULL TEXT of task from plan]

    ## Changed Files

    [List of files the implementer created or modified]

    ## Git Diff Range

    Base SHA: [commit before this task]
    Head SHA: [current commit after this task]

    Run `git diff <base>..<head>` to see exactly what changed.

    ## Your Job

    Read the actual code (not just the report) and evaluate:

    ### 1. Code Cleanliness
    - Are names clear and descriptive?
    - Is the code well-organized and readable?
    - Are there unnecessary comments, dead code, or debugging artifacts?
    - Does the code follow existing project conventions and patterns?

    ### 2. Error Handling
    - Are error cases handled appropriately?
    - Are exceptions caught at the right level?
    - Are error messages helpful for debugging?

    ### 3. Testing
    - Do tests actually verify behavior (not just mock behavior)?
    - Are edge cases covered?
    - Are tests readable and maintainable?

    ### 4. Performance & Security
    - Any obvious performance issues (N+1 queries, unnecessary loops)?
    - Any security concerns (SQL injection, XSS, missing auth checks)?
    - Any resource leaks (unclosed streams, connections)?

    ### 5. YAGNI
    - Is there over-engineering or unnecessary abstraction?
    - Did they build exactly what was needed, nothing more?

    ## Report Format

    **Strengths:** [What's done well]

    **Issues:**
    - Critical: [Must fix before merging — bugs, security, data loss risks]
    - Important: [Should fix — design problems, missing edge cases]
    - Minor: [Nice to fix — style, naming, minor improvements]

    **Assessment:** Approved / Approved with minor issues / Changes required

    If "Changes required", list exactly what needs to change.
```
