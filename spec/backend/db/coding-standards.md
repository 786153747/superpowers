# 数据库与表结构规范

## 适用范围

- 建表 DDL
- 字段设计
- 索引与约束
- SQL 安全规则
- Mapper SQL / 查询约束

凡是涉及表结构、SQL、索引、逻辑删除、审计字段的任务，都必须读取本文。若任务同时修改 Java 后端代码，也必须同时读取 `spec/backend/java/coding-standards.md`。

## 项目基线

- 数据库：MySQL 8
- ORM / 持久层：MyBatis
- 分页：PageHelper（通过 `startPage()`）
- 后端框架：Spring Boot 3.5

## 建表规范

### DDL 示例

```sql
CREATE TABLE tbl_order (
    id              BIGINT(20)      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    order_no        VARCHAR(64)     NOT NULL DEFAULT ''      COMMENT '订单编号',
    material_no     VARCHAR(64)     NOT NULL DEFAULT ''      COMMENT '物料号',
    quantity        DECIMAL(20,6)   NOT NULL DEFAULT 0       COMMENT '数量',
    order_date      DATE            NULL     DEFAULT NULL    COMMENT '下单日期',
    status          CHAR(1)         NOT NULL DEFAULT '0'     COMMENT '状态（0正常 1停用）',
    del_flag        CHAR(1)         NOT NULL DEFAULT '0'     COMMENT '删除标志（0存在 2删除）',
    create_by       VARCHAR(64)     NOT NULL DEFAULT ''      COMMENT '创建者',
    create_time     DATETIME        NULL     DEFAULT NULL    COMMENT '创建时间',
    update_by       VARCHAR(64)     NOT NULL DEFAULT ''      COMMENT '更新者',
    update_time     DATETIME        NULL     DEFAULT NULL    COMMENT '更新时间',
    remark          VARCHAR(500)    NULL     DEFAULT NULL    COMMENT '备注',
    PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=1 COMMENT='订单表';

CREATE INDEX idx_order_no    ON tbl_order (order_no);
CREATE INDEX idx_material_no ON tbl_order (material_no);
CREATE INDEX idx_order_date  ON tbl_order (order_date);
```

### DDL 要点

| 规则 | 说明 |
|------|------|
| 表名 | 业务表使用 `tbl_` 前缀，系统表使用 `sys_` 前缀 |
| 命名 | 统一蛇形命名，下划线分隔 |
| 主键 | `BIGINT(20) NOT NULL AUTO_INCREMENT` |
| 字符串 | `VARCHAR(n)` 指定合理长度，短枚举值可用 `CHAR` |
| 金额/数量 | 使用 `DECIMAL(20,6)`，禁止 `FLOAT` / `DOUBLE` |
| 状态字段 | `CHAR(1)` 并在注释中写清取值含义 |
| 逻辑删除 | 必须包含 `del_flag CHAR(1) NOT NULL DEFAULT '0'` |
| 审计字段 | 必须包含 `create_by`、`create_time`、`update_by`、`update_time` |
| 注释 | 表和字段都必须有中文注释 |
| 存储引擎 | 统一使用 `InnoDB` |
| 索引 | 查询条件字段建索引，命名 `idx_{表名简写}_{字段名}` |

### 日期字段规则

- 业务日期优先用 `date` 或 `datetime`
- 只有外部系统原样文本日期才允许用 `varchar`

## SQL 安全规范

1. 禁止拼接 SQL，参数统一使用 `#{}`。
2. `${}` 仅用于动态表名、列名、排序等不可预编译场景，并且必须做白名单校验。
3. 禁止 `SELECT *`，必须显式列字段。
4. 默认所有查询都要加 `del_flag = '0'` 条件。
5. 分页必须通过 `startPage()` 使用框架分页，禁止手写 `LIMIT`。

## 逻辑删除约定

- 查询：所有 `SELECT` 都必须带 `del_flag = '0'`
- 删除：默认执行逻辑删除，即 `UPDATE ... SET del_flag = '2'`
- 唯一键：若逻辑删除后仍需要复用唯一值，必须设计联合唯一索引或删除时做值迁移
- 关联表：主表逻辑删除时，子表要同步逻辑删除或做引用校验

## 索引与约束规范

1. 主键必须存在。
2. 高频筛选、排序、关联字段需要索引。
3. 唯一约束要结合逻辑删除策略评估。
4. 不为“可能会查”而盲目加索引，基于实际查询条件设计。

## Mapper SQL 约束

1. XML / 注解 SQL 都遵循本文规则。
2. 列表查询、详情查询、统计查询都不能漏掉 `del_flag='0'`。
3. 伪 SQL、设计文档、真实实现要保持一致。
4. SQL 风格应清晰表达精确匹配、模糊匹配、范围过滤、排序字段。

## 表结构设计检查清单

- [ ] 表名使用 `tbl_` 或 `sys_` 前缀
- [ ] 字段命名使用 snake_case
- [ ] 包含 `del_flag`
- [ ] 包含 `create_by/create_time/update_by/update_time`
- [ ] 金额/数量字段使用 `DECIMAL`
- [ ] 所有字段与表均有中文注释
- [ ] 主键与常用查询索引已创建
- [ ] 查询 SQL 默认过滤 `del_flag='0'`
- [ ] 没有 `SELECT *`
- [ ] 分页通过 `startPage()`，未手写 `LIMIT`
