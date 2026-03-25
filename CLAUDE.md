# Claude Code 工作规则（精简版）

> 先澄清、后设计、再计划、最后实现。关键决议必须落盘，不能只存在于对话里。

**会话切换规则**：每次对话被压缩或新开会话窗口时，必须重新阅读此文档。

**详细规则已迁移到对应 skill 中**：
- PRD 差异扫描 → `superpowers:prd-diff-scan`
- 设计文档 → `superpowers:brainstorming`
- 实施计划 → `superpowers:writing-plans`
- 执行计划 → 先让用户二选一：`superpowers:subagent-driven-development` 或 `superpowers:executing-plans`
- 会话启动检查 → `superpowers:using-superpowers`

**执行模式选择补充**：`writing-plans` 落盘后，若用户尚未明确选择执行方式，必须使用 `AskUserQuestion` 让用户二选一：
1. **Subagent-Driven (当前会话)** — 使用 `superpowers:subagent-driven-development` 在当前会话中逐任务执行
2. **Separate Session (独立会话)** — 使用 `superpowers:executing-plans` 在独立会话中执行

未明确选择前，不得默认进入任一执行 skill。

**跳过选择的条件**：如果用户在提示词中已明确指定了具体的执行 skill（如 `请调用 superpowers:executing-plans` 或 `请调用 superpowers:subagent-driven-development`），视为已做出选择，直接执行该 skill，不再弹框询问。

---

## 路径变量

CLI 工作目录（CWD）与实际代码项目目录可能不同。以下变量明确职责分离：

| 变量 | 含义 | 确定时机 |
|------|------|---------|
| `WORKSPACE_ROOT` | CWD（CLI 工作目录 / 工作区根，包含 `spec/` 和 `docs/plans/`） | 自动（即 CWD） |
| `PROJECT_ROOT` | 实际代码项目根目录 | 会话启动时由 `using-superpowers` 确认 |
| `SOURCE_ROOT` | worktree 路径 | worktree 创建后才确定 |
| `VERSION_DIR` | 当前版本目录（精确到 `docs/plans/<topic>/<commitid>/`） | 当前版本目录确定后 |

### 职责分离

- **`WORKSPACE_ROOT` 管文档**：`docs/plans/`、`spec/` 在 CWD 下，主代理用相对路径读写
- **`PROJECT_ROOT` 管代码**：源码、worktree 在此目录下
- **`SOURCE_ROOT` 管隔离源码**：worktree 内做源码修改、构建、测试
- **`VERSION_DIR` 管当前任务版本文档**：当前任务绑定的 `diff.md`、`index.md`、设计文档、`plan.md` 都来自同一个版本目录
- **subagent 传绝对路径**：`WORKSPACE_ROOT`（CWD 绝对路径）+ `SOURCE_ROOT`（worktree 路径）+ `VERSION_DIR`（当前版本目录，已知时必须传）
- **进度回写到 `WORKSPACE_ROOT`**：index.md / plan.md 始终在 CWD 下的 `docs/plans/`

### PROJECT_ROOT 确认规则

`PROJECT_ROOT` 通常由 `using-superpowers` 第零步确认。但如果 skill 被单独调用（跳过了 using-superpowers），任何需要操作代码目录的 skill 在首次使用 `PROJECT_ROOT` 前，必须检查当前会话是否已确认过。**未确认时必须用 `AskUserQuestion` 向用户确认，不得猜测。**

`AskUserQuestion` 用于路径确认时，固定选项里只放真实候选路径；不要添加“其他路径”/“Other”这类兜底选项。需要自定义路径时，直接使用工具自带的自由输入能力。

---

## 核心工作流程

```
PRD/需求 → prd-diff-scan → brainstorming → writing-plans → 选择执行模式 → (subagent-driven-development | executing-plans) → requesting-code-review
                                    ↓
                            docs/plans/YYYY-MM-DD-<主题>/
```

**Skill 调用**：用 `Skill` 工具调用，禁止用 `Task` 工具。

**Skill 路由**：用户提供了 PRD/需求文档或实现目录？→ **必须先调 `prd-diff-scan`**，不管用户说什么。

---

## 11 条核心规则

1. **文档落盘**：`diff.md`、design.md、plan.md 必须保存到 `docs/plans/YYYY-MM-DD-<主题>/` 下的当前版本目录（有 commit 时为 `<commitid>/`），不能只在聊天中
2. **逐轮确认**：brainstorming 每步完成后必须等用户确认，不得连续多步（除非用户明确授权自动模式）
3. **无 Blocker 才能继续**：差异决议中有「待确认」项？→ 停下来等用户确认
4. **起始目录有歧义先问用户**：如果实际修改代码目录、UI 原型实现目录、上一次 diff 文件不明确，必须先用 `AskUserQuestion` 确认，不能靠猜继续
5. **按接口维度切 Task**：每个 Task 是垂直切片（Entity→Mapper→Service→Controller），禁止按技术层横切
6. **延迟编译**：编码阶段不编译，所有后端任务完成后再 `mvn compile`
7. **延迟审查**：编译通过后（后端 + 前端）再请求一次性审查，不每任务审查
8. **代码规范**：implementer 编码前必须读取 `[WORKSPACE_ROOT]/spec/CODING_STANDARDS.md`，并将其作为技术栈、架构、代码规范的唯一来源；Phase 2 审查后收集规范类问题反馈给用户确认是否更新规范文档
9. **Git Worktree**：执行计划前必须调用 `using-git-worktrees` 在 `PROJECT_ROOT` 下创建隔离工作区
10. **子代理执行**：执行 plan 用 `subagent-driven-development`，每任务 fresh subagent（仅实现，编译和审查延迟到 Phase 2）
11. **验证优先**：声称完成前必须调用 `verification-before-completion` 跑验证命令

---

## 文档结构

```
docs/plans/YYYY-MM-DD-<主题>/
  <commitid>/                # 当前版本目录（有 commit 时）
    diff.md                  # prd-diff-scan 创建（每个版本目录一份）
    index.md                 # brainstorming 创建，执行中更新
    shared-plan.md           # writing-plans 创建（可选）
    <page-slug>/
      frontend-detail-design.md
      backend-detail-design.md
      plan.md                # writing-plans 创建，执行 skill 更新状态（subagent-driven-development / executing-plans）
```

---

## 违返后果

违反上述任何一条 = 流程失败，必须：
1. 回退相关代码修改
2. 重新执行完整流程

**每次会话开始前** → 调用 `Skill("superpowers:using-superpowers")` 检查合规性。
