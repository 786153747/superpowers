---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

If the user explicitly wants **详细设计** and the project has templates under `spec/`, use the matching template when you save the final document.

In a PRD/UI-driven development-design workflow, treat detailed design as the default written output for every in-scope side:
- Frontend is in scope when the input or diff mentions a UI project, page paths, page interactions, or frontend changes/blockers.
- Backend is in scope when the input or diff mentions APIs, controllers/services/mappers, database work, SAP/mock integration, or backend changes/blockers.
- If both sides are in scope and the user did not explicitly narrow scope, you MUST produce two detailed-design docs before any planning: **先写前端，再基于前端文档写后端**。

## 自动测试 / 非交互模式（窄例外）

默认仍然是**一步一轮、逐轮确认**。

只有同时满足以下条件，才允许把多步串起来自动执行：

- 用户明确说这是自动测试、CI、批处理或非交互场景
- 用户明确说：没有 blocker 时，默认采用推荐方案
- 用户明确说：默认同意继续下一步、默认同意落盘

启用后可以这样做：

- 不必在 Step 3 / Step 4 / Step 5 / Step 6 之间逐轮停下
- 可以把用户的授权视为：已批准推荐方案、已批准继续、已批准保存文档
- 如果用户明确要详细设计，可以直接写并落盘 `*-detail-design.md`

但下面这些情况仍然**必须停**：

- diff 里还有未解决 blocker
- 关键业务规则不清
- 前后端模板所需信息明显不足
- 你需要用户拍板而不是推荐

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.

Replies like `继续`, `下一步`, `往下走`, or answers to clarification questions do NOT count as design approval on their own. Outside explicit auto-test / non-interactive mode, you must still save the design docs, STOP, and wait for an explicit confirmation to enter `writing-plans`.
</HARD-GATE>

## Restrictions

- This skill can create `*-design.md` documents, and it may create `*-detail-design.md` when the user explicitly asks for detailed design
- Do NOT create: `*-diff.md`, `*-plan.md`, `*-db-design.md` — these belong to other skills
- **One step per turn**: complete one step, then STOP and wait for user to reply. Do NOT continue to the next step in the same turn.
- In explicit auto-test / non-interactive mode, you may combine steps after prerequisites are satisfied and no blockers remain.
- Do NOT do the diff scan yourself. If diff.md is missing, stop and tell the user.
- If both frontend and backend are in scope, Step 5 must present both sides (先前端后后端) and Step 6 must save two docs (先前端，再基于前端写后端). Do NOT silently drop one side because it looks "already implemented".

---

## Steps (one step per turn — STOP after each step and wait for user)

You MUST create a task for each step and complete them in order.
**Each step = one conversation turn.** After completing a step, end your message and wait for user input.

---

### Step 1: Explore project context

- Check out the current project state (files, docs, recent commits)
- Understand what the user wants to build
- If `spec/index.md` exists, read it. If the user wants frontend/backend detailed design, also note the matching template path under `spec/`

**After completing exploration, end your turn.** Present a brief summary of what you found and ask the user one clarifying question.

In explicit auto-test / non-interactive mode, if the user already supplied the needed defaults and there are no blockers, you may continue without stopping.

---

### Step 2: Check PRD diff scan prerequisite

If no PRD / requirement doc was provided → skip to Step 3.

If user provided PRD or requirement doc:

1. Use Glob to check if `docs/plans/*/diff.md` exists
2. If exists → Read the diff document, then **验证完整性与新鲜度**：
   - diff 文档是否包含 `原型目录`
   - 如果 diff 文档记录 `Git 仓库根目录 != 无`，则必须同时记录 `当前原型 Commit ID` 和 `当前原型 Commit 时间`
   - 如果 diff 文档记录了 Git 信息，使用 diff 文档中的 `原型目录` 执行 `git -C <原型目录> log -1 --format="%H%n%cI"` 读取当前 HEAD；若当前 HEAD 与 diff 文档中的 `当前原型 Commit ID` 不一致 → **STOP**，告知用户先重新执行 `prd-diff-scan` 更新 diff
   - 每个 PRD 页面是否都有 5 维度对比（UI 可视要素 + 控件矩阵 + 字段对比 + 9 维度 + 验收点）
   - 差异清单 Dx 是否覆盖了对比表中所有「差异」行
   - 建议决议是否逐项覆盖了所有 Dx 和 Bx
   - 如果不完整或 Git 基线已过期 → **STOP**，告知用户差异扫描不完整或已过期，需重新执行 `prd-diff-scan`
   - 如果完整 → 提取差异决议表中所有「⏳ 待确认」的 Dx 和 Bx 条目，统计待确认总数，告知用户"Step 3 将逐项确认这 N 项差异和 Blockers"，然后 proceed to Step 3
3. If NOT exists → **STOP. End your turn immediately.** Output only this:

> ❌ 差异扫描文档不存在。请先单独执行 `prd-diff-scan` skill 完成差异扫描：
> `Skill("superpowers:prd-diff-scan")`
> 差异扫描完成后再执行 brainstorming。

Do NOT create the diff document yourself. Do NOT continue. End your turn.

---

### Step 3: 逐项确认差异决议 + 需求澄清

当存在 diff 文档时，Step 3 的**首要任务**是逐项确认差异决议表中所有「⏳ 待确认」的 Dx 和 Bx。**全部确认完毕之前，不得进入 Step 4。**

#### 3a. 逐项确认差异决议（diff 文档存在时必做）

每轮展示**一批**待确认项（建议 3-5 项/批），格式如下：

```
以下差异项需要您确认（第 X/Y 批，共 N 项待确认）：

| 编号 | 差异/问题摘要 | 建议处理方案 | 您的决定 |
|------|-------------|-------------|---------|
| D1 | [摘要] | [建议方案] | ⏳ 请确认 |
| D2 | [摘要] | [建议方案] | ⏳ 请确认 |
| D3 | [摘要] | [建议方案] | ⏳ 请确认 |

请逐项确认：同意建议 / 选择其他方案 / 有疑问需讨论。
```

流程：
- 用户回复后，记录每项的用户决定
- **STOP，等待用户回复**
- 展示下一批待确认项
- **重复直到所有 Dx 和 Bx 都已确认**
- 全部确认后，用 Edit 工具更新 diff 文档的差异决议表（将「⏳ 待确认」改为「✅ + 用户选择的方案」），并输出确认完成的 checkpoint：

> **CHECKPOINT**: "✅ 差异决议已全部确认（Dx __ 项 + Bx __ 项 = __ 项），diff 文档已更新。"

#### 3b. 其他澄清问题（差异全部确认后）

差异决议全部确认后，如果还有其他需要澄清的问题：
- One question at a time — do NOT ask multiple questions in one message
- Focus on: purpose, constraints, success criteria, business rules

**Ask ONE question, then STOP and wait for user reply.** Repeat until all questions answered.

#### Step 3 → Step 4 门禁

**以下条件全部满足后才能进入 Step 4：**
1. diff 文档的差异决议表中所有 Dx 和 Bx 都已标记 ✅（用户已逐项确认）
2. diff 文档已更新落盘
3. 没有剩余的澄清问题

如果任一条件不满足，继续 Step 3。不得跳过未确认的差异项。

In explicit auto-test / non-interactive mode, if the user already pre-approved the recommended defaults and no blockers remain, you may resolve Step 3 without stopping.

---

### Step 4: Propose 2-3 approaches

- Present 2-3 different approaches with trade-offs
- Lead with your recommended option and explain why

**After presenting approaches, output the following then STOP：**

→ "请选择方案（A / B / C），或提出其他想法。"

<HARD-STOP>
**Do NOT proceed to Step 5 in the same turn.**
This is the most commonly violated gate. After presenting approaches, you MUST end your turn and wait for the user to explicitly choose an approach.
Even if you think the choice is obvious, STOP and wait.
</HARD-STOP>

#### Step 4 → Step 5 门禁

**以下条件全部满足后才能进入 Step 5：**
1. 用户已明确选择了一个方案（如"方案A"、"推荐方案"、"第一个"）
2. 方案选择发生在**用户的回复中**，不是你自己推断的

如果用户只说"继续"/"下一步"而没有选方案，追问"请先选择方案 A / B / C"。不得默认采用推荐方案。

In explicit auto-test / non-interactive mode, you may proceed with your recommended option if the user pre-approved that behavior.

---

### Step 5: Present design

- Scale each section to its complexity
- Cover: architecture, components, data flow, error handling, testing
- If this is a detailed-design request, align the sections with the matching template under `spec/`
- If both frontend and backend are in scope, **先展示前端设计，再展示后端设计**；后端设计的接口清单必须对齐前端控件矩阵中的「调用接口」列
- Ask after each section whether it looks right so far

**After presenting each section, STOP and wait for user feedback.** Only after user approves all sections, output:

In explicit auto-test / non-interactive mode, you may treat the user's pre-approval as approval for all sections unless a blocker appears.

→ **CHECKPOINT**: "✅ 用户已确认设计：`[一句话总结]`。"

---

### Step 6: Write design doc (per-page directory structure)

Design documents are organized by **page** inside a **task directory**:

```
docs/plans/YYYY-MM-DD-<topic>/           # 任务根目录（由 prd-diff-scan 创建）
  index.md                               # 主索引（本步骤创建）
  diff.md                                # 已存在
  <page-slug>/                           # 页面子目录
    frontend-detail-design.md
    backend-detail-design.md
```

#### 6.0 确定任务根目录和页面清单

1. **任务根目录**：从已有的 `diff.md` 所在目录推断。如果 `diff.md` 位于 `docs/plans/YYYY-MM-DD-<topic>/diff.md`，则任务根目录为 `docs/plans/YYYY-MM-DD-<topic>/`。如果不存在 diff.md（无 PRD 场景），则创建 `docs/plans/YYYY-MM-DD-<topic>/`。
2. **页面清单**：从 diff 文档的受影响页面清单或用户提供的需求中提取。每个页面对应一个 kebab-case 的子目录名（page-slug）。

#### 6.1 按页面保存设计文件（每页一轮，逐页推进）

<TOKEN-BUDGET-RULE>
每份前端详细设计 300-500 行，每份后端详细设计 300-500 行。4 个页面 × 2 份 = 8 份文档 ≈ 3000+ 行。
一次性输出全部页面**必然**导致输出截断或质量崩塌。因此 Step 6 按页面拆分为多轮。

**上下文警戒线**：当前对话累计输出超过 60k tokens 时，立即输出以下内容并停止：
```
[CONTEXT-RESET] 上下文接近上限。请开启新对话，粘贴以下内容继续：
- 任务目录: <路径>
- 当前进度: 第 X / 共 Y 个页面，下一步: <动作>
```
等待用户在新对话中确认后再继续。
</TOKEN-BUDGET-RULE>

- Determine scope before writing:
  - Frontend in scope → use `spec/frontend/vue/detail-design-template.md`
  - Backend in scope → use `spec/backend/java/detail-design-template.md`

**每轮只处理一个页面。** 对当前页面：

**Step 6a：前端详细设计**（Frontend in scope 时执行）
1. 创建页面子目录
2. 写入并保存 `<task>/<page-slug>/frontend-detail-design.md`
3. 前端完成后输出自包含确认：
   ```
   ⚠️ 自包含确认 [前端 <page-slug>]：
   - 此文档能否不依赖其他页面独立执行？Y/N
   - 控件矩阵已覆盖所有调用接口？Y/N
   - 字段逐项对照 diff.md PRD 字段对比表？Y/N
   ```
   三项全 Y 才能继续，否则补全后重新确认。

**Step 6b：后端详细设计**（Backend in scope 时执行，必须在 6a 之后）
4. 写入并保存 `<task>/<page-slug>/backend-detail-design.md`
5. 后端完成后输出自包含确认：
   ```
   ⚠️ 自包含确认 [后端 <page-slug>]：
   - 此文档能否不依赖其他页面独立执行？Y/N
   - 接口清单覆盖前端控件矩阵所有「调用接口」？Y/N
   - 请求参数/返回结构与前端类型设计一致？Y/N
   ```
   三项全 Y 才能继续，否则补全后重新确认。

**页面完成**
6. 输出 checkpoint：`"✅ 页面 <page-slug> 设计已保存（第 X / 共 Y 个页面）"`
7. **如果还有更多页面 → STOP，等用户确认后继续下一个页面**
8. **如果是最后一个页面 → 继续到 6.2 创建 index.md**

> Step 6 会跨越多个对话轮次（每个页面一轮）。这是设计性决策，不违反"每步一轮"规则——Step 6 是一个**多轮步骤**，类似 Step 3 的分批确认机制。

In explicit auto-test / non-interactive mode, you may write all pages in one turn if the user has pre-approved.

- If both frontend and backend are in scope, you MUST write both detailed-design docs for each page before moving to the next page
- **前后端都在范围内时的写入顺序**（依赖链：`原型图/PRD → 前端详细设计 → 后端详细设计`）：
  1. **先写前端** `<page-slug>/frontend-detail-design.md`，字段必须逐项对照 `diff.md` 中 PRD 字段对比表（前端是原型的唯一翻译层），通过下方「前端详细设计必填检查」和「原型字段覆盖规则」
  2. **再写后端** `<page-slug>/backend-detail-design.md`，后端只对齐前端、不再独立对照原型，后端文档必须：
     - 在「需求输入」里引用同目录下的前端详细设计文档路径（如 `前端详细设计: ./frontend-detail-design.md`）
     - 接口清单（Section 3）覆盖前端控件矩阵（3.5）中所有「调用接口」列出现的接口，不得遗漏
     - 每个接口的请求参数 / 返回结构与前端类型设计（Section 6）保持一致
     - 如果前端控件矩阵出现了后端模板里没有的接口场景（如导出、批量操作），后端也必须补上
- **后端详细设计的自包含规则**：
  - 每份 `backend-detail-design.md` 必须是**独立可读**的完整文档
  - 跨页面共享的实体、DB 表、公共 API 设计**在每个用到它的页面的后端设计中重复包含**
  - **不创建** `shared-backend-detail-design.md`
  - 如果多个页面用同一张表，每个页面的后端设计都要包含该表的完整字段定义（Section 5.1）
  - 如果多个页面用同一个 Entity，每个页面的后端设计都要包含该 Entity 的完整字段定义（Section 4.2）
  - 相似页面的后端设计：**复制**完整内容后**修改**差异部分，不要写"同 xxx 页面"
- If one side is intentionally out of scope, say so explicitly before writing and record that decision in the saved design output
- Design docs must be written to disk. Do NOT leave them only in chat.

#### 6.2 创建 index.md

所有页面的设计文件保存完毕后，在任务根目录创建 `index.md`：

```markdown
# <功能名称> — 实施索引

## 元信息

- **创建日期**: YYYY-MM-DD
- **PRD**: `<prd路径>`
- **任务根目录**: `docs/plans/YYYY-MM-DD-<topic>/`
- **技术栈**: [如 Vue 3 + Spring Boot + MySQL]

## 页面清单

| 页面 Slug | 页面名称 | 前端设计 | 后端设计 | Plan | 设计状态 | 实施状态 |
|-----------|---------|---------|---------|------|---------|---------|
| <page-slug> | <页面名> | [link](./<page-slug>/frontend-detail-design.md) | [link](./<page-slug>/backend-detail-design.md) | — | 已完成 | 未开始 |

## 页面-API 映射

| 页面 | API 路径 | Method | Controller | 是否共享 |
|------|---------|--------|------------|---------|
| <page-slug> | /api/path | GET/POST | XxxController | 是/否 |
```

说明：
- `Plan` 列此时为 `—`，由 writing-plans 填充
- `设计状态` 标记为 `已完成`（设计文件刚保存完）
- `实施状态` 标记为 `未开始`
- 页面-API 映射从各页面的后端设计接口清单中提取

#### 按页面拆分时的独立性规则（致命级）

每份 `frontend-detail-design.md` **必须是独立可读、独立可执行的完整文档**。开发者只看这一份文档就能完成该页面的前端开发，不需要打开其他页面的设计文档。

**禁止跨页面引用**（以下写法全部禁止）：

- ❌ "同 myOrder 页面"
- ❌ "同我的订单"
- ❌ "同上一个页面"
- ❌ "参见 ../my-order/frontend-detail-design.md"
- ❌ 任何指向其他页面 frontend-detail-design.md 的引用

**唯一允许的引用**：

- ✅ 引用 `diff.md` 中的差异决议

**相似页面的处理方式**：

如果页面 B 和页面 A 结构相似（如订单台账 vs 我的订单），正确做法是：
1. **复制** A 的完整内容到 B 的文档中
2. **删除** B 不需要的部分（如工具栏按钮）
3. **修改** B 特有的部分（如权限、数据范围）
4. 最终 B 的文档是完整的、自包含的

错误做法是写"同 A"——这让 B 的文档变成了 A 的附录，失去了拆分的意义。

**自检方式**：对每份 frontend-detail-design.md 执行 `grep -c "同.*页面\|同.*myOrder\|同 my" <file>`。计数 > 0 = 不合格。

#### 控件矩阵格式规范（每个页面都必须遵守）

控件矩阵（Section 3.5）的格式在所有页面中保持一致，不得因页面简单就删减列：

1. **控件编号**：必须使用 `CXX` 格式（C01、C02、...），从 C01 开始，按页面独立编号
2. **矩阵表头**：必须包含 8 列 `控件 ID | 控件名称 | 类型 | 业务说明 | 触发事件 | 效果描述 | 影响的控件 | 调用接口`
3. **CXX 编号一致性**：3.3 组合图、3.4 交互图、3.5 控件矩阵、Section 8 交互规则中使用相同的 CXX 编号引用同一个控件
4. **控件状态条件子表**：每个页面必须有，格式为 `控件 ID | 权限字符串 | 显示条件 | 禁用条件 | 默认值`
5. **空态与异常（Section 8.5）**：必须使用表格格式，覆盖：空列表、列表接口失败、弹窗详情接口失败、弹窗提交失败、导出失败、字典加载失败（按页面实际情况裁剪不适用的行，但格式必须是表格）

#### 前端详细设计必填检查

生成 `*-frontend-detail-design.md` 时，以下 section 为**必填项**，不得跳过或留占位文本：

| Section | 必须包含 |
|---------|---------|
| 3.2 页面导航关系图 | Mermaid `graph` 画出页面间跳转关系；**只含页面节点**，不含动作节点 |
| 3.3 页面-控件组合图 | Mermaid `graph` 用 CXX 编号列出所有控件，**包括弹窗/抽屉内控件**；多页面时每页单独一张图；单张图不超过 20 个节点 |
| 3.4 控件交互关系图 | Mermaid `graph` 使用标准边类型（清空/刷新/触发/禁用·启用/显示·隐藏/打开·关闭/回填）；多页面时每页单独一张图 |
| 3.5 控件矩阵 | **3.1 中列出的每个页面**都必须有对应子表（不得只写第一个页面）；每行必须有「业务说明」；附「控件状态条件」子表 |
| 8.0 页面初始化 | **每个页面**的挂载行为（加载字典、初始默认值、自动查询） |
| 8.1-8.4 按控件 | **每个页面**的每个交互控件 CXX 都要写，先写**业务场景**再写技术流程，含成功/失败/空态 |
| 8.5 空态与异常 | 无数据和接口异常场景的展示与可操作控件 |
| 10 自检清单 | 模板 Section 10 的 18 项检查全部标记 ✅ 才可保存 |

以上任一 section 缺失或用占位文本糊弄 → 文档不合格，不得保存。

#### 原型字段覆盖规则（前端详细设计的字段权威来源）

前端详细设计是**原型图/PRD 字段的唯一翻译层**，后端详细设计只需对齐前端，不再独立对照原型。因此前端设计必须保证字段与原型完全一致：

1. 写 Section 6（类型设计）和 Section 3.5（控件矩阵）时，必须**逐字段对照** `diff.md` 中的 PRD 字段对比表
2. PRD 中列出的字段不得遗漏（除非 diff 差异决议明确标记「不做」）
3. PRD 中没有的字段不得凭空新增（后端审计字段如 createTime/delFlag 由后端设计补充，不算前端新增）
4. 字段名称、类型、业务含义必须与 PRD 描述一致；如有重命名，需在字段备注中注明「PRD 原名: xxx」

#### 自检门禁

保存 `*-frontend-detail-design.md` 前，必须：
1. 填写模板 Section 10 自检清单，逐项标记 ✅ / ❌
2. 如有任何 ❌ → 修正对应内容后重新检查
3. 全部 18 项 ✅ → 方可执行 Write 保存文档

#### 后端详细设计必填检查

生成 `*-backend-detail-design.md` 时，以下 section 为**必填项**，不得跳过或留占位文本：

| Section | 必须包含 |
|---------|---------|
| 需求输入 | 引用前端详细设计文档路径 |
| 2 受影响模块 | 3.1 接口清单中**每个 Controller** 都有对应的 Service + Mapper |
| 3.1 接口清单 | 覆盖前端控件矩阵中所有「调用接口」 |
| 3.2 接口详细定义 | 每个接口有权限标注；非 CRUD 接口有请求体 DTO；**每个写操作接口（POST/PUT/DELETE）有「业务逻辑」小节，用有序步骤描述完整实现（校验→前置检查→核心操作→异常分支→返回值），不得只写结论** |
| 4.2 关键字段 | 与前端类型设计**逐字段对齐**，**不得用省略号** |
| 4.3 DTO 设计 | 查询参数 DTO 覆盖前端 `queryParams` 所有字段；非标准操作有请求体 DTO |
| 5.1 表字段 | **完整列出**，不得用省略号；注明默认值约定和删除策略 |
| 6.1 方法清单 | 覆盖 3.1 中**每个接口** |
| 6.2 跨接口规则 | 只写状态机/数据权限注入等跨接口通用规则；单接口逻辑已在 3.2「业务逻辑」中写清 |
| 7 查询 SQL | **每个查询接口**都有伪 SQL（主表/动态条件类型/排序），不需要完整 XML |
| 10 前后端对齐 | 四张对齐表已填写（接口覆盖 + 请求参数 + 响应字段 + 枚举值） |
| 自检清单 | 模板头部自检清单 12 项全部标记 ✅ 才可保存 |

以上任一 section 缺失或用占位文本糊弄 → 文档不合格，不得保存。

#### 后端完整链路防护规则（致命级）

**每个 Controller 必须有完整的下游链路**：Entity + DTO + Service + Mapper + XML + 伪 SQL。

自检方式：列出 Section 3.1 接口清单中所有 Controller，逐个核对：

| Controller | Entity (4.2) | QueryDTO (4.3) | Service (6.1) | Mapper (2) | XML (2) | 伪 SQL (7) |
|------------|-------------|-----------------|--------------|------------|---------|------------|
| XxxController | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

**任一 ❌ = 文档不合格**，必须补全后再保存。

常见遗漏场景（必须警惕）：
- Controller 接口定义了，但因为"TODO 对接外部系统"就跳过了 Entity/Service/Mapper — **禁止**。即使真实调用逻辑留空，编译所需的 Entity/Service/Mapper 必须定义
- 多个 Controller 共用一个 Entity，但其中某个 Controller 的专用 DTO/Service 方法被遗漏 — **必须逐个检查**
- Section 2 受影响模块表只列了部分 Controller 的 Service/Mapper — **必须与 3.1 接口清单 1:1 对齐**

#### 前端 API 文件覆盖防护规则

**每个不同的 API 基路径必须有对应的 API 文件**：

检查前端控件矩阵（3.5）中所有「调用接口」列，提取不同的 API 基路径（如 `/order/xxx` 和 `/inventory/consignment/xxx` 是两个不同基路径）。每个基路径在 Section 2 受影响文件中都必须有对应的 API 文件。

遗漏示例：控件矩阵中有 `GET /inventory/consignment/list`，但 Section 2 只列了 `api/order/index.ts` — 缺少 `api/inventory/index.ts`。

#### 后端自检门禁

保存 `*-backend-detail-design.md` 前，必须：
1. 填写模板头部自检清单，逐项标记 ✅ / ❌
2. 如有任何 ❌ → 修正对应内容后重新检查
3. 全部 12 项 ✅ → 方可执行 Write 保存文档
- Do NOT create plan.md, db-design.md, or diff.md here.
- Commit the design documents to git

→ **CHECKPOINT**: "✅ 全部 Y 个页面的设计文档已保存到 `docs/plans/YYYY-MM-DD-<topic>/` 目录，index.md 已创建。"

**After saving index.md, STOP.** Ask user: "设计文档已保存。是否现在进入实施计划（writing-plans）？"

Do NOT create `*-plan.md`, invoke `writing-plans`, or start coding in the same turn unless this is explicit auto-test / non-interactive mode with prior user approval to continue automatically.

In explicit auto-test / non-interactive mode, you may stop immediately after saving and report the saved paths.

---

### Step 7: Transition to implementation

Only after user explicitly confirms the saved design docs are approved → invoke the writing-plans skill.
If the user only says `继续` / `下一步`, treat that as permission to continue the current discussion, not as permission to create a plan or start implementation.
Do NOT invoke any other skill. writing-plans is the ONLY next step.

---

## Process Flow

```dot
digraph brainstorming {
    "Step 1: Explore context" [shape=box];
    "STOP: wait for user" [shape=octagon style=filled fillcolor=lightyellow];
    "Has PRD?" [shape=diamond];
    "Step 2: Check diff.md" [shape=box];
    "diff.md exists?" [shape=diamond];
    "STOP: run prd-diff-scan" [shape=octagon style=filled fillcolor=salmon];
    "Step 3: Clarify (1 question)" [shape=box];
    "STOP: wait for answer" [shape=octagon style=filled fillcolor=lightyellow];
    "Step 4: Approaches" [shape=box];
    "STOP: wait for choice" [shape=octagon style=filled fillcolor=lightyellow];
    "Step 5: Design" [shape=box];
    "STOP: wait for approval" [shape=octagon style=filled fillcolor=lightyellow];
    "Step 6: Write design.md" [shape=box];
    "STOP: confirm next" [shape=octagon style=filled fillcolor=lightyellow];
    "Step 7: writing-plans" [shape=doublecircle];

    "Step 1: Explore context" -> "STOP: wait for user";
    "STOP: wait for user" -> "Has PRD?";
    "Has PRD?" -> "Step 2: Check diff.md" [label="yes"];
    "Has PRD?" -> "Step 3: Clarify (1 question)" [label="no"];
    "Step 2: Check diff.md" -> "diff.md exists?";
    "diff.md exists?" -> "Step 3: Clarify (1 question)" [label="yes"];
    "diff.md exists?" -> "STOP: run prd-diff-scan" [label="no"];
    "Step 3: Clarify (1 question)" -> "STOP: wait for answer";
    "STOP: wait for answer" -> "Step 4: Approaches";
    "Step 4: Approaches" -> "STOP: wait for choice";
    "STOP: wait for choice" -> "Step 5: Design";
    "Step 5: Design" -> "STOP: wait for approval";
    "STOP: wait for approval" -> "Step 6: Write design.md";
    "Step 6: Write design.md" -> "STOP: confirm next";
    "STOP: confirm next" -> "Step 7: writing-plans";
}
```

## Key Principles

- **One step per turn** - Complete one step, stop, wait for user
- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Blockers first** - If diff scan found blockers, resolve them before proposing approaches
