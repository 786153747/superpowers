---
name: writing-plans
description: "Use ONLY after brainstorming has produced saved design docs (frontend/backend-detail-design.md) and index.md. Never use directly from PRD/requirements — those must go through prd-diff-scan → brainstorming first."
---

# Writing Plans

## Overview

写导航图，不写驾驶手册。告诉执行者：去哪里（文件路径）、看什么（参考文件）、做什么（业务规则）。**不要把完整代码写进 plan**——执行者读真实的参考文件比抄 plan 里的代码更可靠。

Plan 的目标是让一个**有开发能力但不了解项目**的模型，通过读按任务范围选择的规范文件、设计文档和当前 Task 明确涉及的具体文件，产出与项目风格一致的代码。

原则：DRY、YAGNI、TDD。

## 项目规范来源

- `spec/standards-index.md` 是规范索引页，不再承载完整规范正文
- 项目级规范按任务范围只读取需要的文件：
  - 前端 → `spec/frontend/vue/coding-standards.md`
  - 后端 Java → `spec/backend/java/coding-standards.md`
  - 表结构 / SQL → `spec/backend/db/coding-standards.md`
- 上述已选择的规范文件才是技术栈、架构、代码规范的唯一来源
- 禁止通过扫描仓库代码来推断这些项目级约定
- 注意：`spec/standards-index.md` 在 CWD 下，仅用于定位规范；Task 中引用的源码文件路径应指向 `PROJECT_ROOT` 或 `SOURCE_ROOT`
- 参考文件只允许列出当前 Task **明确要修改、调用、继承或对齐**的具体文件，不得作为“扫描项目学习风格”的手段

## API Contract Gate（HARD-GATE）

对于**已有 UI 实现或原型实现**的页面：

- API path / method / request params / response fields 的真相来源是该页面的精确 UI 文件：页面 `.vue` + API 文件 + 类型文件 + 直接相关的 mock 文件（若有）
- 选中的规范文件只约束项目风格，不负责定义业务 API 契约
- `frontend-detail-design.md` / `backend-detail-design.md` 中的 API 契约如果与 UI 实现不一致，且 `diff.md` 没有明确决议要求改契约，**不得继续生成 plan**
- 此时必须停止并回退到 `brainstorming` 修正文档，而不是带着漂移的接口契约继续写 plan

## 当前版本目录契约

- `diff.md`、`index.md`、`frontend-detail-design.md`、`backend-detail-design.md`、`shared-plan.md`、`plan.md` 必须来自**同一个当前版本目录**
- 当前版本目录默认取**当前 diff 文档所在目录**
- 如果存在多个 commit 版本目录，而你无法唯一确定哪个才是本次任务的当前版本目录，必须停止并要求用户重新确认或先重跑 `prd-diff-scan`
- 一旦当前版本目录确定，后续只允许读取该目录中的 `index.md`、设计文档和计划文件；其他版本目录一律忽略

## Prerequisites (HARD-GATE)

Before writing any plan, follow this decision tree in order. Stop at the first ⛔.

```
Q1: 本次 session 提供了 PRD / 需求文档？
  否 → 跳到 Q4
  是 ↓
Q2: 当前版本目录中的 diff.md 存在？
  确定当前版本目录（不得使用 `docs/plans/**/diff.md` glob 扫描）：
  - 如果用户或上游 skill 给出了确切版本目录路径 → 直接使用
  - 如果用户给出了任务目录 → 列出子目录找最新 commit 版本目录
  - 如果存在多个候选且无法唯一确定 → ⛔ STOP: "❌ 当前版本目录不明确。请先确认使用哪一个 commit 版本目录。"
  确定后用 Read 直接读取 `<当前版本目录>/diff.md`
  不存在 → ⛔ STOP: "❌ 缺少差异扫描文档。请先完成 prd-diff-scan。"
  存在 → 验证文档身份（标题、PRD 路径与当前任务一致）↓
Q3: diff 文档有 Git 基线且 commit 一致？
  （无 Git 基线 → 跳到 Q4）
  （执行 git -C <原型目录> log -1 --format="%H"，与 diff 文档的 Commit ID 比对）
  不一致 → ⛔ STOP: "❌ diff 文档已过期，请重新执行 prd-diff-scan。"
  如果文档中存在 `待核对` / `需核对` / `待读取` / `未读取源码` 等未完成标记 → ⛔ STOP: "❌ diff 文档未完成，请先重新执行 prd-diff-scan。"
  一致 ↓
Q4: 当前版本目录中的 index.md 和设计文件完整？（无论有无 PRD，此步必做）
  用 Read 直接读取 `<当前版本目录>/index.md`（不得使用 Glob 扫描）
  不存在 → ⛔ STOP: "❌ 缺少 index.md。请先完成 brainstorming 生成设计文档。"
  存在 → 读取当前版本目录中的 index.md → 按页面清单检查：
  - Frontend in scope → 每个页面需有 frontend-detail-design.md
  - Backend in scope → 每个页面需有 backend-detail-design.md
  缺失 → ⛔ STOP: 列出缺失的页面和设计文件，要求先完成 brainstorming
  完整 ↓
Q5: 确定范围：
  - Frontend in scope：diff 或 session 提到 UI / 页面 / 前端 gaps
  - Backend in scope：diff 或 session 提到 API / DB / 后端 gaps
  - 两侧都在范围内且用户未缩小范围 → 每个页面的 plan.md 中按接口维度切 Task，每个 Task 同时包含后端和前端联调
```

If all checks pass, read design document(s), current diff document (`diff.md`), index.md, and the relevant standards files selected from `spec/standards-index.md` as input. `diff / index / 设计文档` must all come from the same current version directory.

Before writing any plan, also verify:

- Frontend / backend detailed design API path + request params + response fields are mutually consistent
- If the page has existing UI implementation, those API definitions are traceable to the exact UI page/API/type files or an explicit confirmed diff decision
- Any unresolved `待确认` API contract item = STOP; do not generate plan on top of it

Never treat a generic `继续` as approval to bypass the design gate.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** Per-page plan files inside the current version directory (see Plan Generation Flow below).

## 执行追踪元数据（必填）

### index.md 执行追踪格式

在 `index.md` 中添加执行追踪表（不含 Token 列）：

```markdown
## 执行追踪

| 阶段 | 备注 |
|------|------|
| prd-diff-scan | 全量扫描 |
| brainstorming | 4 个页面 |
| writing-plans | 5 个 plan 文件 |
| executing-plans | 进行中 |
```

### plan.md 任务状态格式

在每个 `plan.md` 的任务状态表中追踪状态：

```markdown
## 任务状态

| 任务 | 描述 | 状态 |
|------|------|------|
| Task 1 | 创建数据库表 | 已完成 |
| Task 2 | 创建共享实体类 | 进行中 |
| Task 3 | 创建菜单配置 SQL | 未开始 |
```

---

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
Task 2: 订单列表接口（Entity + Mapper + XML + Service + Controller）
Task 3: 订单确认接口（Service 方法 + Controller 端点）
Task 4: 发货记录查询接口（Entity + Mapper + XML + Service + Controller）
Task 5: 寄售库存查询接口（Entity + Mapper + XML + Service + Controller）
```

**优势**：每个 Task 都是独立闭环；不会出现"Controller 写了但 Service/Mapper 遗漏"的断层。

**注意**：如果多个接口共用同一个 Entity，在第一个用到它的 Task 里创建，后续 Task 注明"Entity 已在 Task N 创建"。

### 纯前端：按页面维度切

每个 Task 对应一个页面，范围清晰：

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

当前 diff 文档中影响范围为"前端"且不依赖任何后端接口变更的差异（如固定列、默认值、导出格式、搜索字段修正），必须有独立的 Task 覆盖。不得因为"只是前端小改动"而省略。

典型的前端独立差异 Task：
```
Task N: [页面名] 前端差异修复
  创建/修改文件: myOrder.vue
  业务规则:
  1. D1: 表格固定列 — 序号/状态/订单编号/行项目/物料号/物料名称列添加 fixed="left"
  2. D5: 发货默认数量 — el-input-number 默认值改为 row.remainingQuantity
  3. D26: 确认弹窗补物料品牌列
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

### 跨页面依赖：拆成后置 Task，不要阻塞整页

多页面场景下，默认目标是：`shared-plan.md` 完成后，**所有页面都能立即进入并行执行**。因此，不能把"本页有一小段工作依赖另一个页面"直接翻译成"整个页面依赖另一个页面"。

正确切法：

- 本页可独立完成的工作先拆成前面的 Task：前端差异、页面结构、独立接口、本地交互等
- 只有真正依赖其他页面输出的那一小段工作，才单独拆成**后置 Task**
- 跨页面共享基础设施（表、Entity、菜单、路由骨架）继续放进 `shared-plan.md`
- **禁止**让某个页面的 `Task 1` 直接依赖其他页面；一旦 `Task 1` 跨页依赖，就等于把整页串行化了

不合格：

```markdown
# order-ledger/plan.md
Task 1: 接入复用的订单列表接口
依赖: my-order Task 2
```

合格：

```markdown
# order-ledger/plan.md
Task 1: 前端差异修复
Task 2: 页面本地交互与表格结构调整
Task 3: 接入复用的订单列表接口
依赖: my-order Task 2
```

这样生成出来的 plan，subagent 才能在 `shared-plan.md` 完成后直接把多个页面一起拉起，并且只在最后一个显式依赖 Task 上等待。

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
3. **逐条扫描当前 diff 文档的 D1-D{N}** → 每个 Dx 都能在 Plan 中找到对应 Task。特别注意影响范围为"前端"的 Dx，这些经常被遗漏
4. 检查 index.md 的 API 映射：如果多个页面共用同一接口（如"是否共享 = 是"），后续页面不得重复创建 Controller/Service/Mapper
5. 多页面场景下，检查是否存在"整页依赖另一页"的切法；如果有，必须拆成页面内可先执行的 Task + 显式后置依赖 Task
6. 如有遗漏，补充 Task 后再保存

## Plan Generation Flow（按页面生成 plan）

### 流程概述

1. 读取当前版本目录中的 `index.md` 获取页面清单和页面-API 映射
2. 读取当前 diff 文档（`diff.md`）获取差异和已确认决议
3. 检查是否有跨页面共享的基础设施任务（建表、菜单配置等）→ 如有则生成 `shared-plan.md`（参考第一个页面的 backend-detail-design.md 中的 DB 表定义和共享实体）
4. **对每个页面**（按 index.md 页面清单顺序）：
   - 读取该页面的 `frontend-detail-design.md` 和 `backend-detail-design.md`
   - 先写本页可独立执行的 Task，再把真正跨页面依赖的收尾动作拆成显式后置 Task
   - 不得生成"整个 `<page>/plan.md` 依赖另一个 `<page>/plan.md`"的结构
   - 生成 `<page-slug>/plan.md`
5. 更新当前版本目录中的 `index.md`：填充 Plan 列链接、添加执行进度表和执行顺序（shared 之后所有页面并行启动，页面内按 Task 依赖串行推进）

### 每个 plan.md 的格式

每个页面的 `plan.md` 顶部必须包含任务状态表（由执行阶段的 skill 更新状态；默认遵循仓库根 `CLAUDE.md` 的执行规则）：

```markdown
# <页面名称> Implementation Plan

> **Execution:** After plan generation, the controller must ask the user to choose execution mode per `CLAUDE.md`: `superpowers:subagent-driven-development` for current-session execution, or `superpowers:executing-plans` for a separate parallel session. Do not assume a default without explicit user choice.

**Goal:** [一句话描述本页面构建什么]

**Page:** <page-slug> (part of <task-name> feature)

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Design Docs:**
- 前端详细设计: `./frontend-detail-design.md`
- 后端详细设计: `./backend-detail-design.md`

**Master Index:** `../index.md`

## 任务状态

| 任务 | 描述 | 状态 |
|------|------|------|
| Task 1 | [描述] | 未开始 |
| Task 2 | [描述] | 未开始 |

---
```

### shared-plan.md 的内容

`shared-plan.md` 包含跨页面只需执行一次的基础设施任务，并保存在当前版本目录中：
- DB 表创建（建表 SQL，参考任意页面的 backend-detail-design.md Section 5.1）
- 共享 Entity / DTO 创建（参考任意页面的 backend-detail-design.md Section 4.2/4.3）
- 路由配置和菜单 SQL
- 其他跨页面共享基础设施

注意：虽然每个页面的后端详细设计都包含完整的共享实体/DB 表定义（自包含原则），但建表和创建 Entity 只需在 shared-plan.md 中执行一次，后续页面的 plan.md 注明"Entity 已在 shared-plan Task N 创建"。

### 更新 index.md

所有 plan.md 生成完毕后，更新当前版本目录中的 `index.md`：

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

> shared 最先执行；shared 完成后，所有页面直接进入并行执行。页面内按 Task 依赖串行推进；跨页面依赖只能体现在显式拆出的后置 Task 上，不能体现在整页顺序上。

1. `shared-plan.md` — [描述]（前置共享任务）
2. `<page1>/plan.md` — [描述]（shared 完成后立即并行启动）
3. `<page2>/plan.md` — [描述]（shared 完成后立即并行启动）
4. `<pageN>/plan.md` — [描述]（如有跨页面依赖，仅该页的后置 Task 等待上游 Task）
```

## Plan Document Header (for each page plan)

**Every page plan MUST start with the header shown in Plan Generation Flow above.**

Do not hard-code a default execution skill in generated plans. Execution mode must be chosen after plan generation via explicit user confirmation, and the generated header should defer to the repository rule instead of assuming either executor.

## Task Structure（核心）

每个 Task 包含 5 个关键要素：

````markdown
### Task N: [组件名称]

**依赖**: Task X, Task Y（必须先完成；优先引用本页前置 Task。跨页面依赖仅允许用于显式拆出的后置 Task，不得让 `Task 1` 依赖其他页面）

> **执行依赖 vs 设计参考**：`依赖` 字段只写**执行依赖**——即 Task B 必须读取或修改 Task A 创建的文件才能工作。如果 Task B 只是参照了与 Task A 相同的设计文档（如 Entity 参照表结构定义），但两者各自独立创建不同文件，则**不构成执行依赖**。设计文档是共享输入，不是上游产物。
>
> 典型误判：建表 SQL（Task A）和 Entity Java 类（Task B）都从 `backend-detail-design.md` 读取表结构定义，各自输出独立文件（`.sql` vs `.java`）→ 无执行依赖，可并行。
>
> 真正的执行依赖示例：Service 层（Task B）需要 import 并调用 Mapper 接口（Task A 创建）→ Task B 依赖 Task A。

> **路径占位符**：`[SOURCE_ROOT]` 和 `[WORKSPACE_ROOT]` 在 plan 中是占位符。实际值在执行阶段由 `using-git-worktrees` 创建 worktree 后确定，controller 负责替换为绝对路径传给 subagent。

**参考文件**（实现前必须先用 Read 工具读取；仅限当前 Task 明确涉及的具体文件）:
- Modify Target: `[SOURCE_ROOT]/path/to/existing/file.java` — 读取当前内容，避免覆盖已有改动
- Dependency/Base: `[SOURCE_ROOT]/path/to/base/BaseEntity.java` — 对齐继承关系或调用方式
- Standards: selected files under `[WORKSPACE_ROOT]/spec/` — 项目级技术栈 / 架构 / 代码规范唯一来源
- Design: `[WORKSPACE_ROOT]/docs/plans/xxx-detail-design.md` Section 4.2 — 字段定义
- For API-related frontend/backend tasks on existing UI pages: include the exact page `.vue`, API file, type file, and related mock file (if any) as reference files so the implementer aligns to the real UI contract instead of only the prose design

**创建/修改文件**:
- Create: `[SOURCE_ROOT]/exact/path/to/NewFile.java`
- Modify: `[SOURCE_ROOT]/exact/path/to/existing.java` — 添加 XXX 方法
- Test: `[SOURCE_ROOT]/exact/path/to/test/NewFileTest.java`
- Copy: `src/views/xxx/detail.vue` ← 原型新增，开发项目不存在（diff F2）
- Overwrite: `src/views/xxx/index.vue` ← 原型修改，开发项目无本地改动（diff F3）
- Merge: `src/views/xxx/list.vue` ← 原型修改，开发项目有本地改动（diff F1）
  - 原型变更要点: [从 diff 中摘要原型改了什么]
  - 保留: [开发项目本地改动中需保留的部分]

**业务规则**:
1. [用自然语言描述规则，一条一行]
2. [字段约束、状态流转、校验逻辑等]
3. [边界情况和异常处理]
````

> **验证和提交不写在 Task 里。** 所有 Task 执行完成后，由 CLAUDE.md Rule 6（延迟编译）、Rule 11（验证优先）和统一提交流程处理。

### Task 6 要素说明

| 要素 | 作用 |
|------|------|
| **参考文件** | 执行者先读当前 Task 明确涉及的具体文件，理解现状；项目级规范以按范围选择的标准文件为准 |
| **设计文档引用** | 字段、接口、规则已在详细设计中，不重复 |
| **业务规则** | 自然语言描述 WHAT，执行者翻译成 HOW |
| **创建/修改文件** | 精确路径，不猜测；涉及原型文件时标注合并策略（Copy/Overwrite/Merge）和 diff 编号（Fx） |
| **依赖关系** | 防止跳步；多页面场景下仅允许显式后置 Task 依赖其他页面 |

### 什么可以写在 Task 里

- 业务规则（自然语言）
- 关键的非显而易见的技术要点（如"用 `@Transactional` 包裹状态更新和发货记录创建"）
- 特殊的数据结构或算法描述（如"内存分页：先全量查询 SAP，再 subList 截取"）
- 原型文件合并策略（Copy/Overwrite/Merge）和对应的 diff 变更文件清单编号（Fx）

### 什么不要写在 Task 里

- 完整的类实现代码（参考文件 + 业务规则足够）
- Getter/Setter/ToString 等样板代码
- 完整的 SQL DDL（设计文档里已有，用 `Design: backend-detail-design.md Section 5.1` 引用）
- 完整的查询 SQL（设计文档 Section 7 已有，引用即可；Task 中只写关键的 WHERE 条件说明）
- 完整的 MyBatis XML 映射文件
- 完整的 import 列表（按相关规范文件和具体目标文件保持一致）
- 设计文档里已经写明的字段列表（直接引用 Section 编号）
- **编译相关的完成条件**：不得在 Task 中写"编译无错误"、"无 import 错误"、"无类型不匹配警告"等编译验证条件——编译检查由 CLAUDE.md Rule 6（延迟编译）在所有 Task 完成后统一执行
- **"同上"**：每个 Task 的参考文件必须列出完整路径，不得写"同上""同 Task 1"。执行者可能单独看某个 Task，看不到"上"是什么

### ⛔ BANNED — 以下内容出现在 Task 中 = Plan 不合格

Task 中禁止出现以下任何模式。如果你生成的 Task 包含这些内容，**必须删除后再保存**：

```
# 禁止的验证/编译段
验证:
**验证**:
验证：

# 禁止的编译命令
mvn compile
mvn package
npm run build
gradle build
tsc

# 禁止的编译完成条件
编译无错误
无编译错误
无 import 错误
无类型不匹配
compile without error
```

**为什么**：Task 中的 `验证:` 段会被弱模型当作执行指令，导致 implementer subagent 在编码阶段运行编译命令，违反延迟编译规则（CLAUDE.md Rule 6）。即使 implementer prompt 中有"忽略验证段"的兜底指令，弱模型也会直接执行看到的命令。唯一可靠的防线是**在源头就不生成这些内容**。

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
```

**不合格：按技术层横切** → Task 3 写所有 Mapper，Task 7 写所有 Controller（模块断层，无法逐步验证）

**不合格：省略 Task** → `Task 5-12（省略，按设计文档实现）`

## Remember
- 精确的文件路径
- 参考文件 + 业务规则代替完整代码
- 每个 Task 30-60 行，禁止省略任何 Task
- DRY, YAGNI, TDD
- 设计文档里已有的内容用 Section 引用，不重复
- 禁止占位符值（XXX、???、TODO_ID）
- 每个 DTO 都有创建 Task
- **Task 中不写验证和提交**——由 CLAUDE.md Rule 6/7 在所有 Task 完成后统一处理
- **Task 中不写编译完成条件**——"编译无错误"、"无 import 错误"、"无类型不匹配警告"等由延迟编译阶段统一检查

## 落盘前自检（必须执行）

Plan 保存前必须逐项自检：

| # | 检查项 | 通过？ |
|---|--------|-------|
| 1 | 后端详细设计中每个 Controller → Plan 中有完整的垂直切片 Task（Entity + DTO + Mapper + Service + Controller） | ✅/❌ |
| 2 | 前端详细设计中每个页面 → Plan 中有对应 Task | ✅/❌ |
| 3 | 后端详细设计 Section 4.3 中每个 DTO → Plan 中有创建文件项 | ✅/❌ |
| 4 | Plan 中无占位符值（`XXX`、`???`、`TODO_ID`、未替换的 `{{xx}}`） | ✅/❌ |
| 5 | 当前 diff 文档中每个差异 Dx → Plan 中有对应 Task 处理（**包括影响范围为"前端"的 Dx**，逐条核对不得遗漏） | ✅/❌ |
| 6 | 参考文件路径全部为真实存在的文件（用 Read 验证存在性），**无"同上"** | ✅/❌ |
| 7 | Task 中**无完整 SQL DDL / 查询 SQL**（应引用设计文档 Section 编号），每个 Task ≤ 60 行 | ✅/❌ |
| 8 | index.md 页面清单**无重复行**（每个 page-slug 只出现一次） | ✅/❌ |
| 9 | **共享接口去重**：index.md API 映射中标记"是否共享=是"的接口，后续页面 plan 不得重复创建 Controller/Service/Mapper | ✅/❌ |
| 10 | **多页面并行友好**：不得出现"整页依赖另一页"的结构；跨页面依赖已拆成显式后置 Task，页面在 shared 后可直接并行启动 | ✅/❌ |
| 11 | **无编译验证条件**：全文搜索 `mvn compile`、`npm run build`、`编译无错误`、`无 import 错误`、`无类型不匹配` — Task 中不得出现任何此类内容（CLAUDE.md Rule 6） | ✅/❌ |
| 12 | **依赖最小化**：每个 `依赖` 字段仅声明执行依赖（Task B 必须读取/修改 Task A 创建的文件），不含设计参考依赖（两个 Task 参照同一设计文档但各自创建独立文件）。特别检查 shared-plan 中建表 SQL、Entity、DTO、菜单 SQL、路由等互不引用的 Task 是否被错误串联 | ✅/❌ |
| 13 | **API 契约一致性**：frontend-detail-design / backend-detail-design 中的 API path、入参、出参与当前页面真实 UI 契约一致；若页面已有 UI 实现，plan 的 API Task 已引用精确的页面/API/类型文件，而不是只引用设计文档散文描述 | ✅/❌ |

任一项为 ❌ → 补全后再保存。

**总裁定（必须在自检表最后输出）**：

```
## 自检总裁定: [PASS / FAIL]
```

- 13 项全部 ✅ → `PASS`，可以落盘
- 任何一项 ❌ → `FAIL`，**绝对不得落盘**。必须定位失败项、修复后重新执行完整自检，直到 `PASS` 才能保存
- **禁止绕过**：不得在 FAIL 时以"后续补充"等理由保存半成品 plan

## Execution Handoff

After saving all page plans and updating index.md:

```
Plan complete. Page plans saved to:
  docs/plans/<task>/<commitid>/shared-plan.md (N tasks)   # 有 commit 时
  docs/plans/<task>/<commitid>/<page1>/plan.md (N tasks)  # 有 commit 时
  ...
Master index updated: docs/plans/<task>/<commitid>/index.md
```

> **路径传递**：调用执行 skill 时，必须传递当前版本目录确切路径 + `PROJECT_ROOT`。执行 skill 不应重新发现这些路径。

**Execution mode selection is a hard gate.**

- If the user has already explicitly chosen the execution mode in the current session, reuse that choice.
- Otherwise, you **MUST** call `AskUserQuestion` and wait for the answer before invoking any execution skill.
- Do **NOT** silently default to `subagent-driven-development` or `executing-plans`.

Use this exact choice set:

1. **Subagent-Driven (当前会话)** — 使用 `superpowers:subagent-driven-development` 在当前会话中逐任务执行
2. **Parallel Session (独立会话)** — 使用 `superpowers:executing-plans` 在独立会话中执行

After the user chooses:

- Pass the exact current version directory path + `PROJECT_ROOT` to the chosen execution skill
- Announce which execution mode was selected
- Invoke only the chosen execution skill
