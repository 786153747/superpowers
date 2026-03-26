# 后端 Java 规范

## 适用范围

- Java 后端开发、设计、评审
- Entity / DTO / Mapper / Service / Controller
- 统一返回结构、Excel 导入导出、后端工具类和注解

如果任务涉及建表、索引、SQL 风格、逻辑删除字段、Mapper SQL 约束，必须同时读取 `spec/backend/db/coding-standards.md`。

## 项目基线

### 技术栈

- Java 17
- Spring Boot 3.5
- Spring Security 6 + JWT
- MyBatis + Druid
- Redis
- Quartz
- SpringDoc/OpenAPI 3

### 模块架构

| 模块 | 说明 |
|------|------|
| `ruoyi-admin` | Web 入口，Controller 层 |
| `ruoyi-framework` | 安全配置、过滤器、注解 |
| `ruoyi-system` | 核心业务模块 |
| `ruoyi-quartz` | 定时任务管理 |
| `ruoyi-generator` | 代码生成器 |
| `ruoyi-common` | 通用工具、常量、异常、注解 |

### 常用命令

```bash
mvn clean install
mvn spring-boot:run -pl ruoyi-admin
mvn clean package
java -jar ruoyi-admin/target/ruoyi-admin.jar
```

### 默认配置

- 默认账号：`admin / admin123`
- 后端端口：`8080`

## 代码规范

### 1. Domain / Entity

**位置**：`ruoyi-system/src/main/java/com/ruoyi/system/domain/`

**规范**：

- 实体类继承 `BaseEntity`
- 树结构实体继承 `TreeEntity`
- 导出字段使用 `@Excel`
- 参数校验使用 Jakarta Validation 注解
- 日期字段使用 `@JsonFormat`
- 需要时实现 `toString()`，或使用 Lombok 统一生成

**示例**：

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

### 1.1 Lombok 规范

- Entity、DTO 默认使用 `@Data`
- 日期字段补 `@JsonFormat(pattern = "yyyy-MM-dd")` 或 `yyyy-MM-dd HH:mm:ss`
- `@Excel` 仍然保留，不能因为用了 Lombok 去掉

**常用注解**：

| 注解 | 用途 | 场景 |
|------|------|------|
| `@Data` | getter/setter/toString/equals/hashCode | Entity、DTO |
| `@EqualsAndHashCode(callSuper = true)` | 包含父类字段 | 父类重写了 equals/hashCode 时 |
| `@Builder` | 构建器模式 | 复杂对象构建 |
| `@NoArgsConstructor` | 无参构造器 | 需要默认构造器 |
| `@AllArgsConstructor` | 全参构造器 | 需要完整构造器 |
| `@Slf4j` | 注入日志对象 | Service、Controller |

**注意事项**：

1. IDE 需要安装 Lombok 插件。
2. `@Data` 会为全部字段生成 getter/setter，包括敏感字段。
3. 父类未使用 Lombok 时，子类只用 `@Data` 即可。

### 1.2 DTO 规范

- DTO 不继承 `BaseEntity`
- 查询参数、请求体、返回体按职责拆分
- 日期字符串字段补 `@JsonFormat`

### 2. Mapper

**位置**：`ruoyi-system/src/main/java/com/ruoyi/system/mapper/`

**规范**：

- 命名：`{Entity}Mapper`
- 直接定义接口，不继承 `BaseMapper`
- XML 路径：`ruoyi-system/src/main/resources/mapper/{模块}/{Entity}Mapper.xml`

**示例**：

```java
public interface SysConfigMapper
{
    List<SysConfig> selectConfigList(SysConfig config);
    int checkConfigKeyUnique(SysConfig config);
}
```

### 3. Service

**位置**：`ruoyi-system/src/main/java/com/ruoyi/system/service/`

**接口规范**：

- 接口命名：`I{Entity}Service`
- 方法命名：`select{Entity}List`、`select{Entity}ById`、`insert{Entity}`、`update{Entity}`、`delete{Entity}ByIds`

**实现类规范**：

- 实现类命名：`{Entity}ServiceImpl`
- 使用 `@Service`
- 注入 Mapper 使用 `@Autowired`
- 批量删除、复杂更新使用自定义 SQL

### 4. Controller

**位置**：`ruoyi-admin/src/main/java/com/ruoyi/web/controller/`

**规范**：

- 继承 `BaseController`
- 使用 `@RestController` + `@RequestMapping`
- 权限控制使用 `@PreAuthorize("@ss.hasPermi('模块:资源:操作')")`
- 操作日志使用 `@Log(title = "...", businessType = BusinessType.XXX)`
- 新增/修改入参使用 `@Validated @RequestBody`
- 返回统一使用 `AjaxResult` 或 `TableDataInfo`

**`@Log` 约定**：

- 查询操作使用 `BusinessType.OTHER`
- 新增 `INSERT`
- 修改 `UPDATE`
- 删除 `DELETE`
- 导出 `EXPORT`
- 导入 `IMPORT`

**标准接口**：

| 方法 | 路径 | 说明 | 权限标识 |
|------|------|------|----------|
| GET | `/list` | 查询列表 | `模块:资源:list` |
| POST | `/export` | 导出 Excel | `模块:资源:export` |
| GET | `/{id}` | 查询详情 | `模块:资源:query` |
| POST | `/` | 新增 | `模块:资源:add` |
| PUT | `/` | 修改 | `模块:资源:edit` |
| DELETE | `/{ids}` | 删除 | `模块:资源:remove` |

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 实体类 | 大驼峰 | `SysConfig` |
| Mapper | 大驼峰 + `Mapper` | `SysConfigMapper` |
| Service 接口 | `I` + 大驼峰 + `Service` | `ISysConfigService` |
| Service 实现 | 大驼峰 + `ServiceImpl` | `SysConfigServiceImpl` |
| Controller | 大驼峰 + `Controller` | `SysConfigController` |
| XML | 实体名 + `Mapper.xml` | `SysConfigMapper.xml` |

## 统一返回格式

### AjaxResult

**适用场景**：新增、修改、删除、详情等非分页接口。

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

**Controller 常用方法**：

```java
return success();
return success("操作成功");
return success(data);
return success("获取成功", data);
return error("操作失败");
return warn("数据不存在");
return toAjax(rows);
```

### TableDataInfo

**适用场景**：分页列表。

```json
{
  "code": 200,
  "msg": "查询成功",
  "rows": [],
  "total": 100
}
```

**Controller 用法**：

```java
@GetMapping("/list")
public TableDataInfo list(SysConfig config) {
    startPage();
    List<SysConfig> list = configService.selectConfigList(config);
    return getDataTable(list);
}
```

## Excel 导入导出

### 核心类

- `com.ruoyi.common.utils.poi.ExcelUtil<T>`

### 常用方法

| 方法 | 说明 |
|------|------|
| `exportExcel(HttpServletResponse, List<T>, String)` | 导出 Excel |
| `exportExcel(OutputStream, List<T>)` | 导出到输出流 |
| `importExcel(String, int, int)` | 从文件路径导入 |
| `importExcel(MultipartFile, int, int)` | 从上传文件导入 |

### 注解规范

| 注解 | 说明 |
|------|------|
| `@Excel` | 字段导出配置 |
| `@Excels` | 多个 Excel 注解容器 |

**注意**：

- 导出仍使用 `ExcelUtil`，不要改成 EasyExcel
- `ColumnType` 从 `com.ruoyi.common.annotation.Excel.ColumnType` 导入

## 后端工具类与注解

### 常用工具类

**位置**：`ruoyi-common/src/main/java/com/ruoyi/common/utils/`

| 工具类 | 常用方法 | 说明 |
|--------|----------|------|
| `StringUtils` | `isEmpty()`、`isNotEmpty()` | 字符串工具 |
| `DateUtils` | `getDate()`、`getTime()`、`parseDateToStr()` | 日期时间工具 |
| `FileUploadUtils` | `upload()` | 文件上传 |
| `SecurityUtils` | `getLoginUser()`、`getUserId()`、`getUsername()` | 当前登录用户 |
| `DictUtils` | `getDictLabel()`、`getDictValue()` | 字典转换 |
| `PageUtils` | `getPageNum()`、`getPageSize()` | 分页工具 |
| `Threads` | `sleep()`、`execute()` | 线程工具 |

### 核心注解

| 注解 | 用途 |
|------|------|
| `@Log` | 操作日志 |
| `@DataScope` | 数据权限过滤 |
| `@RepeatSubmit` | 防重复提交 |
| `@RateLimiter` | 接口限流 |
| `@Sensitive` | 数据脱敏 |

## 通用后端规则

1. 禁止硬编码，优先常量或配置类。
2. 统一异常处理，业务异常走项目既有异常体系。
3. Controller 层按规范加 `@Log`。
4. 数据权限使用 `@DataScope`。
5. 防重复提交使用 `@RepeatSubmit`。
6. 限流使用 `@RateLimiter`。
7. 敏感信息展示使用 `@Sensitive`。
8. 涉及 SQL、DDL、索引、逻辑删除字段时，必须额外遵守 `spec/backend/db/coding-standards.md`。

## 常见错误与修复

### 1. `ExcelUtil.ColumnType` 找不到符号

**错误原因**：`ColumnType` 定义在 `@Excel` 注解内部，不在 `ExcelUtil` 类中。

**正确写法**：

```java
import com.ruoyi.common.annotation.Excel.ColumnType;
@Excel(name = "数量", cellType = ColumnType.NUMERIC)
```

### 2. `javax.servlet.http` 包不存在

Spring Boot 3 迁移到 Jakarta EE，统一使用：

```java
import jakarta.servlet.http.HttpServletResponse;
```

### 3. Controller 包名错误

新 Controller 需要落在模块子包，不要直接放到 `com.ruoyi.web.controller`。

**示例**：

- `com.ruoyi.web.controller.system`
- `com.ruoyi.web.controller.order`
- `com.ruoyi.web.controller.inventory`
- `com.ruoyi.web.controller.monitor`
- `com.ruoyi.web.controller.tool`
- `com.ruoyi.web.controller.common`

## 后端代码生成检查清单

### Domain

- [ ] 继承 `BaseEntity`
- [ ] 需要导出的字段加 `@Excel`
- [ ] 数量字段优先 `BigDecimal`
- [ ] 日期字段加 `@JsonFormat`
- [ ] `ColumnType` 导入正确

### Mapper

- [ ] 命名为 `{Entity}Mapper`
- [ ] 直接定义接口，不继承 `BaseMapper`
- [ ] XML 路径符合模块目录约定

### Service

- [ ] 接口命名 `I{Entity}Service`
- [ ] 实现类命名 `{Entity}ServiceImpl`
- [ ] 使用 `@Service`

### Controller

- [ ] 包名包含模块子包
- [ ] 继承 `BaseController`
- [ ] 使用 `@RestController` + `@RequestMapping`
- [ ] 权限注解使用 `@PreAuthorize`
- [ ] 日志注解使用 `@Log`
- [ ] 使用 `jakarta.servlet.http.HttpServletResponse`

### SQL / DB 联动

- [ ] 如有表结构或 SQL 变更，同时读取 `spec/backend/db/coding-standards.md`
- [ ] 查询语句、逻辑删除、索引、字段类型与 DB 规范一致
