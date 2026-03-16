# Claude Code 工作规则（精简版）

> 先澄清、后设计、再计划、最后实现。关键决议必须落盘，不能只存在于对话里。

**会话切换规则**：每次对话被压缩或新开会话窗口时，必须重新阅读此文档。

**详细规则已迁移到对应 skill 中**：
- PRD 差异扫描 → `superpowers:prd-diff-scan`
- 设计文档 → `superpowers:brainstorming`
- 实施计划 → `superpowers:writing-plans`
- 执行计划 → `superpowers:executing-plans`
- 会话启动检查 → `superpowers:using-superpowers`

---

## 核心工作流程

```
PRD/需求 → prd-diff-scan → brainstorming → writing-plans → executing-plans → requesting-code-review
                                    ↓
                            docs/plans/YYYY-MM-DD-<主题>/
```

**Skill 调用**：用 `Skill` 工具调用，禁止用 `Task` 工具。

**Skill 路由**：用户提供了 PRD/需求文档或实现目录？→ **必须先调 `prd-diff-scan`**，不管用户说什么。

---

## 11 条核心规则

1. **文档落盘**：diff.md、design.md、plan.md 必须保存到 `docs/plans/YYYY-MM-DD-<主题>/`，不能只在聊天中
2. **逐轮确认**：brainstorming 每步完成后必须等用户确认，不得连续多步（除非用户明确授权自动模式）
3. **无 Blocker 才能继续**：差异决议中有「待确认」项？→ 停下来等用户确认
4. **按接口维度切 Task**：每个 Task 是垂直切片（Entity→Mapper→Service→Controller），禁止按技术层横切
5. **延迟编译**：编码阶段不编译，所有后端任务完成后再 `mvn compile`
6. **延迟审查**：编译通过后（后端 + 前端）再请求一次性审查，不每任务审查
7. **时间追踪**：更新任务状态时必须同时更新开始时间/完成时间/耗时（填写当前实际时间）
8. **Git Worktree**：执行计划前必须调用 `using-git-worktrees` 创建隔离工作区
9. **子代理执行**：执行 plan 用 `subagent-driven-development`，每任务 fresh subagent
10. **验证优先**：声称完成前必须调用 `verification-before-completion` 跑验证命令
11. **详细设计无代码**：后端详细设计文档禁止包含 Java 代码块（`class`/`@`/`public`）、DDL SQL（`CREATE TABLE`）、MyBatis XML（`<select>`/`<if>`）。Entity/DTO 用字段表格、DB 用字段表格、查询用伪 SQL 纯文本。此规则在上下文压缩后仍必须遵守，参见模板 `spec/backend/java/detail-design-template.md` 自检清单第 14 条

---

## 文档结构

```
docs/plans/YYYY-MM-DD-<主题>/
  diff.md                    # prd-diff-scan 创建
  index.md                   # brainstorming 创建，执行中更新
  shared-plan.md             # writing-plans 创建（可选）
  <page-slug>/
    frontend-detail-design.md
    backend-detail-design.md
    plan.md                  # writing-plans 创建，executing-plans 更新状态
```

---

## 违返后果

违反上述任何一条 = 流程失败，必须：
1. 回退相关代码修改
2. 重新执行完整流程

**每次会话开始前** → 调用 `Skill("superpowers:using-superpowers")` 检查合规性。
