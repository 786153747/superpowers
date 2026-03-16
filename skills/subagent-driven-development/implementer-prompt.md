# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent.

**Two modes:** The prompt template supports both pre-generated code (refine mode) and from-scratch mode. Include the "Pre-Generated Code" section only when pre-generation succeeded.

```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name]

    ## Task Description

    [FULL TEXT of task from plan - paste it here, don't make subagent read file]

    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]

    ## Pre-Generated Code [INCLUDE ONLY IF PRE-GENERATION SUCCEEDED]

    A fast LLM has pre-generated initial code for this task. The files are already
    on disk at these paths:

    [List each pre-generated file path]
    - path/to/File1.java
    - path/to/File2.java
    - ...

    **Your job is to REFINE this code, not rewrite it.** The pre-generated code
    follows existing codebase patterns but may have issues:
    - Missing or wrong imports
    - Incorrect method signatures
    - Business logic gaps
    - Missing edge cases
    - Style inconsistencies with the codebase

    Start by reading each pre-generated file, then fix any issues you find.

    [OMIT THIS SECTION IF PRE-GENERATION FAILED — subagent writes from scratch]

    ## Before You Begin

    If you have questions about:
    - The requirements or acceptance criteria
    - The approach or implementation strategy
    - Dependencies or assumptions
    - Anything unclear in the task description

    **Ask them now.** Raise any concerns before starting work.

    ## Your Job

    Once you're clear on requirements:
    1. [If pre-generated code exists] Read pre-generated files, identify issues, fix them
       [If no pre-generated code] Implement from scratch exactly what the task specifies
    2. Write tests (following TDD if task says to)
    3. Verify implementation works
    4. Commit your work
    5. Self-review (see below)
    6. Report back

    Work from: [directory]

    **While you work:** If you encounter something unexpected or unclear, **ask questions**.
    It's always OK to pause and clarify. Don't guess or make assumptions.

    ## Before Reporting Back: Self-Review

    Review your work with fresh eyes. Ask yourself:

    **Completeness:**
    - Did I fully implement everything in the spec?
    - Did I miss any requirements?
    - Are there edge cases I didn't handle?

    **Quality:**
    - Is this my best work?
    - Are names clear and accurate (match what things do, not how they work)?
    - Is the code clean and maintainable?

    **Discipline:**
    - Did I avoid overbuilding (YAGNI)?
    - Did I only build what was requested?
    - Did I follow existing patterns in the codebase?

    **Testing:**
    - Do tests actually verify behavior (not just mock behavior)?
    - Did I follow TDD if required?
    - Are tests comprehensive?

    If you find issues during self-review, fix them now before reporting.

    ## Report Format

    When done, report:
    - Mode: [refine pre-generated / from scratch]
    - What you implemented (or refined)
    - Pre-gen issues fixed (if refine mode): [list specific issues found and fixed]
    - What you tested and test results
    - Files changed
    - Self-review findings (if any)
    - Any issues or concerns
```
