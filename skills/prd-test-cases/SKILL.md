---
name: prd-test-cases
description: "Use when user asks to generate test cases, acceptance scenarios, or test case Excel from PRD or diff documents. Triggers on keywords: 测试用例, 场景用例, test cases, Excel 用例"
---

# PRD 场景测试用例生成

## Overview

从 PRD 和 prd-diff-scan 产出的 diff 文档中提取业务场景，生成步骤级测试用例，最终输出为 Excel(.xlsx) 文件。

每个测试用例按操作步骤拆解，每步有独立的预期结果，适合 QA 手工执行或导入测试管理工具。

## 前置条件

- PRD 文档（本地文件路径）
- `diff_<commitid>.md`（prd-diff-scan 产物）— 提供页面清单、差异清单、验收点、控件矩阵
- 如果 diff 文档不存在，告知用户先执行 `prd-diff-scan`

## 输出产物

```
docs/plans/YYYY-MM-DD-<topic>/<commitid>/
  test-cases.json          # 中间 JSON（Claude 生成）
  test-cases.xlsx          # 最终 Excel（脚本生成）
```

---

## Step 1: 确认输入

确认以下路径。任一不明确时用 `AskUserQuestion` 向用户确认：

1. **PRD 文档路径**
2. **diff 文档路径**（`diff_<commitid>.md`）
3. **输出目录**（默认与 diff 文档同目录）

并行读取 PRD 和 diff 文档。

输出：

```
## 输入确认
- PRD: [路径]
- diff 文档: [路径]
- 输出目录: [路径]
- 页面数量: [N]
```

---

## Step 2: 提取页面与场景

从 diff 文档中提取以下信息：

1. **受影响页面清单**（步骤 3 的页面表）
2. **每个页面的验收点**（步骤 4.4 的验收点小节）
3. **每个页面的控件矩阵**（步骤 4.2）— 按钮、表单、查询、弹窗等
4. **差异清单**（Dx 编号）— 用于关联测试用例
5. **9 大维度对比**中标记为「差异」的项

从 PRD 中补充：

- 业务规则和约束
- 状态流转
- 权限角色定义

输出每个页面的场景大纲：

```
## 场景大纲

### [页面名称]（page-slug）
- 正向主流程: [场景列表]
- 反向校验: [场景列表]
- 边界场景: [场景列表]
- 权限控制: [场景列表]
- 异常场景: [场景列表]
- 预计用例数: [N]
```

**STOP，等用户确认场景大纲后再继续。**

---

## Step 3: 生成测试用例 JSON

按页面逐个生成步骤级测试用例，写入 `test-cases.json`。

### JSON 格式

```json
{
  "projectName": "项目名称",
  "generatedAt": "2026-03-19T10:00:00",
  "source": {
    "prd": "PRD 路径",
    "diff": "diff 文档路径"
  },
  "pages": [
    {
      "pageSlug": "my-order",
      "pageName": "我的订单",
      "testCases": [
        {
          "id": "TC-MO-01",
          "priority": "P0",
          "category": "正向主流程",
          "scenario": "查询订单列表-默认加载",
          "precondition": "用户已登录且有页面访问权限，数据库中存在订单数据",
          "steps": [
            {
              "stepNo": 1,
              "action": "导航到「我的订单」页面",
              "expected": "页面正常加载，显示查询表单和订单列表表格"
            },
            {
              "stepNo": 2,
              "action": "观察表格数据",
              "expected": "表格显示订单数据，列头包含：订单编号、订单日期、状态、金额等"
            },
            {
              "stepNo": 3,
              "action": "观察分页组件",
              "expected": "分页组件显示总条数，默认每页 10 条"
            }
          ],
          "testData": "至少 15 条订单数据（超过一页）",
          "relatedDiff": "D1"
        }
      ]
    }
  ]
}
```

### 场景覆盖规则

每个页面必须覆盖以下 5 个维度：

| 维度 | 来源 | 优先级 |
|------|------|--------|
| 正向主流程 | diff 验收点的「正向场景」 | P0 |
| 反向校验 | 控件矩阵中的必填字段 + 表单校验规则 | P1 |
| 边界场景 | diff 验收点的「空态」+ 分页边界 + 特殊字符 | P2 |
| 权限控制 | diff 验收点的「权限态」+ 9 维度的「权限与角色」 | P1 |
| 异常场景 | diff 验收点的「异常态」+ 接口失败 | P2 |

### 编号规则

`TC-{页面缩写}-{序号}`

页面缩写取 pageSlug 的大写首字母缩写（最多 3 个字母）：
- `my-order` → `MO`
- `delivery-record` → `DR`
- `consignment-inventory` → `CI`

序号从 01 开始，按优先级排列（P0 在前）。

用 `Write` 工具保存 JSON 文件到输出目录。

需要完整字段示例时，读取 `references/test-case-example.json`。

---

## Step 4: 生成 Excel

执行以下命令：

```bash
npm --prefix "<skill目录>/scripts" install
node "<skill目录>/scripts/generate-excel.js" "<JSON文件绝对路径>"
```

`generate-excel.js` 位于 `skills/prd-test-cases/scripts/generate-excel.js`。

脚本依赖定义位于 `skills/prd-test-cases/scripts/package.json`。

脚本会在 JSON 同目录生成 `test-cases.xlsx`。

如果脚本执行失败，检查错误信息并修复 JSON 格式后重试。

---

## Step 5: 输出确认

展示生成摘要：

```
## 测试用例生成完成

- Excel 文件: [路径]
- JSON 文件: [路径]

### 用例统计

| 页面 | P0 | P1 | P2 | 合计 |
|------|----|----|----|----|
| [页面名] | [N] | [N] | [N] | [N] |
| **合计** | **N** | **N** | **N** | **N** |

请打开 Excel 文件检查用例内容。如需调整，可以：
1. 修改 test-cases.json 后重新生成 Excel
2. 直接在 Excel 中编辑
```

---

## Excel 结构

### Sheet 结构

- 每个页面一个 Sheet（sheet 名 = 页面中文名，如"我的订单"）
- 最后一个 Sheet 为"汇总"

### 列定义

| 列 | 列头 | 宽度 | 说明 |
|----|------|------|------|
| A | 用例编号 | 15 | TC-{缩写}-{序号} |
| B | 优先级 | 8 | P0 / P1 / P2 |
| C | 场景分类 | 15 | 正向主流程 / 反向校验 / 边界场景 / 权限控制 / 异常场景 |
| D | 场景名称 | 30 | 业务场景描述 |
| E | 前置条件 | 30 | 执行该用例前需要满足的条件 |
| F | 步骤序号 | 8 | 1, 2, 3... |
| G | 操作步骤 | 40 | 具体操作描述 |
| H | 预期结果 | 40 | 该步骤的预期结果 |
| I | 测试数据 | 25 | 需要的测试数据（可为空） |
| J | 关联差异 | 12 | 对应 diff 的 Dx/Bx 编号 |

### 样式规则

- 表头：加粗、蓝色背景(#4472C4)、白色字体
- 优先级颜色：P0=红色填充(#FFC7CE)、P1=橙色填充(#FFE699)、P2=灰色填充(#D9E2F3)
- 同一场景的多步骤：A-E 列合并单元格
- 首行冻结
- 启用筛选

### 汇总 Sheet

| 页面 | P0 数量 | P1 数量 | P2 数量 | 总计 |
|------|--------|--------|--------|------|
| [页面名] | [N] | [N] | [N] | [N] |

---

## 完成条件

- [ ] 每个 diff 文档中的页面都有对应的测试用例
- [ ] 每个页面覆盖 5 个场景维度（正向/反向/边界/权限/异常）
- [ ] 每个验收点都有对应的测试用例
- [ ] JSON 文件已保存
- [ ] Excel 文件已生成且可正常打开
- [ ] 用例编号唯一且连续
