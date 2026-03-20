# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent.

```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name]

    ## Task Description

    [TASK IMPLEMENTATION TEXT from plan - paste it here after removing any legacy `验证:` / `**验证**:` subsection; don't make subagent read file]

    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]

    ## Frontend Copy Mode (仅前端 Task + 用户选择了"复制原型"时提供)

    **FRONTEND_MODE: copy**

    本 Task 的前端文件采用复制原型模式。按以下步骤执行：

    1. 读取原型源文件（路径见下方映射表）
    2. 按嵌入的 CODING_STANDARDS 做最小适配：
       - import 路径前缀（如原型用 `@/` 而项目用 `@/modules/xxx/`）
       - API 调用方式（如 request 封装、前缀适配）
       - 组件注册方式
       - 路由配置
    3. 适配后写入目标路径
    4. **不要从设计文档重新生成代码** — 以原型文件为基础

    原型目录: [PROTOTYPE_DIR]
    文件映射:
    - [原型源路径] → [目标路径 under SOURCE_ROOT]
    - ...

    [如果用户选择了"根据设计文档生成"，此节整个省略，Task 按正常流程从设计文档生成代码]

    ## Merge Context (仅 Copy/Overwrite/Merge 任务需要)

    [如果 Task 涉及原型文件合并，controller 必须提供：]
    - 原型目录: [PROJECT_ROOT 下的原型目录路径]
    - 旧 Commit SHA: [用于三方合并的旧基线，无则填"无"]
    - 当前 Commit SHA: [原型当前 HEAD]
    [无合并策略标注的纯后端 Task 可省略此节]

    ## Coding Standards (由 controller 嵌入，无需自行读取)

    以下是项目代码规范的完整内容，直接遵照执行：

    ```
    [CONTROLLER 在此嵌入 spec/CODING_STANDARDS.md 的完整内容]
    ```

    This is the ONLY source for project-wide 技术栈、架构和代码规范.
    These are mandatory conventions — your implementation MUST conform to them.

    **以下规范全部从上述嵌入内容中获取，禁止通过检索代码库推断**：
    - SQL 风格规范（命名、语法、格式）
    - MyBatis Mapper XML 规范（resultMap、SQL 片段、命名约定）
    - 若依 Entity 风格（字段注解、继承关系、命名规则）
    - Controller / Service / Mapper 分层约定
    - DTO / VO 命名与结构约定

    ### 禁止扫描代码库

    - Do NOT scan the repository (`src/`, `com/`, etc.) to infer conventions, coding patterns, or project structure
    - Do NOT read base classes, parent classes, or utility classes to "verify they exist" — trust the design doc and the embedded CODING_STANDARDS
    - Do NOT use Glob/Grep to explore project code for learning purposes
    - Do NOT read directories (e.g., `domain/`, `mapper/`, `controller/`) to "了解风格" — the embedded CODING_STANDARDS is the sole style reference
    - You may ONLY read the specific files listed in the task's "参考文件" and "创建/修改文件" sections
    - If CODING_STANDARDS says to extend `BaseEntity`, just extend it — don't go read `BaseEntity.java` first
    - If CODING_STANDARDS already defines Controller package layout, module structure, or entity location, use it directly rather than scanning existing Controllers or entities to confirm
    - If you're unsure about a convention, **ask the controller** rather than scanning code

    ## Paths

    - Work from this exact directory only: [SOURCE_ROOT]
    - Read design docs from: [VERSION_DIR] (精确到 commit 版本目录的绝对路径)
    - Do not write source files anywhere else.
    - Do not fall back to the main repository root or another checkout.
    - If you cannot access this exact directory, stop and report the problem immediately.

    ## Before You Begin

    If you have questions about:
    - The requirements or acceptance criteria
    - The approach or implementation strategy
    - Dependencies or assumptions
    - Anything unclear in the task description

    **Ask them now.** Raise any concerns before starting work.

    ## ⛔ FORBIDDEN ACTIONS — VIOLATION = TASK FAILURE

    The following actions are ABSOLUTELY PROHIBITED. If you do any of these, your task is considered FAILED regardless of other output.

    1. **DO NOT COMPILE.** Never run `mvn`, `mvn compile`, `mvn package`, `gradle`, `npm run build`, `tsc`, or any compilation/build command. Compilation is handled in Phase 2 AFTER ALL tasks complete — not by you.
    2. **DO NOT treat "编译无错误" as a completion condition.** Your completion condition is: code files written correctly. Not "it compiles".
    3. **IGNORE any `验证:` or `**验证**:` section** in the Task text below. That section is controller-side noise that was not properly stripped. Do NOT execute any commands listed there. Mention it in your report.
    4. **IGNORE any compile/build instructions** in the Task text. If the Task says "mvn compile 无编译错误" or similar, that is a controller-side mistake. Skip it. Mention it in your report.
    5. **DO NOT COMMIT.** The controller handles commits.

    ## Your Job

    Once you're clear on requirements:
    1. Implement exactly what the task specifies
    2. Write tests (following TDD if task says to)
    3. ⛔ Do NOT compile or build — see FORBIDDEN ACTIONS above
    4. Do NOT commit — the controller handles commits after all tasks complete
    5. Report back

    **While you work:** If you encounter something unexpected or unclear, **ask questions**.
    It's always OK to pause and clarify. Don't guess or make assumptions.

    ## Report Format

    When done, report:
    - STATUS: COMPLETE or NOT COMPLETE
    - What you implemented
    - Exact working directory used
    - Files changed
    - Lightweight checks run during implementation, if any
    - Whether the Task text incorrectly included a legacy `验证:` subsection and you ignored it
    - Whether the Task text incorrectly requested compile/build and you skipped it per Phase 2 policy
    - Whether any command timed out or any blocker remains
    - Any issues or concerns

    If the task is not fully complete, report `STATUS: NOT COMPLETE` and include:
    - Remaining work
    - Blockers or unresolved questions
    - Partial files changed so far
```

## Controller Dispatch Checklist

Controller 在构建 implementer prompt 前必须完成：

1. **嵌入 CODING_STANDARDS.md** — 读取 `[DOC_ROOT]/spec/CODING_STANDARDS.md` 完整内容，嵌入 prompt 的 `## Coding Standards` 节
2. **替换 VERSION_DIR** — 用当前版本目录的绝对路径替换 `[VERSION_DIR]`
3. **替换 SOURCE_ROOT** — 用 worktree 绝对路径替换 `[SOURCE_ROOT]`
4. **替换设计文档路径** — Task 参考文件中的 `[DOC_ROOT]/docs/plans/.../xxx-detail-design.md` 替换为 `[VERSION_DIR]/xxx-detail-design.md` 的绝对路径
5. **删除遗留验证段** — 如果 plan.md 的 Task 中仍有 `验证:` / `**验证**:` 子节，controller 必须先删除该子节，再构建 implementer prompt
6. **粘贴 Task 实施正文** — 从 plan.md 复制 Task 的实施内容（依赖 / 参考文件 / 创建修改文件 / 业务规则等），不让 subagent 自己读 plan 文件
