# 后端详细设计文档模板（若依）

```md
# {{功能名称}} — 后端详细设计

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

| 场景 | 方法 | 路径 | 权限 |
| --- | --- | --- | --- |
| 列表 | GET | `/{{module}}/{{resource}}/list` | `{{module}}:{{resource}}:list` |
| 明细 | GET | `/{{module}}/{{resource}}/{id}` | `{{module}}:{{resource}}:query` |
| 新增 | POST | `/{{module}}/{{resource}}` | `{{module}}:{{resource}}:add` |
| 修改 | PUT | `/{{module}}/{{resource}}` | `{{module}}:{{resource}}:edit` |
| 删除 | DELETE | `/{{module}}/{{resource}}/{ids}` | `{{module}}:{{resource}}:remove` |

### 3.2 返回结构

- 列表接口：`TableDataInfo`
- 普通接口：`AjaxResult`
- 导出接口：直接写 `HttpServletResponse`

## 4. 领域模型

### 4.1 主要实体

| 实体 | 说明 | 位置 |
| --- | --- | --- |
| `{{Entity}}` | 主实体 | `ruoyi-system/src/main/java/com/ruoyi/system/domain/` |

### 4.2 关键字段

| 字段 | 类型 | 说明 | 约束 |
| --- | --- | --- | --- |
| `id` | `Long` | 主键 | 必填 |
| `status` | `String` | 状态 | `'0'/'1'` |
| `delFlag` | `String` | 删除标志 | `'0'/'2'` |

## 5. 数据库设计

### 5.1 表清单

| 表名 | 用途 | 关键字段 |
| --- | --- | --- |
| `{{table_name}}` | 主表 | `id / status / del_flag / create_time ...` |

### 5.2 索引与约束

- 主键：
- 唯一约束：
- 常用查询索引：

## 6. Service 设计

### 6.1 方法清单

| 方法 | 说明 | 事务 |
| --- | --- | --- |
| `select{{Entity}}List` | 查询列表 | 否 |
| `select{{Entity}}ById` | 查询明细 | 否 |
| `insert{{Entity}}` | 新增 | 是/否 |
| `update{{Entity}}` | 修改 | 是/否 |
| `delete{{Entity}}ByIds` | 删除 | 是/否 |

### 6.2 业务规则

- 
- 

## 7. Mapper / SQL 设计

### 7.1 查询 SQL

- 是否需要联表：
- 是否需要数据范围：
- 是否需要分页：

### 7.2 写入 SQL

- 新增默认值：
- 更新策略：
- 删除策略：软删 / 物理删

## 8. 权限、日志与审计

- **权限字符串**：
- **是否记录操作日志**：
- **创建 / 修改人填充方式**：`getUsername()`

## 9. 风险点与兼容性

- 旧接口兼容：
- 数据迁移要求：
- 缓存 / 定时任务 / 异步影响：

## 10. 验证方式

- 编译验证：
- 接口验证：
- 回归点：
```
