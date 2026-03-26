# Standards Index

本文档已从单一大文件拆分为按领域加载的规范索引页。

不要再默认读取整份总规范。请先判断任务范围，再只读取需要的规范文件。

## 项目基线

- 项目：若依 `ruoyi-ui`
- 前端：Vue 3.5 + TypeScript + Vite 6 + Element Plus 2.x + Pinia + Vue Router 4
- 后端：Java 17 + Spring Boot 3.5 + Spring Security 6 + MyBatis + Druid + Redis + Quartz
- 数据库：MySQL 8
- 后端核心模块：`ruoyi-admin`、`ruoyi-framework`、`ruoyi-system`、`ruoyi-quartz`、`ruoyi-generator`、`ruoyi-common`
- 前端核心目录：`src/api/`、`src/views/`、`src/types/`、`src/components/`、`src/utils/`、`src/router/`

## 规范文件

### 1. 后端 Java 规范

- 路径：`spec/backend/java/coding-standards.md`
- 适用范围：Entity、DTO、Mapper、Service、Controller、统一返回、Excel、后端工具类与注解、后端命名与检查清单

### 2. 前端规范

- 路径：`spec/frontend/vue/coding-standards.md`
- 适用范围：Vue 页面、API 封装、TypeScript 类型、字典、权限、前端工具函数、前端命名与交互约定
- 说明：前端详细设计模板和前端规范文件统一放在 `spec/frontend/vue/`

### 3. 数据库与表结构规范

- 路径：`spec/backend/db/coding-standards.md`
- 适用范围：DDL 建表、字段命名、索引、逻辑删除、审计字段、SQL 安全、分页与查询约束

## 按需加载规则

- 纯后端 Java 开发、评审、设计：读取 `spec/backend/java/coding-standards.md`
- 纯前端开发、评审、设计：读取 `spec/frontend/vue/coding-standards.md`
- 涉及表结构、DDL、SQL、Mapper XML 查询约束：额外读取 `spec/backend/db/coding-standards.md`
- 全栈页面任务：按实际范围组合读取，不需要 DB 变更时不要加载 DB 规范
- 审查或计划阶段：只允许把与当前 scope 直接相关的规范文件作为项目级事实来源

## 推荐加载矩阵

| 场景 | 必读规范 |
|------|----------|
| 新增/修改 Controller、Service、Mapper、Entity | `spec/backend/java/coding-standards.md` |
| 新增/修改 Mapper SQL、表结构、索引 | `spec/backend/java/coding-standards.md` + `spec/backend/db/coding-standards.md` |
| 新增/修改 Vue 页面、API、TS 类型 | `spec/frontend/vue/coding-standards.md` |
| 前后端联动但不改表 | `spec/frontend/vue/coding-standards.md` + `spec/backend/java/coding-standards.md` |
| 前后端联动且改表/SQL | `spec/frontend/vue/coding-standards.md` + `spec/backend/java/coding-standards.md` + `spec/backend/db/coding-standards.md` |

## 迁移说明

- 本索引文件已重命名为 `spec/standards-index.md`
- 任何 workflow、skill、prompt 都不应再把它当作完整规范正文
- 需要更新规范时，应更新对应领域文件，而不是回到单文件模式
