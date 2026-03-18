# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 在此代码库中工作提供指导。

## 项目简介

若依 (RuoYi-Vue3-TypeScript) 是基于 Spring Boot 3 + Vue3 + TypeScript 的前后端分离快速开发平台。

## 技术栈

**前端 (ruoyi-ui/):**
- Vue 3.5 + TypeScript + Vite 6
- Element Plus 2.x (UI 组件库)
- Pinia (状态管理)
- Vue Router 4 (路由)
- Axios (HTTP 客户端)
- @vueuse/core (工具函数库)

**后端:**
- Java 17 + Spring Boot 3.5
- Spring Security 6 + JWT 认证
- MyBatis + Druid 连接池 + MySQL 8
- Redis (缓存/会话)
- Quartz (定时任务)
- SpringDoc/OpenAPI 3 (接口文档)

## 模块架构

### 后端模块 (Maven 多模块)

| 模块 | 说明 |
|------|------|
| `ruoyi-admin` | Web 入口，Controller 层 |
| `ruoyi-framework` | 安全配置、过滤器、注解 |
| `ruoyi-system` | 核心业务：用户、角色、菜单、部门、字典等 |
| `ruoyi-quartz` | 定时任务管理 |
| `ruoyi-generator` | 代码生成器 |
| `ruoyi-common` | 通用工具、常量、异常、注解 |

### 前端结构

| 目录 | 说明 |
|------|------|
| `src/api/` | API 接口层 |
| `src/views/` | 页面组件 |
| `src/components/` | 通用组件 (Pagination, RightToolbar, Editor, FileUpload, ImageUpload, DictTag 等) |
| `src/store/modules/` | Pinia 状态模块 (app, user, permission, tagsView, dict, settings) |
| `src/utils/` | 工具函数 |
| `src/plugins/` | Vue 插件 |
| `src/directive/` | 自定义指令 (hasPermi 权限指令等) |
| `src/layout/` | 布局组件 |
| `src/router/` | 路由配置 |

## 开发命令

### 前端 (ruoyi-ui/)
```bash
cd ruoyi-ui
yarn dev              # 启动开发服务器 http://localhost:80
yarn build:prod       # 生产环境打包
yarn build:stage      # 测试环境打包
yarn tsc --noEmit     # TypeScript 类型检查
```

### 后端
```bash
# 项目根目录
mvn clean install                    # 编译安装
mvn spring-boot:run -pl ruoyi-admin  # 运行后端服务

# 或打包后运行
mvn clean package
java -jar ruoyi-admin/target/ruoyi-admin.jar
```

### Shell 脚本
```bash
./ry.sh start      # 启动后端
./ry.sh stop       # 停止后端
./ry.sh restart    # 重启后端
./ry.sh status     # 查看状态
```

## 默认配置

- 默认账号：admin / admin123
- 后端端口：8080
- 前端端口：80 (开发环境)
- 前端代理：`/dev-api` -> `http://localhost:8080`

---

## 代码生成规范

### 一、后端代码规范

#### 1. Domain (实体类)

**位置**: `ruoyi-system/src/main/java/com/ruoyi/system/domain/`

**规范**:
- 继承 `BaseEntity` (包含创建人、创建时间、更新人、更新时间、备注)
- 树结构实体继承 `TreeEntity` (额外包含父 ID、祖先列表、子节点)
- 字段使用 `@Excel` 注解支持 Excel 导入导出
- 使用 Jakarta Validation 注解 (`@NotBlank`, `@Size` 等) 进行参数校验
- Getter 方法上加校验注解
- 实现 `toString()` 方法使用 `ToStringBuilder`

**示例**:
```java
public class SysConfig extends BaseEntity
{
    @Excel(name = "参数主键", cellType = ColumnType.NUMERIC)
    private Long configId;

    @NotBlank(message = "参数名称不能为空")
    @Size(min = 0, max = 100, message = "参数名称不能超过 100 个字符")
    public String getConfigName() { return configName; }
}
```

#### 1.1 Lombok 使用规范

项目已集成 Lombok，所有模块自动继承依赖（父 pom.xml 统一配置）。

**Entity 实体类规范**:
- 使用 `@Data` 注解自动生成 getter/setter/toString/equals/hashCode
- 日期字段添加 `@JsonFormat(pattern = "yyyy-MM-dd")` 或 `@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")`
- `@Excel` 注解仍然需要，用于 Excel 导入导出

**示例**:
```java
package com.ruoyi.system.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.annotation.Excel.ColumnType;
import com.ruoyi.common.core.domain.BaseEntity;
import lombok.Data;

/**
 * 订单表 t_order
 * @author ruoyi
 */
@Data
public class Order extends BaseEntity
{
    /** 主键 */
    @Excel(name = "主键", cellType = ColumnType.NUMERIC)
    private Long id;

    /** 订单编号 */
    @Excel(name = "订单编号")
    private String orderNo;

    /** 下单日期 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "下单日期", width = 30, dateFormat = "yyyy-MM-dd")
    private LocalDate orderDate;

    /** 采购数量 */
    @Excel(name = "采购数量", cellType = ColumnType.NUMERIC)
    private BigDecimal quantity;
}
```

**DTO 类规范**:
- 使用 `@Data` 注解
- 不需要继承 BaseEntity（DTO 是独立的数据传输对象）
- 日期字段添加 `@JsonFormat` 注解

**示例**:
```java
package com.ruoyi.system.domain.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

/**
 * 订单查询参数 DTO
 * @author ruoyi
 */
@Data
public class OrderQueryDTO
{
    /** 页码 */
    private Integer pageNum;

    /** 每页显示数量 */
    private Integer pageSize;

    /** 物料号 */
    private String materialNo;

    /** 下单日期开始 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private String orderDateStart;

    /** 下单日期结束 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private String orderDateEnd;
}
```

**Lombok 注解使用指南**:

| 注解 | 用途 | 使用场景 |
|------|------|----------|
| `@Data` | 自动生成 getter/setter/toString/equals/hashCode | Entity、DTO |
| `@EqualsAndHashCode(callSuper = true)` | 包含父类的 equals/hashCode | 父类重写了 equals/hashCode 时使用 |
| `@Builder` | 构建器模式 | 复杂对象构建 |
| `@NoArgsConstructor` | 无参构造器 | 需要默认构造器的场景 |
| `@AllArgsConstructor` | 全参构造器 | 需要全参构造器的场景 |
| `@Slf4j` | 注入 log 对象 | Service、Controller |

**注意事项**:
1. IDE 需要安装 Lombok 插件（IntelliJ IDEA / VS Code）
2. `@Data` 会生成所有字段的 getter/setter，包括敏感字段
3. 如果需要自定义 toString 格式，可以手动实现，不使用 `@Data` 的自动生成
4. `@JsonFormat` 用于 JSON 序列化格式化，`@Excel` 用于 Excel 导出格式化，两者可同时使用
5. 父类（如 BaseEntity）没有使用 Lombok 时，子类只用 `@Data` 即可（父类字段不参与 equals/hashCode 比较）

#### 2. Mapper (DAO 层)

**位置**: `ruoyi-system/src/main/java/com/ruoyi/system/mapper/`

**规范**:
- 接口命名：`I{模块}Mapper` 或 `{实体}Mapper`
- 继承 `BaseMapper` (若依封装的通用 Mapper)
- XML 映射文件位置：`ruoyi-system/src/main/resources/mapper/{模块}/{实体}Mapper.xml`

**示例**:
```java
public interface SysConfigMapper extends BaseMapper<SysConfig>
{
    List<SysConfig> selectConfigList(SysConfig config);
    int checkConfigKeyUnique(SysConfig config);
}
```

#### 3. Service (业务层)

**位置**: `ruoyi-system/src/main/java/com/ruoyi/system/service/`

**接口规范**:
- 接口命名：`I{模块}Service`
- 方法命名：`select{实体}List`, `select{实体}ById`, `insert{实体}`, `update{实体}`, `delete{实体}ByIds`

**实现类规范**:
- 实现类命名：`{模块}ServiceImpl`
- 使用 `@Service` 注解
- 注入 Mapper 使用 `@Autowired`
- 批量删除时调用自定义 SQL

**示例**:
```java
@Service
public class SysConfigServiceImpl implements ISysConfigService
{
    @Autowired
    private SysConfigMapper configMapper;

    @Override
    public List<SysConfig> selectConfigList(SysConfig config) {
        return configMapper.selectConfigList(config);
    }
}
```

#### 4. Controller (控制层)

**位置**: `ruoyi-admin/src/main/java/com/ruoyi/web/controller/`

**规范**:
- 继承 `BaseController` (获取分页、用户信息、返回结果等通用方法)
- 使用 `@RestController` + `@RequestMapping`
- 权限控制使用 `@PreAuthorize("@ss.hasPermi('模块：操作')")`
- 操作日志使用 `@Log(title = "xxx", businessType = BusinessType.XXX)`
- 新增/修改接口参数使用 `@Validated @RequestBody`
- 统一返回 `AjaxResult` 或 `TableDataInfo`

**标准接口**:
| 方法 | 路径 | 说明 | 权限标识 |
|------|------|------|----------|
| GET | /list | 查询列表 | `模块:list` |
| POST | /export | 导出 Excel | `模块:export` |
| GET | /{id} | 查询详情 | `模块:query` |
| POST | / | 新增 | `模块:add` |
| PUT | / | 修改 | `模块:edit` |
| DELETE | /{ids} | 删除 | `模块:remove` |

**示例**:
```java
@RestController
@RequestMapping("/system/config")
public class SysConfigController extends BaseController
{
    @Autowired
    private ISysConfigService configService;

    @PreAuthorize("@ss.hasPermi('system:config:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysConfig config) {
        startPage();
        return getDataTable(configService.selectConfigList(config));
    }
}
```

---

### 三、前端代码规范

#### 1. API 层

**位置**: `ruoyi-ui/src/api/{模块}/`

**规范**:
- 每个业务模块一个独立的 API 文件
- 使用 `request` 工具发送请求
- 统一使用 Promise 返回
- 增删改查方法命名：`list`, `get`, `add`, `update`, `del`

**示例**:
```typescript
// src/api/system/config.ts
import request from '@/utils/request'

export function listConfig(query: any) {
  return request({
    url: '/system/config/list',
    method: 'get',
    params: query
  })
}

export function getConfig(configId: number) {
  return request({
    url: '/system/config/' + configId,
    method: 'get'
  })
}
```

#### 2. 页面组件 (CRUD 标准模板)

**位置**: `ruoyi-ui/src/views/{模块}/`

**规范**:
- 使用 `<script setup>` 语法
- 使用 TypeScript 类型定义
- 使用 Composition API (`ref`, `reactive`, `computed`)
- 全局组件：`Pagination`, `RightToolbar`, `Editor`, `FileUpload`, `ImageUpload`, `DictTag`

**标准结构**:
```vue
<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true">
      <!-- 查询条件 -->
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-button type="primary" icon="Plus" @click="handleAdd" v-hasPermi="['模块:add']">新增</el-button>
      <el-button type="danger" icon="Delete" @click="handleDelete" v-hasPermi="['模块:remove']">删除</el-button>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <!-- 列定义 -->
      <el-table-column label="操作" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改弹窗 -->
    <el-dialog :title="title" v-model="open" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <!-- 表单字段 -->
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确定</el-button>
        <el-button @click="cancel">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="模块名称">
import { list, get, del, add, update } from "@/api/模块/文件"

const { proxy } = getCurrentInstance()
const dataList = ref([])
const open = ref(false)
const loading = ref(true)
const total = ref(0)
const ids = ref([])
const title = ref("")

const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10 },
  rules: {}
})

const { queryParams, form, rules } = toRefs(data)

function getList() {
  loading.value = true
  list(queryParams.value).then(response => {
    dataList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "添加"
}

function handleUpdate(row) {
  reset()
  get(row.id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改"
  })
}

function submitForm() {
  proxy.$refs.formRef.validate(valid => {
    if (valid) {
      const method = form.value.id ? update : add
      method(form.value).then(() => {
        proxy.$modal.msgSuccess("操作成功")
        open.value = false
        getList()
      })
    }
  })
}

function handleDelete(row) {
  const ids = row.id || ids.value
  proxy.$modal.confirm('确认删除？').then(() => {
    return del(ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  })
}

function reset() {
  form.value = {}
  proxy.resetForm("formRef")
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
}

getList()
</script>
```

#### 3. 字典使用

```typescript
// 引入字典
const { sys_normal_disable } = proxy.useDict('sys_normal_disable')

// 模板中使用
<el-option
  v-for="dict in sys_normal_disable"
  :key="dict.value"
  :label="dict.label"
  :value="dict.value"
/>
```

#### 4. 权限控制

```vue
<!-- 按钮级权限 -->
<el-button v-hasPermi="['system:user:add']">新增</el-button>

<!-- 条件显示 -->
<el-button v-if="hasPermi('system:user:edit')">修改</el-button>
```

---

### 四、命名规范

#### 后端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 实体类 | 大驼峰，Sys 前缀 | `SysConfig`, `SysUser` |
| Mapper 接口 | 大驼峰 +Mapper | `SysConfigMapper` |
| Service 接口 | I+ 大驼峰+Service | `ISysConfigService` |
| Service 实现 | 大驼峰 +ServiceImpl | `SysConfigServiceImpl` |
| Controller | 大驼峰 +Controller | `SysConfigController` |
| XML 文件 | 实体类名+Mapper.xml | `SysConfigMapper.xml` |

#### 前端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| API 文件 | 小驼峰 | `config.ts`, `user.ts` |
| 页面组件 | 小写 + 连字符 | `user/index.vue`, `config/index.vue` |
| 组件 name | 大驼峰 (PascalCase) | `UserManage`, `ConfigList` |
| 变量/函数 | 小驼峰 | `dataList`, `handleAdd` |
| 类型接口 | 大驼峰 | `UserQuery`, `ConfigVO` |

---

### 五、代码生成器使用

若依内置代码生成器可根据数据库表结构一键生成前后端代码。

**生成步骤**:
1. 在数据库创建表 (支持单表、树表、主子表)
2. 访问系统工具 -> 代码生成 -> 导入表
3. 配置生成信息 (包路径、作者、模块等)
4. 预览和下载代码

**生成模板位置**: `ruoyi-generator/src/main/resources/vm/`

| 模板文件 | 说明 |
|----------|------|
| `java/domain.java.vm` | 实体类模板 |
| `java/mapper.java.vm` | Mapper 接口模板 |
| `java/service.java.vm` | Service 接口模板 |
| `java/serviceImpl.java.vm` | Service 实现模板 |
| `java/controller.java.vm` | Controller 模板 |
| `xml/mapper.xml.vm` | MyBatis XML 模板 |
| `js/api.js.vm` | 前端 API 模板 |
| `vue/v3/index.vue.vm` | Vue3 页面模板 |

---

### 六、统一返回格式

系统有两种标准返回格式，使用场景不同：

#### 1. AjaxResult - 操作结果返回

**使用场景**: 新增、修改、删除、查询详情等非分页接口

**返回结构**:
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

**状态码说明** (`HttpStatus`):
| 状态码 | 说明 |
|--------|------|
| 200 | SUCCESS - 操作成功 |
| 201 | CREATED - 对象创建成功 |
| 400 | BAD_REQUEST - 参数错误 |
| 401 | UNAUTHORIZED - 未授权 |
| 403 | FORBIDDEN - 访问受限 |
| 404 | NOT_FOUND - 资源未找到 |
| 500 | ERROR - 系统内部错误 |
| 601 | WARN - 警告消息 |

**Controller 用法**:
```java
// 继承 BaseController 后可直接使用以下方法

// 返回成功（无数据）
return success();

// 返回成功（带消息）
return success("操作成功");

// 返回成功（带数据）
return success(data);

// 返回成功（带消息和数据）
return success("获取成功", data);

// 返回错误
return error("操作失败");

// 返回错误（带状态码）
return AjaxResult.error(500, "系统错误");

// 返回警告
return warn("数据不存在");

// toAjax 快捷方法（根据影响行数返回成功/失败）
return toAjax(rows);
```

#### 2. TableDataInfo - 表格分页数据返回

**使用场景**: 列表查询接口（带分页）

**返回结构**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "rows": [{ "id": 1, "name": "测试" }],
  "total": 100
}
```

**字段说明**:
| 字段 | 说明 |
|------|------|
| code | 状态码 |
| msg | 消息内容 |
| rows | 数据列表 |
| total | 总记录数 |

**Controller 用法**:
```java
// 继承 BaseController 后可直接使用

@GetMapping("/list")
public TableDataInfo list(SysConfig config) {
    startPage();  // 开启分页
    List<SysConfig> list = configService.selectConfigList(config);
    return getDataTable(list);  // 自动包装分页结果
}
```

**前端响应处理** (`utils/request.ts`):
```typescript
// Axios 响应拦截器自动处理
// AjaxResult: response.code === 200 时 resolve(response.data)
// TableDataInfo: response.rows 为列表数据，response.total 为总数
```

---

### 七、Excel 导入导出

若依封装了 `ExcelUtil` 工具类，支持基于注解的 Excel 导入导出功能。

#### 1. 核心类和方法

**类**: `com.ruoyi.common.utils.poi.ExcelUtil<T>`

**构造方法**:
```java
// 指定实体类创建 Excel 工具
ExcelUtil<SysUser> util = new ExcelUtil<SysUser>(SysUser.class);
```

**核心方法**:

| 方法 | 说明 | 参数 |
|------|------|------|
| `exportExcel(HttpServletResponse, List<T>, String)` | 导出 Excel | response、数据列表、文件名 |
| `exportExcel(OutputStream, List<T>)` | 导出到输出流 | 输出流、数据列表 |
| `importExcel(String, int, int)` | 导入 Excel | 文件路径、标题行数、是否忽略空行 |
| `importExcel(MultipartFile, int, int)` | 导入 Excel | 文件对象、标题行数、是否忽略空行 |

#### 2. Excel 注解

**@Excel** - 字段导出配置

| 属性 | 说明 | 默认值 |
|------|------|--------|
| name | 列名 | "" |
| readConverterExp | 读取转换表达式（字典） | "" |
| combo | 下拉框选项 | {} |
| type | 导出类型（ALL/EXPORT/IMPORT） | Type.ALL |
| dataType | 数据类型（TEXT/NUMERIC/IMAGE） | ColumnType.TEXT |
| width | 列宽 | 0 |
| height | 列高 | 0 |

**@Excels** - 多个 Excel 注解容器

**用法示例**:
```java
public class SysConfig extends BaseEntity
{
    /** 参数主键 - 数字类型 */
    @Excel(name = "参数主键", cellType = ColumnType.NUMERIC)
    private Long configId;

    /** 参数名称 - 文本类型 */
    @Excel(name = "参数名称")
    private String configName;

    /** 系统内置 - 字典转换 */
    @Excel(name = "系统内置", readConverterExp = "Y=是,N=否")
    private String configType;

    /** 创建时间 - 日期格式化 */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Excel(name = "创建时间", width = 30, dateFormat = "yyyy-MM-dd")
    private Date createTime;

    /** 图片 - 图片类型 */
    @Excel(name = "图片", cellType = ColumnType.IMAGE)
    private String image;
}
```

#### 3. Controller 导出示例

```java
@PostMapping("/export")
@Log(title = "参数管理", businessType = BusinessType.EXPORT)
@PreAuthorize("@ss.hasPermi('system:config:export')")
public void export(HttpServletResponse response, SysConfig config)
{
    List<SysConfig> list = configService.selectConfigList(config);
    ExcelUtil<SysConfig> util = new ExcelUtil<SysConfig>(SysConfig.class);
    util.exportExcel(response, list, "参数数据");
}
```

#### 4. 导入示例

```java
@PostMapping("/importData")
@Log(title = "用户导入", businessType = BusinessType.IMPORT)
public AjaxResult importData(MultipartFile file, boolean updateSupport)
{
    ExcelUtil<SysUser> util = new ExcelUtil<SysUser>(SysUser.class);
    List<SysUser> userList = util.importExcel(file.getInputStream());
    // 处理导入数据
    return success();
}
```

#### 5. 字典回显配置

对于有字典转换的字段，在 Service 层需要手动设置字典映射：
```java
// 在查询出数据后
for (SysConfig config : list) {
    // 设置字典值到 map 中，避免重复查询
    util.sysDictMap.put(config.getConfigKey(), config.getConfigValue());
}
```

---

### 八、核心工具类和注解

#### 1. 后端工具类

**位置**: `ruoyi-common/src/main/java/com/ruoyi/common/utils/`

| 工具类 | 常用方法 | 说明 |
|--------|----------|------|
| `StringUtils` | `isEmpty()`, `isNotEmpty()`, `trim()`, `substring()` | 字符串操作，继承 Apache Commons |
| `DateUtils` | `getDate()`, `getTime()`, `parseDateToStr()`, `dateTimeNow()` | 日期时间工具 |
| `FileUploadUtils` | `upload()` | 文件上传，支持大小限制、文件名校验 |
| `SecurityUtils` | `getLoginUser()`, `getUserId()`, `getUsername()` | 获取当前登录用户信息 |
| `DictUtils` | `getDictLabel()`, `getDictValue()` | 字典数据转换 |
| `PageUtils` | `getPageNum()`, `getPageSize()` | 分页工具 |
| `Threads` | `sleep()`, `execute()`, `shutdownAndAwaitTermination()` | 线程工具 |

**DateUtils 常用常量**:
```java
public static final String YYYY_MM_DD = "yyyy-MM-dd";
public static final String YYYYMMDDHHMMSS = "yyyyMMddHHmmss";
public static final String YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd HH:mm:ss";
```

**DateUtils 使用示例**:
```java
// 获取当前日期
Date today = DateUtils.getDate();

// 获取当前时间字符串
String timeStr = DateUtils.getTime();

// 日期格式化
String dateStr = DateUtils.parseDateToStr(YYYY_MM_DD, new Date());

// 解析字符串为日期
Date date = DateUtils.parseDate("2024-01-01");
```

**FileUploadUtils 使用示例**:
```java
// 默认上传（50MB 限制）
String fileName = FileUploadUtils.upload(baseDir, file);

// 带校验的上传（指定允许的文件扩展名和最大大小）
String fileName = FileUploadUtils.upload(
    baseDir,
    file,
    new String[] {"jpg", "png", "gif"},  // 允许扩展名
    FileUploadUtils.IMAGE_SIZE            // 最大大小
);
```

#### 2. 核心注解

**@Log - 操作日志**

**位置**: `ruoyi-common/src/main/java/com/ruoyi/common/annotation/Log.java`

| 属性 | 说明 | 默认值 |
|------|------|--------|
| title | 模块标题 | "" |
| businessType | 业务类型（枚举） | BusinessType.OTHER |
| operatorType | 操作类型（枚举） | OperatorType.MANAGE |
| isSaveRequestData | 是否保存请求数据 | true |
| isSaveResponseData | 是否保存响应数据 | true |

**使用示例**:
```java
@PostMapping("/add")
@Log(title = "用户管理", businessType = BusinessType.ADD)
public AjaxResult add(@Validated @RequestBody SysUser user) {
    return toAjax(userService.insertUser(user));
}
```

**@DataScope - 数据权限过滤**

**位置**: `ruoyi-common/src/main/java/com/ruoyi/common/annotation/DataScope.java`

| 属性 | 说明 | 默认值 |
|------|------|--------|
| deptAlias | 部门表别名 | "" |
| userAlias | 用户表别名 | "" |
| permission | 权限字符 | "" |

**使用示例**:
```java
// Service 方法上使用
@DataScope(deptAlias = "d", userAlias = "u", permission = "system:user:list")
public List<SysUser> selectUserList(SysUser user);
```

**@RepeatSubmit - 防止重复提交**

**位置**: `ruoyi-common/src/main/java/com/ruoyi/common/annotation/RepeatSubmit.java`

| 属性 | 说明 | 默认值 |
|------|------|--------|
| interval | 间隔时间（毫秒） | 5000 |
| message | 提示信息 | "不允许重复提交，请稍后再试" |

**使用示例**:
```java
@PostMapping("/add")
@RepeatSubmit(interval = 5000, message = "请勿重复提交")
@Log(title = "参数管理", businessType = BusinessType.ADD)
public AjaxResult add(@RequestBody SysConfig config) {
    return toAjax(configService.insertConfig(config));
}
```

**@RateLimiter - 接口限流**

**位置**: `ruoyi-common/src/main/java/com/ruoyi/common/annotation/RateLimiter.java`

| 属性 | 说明 | 默认值 |
|------|------|--------|
| key | 限流 key | "" |
| time | 时间窗口（秒） | 60 |
| count | 限制次数 | 100 |
| limitType | 限流类型（GLOBAL/CLUSTER） | GLOBAL |

**使用示例**:
```java
// 限制 60 秒内最多 10 次请求
@RateLimiter(key = "login", time = 60, count = 10)
@PostMapping("/login")
public AjaxResult login(@RequestBody LoginBody loginBody) {
    // 登录逻辑
}
```

**@Sensitive - 数据脱敏**

**位置**: `ruoyi-common/src/main/java/com/ruoyi/common/annotation/Sensitive.java`

| 属性 | 说明 | 默认值 |
|------|------|--------|
| type | 脱敏类型（枚举） | SensitiveType.NONE |

**脱敏类型**:
- `MOBILE` - 手机号（138****1234）
- `ID_CARD` - 身份证号（110101********1234）
- `EMAIL` - 邮箱（test****@example.com）
- `ADDRESS` - 地址（北京市********）
- `PASSWORD` - 密码（******）

**使用示例**:
```java
public class SysUser {
    /** 手机号 - 脱敏显示 */
    @Sensitive(type = SensitiveType.MOBILE)
    private String phonenumber;

    /** 邮箱 - 脱敏显示 */
    @Sensitive(type = SensitiveType.EMAIL)
    private String email;
}
```

#### 3. 前端工具类

**位置**: `ruoyi-ui/src/utils/`

**request.ts - Axios 请求封装**

| 功能 | 说明 |
|------|------|
| 请求拦截 | 自动添加 Authorization token |
| GET 参数转换 | 将 params 对象转换为 URL 查询字符串 |
| 防重复提交 | 检测 5 秒内相同请求 |
| 响应拦截 | 统一处理状态码（200/401/500/601） |
| 下载方法 | `download()` 支持文件下载 |

**核心方法**:
```typescript
// 下载文件
export function download(url: string, params: any, filename: string, config?: any) {
  downloadLoadingInstance = ElLoading.service({
    text: "正在下载数据，请稍候",
    background: "rgba(0, 0, 0, 0.7)"
  })
  return service.post(url, params, {
    transformRequest: [(params: any) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob',
    ...config
  })
}
```

**ruoyi.ts - 通用工具函数**

| 方法 | 说明 | 示例 |
|------|------|------|
| `parseTime(time, pattern)` | 日期格式化 | `parseTime(new Date(), '{y}-{m}-{d}')` |
| `resetForm(refName)` | 重置表单 | `resetForm('formRef')` |
| `addDateRange(params, dateRange, propName)` | 添加日期范围参数 | `addDateRange(query, dateRange, '')` |
| `selectDictLabel(datas, value)` | 字典标签回显（单个值） | `selectDictLabel(dictList, status)` |
| `selectDictLabels(datas, value, separator)` | 字典标签回显（多个值） | `selectDictLabels(dictList, '1,2', ',')` |
| `handleTree(data, id, parentId, children)` | 构建树形结构 | `handleTree(list, 'id', 'parentId')` |
| `tansParams(params)` | 参数序列化 | `tansParams({name: 'test'})` |

**validate.ts - 表单验证函数**

| 方法 | 说明 |
|------|------|
| `isEmpty(value)` | 判断是否为空 |
| `validEmail(email)` | 验证邮箱格式 |
| `validPhone(phone)` | 验证手机号格式 |
| `validURL(url)` | 验证 URL 格式 |
| `isExternal(path)` | 判断是否为外链 |
| `isHttp(url)` | 判断是否为 http/https 协议 |

---

### 九、通用规则

1. **禁止硬编码**: 使用常量或配置类管理
2. **统一异常处理**: 使用 `@ServiceException` 抛出业务异常
3. **日志规范**: Controller 层使用 `@Log` 注解记录操作日志
4. **数据权限**: 使用 `@DataScope` 注解实现数据范围过滤
5. **防重复提交**: 使用 `@RepeatSubmit` 注解防止重复提交
6. **限流**: 使用 `@RateLimiter` 注解进行接口限流
7. **数据脱敏**: 使用 `@Sensitive` 注解对敏感信息进行脱敏

---

### 十、常见错误与修复方案

#### 错误 1: ExcelUtil.ColumnType 找不到符号

**错误信息**:
```
无法解析符号 'ColumnType'
位置：类 com.ruoyi.common.utils.poi.ExcelUtil
```

**原因**: `ColumnType` 枚举定义在 `@Excel` 注解中，不是在 `ExcelUtil` 类中。

**修复方法**:
```java
// ❌ 错误的导入
import com.ruoyi.common.utils.poi.ExcelUtil;
@Excel(name = "数量", cellType = ExcelUtil.ColumnType.NUMERIC)

// ✅ 正确的导入
import com.ruoyi.common.annotation.Excel.ColumnType;
@Excel(name = "数量", cellType = ColumnType.NUMERIC)
```

---

#### 错误 2: javax.servlet.http 包不存在

**错误信息**:
```
程序包 javax.servlet.http 不存在
```

**原因**: Spring Boot 3 迁移到 Jakarta EE 9+，`javax.servlet` 包名改为 `jakarta.servlet`。

**修复方法**:
```java
// ❌ 错误的导入
import javax.servlet.http.HttpServletResponse;

// ✅ 正确的导入
import jakarta.servlet.http.HttpServletResponse;
```

**影响文件**: 所有 Controller 中使用 `HttpServletResponse` 的地方。

---

#### 错误 3: Controller 包名错误

**错误信息**: 编译通过但运行时可能找不到 Controller，或与其他 Controller 包结构不一致。

**问题代码**:
```java
// ❌ 错误 - 缺少子包名
package com.ruoyi.web.controller;

@RestController
@RequestMapping("/order")
public class OrderController { ... }
```

**原因**: 项目中现有 Controller 都按模块分子包（如 `com.ruoyi.web.controller.system`），新 Controller 也应遵循此规范。

**修复方法**:
```java
// ✅ 正确 - 按模块划分子包
// order 模块 Controller
package com.ruoyi.web.controller.order;

@RestController
@RequestMapping("/order")
public class OrderController { ... }

// inventory 模块 Controller
package com.ruoyi.web.controller.inventory;

@RestController
@RequestMapping("/inventory/consignment")
public class ConsignmentInventoryController { ... }
```

**包名规范**:
| 模块 | Controller 包名 |
|------|----------------|
| 系统管理 | `com.ruoyi.web.controller.system` |
| 订单管理 | `com.ruoyi.web.controller.order` |
| 库存管理 | `com.ruoyi.web.controller.inventory` |
| 监控 | `com.ruoyi.web.controller.monitor` |
| 工具 | `com.ruoyi.web.controller.tool` |
| 公共 | `com.ruoyi.web.controller.common` |

---

#### 错误 4: 后端编译失败但前端代码已修改

**场景**: 后端代码修改后未重新编译，导致运行时错误。

**解决方法**:
```bash
# 编译后端核心模块
mvn compile -pl ruoyi-admin,ruoyi-system -am

# 完整编译
mvn clean compile
```

**建议**: 每次修改后端代码后，先编译验证再测试。

---

### 十一、后端代码生成检查清单

生成新模块代码时，请确认以下项目：

**Domain 层 (ruoyi-system/src/main/java/com/ruoyi/system/domain/)**:
- [ ] 继承 `BaseEntity`
- [ ] 字段使用 `@Excel` 注解标记（需要导出的字段）
- [ ] 数量字段使用 `BigDecimal` 类型
- [ ] 日期字段使用 `@JsonFormat(pattern = "yyyy-MM-dd")`
- [ ] `ColumnType` 导入正确：`import com.ruoyi.common.annotation.Excel.ColumnType;`

**Mapper 层 (ruoyi-system/src/main/java/com/ruoyi/system/mapper/)**:
- [ ] 接口命名 `{Entity}Mapper`
- [ ] 继承 `BaseMapper`
- [ ] XML 文件路径：`src/main/resources/mapper/{模块}/{Entity}Mapper.xml`

**Service 层 (ruoyi-system/src/main/java/com/ruoyi/system/service/)**:
- [ ] 接口命名 `I{Entity}Service`
- [ ] 实现类命名 `{Entity}ServiceImpl`
- [ ] 使用 `@Service` 注解

**Controller 层 (ruoyi-admin/src/main/java/com/ruoyi/web/controller/)**:
- [ ] 包名包含模块子包：`com.ruoyi.web.controller.{模块}`
- [ ] 继承 `BaseController`
- [ ] 使用 `@RestController` + `@RequestMapping`
- [ ] 权限注解 `@PreAuthorize("@ss.hasPermi('模块：操作')")`
- [ ] 日志注解 `@Log(title = "xxx", businessType = BusinessType.XXX)`
- [ ] 使用 `jakarta.servlet.http.HttpServletResponse`（不是 javax）

**SQL 脚本**:
- [ ] 表名使用蛇形命名（下划线分隔）
- [ ] 包含 `del_flag` 逻辑删除字段
- [ ] 包含 `create_time`, `update_time` 等审计字段
- [ ] 主键索引和查询字段索引已创建
