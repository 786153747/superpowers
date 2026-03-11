# 后端详细设计文档模板（若依）

```md
# {{功能名称}} — 后端详细设计

## 需求输入

- **PRD**: `[PRD 文档路径]`
- **前端详细设计**: `docs/plans/YYYY-MM-DD-<topic>-frontend-detail-design.md`
- **项目规范**: `spec/index.md`（如有）

## 1. 背景与目标

- **业务背景**：
- **目标**：
- **不在本次范围**：

## 2. 受影响模块

> **完整性要求**：接口清单（3.1）中每个 Controller 都必须有对应的 Service 接口 + 实现 + Mapper 接口 + Mapper XML。
> 不得只列部分 Controller 而遗漏其余模块的 Service/Mapper。

| 模块 | 文件 | 说明 |
| --- | --- | --- |
| `ruoyi-admin` | `com/ruoyi/web/controller/{{xx}}/{{Xxx}}Controller.java` | Controller |
| `ruoyi-system` | `service/{{IxxxService}}.java` | Service 接口 |
| `ruoyi-system` | `service/impl/{{XxxServiceImpl}}.java` | Service 实现 |
| `ruoyi-system` | `mapper/{{XxxMapper}}.java` | Mapper 接口 |
| `ruoyi-system` | `resources/mapper/system/{{XxxMapper}}.xml` | SQL |

## 3. 接口设计

### 3.1 接口清单

> 必须覆盖前端控件矩阵（3.5）中所有「调用接口」列出现的接口，不得遗漏。

| 场景 | 方法 | 路径 | 权限 | Controller |
| --- | --- | --- | --- | --- |
| 列表 | GET | `/{{module}}/{{resource}}/list` | `{{module}}:{{resource}}:list` | {{Xxx}}Controller |
| 明细 | GET | `/{{module}}/{{resource}}/{id}` | `{{module}}:{{resource}}:query` | {{Xxx}}Controller |
| 新增 | POST | `/{{module}}/{{resource}}` | `{{module}}:{{resource}}:add` | {{Xxx}}Controller |
| 修改 | PUT | `/{{module}}/{{resource}}` | `{{module}}:{{resource}}:edit` | {{Xxx}}Controller |
| 删除 | DELETE | `/{{module}}/{{resource}}/{ids}` | `{{module}}:{{resource}}:remove` | {{Xxx}}Controller |

### 3.2 接口详细定义

> 每个接口列出请求参数和响应结构，字段名和类型必须与前端类型设计（Section 6）对齐。
> 非 CRUD 接口（如确认、发货、导出等）必须定义请求体 DTO。

#### GET `/{{module}}/{{resource}}/list`

**请求参数（Query）：**

| 参数 | 类型 | 必填 | 说明 | 对应前端字段 |
| --- | --- | --- | --- | --- |
| `pageNum` | `Integer` | 是 | 页码 | `queryParams.pageNum` |
| `pageSize` | `Integer` | 是 | 每页条数 | `queryParams.pageSize` |

**响应结构：**

```json
{
  "total": 100,
  "rows": [{ /* 实体字段 */ }],
  "code": 200,
  "msg": "查询成功"
}
```

#### POST `/{{module}}/{{resource}}/confirm`（非标准 CRUD 示例）

**请求体 DTO：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ids` | `Long[]` | 是 | 待确认的记录 ID 数组 |

### 3.3 返回结构约定

- 列表接口：`TableDataInfo`（包含 `rows` 和 `total`）
- 普通接口：`AjaxResult`（包含 `code`、`msg`、`data`）
- 导出接口：`void` 直接写 `HttpServletResponse`，返回 Excel 文件流

## 4. 领域模型

### 4.1 主要实体

| 实体 | 说明 | 位置 |
| --- | --- | --- |
| `{{Entity}}` | 主实体 | `ruoyi-system/src/main/java/com/ruoyi/system/domain/` |

### 4.2 关键字段

> **完整性要求**：字段列表必须与前端类型设计（Section 6）逐字段对齐。
> 前端有的字段后端必须有（或注明「前端展示用计算字段」）；后端独有的字段（如 delFlag）也要列出。
> **不得用省略号 `...` 代替未列出的字段。**

| 字段 | Java 类型 | 数据库列名 | 说明 | 约束 | 对应前端字段 |
| --- | --- | --- | --- | --- | --- |
| `id` | `Long` | `id` | 主键 | 必填，自增 | `id` |
| `status` | `String` | `status` | 状态 | 必填 | `status` |
| `delFlag` | `String` | `del_flag` | 删除标志 | 默认 `'0'` | —（后端独有） |
| `createTime` | `Date` | `create_time` | 创建时间 | 自动填充 | `createTime` |
| `updateTime` | `Date` | `update_time` | 更新时间 | 自动填充 | —（后端独有） |

### 4.3 DTO 设计

> 查询参数、请求体、特殊响应体均需定义 DTO。
> 查询参数 DTO 的字段必须覆盖前端 `queryParams` 中所有可选字段。

#### 查询参数 DTO

| 字段 | 类型 | 说明 | 对应前端字段 |
| --- | --- | --- | --- |
| `pageNum` | `Integer` | 页码 | `queryParams.pageNum` |
| `pageSize` | `Integer` | 每页条数 | `queryParams.pageSize` |

#### 请求体 DTO（非标准 CRUD）

> 订单确认、发货、取消发货等非标准操作，必须单独定义请求体 DTO。

| DTO 类名 | 用途 | 关键字段 |
| --- | --- | --- |
| `{{Xxx}}QueryDTO` | 列表查询参数 | 分页 + 筛选字段 |

## 5. 数据库设计

### 5.1 表清单与完整字段

> **不得用省略号 `...`**。每张表必须列出完整字段（字段名 / 类型 / 默认值 / 说明）。
> 如字段数多，可用 DDL SQL 代替表格。

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `id` | `bigint` | 自增 | 主键 |
| `status` | `varchar(10)` | `'0'` | 状态 |
| `del_flag` | `char(1)` | `'0'` | 删除标志 |
| `create_by` | `varchar(64)` | `''` | 创建者 |
| `create_time` | `datetime` | — | 创建时间 |
| `update_by` | `varchar(64)` | `''` | 更新者 |
| `update_time` | `datetime` | — | 更新时间 |

### 5.2 索引与约束

- **主键**：
- **唯一约束**：
- **常用查询索引**：

## 6. Service 设计

### 6.1 方法清单

> 接口清单（3.1）中每个接口都必须有对应的 Service 方法。不得遗漏。

| 方法 | 说明 | 事务 | 对应接口 |
| --- | --- | --- | --- |
| `select{{Entity}}List` | 查询列表 | 否 | `GET /list` |
| `select{{Entity}}ById` | 查询明细 | 否 | `GET /{id}` |
| `insert{{Entity}}` | 新增 | 是/否 | `POST /` |
| `update{{Entity}}` | 修改 | 是/否 | `PUT /` |
| `delete{{Entity}}ByIds` | 删除 | 是/否 | `DELETE /{ids}` |

### 6.2 业务规则

> 每条规则说清楚：前置条件 → 操作 → 状态变更 → 后置动作。
> 含边界条件和异常情况。

-

## 7. Mapper / SQL 设计

### 7.1 查询 SQL

> **每个查询接口**都需要提供 SQL 或伪 SQL，不得只写第一个而省略其余。
> 包含：联表条件、动态条件、排序、数据范围。

#### select{{Entity}}List

```xml
<select id="selectXxxList" parameterType="XxxQuery" resultMap="XxxResult">
    select ... from ... where del_flag = '0'
    <if test="...">...</if>
    order by create_time desc
</select>
```

### 7.2 写入 SQL

> 关键写入操作（非简单 INSERT/UPDATE）需要提供具体 SQL。
> 如涉及多表更新（如发货需同时更新订单表和发货记录表），需写清事务内的多条 SQL。

- **新增默认值**：
- **更新策略**：
- **删除策略**：软删 / 物理删

## 8. 权限、日志与审计

### 权限字符串

> 必须与接口清单（3.1）一一对应。

| 权限 | 说明 | 对应接口 |
| --- | --- | --- |
| `{{module}}:{{resource}}:list` | 列表查询 | `GET /list` |

### 数据权限

> 不同角色看到的数据范围是否不同？用 RuoYi 数据范围注解还是 SQL 手动过滤？

-

### 操作日志

- **是否记录操作日志**：
- **使用 `@Log` 注解的方法**：

### 创建/修改人填充

- 使用 RuoYi 框架的 `getUsername()` 自动填充

## 9. 风险点与兼容性

- **旧接口兼容**：
- **数据迁移要求**：
- **缓存 / 定时任务 / 异步影响**：

## 10. 验证方式

- **编译验证**：
- **接口验证**：
- **回归点**：

## 11. 前后端对齐检查

> 后端设计必须与前端详细设计逐项对齐。以下三张表为必填。

### 11.1 接口覆盖检查

| 前端控件矩阵调用接口 | 后端接口路径 | 覆盖状态 |
| --- | --- | --- |
| `GET /list`（XX 页面） | `GET /xxx/list` | ✅ / ❌ |

### 11.2 请求参数对齐

> 前端 `queryParams` / 请求体的每个字段，后端是否有对应接收？

| 前端字段 | 后端参数 | 类型是否一致 | 备注 |
| --- | --- | --- | --- |
| `queryParams.materialNo` | `OrderQuery.materialNo` | ✅ | — |

### 11.3 响应字段对齐

> 前端类型设计（Section 6）的每个字段，后端响应是否包含？

| 前端字段 | 后端实体字段 | 类型映射 | 备注 |
| --- | --- | --- | --- |
| `order.status: string` | `Order.status: String` | ✅ | — |

### 11.4 枚举值对齐

> 前端状态枚举与后端是否一致（中文/编码/字典值）？

| 字段 | 前端值 | 后端值 | 一致 |
| --- | --- | --- | --- |
| `status` | `'待确认'` | `'待确认'` | ✅ / ❌ |

## 12. 自检清单

> 保存文档前，逐项检查并标记 ✅ / ❌。全部 ✅ 才可保存，任一 ❌ 必须修正后重新检查。

| # | 检查项 | ✅/❌ |
|---|--------|------|
| 1 | 需求输入已引用前端详细设计文档路径 | |
| 2 | Section 2 受影响模块覆盖了 3.1 接口清单中**每个 Controller** 对应的 Service/Mapper | |
| 3 | Section 3.1 接口清单覆盖了前端控件矩阵中所有「调用接口」 | |
| 4 | Section 3.2 非 CRUD 接口有请求体 DTO 定义 | |
| 5 | Section 4.2 实体字段与前端类型设计**逐字段对齐**，无省略号 | |
| 6 | Section 4.3 查询参数 DTO 覆盖前端 `queryParams` 所有字段 | |
| 7 | Section 5.1 表字段完整列出，**无省略号 `...`** | |
| 8 | Section 6.1 方法清单覆盖 3.1 中**每个接口** | |
| 9 | Section 7.1 **每个查询接口**都有 SQL 或伪 SQL | |
| 10 | Section 7.2 关键写入操作有具体 SQL（多表事务写清多条 SQL） | |
| 11 | Section 8 数据权限已说明（不同角色的数据过滤方式） | |
| 12 | Section 11 前后端对齐四张表（接口覆盖 + 请求参数 + 响应字段 + 枚举值）已填写 | |
```
