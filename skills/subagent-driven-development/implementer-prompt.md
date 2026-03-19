# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent.

```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name]

    ## Task Description

    [FULL TEXT of task from plan - paste it here, don't make subagent read file]

    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]

    ## Coding Standards

    Before writing any code, read and follow the project coding standards:
    - **代码规范**: `spec/CODING_STANDARDS.md`（相对于业务项目根目录，前后端统一规范文档）

    Read this spec file before starting implementation.
    These are mandatory conventions — your implementation MUST conform to them.
    Treat `spec/CODING_STANDARDS.md` as the ONLY source for project-wide技术栈、架构和代码规范.
    Do NOT scan the repository to infer conventions.
    You may read only the specific target files you need to modify, merge, or verify safely.

    ## Before You Begin

    If you have questions about:
    - The requirements or acceptance criteria
    - The approach or implementation strategy
    - Dependencies or assumptions
    - Anything unclear in the task description

    **Ask them now.** Raise any concerns before starting work.

    ## Your Job

    Once you're clear on requirements:
    1. Implement exactly what the task specifies
    2. Write tests (following TDD if task says to)
    3. Do not run project-level compilation/build in Phase 1 unless the task explicitly requires a lightweight local check or you are diagnosing a blocker
    4. Commit your work
    5. Report back

    Work from this exact directory only: [ABSOLUTE_WORKTREE_PATH]
    Do not write source files anywhere else.
    Do not fall back to the main repository root or another checkout.
    If you cannot access this exact directory, stop and report the problem immediately.

    **While you work:** If you encounter something unexpected or unclear, **ask questions**.
    It's always OK to pause and clarify. Don't guess or make assumptions.

    ## Report Format

    When done, report:
    - STATUS: COMPLETE or NOT COMPLETE
    - What you implemented
    - Exact working directory used
    - Files changed
    - Lightweight checks run during implementation, if any
    - Whether any command timed out or any blocker remains
    - Any issues or concerns

    If the task is not fully complete, report `STATUS: NOT COMPLETE` and include:
    - Remaining work
    - Blockers or unresolved questions
    - Partial files changed so far
```
