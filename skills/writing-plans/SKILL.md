---
name: writing-plans
description: "Use ONLY after brainstorming has produced saved design docs (frontend/backend-detail-design.md) and index.md. Never use directly from PRD/requirements — those must go through prd-diff-scan → brainstorming first."
---

# Writing Plans

## Overview

写导航图，不写驾驶手册。告诉执行者：去哪里（文件路径）、看什么（参考文件）、做什么（业务规则）、怎么验证（验证步骤）。**不要把完整代码写进 plan**——执行者读真实的参考文件比抄 plan 里的代码更可靠。

Plan 的目标是让一个**有开发能力但不了解项目**的模型，通过读参考文件 + 遵循业务规则，产出与项目风格一致的代码。

原则：DRY、YAGNI、TDD、频繁提交。

## Prerequisites (HARD-GATE)

Before writing any plan, follow this decision tree in order. Stop at the first ⛔.

```
Q1: 本次 session 提供了 PRD / 需求文档？
  否 → 跳到 Q4
  是 ↓
Q2: docs/plans/*/diff.md 存在？
  否 → ⛔ STOP: "❌ 缺少差异扫描文档。请先完成 prd-diff-scan。"
  是 ↓
Q3: diff 文档有 Git 基线且 commit 一致？
  （无 Git 基线 → 跳到 Q4）
  （执行 git -C <原型目录> log -1 --format="%H"，与 diff 文档的 Commit ID 比对）
  不一致 → ⛔ STOP: "❌ diff 文档已过期，请重新执行 prd-diff-scan。"
  一致 ↓
Q4: index.md 和设计文件完整？（无论有无 PRD，此步必做）
  用 Glob 检查 docs/plans/*/index.md 是否存在
  不存在 → ⛔ STOP: "❌ 缺少 index.md。请先完成 brainstorming 生成设计文档。"
  存在 → 读取 index.md → 按页面清单检查：
  - Frontend in scope → 每个页面需有 frontend-detail-design.md
  - Backend in scope → 每个页面需有 backend-detail-design.md
  缺失 → ⛔ STOP: 列出缺失的页面和设计文件，要求先完成 brainstorming
  完整 ↓
Q5: 确定范围：
  - Frontend in scope：diff 或 session 提到 UI / 页面 / 前端 gaps
  - Backend in scope：diff 或 session 提到 API / DB / 后端 gaps
  - 两侧都在范围内且用户未缩小范围 → 先写前端 plan 再写后端 plan
```

If all checks pass, read design document(s), diff document, and index.md as input.

Never treat a generic `继续` as approval to bypass the design gate.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** Per-page plan files inside the task directory (see Plan Generation Flow below).

## 完整性规则

**禁止省略任何 Task。** 如果 plan 有 12 个 Task，文档必须包含 12 个完整 Task。禁止写 `（省略）`、`（结构类似）`、`（按设计文档创建）` 等占位文本来跳过 Task。

每个 Task 控制在 **30-60 行**以内。如果你写不下——说明你在写代码而不是写导航图。

## 禁止占位符值

Task 中**不得出现无法直接执行的占位符**。以下内容在 Plan 中出现 = 不合格：

- SQL 中的 `parent_id = XXX`、`menu_id = ???`、`TODO_ID` 等占位 ID
- 路径中的 `path/to/xxx`、`{{module}}`（模板变量未替换）
- 业务规则中的"参考设计文档"但不给出具体 Section 编号

如果某个值在 Plan 生成时无法确定（如菜单表 parent_id 需要查数据库），必须在 Task 的业务规则中写出**查询方式**：

```
业务规则:
1. 先查询父菜单 ID：SELECT menu_id FROM sys_menu WHERE menu_name='后市场管理' AND menu_type='M'
2. 用查询到的 menu_id 作为 parent_id 插入子菜单
```

## DTO 必须有对应 Task

设计文档中定义的所有 DTO（查询参数 DTO、请求体 DTO）必须有明确的创建 Task。不能只在 Service/Controller Task 中引用 DTO 却没有创建它的 Task。

自检：列出后端详细设计 Section 4.3 中所有 DTO → 每个 DTO 都能在 Plan 中找到"创建文件"项。

## Task 切分维度（关键）

**Task 的切分维度必须与详细设计文档的结构保持一致**，而不是按技术层（Entity → Mapper → Service → Controller）横切。

### 纯后端：按接口（功能）维度切

每个 Task 是一个**垂直切片**，包含该接口从 Entity 到 Controller 的完整链路：

```
Task 1: 建表（前置，只做一次）
Task 2: 订单列表接口（Entity + Mapper + XML + Service + Controller）→ 可独立验证
Task 3: 订单确认接口（Service 方法 + Controller 端点）→ 可独立验证
Task 4: 发货记录查询接口（Entity + Mapper + XML + Service + Controller）→ 可独立验证
Task 5: 寄售库存查询接口（Entity + Mapper + XML + Service + Controller）→ 可独立验证
```

**优势**：每个 Task 完成后立即可验证；不会出现"Controller 写了但 Service/Mapper 遗漏"的断层。

**注意**：如果多个接口共用同一个 Entity，在第一个用到它的 Task 里创建，后续 Task 注明"Entity 已在 Task N 创建"。

### 纯前端：按页面维度切

每个 Task 对应一个页面，改完即可在浏览器验证：

```
Task 1: myOrder.vue — 补按钮 + 权限控制
Task 2: orderConfirm.vue — 替换 Mock API + 联调
Task 3: deliveryRecord.vue — 替换 Mock API + 联调
Task 4: consignmentInventory.vue — 替换 Mock API + 联调
Task 5: 路由配置 + 菜单权限
```

### 前后端都有：按接口切，每个 Task 同时包含前后端

```
Task 1: 建表（前置）
Task 2: 订单列表接口（后端 Entity→Controller 全链路 + 前端 API 文件改造 + 页面联调）
Task 3: 订单确认接口（后端 Service 方法 + Controller + 前端按钮联调）
Task 4: 寄售库存查询接口（后端全链路 + 前端页面联调）
Task N: 前端差异修复（diff D1/D5/D6 等前端独立差异，不涉及后端）
```

**每个后端接口 Task 必须同时包含前端联调步骤**：修改 API 文件（Mock → 真实接口）+ 页面中调用该接口的代码改动。

### 前端独立差异 Task

diff.md 中影响范围为"前端"且不依赖任何后端接口变更的差异（如固定列、默认值、导出格式、搜索字段修正），必须有独立的 Task 覆盖。不得因为"只是前端小改动"而省略。

典型的前端独立差异 Task：
```
Task N: [页面名] 前端差异修复
  创建/修改文件: myOrder.vue
  业务规则:
  1. D1: 表格固定列 — 序号/状态/订单编号/行项目/物料号/物料名称列添加 fixed="left"
  2. D5: 发货默认数量 — el-input-number 默认值改为 row.remainingQuantity
  3. D26: 确认弹窗补物料品牌列
  验证: npm run build 无 TS 错误；浏览器验证固定列效果
```

### 复用接口的页面：不重复创建后端

如果多个页面共用同一个后端接口（如订单台账和我的订单共用 `/order/list`），**后续页面的 plan 不得再创建独立的 Controller/Service/Mapper**。正确做法：

```
# 订单台账 plan

Task 1: 前端差异修复（D16-D18 搜索字段修正 + D19 导出格式）
  创建/修改文件: orderLedger.vue
  业务规则:
  1. D16: 公司名称改为文本输入（与 myOrder 一致）
  2. D17: 高级搜索补充供应商证件号字段
  3. D18: 高级搜索去掉重复的公司名称弹框，改为公司代码
  4. D19: 导出改为 proxy.download + xlsx
  注意: 后端接口复用 OrderController（my-order 阶段已实现），无额外后端开发
```

不合格的做法（重复造后端）：
```
Task 1: 创建 OrderLedgerMapper + IOrderLedgerService + OrderLedgerController ← 查同一张表，不需要独立 Mapper/Service
```

### 禁止按技术层横切

以下切法**不合格**：

```
Task 2: Entity（Order + DeliveryRecord + Inventory）   ← 3 个模块的 Entity 混在一起
Task 3: Mapper（Order + DeliveryRecord）                ← Inventory 的 Mapper 漏了
Task 7: Controller（Order + DeliveryRecord + Inventory）← Inventory 没有 Service 可注入
```

为什么不合格：
- 一个模块的代码散落在多个 Task 中，容易遗漏某一层
- 执行到 Controller 时才发现 Service/Mapper 不存在，无法编译
- 无法逐步验证，必须所有 Task 完成后才能联调

### 完整性自检

Plan 生成后，必须自检：**设计文档中每个独立模块（Controller / 页面）在 Plan 里是否有完整的 Task 覆盖**。

自检方式：
1. 列出后端详细设计中所有 Controller → 每个 Controller 都有对应 Task，且 Task 内包含完整的 Entity/Mapper/Service 链路
2. 列出前端详细设计中所有页面 → 每个页面都有对应 Task
3. **逐条扫描 diff.md 的 D1-D{N}** → 每个 Dx 都能在 Plan 中找到对应 Task。特别注意影响范围为"前端"的 Dx，这些经常被遗漏
4. 检查 index.md 的 API 映射：如果多个页面共用同一接口（如"是否共享 = 是"），后续页面不得重复创建 Controller/Service/Mapper
5. 如有遗漏，补充 Task 后再保存

## Plan Generation Flow（按页面生成 plan）

### 流程概述

1. 读取 `index.md` 获取页面清单和页面-API 映射
2. 读取 `diff.md` 获取差异和已确认决议
3. 检查是否有跨页面共享的基础设施任务（建表、菜单配置等）→ 如有则生成 `shared-plan.md`（参考第一个页面的 backend-detail-design.md 中的 DB 表定义和共享实体）
4. **对每个页面**（按 index.md 页面清单顺序）：
   - 读取该页面的 `frontend-detail-design.md` 和 `backend-detail-design.md`
   - 生成 `<page-slug>/plan.md`
5. 更新 `index.md`：填充 Plan 列链接、添加执行进度表和执行顺序

### 每个 plan.md 的格式

每个页面的 `plan.md` 顶部必须包含任务状态表（由 executing-plans 更新状态）：

```markdown
# <页面名称> Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [一句话描述本页面构建什么]

**Page:** <page-slug> (part of <task-name> feature)

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Design Docs:**
- 前端详细设计: `./<page-slug>/frontend-detail-design.md`
- 后端详细设计: `./<page-slug>/backend-detail-design.md`

**Master Index:** `./index.md`

## 任务状态

| 任务 | 描述 | 状态 | 完成时间 |
|------|------|------|---------|
| Task 1 | [描述] | 未开始 | — |
| Task 2 | [描述] | 未开始 | — |

---
```

### shared-plan.md 的内容

`shared-plan.md` 包含跨页面只需执行一次的基础设施任务：
- DB 表创建（建表 SQL，参考任意页面的 backend-detail-design.md Section 5.1）
- 共享 Entity / DTO 创建（参考任意页面的 backend-detail-design.md Section 4.2/4.3）
- 路由配置和菜单 SQL
- 其他跨页面共享基础设施

注意：虽然每个页面的后端详细设计都包含完整的共享实体/DB 表定义（自包含原则），但建表和创建 Entity 只需在 shared-plan.md 中执行一次，后续页面的 plan.md 注明"Entity 已在 shared-plan Task N 创建"。

### 更新 index.md

所有 plan.md 生成完毕后，更新 `index.md`：

1. **页面清单**的 Plan 列：从 `—` 更新为实际链接
2. **新增执行进度表**：

```markdown
## 执行进度

| 页面 Slug | 总任务数 | 已完成 | 实施状态 |
|-----------|---------|-------|---------|
| shared | N | 0 | 未开始 |
| <page-slug> | N | 0 | 未开始 |
```

3. **新增执行顺序**：

```markdown
## 执行顺序

> shared 最先执行，之后按依赖关系排列。

1. `shared-plan.md` — [描述]（无依赖）
2. `<page1>/plan.md` — [描述]（依赖 shared）
3. `<page2>/plan.md` — [描述]（依赖 shared + page1）
```

## Plan Document Header (for each page plan)

**Every page plan MUST start with the header shown in Plan Generation Flow above.**

## Task Structure（核心）

每个 Task 包含 6 个关键要素：

````markdown
### Task N: [组件名称]

**依赖**: Task X, Task Y（必须先完成）

**参考文件**（实现前必须先用 Read 工具读取）:
- Pattern: `path/to/existing/similar/file.java` — 按此文件的分层结构和代码风格
- Framework: `path/to/base/BaseEntity.java` — 继承此基类
- Design: `docs/plans/xxx-detail-design.md` Section 4.2 — 字段定义

**创建/修改文件**:
- Create: `exact/path/to/NewFile.java`
- Modify: `exact/path/to/existing.java` — 添加 XXX 方法
- Test: `exact/path/to/test/NewFileTest.java`
- Copy: `src/views/xxx/detail.vue` ← 原型新增，开发项目不存在（diff F2）
- Overwrite: `src/views/xxx/index.vue` ← 原型修改，开发项目无本地改动（diff F3）
- Merge: `src/views/xxx/list.vue` ← 原型修改，开发项目有本地改动（diff F1）
  - 原型变更要点: [从 diff 中摘要原型改了什么]
  - 保留: [开发项目本地改动中需保留的部分]

**业务规则**:
1. [用自然语言描述规则，一条一行]
2. [字段约束、状态流转、校验逻辑等]
3. [边界情况和异常处理]

**验证**:
1. `mvn compile -q` → BUILD SUCCESS
2. `mvn test -Dtest=XxxTest -pl module-name` → ALL PASS
3. [其他验证步骤]

**提交**:
```bash
git add [具体文件列表]
git commit -m "feat: [描述]"
```
````

### Task 6 要素说明

| 要素 | 作用 |
|------|------|
| **参考文件** | 执行者先读真实代码，学到 import、基类、注解、命名规范 |
| **设计文档引用** | 字段、接口、规则已在详细设计中，不重复 |
| **业务规则** | 自然语言描述 WHAT，执行者翻译成 HOW |
| **创建/修改文件** | 精确路径，不猜测；涉及原型文件时标注合并策略（Copy/Overwrite/Merge）和 diff 编号（Fx） |
| **验证步骤** | 机械检查，明确的"完成"信号 |
| **依赖关系** | 防止跳步 |

### 什么可以写在 Task 里

- 业务规则（自然语言）
- 关键的非显而易见的技术要点（如"用 `@Transactional` 包裹状态更新和发货记录创建"）
- 特殊的数据结构或算法描述（如"内存分页：先全量查询 SAP，再 subList 截取"）
- 验证命令和预期输出
- 原型文件合并策略（Copy/Overwrite/Merge）和对应的 diff 变更文件清单编号（Fx）

### 什么不要写在 Task 里

- 完整的类实现代码（参考文件 + 业务规则足够）
- Getter/Setter/ToString 等样板代码
- 完整的 SQL DDL（设计文档里已有，用 `Design: backend-detail-design.md Section 5.1` 引用）
- 完整的查询 SQL（设计文档 Section 7 已有，引用即可；Task 中只写关键的 WHERE 条件说明）
- 完整的 MyBatis XML 映射文件
- 完整的 import 列表（从参考文件学习）
- 设计文档里已经写明的字段列表（直接引用 Section 编号）
- **"同上"**：每个 Task 的参考文件必须列出完整路径，不得写"同上""同 Task 1"。执行者可能单独看某个 Task，看不到"上"是什么

## 反面示例

**不合格：Task 里写完整代码**

```markdown
### Task 2: 后端领域模型
​```java
public class Order extends BaseEntity {
    // ... 100 行完整实现 ...
}
​```
```

**合格：导航图 + 引用**

```markdown
### Task 2: 后端领域模型

**参考文件**: `com/ruoyi/system/domain/SysUser.java`（BaseEntity 继承、@Excel 注解）
**设计**: `backend-detail-design.md` Section 4.2 — 字段定义
**创建文件**: `.../domain/Order.java`, `.../domain/DeliveryRecord.java`
**业务规则**: 金额用 BigDecimal(13,3)；日期加 @JsonFormat；isReturnOrder 用 Boolean
**验证**: `mvn compile -q -pl ruoyi-system` → BUILD SUCCESS
```

**不合格：按技术层横切** → Task 3 写所有 Mapper，Task 7 写所有 Controller（模块断层，无法逐步验证）

**不合格：省略 Task** → `Task 5-12（省略，按设计文档实现）`

## Remember
- 精确的文件路径
- 参考文件 + 业务规则代替完整代码
- 精确的验证命令和预期输出
- 每个 Task 30-60 行，禁止省略任何 Task
- DRY, YAGNI, TDD, frequent commits
- 设计文档里已有的内容用 Section 引用，不重复
- 禁止占位符值（XXX、???、TODO_ID）
- 每个 DTO 都有创建 Task

## 落盘前自检（必须执行）

Plan 保存前必须逐项自检：

| # | 检查项 | 通过？ |
|---|--------|-------|
| 1 | 后端详细设计中每个 Controller → Plan 中有完整的垂直切片 Task（Entity + DTO + Mapper + Service + Controller） | ✅/❌ |
| 2 | 前端详细设计中每个页面 → Plan 中有对应 Task | ✅/❌ |
| 3 | 后端详细设计 Section 4.3 中每个 DTO → Plan 中有创建文件项 | ✅/❌ |
| 4 | Plan 中无占位符值（`XXX`、`???`、`TODO_ID`、未替换的 `{{xx}}`） | ✅/❌ |
| 5 | diff.md 中每个差异 Dx → Plan 中有对应 Task 处理（**包括影响范围为"前端"的 Dx**，逐条核对不得遗漏） | ✅/❌ |
| 6 | 参考文件路径全部为真实存在的文件（用 Glob 验证），**无"同上"** | ✅/❌ |
| 7 | Task 中**无完整 SQL DDL / 查询 SQL**（应引用设计文档 Section 编号），每个 Task ≤ 60 行 | ✅/❌ |
| 8 | index.md 页面清单**无重复行**（每个 page-slug 只出现一次） | ✅/❌ |
| 9 | **共享接口去重**：index.md API 映射中标记"是否共享=是"的接口，后续页面 plan 不得重复创建 Controller/Service/Mapper | ✅/❌ |

任一项为 ❌ → 补全后再保存。

## Execution Handoff

After saving all page plans and updating index.md:

```
Plan complete. Page plans saved to:
  docs/plans/<task>/shared-plan.md (N tasks)
  docs/plans/<task>/<page1>/plan.md (N tasks)
  ...
Master index updated: docs/plans/<task>/index.md
```

Offer execution choice (详见 CLAUDE.md §1 执行模式选择):

1. **Subagent-Driven (this session)** → `superpowers:subagent-driven-development`
2. **Parallel Session (separate)** → `superpowers:executing-plans`
