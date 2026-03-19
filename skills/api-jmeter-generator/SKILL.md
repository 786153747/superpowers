---
name: api-jmeter-generator
description: "Use when user asks to generate JMeter test plan, JMX file, API automation tests, or performance test scripts from backend detailed design documents. Triggers on keywords: JMeter, JMX, 接口测试, 性能测试, 压测"
---

# 后端接口测试产物生成

## Overview

从后端详细设计文档 `backend-detail-design.md` 中提取 API 信息，生成一套可直接落地的测试产物：

- `api.json`：统一的中间描述文件
- `postman.json`：可直接导入 Postman 的 Collection
- `jmeter-test-plan.jmx`：可直接在 JMeter 中打开的测试计划

其中 `postman.json` 与 `jmx` 都由脚本从同一份 `api.json` 派生，避免维护两套接口定义。

## 前置条件

- 已有 `backend-detail-design.md`，且包含接口清单、请求参数、响应结构、认证方式
- 如果后端详细设计不存在，先引导用户完成 `brainstorming` 或详细设计整理

## 输出产物

```text
docs/plans/YYYY-MM-DD-<topic>/<commitid>/
  api.json                 # 中间 JSON（Claude 生成）
  postman.json             # Postman Collection（脚本生成）
  jmeter-test-plan.jmx     # JMeter 测试计划（脚本生成）
```

---

## Step 1: 确认输入

确认以下信息；不明确时向用户确认：

1. 后端详细设计文档路径
2. 目标服务基础 URL，例如 `http://localhost:8080`
3. 认证方式
4. 输出目录

认证方式默认约定：

- 登录接口：`POST /login`
- token 提取：`$.token`
- 鉴权头：`Authorization: Bearer ${token}`

输出示例：

```text
## 输入确认
- 设计文档: [路径列表]
- 基础 URL: [URL]
- 认证方式: [默认 / 自定义]
- 输出目录: [路径]
- API 数量: [N]
```

---

## Step 2: 提取 API 清单

从详细设计中提取每个接口的核心信息：

- 接口路径，例如 `/aftermarket/order/list`
- HTTP Method
- Controller 名称
- 请求参数：Query / Path / RequestBody
- 响应结构：关键字段、业务码
- 权限标识

输出 API 清单预览：

```text
## API 清单

| # | Method | Path | Controller | 描述 | 参数类型 |
|---|--------|------|------------|------|---------|
| 1 | GET | /aftermarket/order/list | OrderController | 查询订单列表 | Query |
| 2 | POST | /aftermarket/order | OrderController | 新增订单 | Body |
```

在继续前，先让用户确认 API 清单是否完整。

---

## Step 3: 生成 `api.json`

将接口描述写入 `api.json`：

```json
{
  "projectName": "项目名称",
  "generatedAt": "2026-03-19T10:00:00",
  "baseUrl": "http://localhost:8080",
  "auth": {
    "loginPath": "/login",
    "method": "POST",
    "body": {
      "username": "admin",
      "password": "admin123"
    },
    "tokenExtract": "$.token",
    "headerName": "Authorization",
    "headerPrefix": "Bearer "
  },
  "performanceConfig": {
    "threads": 10,
    "rampUp": 10,
    "loops": 5,
    "thinkTime": 300
  },
  "apis": [
    {
      "id": "API-01",
      "name": "查询订单列表",
      "method": "GET",
      "path": "/aftermarket/order/list",
      "controller": "OrderController",
      "contentType": "application/x-www-form-urlencoded",
      "params": {
        "type": "query",
        "fields": [
          { "name": "pageNum", "value": "1" },
          { "name": "pageSize", "value": "10" },
          { "name": "orderNo", "value": "" }
        ]
      },
      "assertions": [
        { "type": "status", "value": "200" },
        { "type": "jsonpath", "path": "$.code", "value": "200" },
        { "type": "jsonpath", "path": "$.rows", "condition": "exists" }
      ]
    },
    {
      "id": "API-02",
      "name": "新增订单",
      "method": "POST",
      "path": "/aftermarket/order",
      "controller": "OrderController",
      "contentType": "application/json",
      "params": {
        "type": "body",
        "json": {
          "orderNo": "ORD-${__time(yyyyMMddHHmmss)}",
          "supplierId": 1,
          "remark": "自动化测试数据"
        }
      },
      "assertions": [
        { "type": "status", "value": "200" },
        { "type": "jsonpath", "path": "$.code", "value": "200" }
      ]
    }
  ]
}
```

### 参数生成规则

| 场景 | 生成策略 |
|------|---------|
| 分页参数 | 默认使用 `pageNum=1`、`pageSize=10` |
| 字符串字段 | 使用有业务意义的示例值 |
| 数值字段 | 使用合理默认值 |
| 枚举字段 | 使用设计文档中的有效值 |
| ID 字段 | 优先使用列表接口返回值或稳定示例值 |
| 日期字段 | 可使用 `${__time(yyyy-MM-dd)}` |

如需完整参考，可查看 `references/api-example.json`。

---

## Step 4: 用户确认

展示测试计划预览并等待用户确认或调整：

```text
## 测试计划预览

### 接口统计
- GET: [N]
- POST: [N]
- PUT: [N]
- DELETE: [N]
- 总计: [N]

### 性能测试配置
- 并发线程数: 10
- Ramp-up 时间: 10s
- 循环次数: 5
- 思考时间: 300ms
```

用户若调整配置，先更新 `api.json`，再继续。

---

## Step 5: 生成 `postman.json` 和 `jmx`

执行以下命令：

```bash
node "<skill目录>/scripts/generate-artifacts.js" "<api.json绝对路径>" "[输出目录]"
```

说明：

- `generate-artifacts.js` 位于 `skills/api-jmeter-generator/scripts/generate-artifacts.js`
- 若未指定输出目录，默认输出到 `api.json` 所在目录
- 脚本会标准化生成以下三个文件：

```text
api.json
postman.json
jmeter-test-plan.jmx
```

其中：

- `postman.json` 为 Postman Collection v2.1，可直接导入
- `jmeter-test-plan.jmx` 为 JMeter 测试计划

---

## Step 6: 输出确认

向用户展示最终结果：

```text
## 测试产物生成完成

- API JSON: [路径]
- Postman Collection: [路径]
- JMX 文件: [路径]

### 接口覆盖

| # | Method | Path | 功能测试 | 性能测试 | 断言 |
|---|--------|------|---------|---------|------|
| 1 | GET | /path | ✓ | ✓ | 状态码 + 业务码 |
```

### 使用方式

```text
Postman
1. 导入 `postman.json`
2. 先执行 `Login` 请求，自动提取 token 到 `{{token}}`
3. 再执行其他 API 请求

JMeter
1. 用 JMeter GUI 打开 `jmeter-test-plan.jmx`
2. 修改 User Defined Variables 中的 `base_url`
3. 按需修改登录用户名密码
4. 运行“接口功能测试” Thread Group
5. 如需压测，启用“性能测试” Thread Group 后再运行
```

---

## JMX 结构

```text
TestPlan
├─ User Defined Variables
│  ├─ base_url = http://localhost:8080
│  ├─ username = admin
│  ├─ password = admin123
│  └─ thinkTime = 300
├─ HTTP Header Manager
│  ├─ Content-Type: application/json
│  └─ Authorization: Bearer ${token}
├─ Thread Group: 接口功能测试
│  ├─ HTTP Request: 登录
│  ├─ JSON Extractor: token
│  ├─ HTTP Request: API-01
│  └─ HTTP Request: API-02 ...
├─ Thread Group: 性能测试
│  ├─ HTTP Request: 登录
│  ├─ Constant Timer: ${thinkTime}
│  ├─ HTTP Request: API-01
│  └─ HTTP Request: API-02 ...
├─ View Results Tree
├─ Summary Report
└─ Aggregate Report
```

---

## 完成条件

- [ ] 详细设计中的所有接口都已映射到 `apis`
- [ ] 登录与 token 提取配置正确
- [ ] 每个接口至少有一个断言
- [ ] `postman.json` 可导入 Postman
- [ ] `jmeter-test-plan.jmx` 可在 JMeter 中打开
- [ ] `api.json`、`postman.json`、`jmeter-test-plan.jmx` 已生成
