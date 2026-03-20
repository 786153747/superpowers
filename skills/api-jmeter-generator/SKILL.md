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

上面的目录结构只是推荐示例，不要在未确认前直接假定为实际输出目录。

---

## Step 1: 确认输入

确认以下信息；只要用户没有明确给出输出目录，就必须先向用户确认；确认前不要继续执行生成步骤：

1. 后端详细设计文档路径
2. 目标服务基础 URL，例如 `http://localhost:8080`
3. 认证方式
4. 输出目录（可建议推荐目录，但必须先得到用户确认）

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
- 测试场景数量: [N]
```

---

## Step 2: 提取接口与业务场景清单

从详细设计中提取每个接口的核心信息：

- 接口路径，例如 `/aftermarket/order/list`
- HTTP Method
- Controller 名称
- 请求参数：Query / Path / RequestBody
- Content-Type（若详细设计明确写出）
- 响应结构：关键字段、业务码
- 权限标识
- 业务前置条件、后置结果
- 状态流转规则
- 数据归属、数据权限、可操作条件
- 关联接口依赖（如先新增再提交、先查询再详情）
- 成功后的副作用与一致性要求（如列表、详情、统计、导出结果一致）

`apis` 中的每一项代表一个“可执行测试场景”，不要求与 Controller 方法一一对应。
同一路径可以因为不同业务场景重复出现，例如“草稿单提交成功”和“已提交单重复提交被拒绝”可以是两条独立记录。

不要为每个接口重复生成以下公共场景，除非详细设计明确说明该接口有自定义处理：

- 无认证 / token 缺失
- 统一分页参数异常
- 统一 Bean Validation / 全局异常拦截
- 网关、过滤器、统一拦截器已经覆盖的通用错误

优先生成以下偏业务场景：

- 正向主链路
- 状态流转正向 / 反向
- 前置条件不满足
- 重复提交、幂等冲突、唯一性冲突
- 数据归属和数据权限范围
- 成功后的副作用、一致性、联动校验

输出测试场景清单预览：

```text
## 测试场景清单

| # | 场景名称 | Method | Path | 场景类型 | 业务关注点 |
|---|----------|--------|------|----------|------------|
| 1 | 查询订单列表-草稿单筛选 | GET | /aftermarket/order/list | 正向主链路 | 筛选条件生效 |
| 2 | 提交订单-已提交单重复提交被拒绝 | POST | /aftermarket/order/submit/{orderId} | 业务反向 | 状态流转限制 |
```

在继续前，先让用户确认测试场景清单是否完整，并确认是否需要删掉公共平台类用例。

---

## Step 3: 生成 `api.json`

将业务测试场景写入已确认输出目录下的 `api.json`：

可选字段如 `scenarioType`、`notes` 可用于人工复核；生成脚本会忽略未使用字段。

`contentType` 规则：
- 只有请求带 body 时才写入 `contentType`
- 无请求体接口不要为了“统一格式”强行补 `Content-Type`
- 若详细设计写明 `Content-Type: 无（无请求体）`，则 `api.json` 中不写 `contentType`

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
      "name": "查询订单列表-草稿单筛选",
      "scenarioType": "query-positive",
      "method": "GET",
      "path": "/aftermarket/order/list",
      "controller": "OrderController",
      "params": {
        "type": "query",
        "fields": [
          { "name": "pageNum", "value": "1" },
          { "name": "pageSize", "value": "10" },
          { "name": "orderNo", "value": "" },
          { "name": "status", "value": "DRAFT" }
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
      "name": "提交订单-草稿单成功",
      "scenarioType": "state-transition-positive",
      "method": "POST",
      "path": "/aftermarket/order/submit/{orderId}",
      "controller": "OrderController",
      "contentType": "application/json",
      "params": {
        "type": "path",
        "fields": [
          { "name": "orderId", "value": "1001" }
        ]
      },
      "assertions": [
        { "type": "status", "value": "200" },
        { "type": "jsonpath", "path": "$.code", "value": "200" },
        { "type": "jsonpath", "path": "$.data.status", "value": "SUBMITTED" }
      ]
    },
    {
      "id": "API-03",
      "name": "提交订单-已提交单重复提交被拒绝",
      "scenarioType": "business-negative",
      "method": "POST",
      "path": "/aftermarket/order/submit/{orderId}",
      "controller": "OrderController",
      "contentType": "application/json",
      "params": {
        "type": "path",
        "fields": [
          { "name": "orderId", "value": "1002" }
        ]
      },
      "assertions": [
        { "type": "status", "value": "200" },
        { "type": "jsonpath", "path": "$.code", "value": "500" },
        { "type": "jsonpath", "path": "$.msg", "value": "当前状态不允许重复提交" }
      ]
    }
  ]
}
```

### 场景与断言生成规则

| 场景 | 生成策略 |
|------|---------|
| 业务正向 | 选择最小闭环参数，覆盖主链路成功结果 |
| 业务反向 | 优先覆盖状态不允许、前置条件不足、重复提交、唯一性冲突、数据归属冲突 |
| 平台通用拦截 | 默认不生成无认证、统一分页参数异常、统一 Bean Validation；除非详细设计说明该接口有自定义处理 |
| 列表查询 | 使用稳定筛选条件，断言结果集存在，必要时补充关键字段或业务码断言 |
| 状态流转 | 断言业务码 + 目标状态字段；反向场景断言拒绝码或提示语 |
| 写操作 | 除状态码外，至少补 1 条业务断言，如状态、关键字段、提示语、结果字段存在 |
| 导出 / 二进制 | 至少断言状态码；若协议层校验无法自动生成，在说明中标注人工补充点 |

### 参数取值规则

| 场景 | 生成策略 |
|------|---------|
| 分页参数 | 默认使用 `pageNum=1`、`pageSize=10` |
| 字符串字段 | 使用有业务意义的示例值 |
| 数值字段 | 使用合理默认值 |
| 枚举字段 | 使用设计文档中的有效值 |
| ID 字段 | 优先使用列表接口返回值或稳定示例值 |
| 日期字段 | 可使用 `${__time(yyyy-MM-dd)}` |

### Content-Type 生成规则

| 场景 | 生成策略 |
|------|---------|
| JSON 请求体 | `contentType` 写 `application/json` |
| 表单请求体 | `contentType` 写 `application/x-www-form-urlencoded` |
| 无请求体（GET/DELETE/部分 POST 导出） | 不写 `contentType`，Postman 不生成 `Content-Type` 头 |

如需完整参考，可查看 `references/api-example.json`。

---

## Step 4: 用户确认

展示测试计划预览并等待用户确认或调整：

```text
## 测试计划预览

### 场景统计
- 业务正向: [N]
- 业务反向 / 状态流转反向: [N]
- 副作用 / 一致性校验: [N]
- GET: [N]
- POST: [N]
- PUT: [N]
- DELETE: [N]
- 总计: [N]

### 已排除的公共场景
- 无认证
- 统一分页参数异常
- 统一 Bean Validation / 全局异常拦截

### 业务覆盖重点
- [状态流转]
- [前后置条件]
- [数据归属 / 权限范围]

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
node "<skill目录>/scripts/generate-artifacts.js" "<api.json绝对路径>" "<输出目录>"
```

说明：

- `generate-artifacts.js` 位于 `skills/api-jmeter-generator/scripts/generate-artifacts.js`
- 调用时必须显式传入已确认的输出目录，不要依赖脚本默认值
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

### 场景覆盖

| # | 场景名称 | Method | Path | 功能测试 | 性能测试 | 断言 |
|---|----------|--------|------|---------|---------|------|
| 1 | 提交订单-已提交单重复提交被拒绝 | POST | /aftermarket/order/submit/{orderId} | ✓ | ✓ | 状态码 + 业务提示 |
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

- [ ] 详细设计中的所有业务接口都已映射到至少一个可执行场景
- [ ] 登录与 token 提取配置正确
- [ ] 涉及新增、编辑、提交、审核、删除、作废等写操作的接口，至少覆盖 1 条业务正向场景
- [ ] 涉及状态流转或业务限制的接口，至少覆盖 1 条业务反向场景
- [ ] 非二进制接口至少有 1 条业务断言，不只是通用 `status=200` / `code=200`
- [ ] 未在每个接口上重复生成统一拦截类公共用例，除非详细设计要求
- [ ] `postman.json` 可导入 Postman
- [ ] `jmeter-test-plan.jmx` 可在 JMeter 中打开
- [ ] `api.json`、`postman.json`、`jmeter-test-plan.jmx` 已生成
