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

    ## Merge Context (仅 Copy/Overwrite/Merge 任务需要)

    [如果 Task 涉及原型文件合并，controller 必须提供：]
    - 原型目录: [PROJECT_ROOT 下的原型目录路径]
    - 旧 Commit SHA: [用于三方合并的旧基线，无则填"无"]
    - 当前 Commit SHA: [原型当前 HEAD]
    [无合并策略标注的纯后端 Task 可省略此节]

    ## Coding Standards

    Before writing any code, read and follow the project coding standards:
    - **代码规范**: `[DOC_ROOT]/spec/CODING_STANDARDS.md`（由 controller 传入的绝对路径）

    Read this spec file before starting. [DOC_ROOT] is the absolute path to the documentation root, provided by the controller.
    These are mandatory conventions — your implementation MUST conform to them.
    Treat `[DOC_ROOT]/spec/CODING_STANDARDS.md` as the ONLY source for project-wide技术栈、架构和代码规范.

    **以下规范全部从 CODING_STANDARDS.md 直接获取，禁止通过检索代码库推断**：
    - SQL 风格规范（命名、语法、格式）
    - MyBatis Mapper XML 规范（resultMap、SQL 片段、命名约定）
    - 若依 Entity 风格（字段注解、继承关系、命名规则）
    - Controller / Service / Mapper 分层约定
    - DTO / VO 命名与结构约定

    ### 禁止扫描代码库

    - Do NOT scan the repository (`src/`, `com/`, etc.) to infer conventions, coding patterns, or project structure
    - Do NOT read base classes, parent classes, or utility classes to "verify they exist" — trust the design doc and CODING_STANDARDS.md
    - Do NOT use Glob/Grep to explore project code for learning purposes
    - You may ONLY read the specific files listed in the task's "参考文件" and "创建/修改文件" sections
    - If CODING_STANDARDS.md says to extend `BaseEntity`, just extend it — don't go read `BaseEntity.java` first
    - If CODING_STANDARDS.md already defines Controller package layout, module structure, or entity location, use it directly rather than scanning existing Controllers or entities to confirm
    - If you're unsure about a convention, **ask the controller** rather than scanning code

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
    3. Do NOT run project-level compilation/build — compilation is deferred to Phase 2 after all tasks complete. Do not treat "编译无错误" or "无 import 错误" as your completion condition
    4. Do NOT commit — the controller handles commits after all tasks complete
    5. Report back

    Work from this exact directory only: [SOURCE_ROOT]
    Read design docs and spec from: [DOC_ROOT]
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
