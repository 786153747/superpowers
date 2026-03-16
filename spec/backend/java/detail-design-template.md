# 后端详细设计文档模板（若依）

```md
# {{功能名称}} — 后端详细设计

## 需求输入

- **PRD**: `[PRD 文档路径]`
- **前端详细设计**: `./frontend-detail-design.md`
- **项目规范**: `spec/index.md`（如有）

## 自检清单（写之前先看，写完再核）

| # | 检查项 | ✅/❌ |
|---|--------|------|
| 1 | 需求输入已引用前端详细设计文档路径 | |
| 2 | Section 2 受影响模块覆盖了 3.1 中每个 Controller 对应的 Service/Mapper | |
| 3 | Section 3.1 接口清单覆盖前端控件矩阵所有「调用接口」 | |
| 4 | Section 3.2 每个接口有权限标注；写操作接口有「业务逻辑」步骤（校验/前置检查/核心操作/异常/返回） | |
| 5 | Section 4.2 实体字段与前端类型设计逐字段对齐，无省略号 | |
| 6 | Section 4.3 查询参数 DTO 覆盖前端 queryParams 所有字段 | |
| 7 | Section 5.1 表字段完整列出，无省略号 | |
| 8 | Section 6.1 方法清单覆盖 3.1 中每个接口 | |
| 9 | Section 7 每个查询接口都有伪 SQL | |
| 10 | Section 10 前后端对齐四张表已填写 | |
| 11 | **完整链路**：3.1 中每个 Controller 在 4.1/4.2 有 Entity、4.3 有 QueryDTO、6.1 有 Service 方法、2 有 Mapper + XML、7 有伪 SQL（逐个 Controller 核对，任一缺失 = ❌） | |
| 12 | **DTO 文件路径**：4.3 中每个 DTO 都标注了 Java 文件路径（放哪个包、叫什么名字） | |

## 1. 背景与目标

- **业务背景**：
- **目标**：
- **不在本次范围**：

## 2. 受影响模块

| 模块 | 文件 | 说明 |
| --- | --- | --- |
| `ruoyi-admin` | `com/ruoyi/web/controller/{{xx}}/{{Xxx}}Controller.java` | Controller |
| `ruoyi-system` | `service/{{IxxxService}}.java` | Service 接口 |
| `ruoyi-system` | `service/impl/{{XxxServiceImpl}}.java` | Service 实现 |
| `ruoyi-system` | `mapper/{{XxxMapper}}.java` | Mapper 接口 |
| `ruoyi-system` | `resources/mapper/system/{{XxxMapper}}.xml` | SQL |

## 3. 接口设计

### 3.1 接口清单

| 场景 | 方法 | 路径 | 权限 | Controller |
| --- | --- | --- | --- | --- |
| 列表 | GET | `/{{module}}/{{resource}}/list` | `{{module}}:{{resource}}:list` | {{Xxx}}Controller |
| 明细 | GET | `/{{module}}/{{resource}}/{id}` | `{{module}}:{{resource}}:query` | {{Xxx}}Controller |
| 新增 | POST | `/{{module}}/{{resource}}` | `{{module}}:{{resource}}:add` | {{Xxx}}Controller |
| 修改 | PUT | `/{{module}}/{{resource}}` | `{{module}}:{{resource}}:edit` | {{Xxx}}Controller |
| 删除 | DELETE | `/{{module}}/{{resource}}/{ids}` | `{{module}}:{{resource}}:remove` | {{Xxx}}Controller |

### 3.2 接口详细定义

> 每个接口写：权限标注 + 请求参数/DTO + 响应结构。
> 写操作接口（POST/PUT/DELETE）还必须写「业务逻辑」，用有序步骤描述完整实现：
> 校验 → 前置状态检查 → 核心操作（含涉及的表和关键字段）→ 异常分支 → 返回值。
> 禁止只写结论不写过程。

#### GET `/{{module}}/{{resource}}/list`

- **权限**: `@PreAuthorize("@ss.hasPermi('{{module}}:{{resource}}:list')")`

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

#### POST `/{{module}}/{{resource}}/confirm`（写操作示例）

- **权限**: `@PreAuthorize("@ss.hasPermi('{{module}}:{{resource}}:confirm')")`
- **日志**: `@Log(title = "{{功能名称}}", businessType = BusinessType.UPDATE)`

**请求体 DTO：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ids` | `Long[]` | 是 | 待确认的记录 ID 数组 |

**响应结构：** `AjaxResult`（code=200, data=null）

**业务逻辑：**

```
confirm(ids):
1. 校验 ids 不为空 → 抛「请选择待操作记录」
2. 批量查询记录；过滤状态不为「待确认」的，收集错误消息统一返回
3. TODO: 调用外部接口（保留空实现）
4. UPDATE 目标表 SET status='已确认', update_by=?, update_time=NOW() WHERE id IN (...)
5. 返回操作成功
```

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

> 与前端类型设计逐字段对齐；后端独有字段（delFlag 等）也要列出；不得用省略号。

| 字段 | Java 类型 | 数据库列名 | 说明 | 约束 | 对应前端字段 |
| --- | --- | --- | --- | --- | --- |
| `id` | `Long` | `id` | 主键 | 必填，自增 | `id` |
| `status` | `String` | `status` | 状态 | 必填 | `status` |
| `delFlag` | `String` | `del_flag` | 删除标志 | 默认 `'0'` | —（后端独有） |
| `createTime` | `Date` | `create_time` | 创建时间 | 自动填充 | `createTime` |
| `updateTime` | `Date` | `update_time` | 更新时间 | 自动填充 | —（后端独有） |

### 4.3 DTO 设计

#### 查询参数 DTO

| 字段 | 类型 | 说明 | 对应前端字段 |
| --- | --- | --- | --- |
| `pageNum` | `Integer` | 页码 | `queryParams.pageNum` |
| `pageSize` | `Integer` | 每页条数 | `queryParams.pageSize` |

#### 请求体 DTO（非标准 CRUD）

| DTO 类名 | 用途 | 关键字段 |
| --- | --- | --- |
| `{{Xxx}}QueryDTO` | 列表查询参数 | 分页 + 筛选字段 |

## 5. 数据库设计

### 5.1 表清单与完整字段

> 每张表完整列出字段，不得用省略号。字段数多时用 DDL SQL。
> 在此注明各表的默认值约定和删除策略（软删/物理删），无需在其他地方重复。

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
- **唯一约束**：（无则写「无」）
- **常用查询索引**：
- **默认值约定**：del_flag='0'，create_time/update_time 自动填充，其他特殊默认值在此列出
- **删除策略**：软删（del_flag='1'）/ 物理删

## 6. Service 设计

### 6.1 方法清单

| 方法 | 说明 | 事务 | 对应接口 |
| --- | --- | --- | --- |
| `select{{Entity}}List` | 查询列表 | 否 | `GET /list` |
| `select{{Entity}}ById` | 查询明细 | 否 | `GET /{id}` |
| `insert{{Entity}}` | 新增 | 是/否 | `POST /` |
| `update{{Entity}}` | 修改 | 是/否 | `PUT /` |
| `delete{{Entity}}ByIds` | 删除 | 是/否 | `DELETE /{ids}` |

### 6.2 跨接口业务规则（补充）

> 本节只写**跨接口通用规则**。单个接口的完整实现逻辑写在 3.2 对应接口的「业务逻辑」小节，不在这里重复。
> 适合写：状态机流转图、数据权限注入规则、序号生成策略、并发控制方式。

#### 状态机（如有）

```
状态A → 状态B → 状态C
              ↑_____↑（回退场景）
```

#### 数据权限注入规则

> 各角色在 Service 层强制注入过滤条件，防止越权。示例：
> - **角色X**：强制覆盖 query.fieldX = currentUser.fieldX，忽略前端传值
> - **管理员**：不注入，可查所有数据

## 7. 查询 SQL

> 每个查询接口写一条伪 SQL，说清主表、动态条件类型、排序。不需要写完整 XML。

#### select{{Entity}}List

```
SELECT * FROM {{table}} WHERE del_flag='0'
  AND fieldA = #{fieldA}          -- 精确匹配
  AND fieldB LIKE #{fieldB}       -- 模糊匹配
  AND date >= #{dateStart}        -- 范围
ORDER BY create_time DESC
```

## 8. 风险点与兼容性

- **旧接口兼容**：
- **数据迁移要求**：
- **缓存 / 定时任务 / 异步影响**：

## 9. 验证方式

- **编译验证**：
- **接口验证**：
- **回归点**：

## 10. 前后端对齐检查

### 10.1 接口覆盖检查

| 前端控件矩阵调用接口 | 后端接口路径 | 覆盖状态 |
| --- | --- | --- |
| `GET /list`（XX 页面） | `GET /xxx/list` | ✅ / ❌ |

### 10.2 请求参数对齐

| 前端字段 | 后端参数 | 类型是否一致 | 备注 |
| --- | --- | --- | --- |
| `queryParams.materialNo` | `OrderQuery.materialNo` | ✅ | — |

### 10.3 响应字段对齐

| 前端字段 | 后端实体字段 | 类型映射 | 备注 |
| --- | --- | --- | --- |
| `order.status: string` | `Order.status: String` | ✅ | — |

### 10.4 枚举值对齐

| 字段 | 前端值 | 后端值 | 一致 |
| --- | --- | --- | --- |
| `status` | `'待确认'` | `'待确认'` | ✅ / ❌ |

```
