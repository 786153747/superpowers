# 全流程测试用例

## 测试环境

- **原型项目**（PRD + UI 原型）：`D:\workspace\ruoyi\ruoyi`（独立 Git 仓库）
- **开发项目**：当前项目 `D:\workspace\ruoyi\superpowers-lite`
- **PRD 文件**：`D:\workspace\ruoyi\ruoyi\prd\后市场订单库存功能需求规格说明书.md`
- **UI 原型目录**：`D:\workspace\ruoyi\ruoyi\ruoyi-ui`

### 原型项目页面清单

| 页面 | 原型文件 | API 文件 |
|------|---------|---------|
| 我的订单 | `src/views/order/myOrder.vue` | `src/api/order/index.ts` |
| 发货记录 | `src/views/order/deliveryRecord.vue` | `src/api/order/index.ts` |
| 寄售库存查询 | `src/views/inventory/consignmentInventory.vue` | `src/api/inventory/index.ts` |
| 订单台账 | `src/views/report/orderLedger.vue` | — |

---

## TC-01: prd-diff-scan 全量扫描

### 前提条件

- `docs/plans/` 下无已有 diff 文档（首次扫描）

### 输入

```
PRD: D:\workspace\ruoyi\ruoyi\prd\后市场订单库存功能需求规格说明书.md
原型目录: D:\workspace\ruoyi\ruoyi\ruoyi-ui
```

### 执行

调用 `Skill("superpowers:prd-diff-scan")`，提供 PRD 路径和原型目录路径。

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 创建任务目录 | `docs/plans/2026-03-14-后市场订单库存/` 目录被创建 | |
| 2 | diff.md 存在 | `docs/plans/2026-03-14-后市场订单库存/diff.md` 已写入 | |
| 3 | 比对基线 | 包含 `原型目录`、`Git 仓库根目录`、`当前原型 Commit ID`、`当前原型 Commit 时间`，均非"无" | |
| 4 | 比对模式 | `全量扫描`（首次，无旧 diff） | |
| 5 | 受影响页面清单 | 4 个页面：我的订单、发货记录、寄售库存查询、订单台账 | |
| 6 | 每页面 5 维度完整 | 每个页面都有：UI 可视要素 + 控件矩阵 + 字段对比 + 9 维度 + 验收点 | |
| 7 | 无「待核对」结论 | diff.md 中不存在「待核对」「需核对」等未决结论 | |
| 8 | 差异清单完整 | 对比表中每个「差异/缺失/新增」行都有对应 Dx | |
| 9 | 建议决议覆盖 | 每个 Dx 和 Bx 都有对应建议处理方案 | |
| 10 | **变更文件清单**（新增功能） | 包含 `## 变更文件清单` 小节，列出原型目录下所有相关文件 | |
| 11 | 变更文件清单 - 变更类型 | 全量扫描模式下统一标为 `全量` | |
| 12 | 变更文件清单 - 开发文件状态 | 每个文件判定了 `不存在` 或 `已存在（需人工判断）` | |
| 13 | 变更文件清单 - 合并策略 | 不存在 → `复制 + 适配`；已存在 → `智能合并` | |
| 14 | 落盘前自检 | 8 项自检全部通过（含新增的第 8 项变更文件清单检查） | |
| 15 | 停止等待 | 输出保存路径后停止，不自动进入 brainstorming | |

---

## TC-02: prd-diff-scan 增量刷新 + 变更文件清单

### 前提条件

- TC-01 已完成，`docs/plans/2026-03-14-后市场订单库存/diff.md` 已存在且包含 Git 基线
- 在原型项目中修改了至少 1 个文件并 commit

### 准备步骤

```bash
# 在原型项目中模拟修改
cd D:\workspace\ruoyi\ruoyi
# 修改我的订单页面（添加一个注释）
echo "<!-- test change -->" >> ruoyi-ui/src/views/order/myOrder.vue
git add ruoyi-ui/src/views/order/myOrder.vue
git commit -m "test: 模拟原型修改"
```

### 执行

再次调用 `Skill("superpowers:prd-diff-scan")`，提供同样的 PRD 路径和原型目录路径。

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 比对模式 | `增量刷新`（旧 diff 有效，commit ID 不同） | |
| 2 | 本次重检文件 | 只列出 `ruoyi-ui/src/views/order/myOrder.vue`（实际变更的文件） | |
| 3 | 未变更页面 | 发货记录、寄售库存查询、订单台账 → 沿用旧 diff 的对比内容 | |
| 4 | 变更页面重做 | 我的订单 → 重做 5 维度对比 | |
| 5 | **变更文件清单** | `## 变更文件清单` 显示基线 Commit 变化（旧→新） | |
| 6 | 变更文件清单 - 文件数 | 1 个文件：`src/views/order/myOrder.vue` | |
| 7 | 变更文件清单 - 变更类型 | `修改`（M） | |
| 8 | 变更文件清单 - 开发文件状态判定 | 需正确判定开发项目中对应文件是否存在、是否有本地改动 | |
| 9 | 变更文件清单 - 合并策略 | 根据开发文件状态正确推断（直接覆盖/智能合并） | |
| 10 | Git 基线更新 | `当前原型 Commit ID` 更新为最新 HEAD | |

### 清理步骤

```bash
# 还原原型项目
cd D:\workspace\ruoyi\ruoyi
git revert HEAD --no-edit
```

---

## TC-03: prd-diff-scan 新增文件场景

### 前提条件

- TC-01 已完成，diff.md 已存在

### 准备步骤

```bash
cd D:\workspace\ruoyi\ruoyi
# 模拟原型新增一个页面
mkdir -p ruoyi-ui/src/views/order
cat > ruoyi-ui/src/views/order/newFeature.vue << 'EOF'
<template>
  <div>新功能页面</div>
</template>
EOF
git add ruoyi-ui/src/views/order/newFeature.vue
git commit -m "test: 模拟原型新增页面"
```

### 执行

调用 `Skill("superpowers:prd-diff-scan")`

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 变更文件清单 - 变更类型 | `newFeature.vue` 标为 `新增`（A） | |
| 2 | 变更文件清单 - 开发文件状态 | `不存在`（开发项目无此文件） | |
| 3 | 变更文件清单 - 合并策略 | `复制 + 适配` | |

### 清理步骤

```bash
cd D:\workspace\ruoyi\ruoyi
git revert HEAD --no-edit
```

---

## TC-04: brainstorming 完整流程

### 前提条件

- TC-01 的 diff.md 已存在且合格
- diff.md 中的差异决议全部待确认

### 执行

调用 `Skill("superpowers:brainstorming")`

### 检查点（按 Step 逐步验证）

| Step | 检查项 | 预期 | 通过? |
|------|--------|------|------|
| Step 1 | 探索项目上下文 | 输出项目现状摘要后**停止等待** | |
| Step 2 | 检查 diff.md | 读取 diff.md，验证完整性和 Git 基线新鲜度 | |
| Step 2 | 基线新鲜度 | 比对 diff.md 中 Commit ID 与原型当前 HEAD，一致则通过 | |
| Step 3 | 逐项确认差异 | 分批展示待确认 Dx/Bx，每批 3-5 项，**每批停止等待** | |
| Step 3 | 确认后更新 diff | 用户确认后用 Edit 工具更新 diff.md 差异决议表 | |
| Step 4 | 提出方案 | 展示 2-3 个设计方案后**停止等待**用户选择 | |
| Step 5 | 展示设计 | 展示详细设计内容 | |
| Step 6 | 页面子目录 | 创建 4 个页面子目录（my-order / delivery-record / consignment-inventory / order-ledger） | |
| Step 6 | 前端详细设计 | 每个页面子目录下有 `frontend-detail-design.md` | |
| Step 6 | 后端详细设计 | 每个页面子目录下有 `backend-detail-design.md` | |
| Step 6 | 后端自包含 | 每份后端设计独立可读，共享实体/表在每个页面中重复包含 | |
| Step 6 | index.md | 任务根目录下创建 `index.md`，含页面清单 + 页面-API 映射 | |
| Step 6 | 前端独立性 | 每份前端设计无跨页面引用（不出现"同 xxx 页面"） | |
| Step 6 | 停止等待 | 保存后停止，询问是否进入 writing-plans | |

---

## TC-05: writing-plans 含合并策略

### 前提条件

- TC-04 完成，所有设计文件已保存
- diff.md 包含变更文件清单

### 执行

调用 `Skill("superpowers:writing-plans")`

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 前置检查 | 读取 diff.md + index.md + 各页面设计文件，全部存在 | |
| 2 | diff.md 基线新鲜度 | 验证原型 Commit ID 是否与当前 HEAD 一致 | |
| 3 | shared-plan.md | 若有跨页面共享基础设施（建表/菜单），生成 `shared-plan.md` | |
| 4 | 页面 plan.md | 每个页面子目录下生成 `plan.md` | |
| 5 | Task 切分维度 | 按接口/功能维度切（垂直切片），非技术层横切 | |
| 6 | Task 无省略 | 所有 Task 完整，无 `（省略）`、`（结构类似）` | |
| 7 | Task 无占位符 | 无 `XXX`、`???`、`TODO_ID` | |
| 8 | **Task 合并策略标注** | 涉及原型文件的 Task，「创建/修改文件」标注了 Copy/Overwrite/Merge + diff Fx 编号 | |
| 9 | Merge 任务详情 | Merge 类型的文件包含「原型变更要点」和「保留」说明 | |
| 10 | 更新 index.md | 填充 Plan 列链接 + 添加执行进度表 + 执行顺序 | |
| 11 | 落盘前自检 | 6 项自检全部通过 | |

---

## TC-06: executing-plans 文件合并（Copy 策略）

### 前提条件

- TC-05 完成，plan.md 包含 Copy 类型的 Task

### 执行

在 executing-plans 中执行一个 Copy 策略的 Task

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 读取原型文件 | 正确读取原型项目中的源文件 | |
| 2 | 检查代码规范 | 对比开发项目的代码风格（import、命名等） | |
| 3 | 适配写入 | 文件写入开发项目对应路径，风格适配 | |
| 4 | 验证 | 文件能正常编译/运行 | |
| 5 | 状态更新 | plan.md 和 index.md 的进度已更新 | |

---

## TC-07: executing-plans 文件合并（Overwrite 策略）

### 前提条件

- TC-05 完成，plan.md 包含 Overwrite 类型的 Task
- 开发项目中有对应文件且与旧原型一致（开发者未做本地修改）

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 读取原型新版 | 读取原型文件最新版本 | |
| 2 | 直接写入 | 无需三方对比，直接覆盖写入 | |
| 3 | 验证 | 文件能正常编译/运行 | |

---

## TC-08: executing-plans 文件合并（Merge 策略）

### 前提条件

- TC-05 完成，plan.md 包含 Merge 类型的 Task
- 开发项目中有对应文件且开发者做了本地修改

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 读取原型旧版 | 执行 `git -C <原型目录> show <旧Commit>:<文件路径>` | |
| 2 | 读取原型新版 | 读取原型文件当前内容 | |
| 3 | 读取开发当前版 | 读取开发项目中的文件 | |
| 4 | 理解原型变更 | 对比旧→新，能说明原型改了什么 | |
| 5 | 保留本地改动 | 开发项目的本地修改（如权限控制、API 封装）未被覆盖 | |
| 6 | 冲突处理 | 如果两边改了同一区域，停下来让用户决定 | |
| 7 | 验证 | 合并后文件能正常编译/运行 | |

---

## TC-09: CLAUDE.md 第 6 节 — worktree 隔离

### 前提条件

- 有待执行的 plan

### 执行

调用 `Skill("superpowers:executing-plans")`

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | worktree 创建 | 开始执行前调用了 `superpowers:using-git-worktrees` | |
| 2 | 隔离验证 | 代码修改发生在 worktree 目录中，而非主工作目录 | |
| 3 | .gitignore | worktree 目录已被 .gitignore 忽略 | |

---

## TC-10: CLAUDE.md 第 6 节 — executing-plans 代码审查

### 前提条件

- 正在执行 executing-plans，一个页面的所有 Task 完成

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 请求审查 | 页面完成后调用了 `superpowers:requesting-code-review` | |
| 2 | 审查内容 | 审查范围为本页面的所有 commit（BASE_SHA → HEAD_SHA） | |
| 3 | 反馈处理 | 收到审查反馈后按 `superpowers:receiving-code-review` 规则处理 | |
| 4 | 无表演性回复 | 不出现 "You're absolutely right!" 等表演性语句 | |

---

## TC-11: CLAUDE.md 第 6 节 — subagent-driven-development 不重复审查

### 前提条件

- 使用 subagent-driven-development 模式执行

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 内置审查 | 每个 Task 经过 3 道门禁（编译 → 规格审查 → 质量审查） | |
| 2 | 不额外调用 | **没有**额外调用 `superpowers:requesting-code-review` | |
| 3 | 最终审查 | 所有 Task 完成后派遣最终代码审查子 agent | |

---

## TC-12: CLAUDE.md 第 6 节 — 完成前验证 + 收尾

### 前提条件

- 所有 Task 执行完毕

### 检查点

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 验证调用 | 调用了 `superpowers:verification-before-completion` | |
| 2 | 验证证据 | 运行了实际验证命令（编译/测试），输出了证据 | |
| 3 | 无空口承诺 | 不出现 "should work"、"looks correct" 等无证据声称 | |
| 4 | 收尾调用 | 验证通过后调用了 `superpowers:finishing-a-development-branch` | |
| 5 | 4 选项 | 展示 4 个选项：本地 merge / 创建 PR / 保留 / 丢弃 | |
| 6 | worktree 清理 | 根据用户选择正确清理 worktree | |

---

## TC-13: Skill 路由 — 自动触发 prd-diff-scan

### 场景 A: 用户只给路径

```
用户: "需求文档在 prd/后市场订单库存功能需求规格说明书.md，UI 项目在 D:\workspace\ruoyi\ruoyi\ruoyi-ui"
```

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 自动触发 | 即使用户没说"做差异扫描"，也自动进入 prd-diff-scan | |
| 2 | 不跳过 | 不直接进入 brainstorming 或 writing-plans | |

### 场景 B: 用户说中文触发语

```
用户: "对照 PRD 看看差异"
```

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 自动触发 | 进入 prd-diff-scan | |

### 场景 C: diff 已存在但过期

```
用户: "继续做设计"（但 diff.md 的 Commit ID 落后于当前 HEAD）
```

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 检测过期 | 发现 diff 已过期，提示重新执行 prd-diff-scan | |
| 2 | 不继续 | 不直接用过期的 diff 进入设计 | |

---

## TC-14: 确认规则

### 场景 A: 需求不清

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 不脑补 | PRD 中未明确的接口行为/数据来源，标记为 Blocker 而非自行补全 | |

### 场景 B: 设计完成转计划

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 等待确认 | brainstorming Step 6 保存后停止，等用户明确说"进入 writing-plans" | |
| 2 | 不自动继续 | 不因为用户说"继续"就直接创建 plan | |

### 场景 C: 自动测试模式

```
用户: "这是自动测试场景，没有 blocker 时默认采用推荐方案，默认同意继续下一步，默认同意落盘"
```

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 合并执行 | 多个 Step 可以串起来执行 | |
| 2 | 有 Blocker 仍停 | 遇到 Blocker 时仍然停止 | |

---

## TC-15: 文档创建权限

| # | 文档 | 只能由谁创建 | 测试方式 | 通过? |
|---|------|------------|---------|------|
| 1 | `diff.md` | prd-diff-scan | brainstorming 不应创建 diff.md | |
| 2 | `index.md` | brainstorming | prd-diff-scan 不应创建 index.md | |
| 3 | `frontend-detail-design.md` | brainstorming | writing-plans 不应创建设计文件 | |
| 4 | `plan.md` | writing-plans | brainstorming 不应创建 plan 文件 | |
| 5 | `shared-plan.md` | writing-plans | brainstorming 不应创建 shared-plan | |

---

## TC-16: 端到端冒烟测试

### 目标

一次完整流程走通：prd-diff-scan → brainstorming → writing-plans → executing-plans → 审查 + 收尾

### 执行步骤

```
1. 用户提供 PRD 路径和原型目录
2. → 自动进入 prd-diff-scan，生成 diff.md（含变更文件清单）
3. 用户说"继续设计"
4. → 进入 brainstorming，逐步完成 Step 1-6，生成设计文件
5. 用户说"进入实施计划"
6. → 进入 writing-plans，生成 plan.md（含合并策略标注）
7. 用户说"开始执行"
8. → 进入 executing-plans：
     a. 创建 worktree
     b. 逐批执行 Task（含 Copy/Overwrite/Merge 文件合并）
     c. 每页面完成后请求代码审查
     d. 所有 Task 完成后运行验证
     e. 调用 finishing-a-development-branch
9. 用户选择"创建 PR"或"本地 merge"
```

### 最终检查

| # | 检查项 | 预期 | 通过? |
|---|--------|------|------|
| 1 | 文档完整 | diff.md + index.md + 设计文件 + plan.md 全部存在 | |
| 2 | 代码已生成 | 开发项目中有新的/修改的代码文件 | |
| 3 | 原型文件合并正确 | Copy 文件已复制，Merge 文件保留了本地改动 | |
| 4 | Git 历史清晰 | commit 记录反映了逐 Task 提交 | |
| 5 | worktree 已清理 | 根据用户选择，worktree 被清理或保留 | |
