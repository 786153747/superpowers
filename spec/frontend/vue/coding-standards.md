# 前端规范

## 适用范围

- Vue 页面开发、设计、评审
- API 封装、TypeScript 类型、权限、字典、通用工具函数

说明：前端详细设计模板和前端规范文件统一放在 `spec/frontend/vue/`。

## 项目基线

### 技术栈

- Vue 3.5
- TypeScript
- Vite 6
- Element Plus 2.x
- Pinia
- Vue Router 4
- Axios
- `@vueuse/core`

### 目录结构

| 目录 | 说明 |
|------|------|
| `src/api/` | API 接口层 |
| `src/views/` | 页面组件 |
| `src/components/` | 通用组件 |
| `src/store/modules/` | Pinia 状态模块 |
| `src/utils/` | 工具函数 |
| `src/plugins/` | Vue 插件 |
| `src/directive/` | 自定义指令 |
| `src/layout/` | 布局组件 |
| `src/router/` | 路由配置 |

### 常用命令

```bash
cd ruoyi-ui
yarn dev
yarn build:prod
yarn build:stage
yarn tsc --noEmit
```

### 默认配置

- 开发端口：`80`
- 代理：`/dev-api -> http://localhost:8080`

## 代码规范

### 1. API 层

**位置**：`ruoyi-ui/src/api/{模块}/`

**规范**：

- 每个业务模块一个独立 API 文件
- 使用 `@/utils/request`
- 统一返回 Promise
- CRUD 方法命名：`list`、`get`、`add`、`update`、`del`

**示例**：

```typescript
import request from '@/utils/request'

export function listConfig(query: ConfigQueryParams) {
  return request({
    url: '/system/config/list',
    method: 'get',
    params: query
  })
}
```

### 1.1 API 错误处理

所有 API 调用必须有完整错误处理。

**正确示例**：

```typescript
listOrder(queryParams)
  .then((res) => {
    loading.value = false
    orderList.value = res.rows
    total.value = res.total
  })
  .catch((error) => {
    console.error('查询订单失败:', error)
    ElMessage.error('查询失败，请稍后重试')
  })
```

**要求**：

1. `catch` 中必须给用户错误提示。
2. 同时记录 `console.error`。
3. 不能只吞异常不处理。

### 2. 页面组件

**位置**：`ruoyi-ui/src/views/{模块}/`

**规范**：

- 使用 `<script setup>`
- 使用 TypeScript
- 使用 Composition API
- 优先复用全局组件：`Pagination`、`RightToolbar`、`Editor`、`FileUpload`、`ImageUpload`、`DictTag`

**文件命名**：

- 推荐单文件模式：`src/views/order/myOrder.vue`
- 不推荐：`src/views/order/myOrder/index.vue`

**路由配置对应**：

```typescript
{
  path: 'myOrder',
  component: () => import('@/views/order/myOrder.vue'),
  name: 'MyOrder',
  meta: { title: '我的订单', icon: 'form' }
}
```

### 2.1 TypeScript 类型

**禁止滥用 `any`**。

```typescript
const dataList = ref<Order[]>([])
const unknownData = ref<unknown>(null)
```

**类型文件位置**：

- `src/types/api/{模块}.ts`

**每个业务模块至少包含**：

- 实体类型
- 查询参数类型
- DTO / 表单类型
- 其他业务相关类型

### 2.2 调试代码清理

提交前必须移除所有 `console.log` 等调试输出，保留 `console.error` 用于错误排查。

### 3. 字典使用

```typescript
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')
```

### 4. 权限控制

```vue
<el-button v-hasPermi="['system:user:add']">新增</el-button>
<el-button v-if="hasPermi('system:user:edit')">修改</el-button>
```

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| API 文件 | 小驼峰 | `config.ts` |
| 页面组件 | 小写 + 连字符或业务约定文件名 | `order/myOrder.vue` |
| 组件 `name` | 大驼峰 | `UserManage` |
| 变量/函数 | 小驼峰 | `dataList`、`handleAdd` |
| 类型接口 | 大驼峰 | `OrderQueryParams` |

## 返回结构约定

### AjaxResult

适用于新增、修改、删除、详情等非分页接口。

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

### TableDataInfo

适用于分页列表接口。

```json
{
  "code": 200,
  "msg": "查询成功",
  "rows": [],
  "total": 100
}
```

前端列表页统一按 `response.rows` 和 `response.total` 取值。

## 前端工具类

### `src/utils/request.ts`

| 功能 | 说明 |
|------|------|
| 请求拦截 | 自动带 token |
| GET 参数转换 | `params` 转查询字符串 |
| 防重复提交 | 检测短时间内重复请求 |
| 响应拦截 | 统一处理 `200/401/500/601` |
| 下载方法 | 支持文件下载 |

**约束**：

- 所有请求统一使用 `@/utils/request`
- 禁止自建 axios 实例
- 导出下载优先使用框架已有下载能力，不手写 blob 处理链路

### `src/utils/ruoyi.ts`

| 方法 | 说明 |
|------|------|
| `parseTime` | 日期格式化 |
| `resetForm` | 重置表单 |
| `addDateRange` | 添加日期范围参数 |
| `selectDictLabel` | 字典值回显 |
| `selectDictLabels` | 多值字典回显 |
| `handleTree` | 树形结构转换 |
| `tansParams` | 参数序列化 |

### `src/utils/validate.ts`

| 方法 | 说明 |
|------|------|
| `isEmpty` | 判空 |
| `validEmail` | 邮箱校验 |
| `validPhone` | 手机号校验 |
| `validURL` | URL 校验 |
| `isExternal` | 外链判断 |
| `isHttp` | HTTP/HTTPS 判断 |

## 页面交互约定

1. 查询区域、工具栏、表格、分页、弹窗按若依 CRUD 模板组织。
2. 搜索默认重置页码到 1。
3. 提交按钮在请求中应禁用，防止重复提交。
4. 删除、导出、批量操作需要明确确认或状态联动。
5. 接口失败必须有用户可见提示。
6. 空列表、详情失败、提交失败、导出失败都要有清晰兜底表现。

## 通用前端规则

1. 不通过扫描项目代码推断项目级规范，前端风格以本文为准。
2. 页面、API、类型文件按任务范围精确读取，不把代码搜索当成“学习风格”的手段。
3. 页面交互与 API 契约应以当前设计文档和精确 UI 文件为准。
4. 字典字段统一走 `useDict` / `DictTag` 模式。
5. 按钮权限统一用 `v-hasPermi` 或 `hasPermi`。

## 前端开发检查清单

- [ ] 页面使用 `<script setup>` + TypeScript
- [ ] API 调用来自 `@/utils/request`
- [ ] 类型定义落在 `src/types/api/`
- [ ] 没有新增 `any` 泛滥
- [ ] `console.log` 已清理
- [ ] 接口异常有 `console.error` + 用户提示
- [ ] 字典、权限、分页、弹窗遵循若依既有模式
