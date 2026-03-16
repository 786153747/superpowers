---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

写导航图，不写驾驶手册。告诉执行者：去哪里（文件路径）、看什么（参考文件）、做什么（业务规则）、怎么验证（验证步骤）。**不要把完整代码写进 plan**——执行者读真实的参考文件比抄 plan 里的代码更可靠。

Plan 的目标是让一个**有开发能力但不了解项目**的模型，通过读参考文件 + 遵循业务规则，产出与项目风格一致的代码。

原则：DRY、YAGNI、TDD、频繁提交。

## Prerequisites (HARD-GATE)

Before writing any plan, you MUST verify prerequisite documents exist. Use Glob to check:

1. **If a PRD / requirement doc was provided in this session:**
   - Check: `docs/plans/*/diff.md`
   - If missing: STOP. Output "❌ 缺少差异扫描文档。请先完成 prd-diff-scan，生成 `docs/plans/<task>/diff.md` 后再来。" Do NOT proceed.

2. **Read the diff document and verify freshness before checking design docs:**
   - diff 文档必须包含 `原型目录`
   - 如果 diff 文档记录 `Git 仓库根目录 != 无`，则必须同时记录 `当前原型 Commit ID` 和 `当前原型 Commit 时间`
   - 如果 diff 文档记录了 Git 信息，使用 diff 文档中的 `原型目录` 执行 `git -C <原型目录> log -1 --format="%H%n%cI"` 读取当前 HEAD；若与 diff 文档中的 `当前原型 Commit ID` 不一致：STOP。输出 "❌ 差异扫描文档已过期。请先重新执行 `prd-diff-scan`，更新 diff 文档后再来。"
   - 只有在 diff 文档通过完整性和新鲜度检查后，才能继续判断范围
   - Frontend is in scope when the diff or session mentions UI projects, page paths, page interactions, or frontend gaps/blockers.
   - Backend is in scope when the diff or session mentions APIs, controllers/services/mappers, database work, SAP/mock integration, or backend gaps/blockers.

3. **Check index.md and design documents:**
   - 读取任务根目录下的 `index.md`（与 diff.md 同目录）
   - 按 index.md 的页面清单逐个检查设计文件是否存在：
     - Frontend in scope → 每个页面子目录下需有 `frontend-detail-design.md`
     - Backend in scope → 每个页面子目录下需有 `backend-detail-design.md`
   - If both frontend and backend are in scope, both sides must be covered for all pages before planning.

4. **If any required design document is missing:**
   - STOP. Output a precise missing-doc message listing which pages lack which design docs, and do NOT proceed.
   - Tell the user to finish brainstorming for the missing pages/sides.

If all required checks pass, read the design document(s), diff document, and index.md to use as input for the plan.

Never treat a generic `继续` as approval to bypass the design gate. In normal interactive mode, planning starts only after the saved design docs have been explicitly approved.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** Per-page plan files inside the task directory (see Plan Generation Flow below).

## 执行追踪元数据（必填）

### index.md 时间追踪格式

在 `index.md` 中添加执行追踪表（不含 Token 列）：

```markdown
## 执行追踪

| 阶段 | 开始时间 | 结束时间 | 耗时 | 备注 |
|------|---------|---------|------|------|
| prd-diff-scan | 2026-03-15 14:30 | 2026-03-15 15:00 | 30 分钟 | 全量扫描 |
| brainstorming | 2026-03-15 15:00 | 2026-03-15 16:30 | 1.5 小时 | 4 个页面 |
| writing-plans | 2026-03-15 16:30 | 2026-03-15 17:30 | 1 小时 | 5 个 plan 文件 |
| executing-plans | 2026-03-15 17:30 | — | — | 进行中 |
| **合计** | — | — | **3.5 小时** | — |
```

### plan.md 时间追踪格式

在每个 `plan.md` 的任务状态表中包含时间追踪列：

```markdown
## 任务状态

| 任务 | 描述 | 状态 | 开始时间 | 完成时间 | 耗时 |
|------|------|------|---------|---------|------|
| Task 1 | 创建数据库表 | 已完成 | 2026-03-15 22:45 | 2026-03-15 22:55 | 10 分钟 |
| Task 2 | 创建共享实体类 | 进行中 | 2026-03-15 22:55 | — | — |
| Task 3 | 创建菜单配置 SQL | 未开始 | — | — | — |
```

### 填写规则

- **开始时间**：任务设为 in_progress 时填写当前实际时间（如 `2026-03-16 10:30`）
- **完成时间**：任务设为 completed 时填写当前实际时间（如 `2026-03-16 11:15`）
- **耗时**：任务完成时计算（完成时间 - 开始时间，如 `45 分钟`）
- **禁止只更新状态列而不更新时间追踪字段**

---

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
Task 2: 订单列表接口（后端 Entity→Controller 全链路 + 前端 API + 页面联调）
Task 3: 订单确认接口（后端 Service 方法 + Controller + 前端按钮联调）
Task 4: 寄售库存查询接口（后端全链路 + 前端页面联调）
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
3. 如有遗漏，补充 Task 后再保存

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

| 要素 | 作用 | 弱模型为什么需要 |
|------|------|-----------------|
| **参考文件** | 执行者先读真实代码，学到 import、基类、注解、命名规范 | 比抄 plan 里的代码更可靠，不会出现 import 错误 |
| **设计文档引用** | 字段、接口、规则已在详细设计中，不重复 | 减少 plan 体积，避免 plan 和 design 不一致 |
| **业务规则** | 自然语言描述 WHAT，执行者翻译成 HOW | 弱模型翻译规则比理解 200 行代码更可靠 |
| **创建/修改文件** | 精确路径，不猜测 | 消除路径歧义 |
| **验证步骤** | 机械检查，明确的"完成"信号 | 执行者知道什么时候可以标 completed |
| **依赖关系** | 防止跳步 | 避免引用不存在的类/表 |

### 什么可以写在 Task 里

- 业务规则（自然语言）
- 关键的非显而易见的技术要点（如"用 `@Transactional` 包裹状态更新和发货记录创建"）
- 特殊的数据结构或算法描述（如"内存分页：先全量查询 SAP，再 subList 截取"）
- 验证命令和预期输出

### 什么不要写在 Task 里

- 完整的类实现代码（参考文件 + 业务规则足够）
- Getter/Setter/ToString 等样板代码
- 完整的 SQL DDL（设计文档里已有）
- 完整的 MyBatis XML 映射文件
- 完整的 import 列表（从参考文件学习）
- 设计文档里已经写明的字段列表（直接引用 Section 编号）

## 反面示例

以下 plan 输出**不合格**：

```markdown
### Task 2: 后端领域模型（Entity）

Step 1: 创建 Order 实体类

​```java
package com.ruoyi.system.domain;
// ... 100 行完整实现 ...
public class Order extends BaseEntity {
    private Long id;
    private String orderNo;
    // ... 30 个字段 ...
    // ... 30 个 getter/setter ...
    // ... toString ...
}
​```
```

为什么不合格：
- 把完整代码塞进 plan 浪费 context，导致后续 Task 被省略
- getter/setter 是样板代码，不需要出现在 plan 里
- 字段列表在设计文档 Section 4.2 已经定义，不应重复

**合格的写法**：

```markdown
### Task 2: 后端领域模型（Entity）

**依赖**: Task 1（数据库表）

**参考文件**:
- Pattern: `com/ruoyi/system/domain/SysUser.java` — BaseEntity 继承、@Excel 注解
- Design: `backend-detail-design.md` Section 4.2 — 字段定义

**创建文件**:
- `ruoyi-system/src/main/java/com/ruoyi/system/domain/Order.java`
- `ruoyi-system/src/main/java/com/ruoyi/system/domain/DeliveryRecord.java`
- `ruoyi-system/src/main/java/com/ruoyi/system/domain/Inventory.java`

**业务规则**:
1. Order 和 DeliveryRecord 继承 BaseEntity，Inventory 不继承（SAP 实时数据，不持久化）
2. 所有金额/数量字段用 BigDecimal(13,3)
3. 日期字段加 @JsonFormat(pattern="yyyy-MM-dd")，导出字段加 @Excel 注解
4. isReturnOrder 用 Boolean 映射 TINYINT(1)

**验证**: `mvn compile -q -pl ruoyi-system` → BUILD SUCCESS

**提交**: `git commit -m "feat: 创建订单库存领域模型"`
```

还有一种不合格——**按技术层横切导致模块断层**：

```markdown
### Task 3: Mapper 接口（Order + DeliveryRecord）
### Task 7: Controller（Order + DeliveryRecord + ConsignmentInventory）
```

为什么不合格：
- Task 3 只创建了 Order 和 DeliveryRecord 的 Mapper，ConsignmentInventory 的 Mapper 被遗漏
- Task 7 的 ConsignmentInventoryController 注入 Service 时编译失败，因为没有任何 Task 创建它的 Service/Mapper
- 应改为按接口维度切：每个模块的全链路放在同一个 Task 里

还有一种不合格——**省略 Task**：

```markdown
### Task 5-12（省略，按设计文档实现）
```

为什么不合格：
- 跳过了 8 个 Task，执行者无法工作
- 省略的原因是前面的 Task 写了太多代码占满了 context

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
| 5 | diff.md 中每个差异 Dx → Plan 中有对应 Task 处理 | ✅/❌ |
| 6 | 参考文件路径全部为真实存在的文件（用 Glob 验证） | ✅/❌ |

任一项为 ❌ → 补全后再保存。

## Execution Handoff

After saving all page plans and updating index.md, offer execution choice:

**"Plan complete. Page plans saved to:**

```
docs/plans/<task>/
  shared-plan.md (N tasks)
  <page1>/plan.md (N tasks)
  <page2>/plan.md (N tasks)
  ...

Master index updated: docs/plans/<task>/index.md
```

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh subagent per task + code review

**If Parallel Session chosen:**
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans
