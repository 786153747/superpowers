# Claude Code 工作规则

> 先澄清、后设计、再计划、最后实现。关键决议必须落盘，不能只存在于对话里。

---

## 1. 工作流程

### 流程分类

根据任务类型选择对应流程：

| 场景 | 入口 | 流程 |
|------|------|------|
| 有 PRD / 需求文档 | prd-diff-scan | ① prd-diff-scan → ② brainstorming → ③ writing-plans → ④ executing-plans → ⑤ 审查 + 收尾 |
| 无 PRD、用户口头描述需求 | brainstorming | ② brainstorming → ③ writing-plans → ④ executing-plans → ⑤ 审查 + 收尾 |
| 单一 bug fix / 小改动（≤ 3 个文件） | 直接编码 | 遵守 §5 编码原则，完成后提交 |
| 纯聊天 / 概念问答 | — | 不受流程约束 |

**每一步单独执行**，确认输出合格后再进入下一步。不要在一个 skill 里完成多个阶段。

用 `Skill` 工具调用 skill：`Skill("superpowers:prd-diff-scan")`、`Skill("superpowers:brainstorming")`。禁止用 `Task` 工具调用 skill。

### Skill 路由（收到用户消息后先检查）

用户提供了 PRD / 需求文档，且 `docs/plans/*/diff.md` 不存在？→ **必须先调 `prd-diff-scan`**，不管用户要求什么（即使用户说"用 brainstorming"）。

用户**不需要显式点名** `prd-diff-scan`。以下任一信号即触发：

- 给出 PRD / 需求文档路径（如 `prd/xxx.md`、`docs/xxx-prd.md`）
- 给出现有实现目录（如 `ruoyi-ui/`、`src/`）
- 组合表达（如"需求文档在 `prd/...`，UI 项目在 `ruoyi-ui/`"）
- 中文关键词："对照 PRD 看看差异"、"做差异分析/差异扫描/页面核对"、"按这个 PRD 跑一遍差异分析"

### 执行模式选择

| 条件 | 推荐模式 |
|------|---------|
| 任务独立、同一 session 内执行、希望自动审查 | `subagent-driven-development`（内置 3 道门禁） |
| 需要人工逐批审查、或分多 session 执行 | `executing-plans`（每批暂停等用户反馈） |

详见各 skill 的 "When to Use" 章节。

---

## 2. PRD 差异扫描（原则）

详细的扫描步骤、合格清单、反面示例见 `skills/prd-diff-scan/SKILL.md`。本节只规定原则：

- 有 PRD 时，**必须先做差异扫描**，再谈设计
- 对比方式统一为 **PRD ↔ 当前实现**
- 差异扫描结果保存到 `docs/plans/YYYY-MM-DD-<主题>/diff.md`
- 如果原型目录位于 Git 仓库中，diff 文档必须记录 Git 基线（原型目录、仓库根目录、Commit ID、Commit 时间）
- 已有 diff 但 Commit ID 落后于当前 HEAD → 必须重新扫描（增量或全量，判定逻辑见 SKILL.md）
- 有 Blocker 未解决时，不得进入设计或实现
- "建议决议"必须**逐项对应**每个 Dx 和 Bx，不得笼统概括
- PRD 中无法明确的数据来源、状态流转、权限、接口行为，标记为 `Blocker/待确认`，不得脑补
- 每个页面必须完成 5 项对比（缺一不可）：
  1. UI 可视要素对比
  2. 控件矩阵（筛选控件 / 表格列 / 按钮菜单 / 状态标签 / 弹窗入口 / 分页工具栏 / 空态提示）
  3. 字段对比（查询条件 / 表格列 / 表单字段 / 行操作按钮）
  4. 9 维度交互/联动对比：交互行为、触发事件、数据来源、数据流向、字段联动、状态流转、权限与角色、默认值/排序/回显、下拉/字典来源
  5. 验收点（正向 / 空态 / 异常态 / 权限态）

---

## 3. 文档规则

所有设计、计划、测试、审查文档统一放在 `docs/plans/` 下的**任务目录**中：

```
docs/plans/YYYY-MM-DD-<主题>/           # 任务根目录
  index.md                               # 主索引（页面清单 + 页面-API映射 + 执行状态）
  diff.md                                # PRD 差异扫描
  shared-plan.md                         # 跨页面共享基础设施 plan（可选，如建表/菜单）
  <page-slug>/                           # 页面子目录（kebab-case）
    frontend-detail-design.md
    backend-detail-design.md
    plan.md
```

### 文档创建权限

每种文档只能由对应的 skill 创建或更新：

| 文档类型 | 位置 | 创建 | 更新 |
|----------|------|------|------|
| `diff.md` | 任务根目录 | prd-diff-scan | — |
| `index.md` | 任务根目录 | brainstorming | writing-plans（填充 plan 链接和执行进度）、executing-plans（更新状态） |
| `frontend-detail-design.md` | `<page>/` 页面子目录 | brainstorming | — |
| `backend-detail-design.md` | `<page>/` 页面子目录 | brainstorming | — |
| `plan.md` | `<page>/` 页面子目录 | writing-plans | executing-plans（更新任务状态） |
| `shared-plan.md` | 任务根目录（跨页面共享基础设施） | writing-plans | executing-plans（更新任务状态） |
| `*-db-design.md` | 任务根目录 | writing-plans | — |

违反此规则 = 流程失败，必须删除错误产出的文档并由正确的 skill 重新生成。

### 详细设计怎么写

- 后端详细设计模板：`spec/backend/java/detail-design-template.md`
- 前端详细设计模板：`spec/frontend/vue/detail-design-template.md`
- 前后端都要时，**分两份文档写**，不要混成一篇
- 文档不能只写在聊天里，**必须落盘**
- 每份后端详细设计必须自包含：跨页面共享的实体/DB 表/公共 API 设计在每个用到它的页面中**重复包含**
- 写的时候用白话，多写具体的文件、接口、字段、规则、验证方式
- 如果项目里还没有 `spec/`，先补一份再继续

文档头部包含：

```md
## 需求输入

- PRD: [路径]
- 项目规范: [路径]
```

---

## 4. 确认规则

以下场景必须等用户确认后再继续：

- 需求不清
- 多种方案可选
- 设计完成要进入计划
- 计划完成要进入实现
- 有破坏性变更

未确认前不得编造业务规则，不得自行拍板。

### 每步一轮交互

brainstorming 的每个 Step 完成后，必须**停下来等用户回复**，不得在一个回合中连续完成多个 Step。
一个回合 = 一次模型输出。每次输出最多推进一个 Step。

---

## 5. 编码原则

- 只改与当前目标直接相关的内容
- 不顺手修无关问题
- 不引入与当前任务无关的重构
- 后端 service / controller 层推荐 TDD（先写测试、再写实现）；前端视图层可选

---

## 6. 执行阶段的集成规则

使用 `executing-plans` 或 `subagent-driven-development` 执行计划时，必须集成以下技能：

### 开始前

- **必须** 调用 `superpowers:using-git-worktrees` 创建隔离工作区
- 不得在 main/master 上直接实现

### 执行中

- 涉及原型文件合并时，按 diff.md 变更文件清单中的合并策略执行（Copy / Overwrite / Merge）

**`executing-plans` 模式**（人工审查为主）：
- 每批次（默认 3 个任务）完成后暂停，等待用户审查
- 每个页面完成后 **必须** 调用 `superpowers:requesting-code-review` 请求代码审查
- 收到审查反馈时 **必须** 按 `superpowers:receiving-code-review` 的规则处理

**`subagent-driven-development` 模式**（内置自动审查）：
- 已内置 3 道硬门禁（编译 → 规格审查子 agent → 质量审查子 agent），**不需要** 额外调用 `requesting-code-review`
- 所有 task 完成后会自动派遣最终代码审查子 agent

### 完成前

- 所有任务完成后 **必须** 调用 `superpowers:verification-before-completion` 运行验证
- 验证通过后 **必须** 调用 `superpowers:finishing-a-development-branch` 完成分支

### 错误恢复

- 文档由错误的 skill 创建 → 删除该文档，由正确的 skill 重新生成
- 某个 step 产出不合格 → 在原文档上修正并重新通过质量检查，不必回退到更早的 step
- 编译 / 测试持续失败 → 停下来向用户报告，不要循环重试超过 3 次
