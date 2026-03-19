# Superpowers 中文说明

`Superpowers` 是一套面向编码智能体的完整开发工作流。它把需求澄清、方案设计、计划拆解、编码执行、测试验证和代码评审，沉淀为一组可组合的 `skills`、命令入口和插件集成配置，让 Claude Code、Cursor、Codex、OpenCode 等工具在真正开始写代码前，先按工程化流程做对事情。

## 项目定位

这个仓库不是传统业务应用，而是一个“给编码代理增强能力”的工作流仓库，核心目标是：

- 让代理优先研究需求，而不是直接动手改代码
- 用 `skills` 把高质量研发流程标准化
- 通过插件、命令和钩子把流程自动注入到会话里
- 用真实 CLI 测试验证这些技能是否按预期工作

## 适用平台

- `Claude Code`
- `Cursor`
- `Codex`
- `OpenCode`

其中，Claude Code 和 Cursor 走插件市场安装；Codex 和 OpenCode 以仓库目录或符号链接方式集成。

## 核心工作流

Superpowers 的基础流程围绕以下技能展开：

1. `brainstorming`：在写代码前先澄清需求、分析方案、落设计
2. `using-git-worktrees`：为开发任务创建隔离分支或工作区
3. `writing-plans`：把方案拆成 2～5 分钟粒度的可执行任务
4. `subagent-driven-development` / `executing-plans`：按计划执行，实现与检查分离
5. `test-driven-development`：坚持 RED → GREEN → REFACTOR
6. `requesting-code-review`：在任务间执行代码审查
7. `finishing-a-development-branch`：完成验证、整理产出并收尾

配套还有 `systematic-debugging`、`verification-before-completion`、`writing-skills`、`using-superpowers` 等技能，用来覆盖调试、验收、技能创作和技能调度。

## 仓库结构

```text
superpowers/
├─ .claude-plugin/        # Claude Code 插件元数据与本地开发市场配置
├─ .codex/                # Codex 安装说明
├─ .cursor-plugin/        # Cursor 插件配置
├─ .opencode/             # OpenCode 安装说明与插件入口
├─ agents/                # 代理提示词，例如代码审查代理
├─ commands/              # Claude Code 命令入口，如 brainstorm / write-plan / execute-plan
├─ docs/                  # 平台文档、测试文档、Windows 兼容说明
├─ hooks/                 # SessionStart 钩子与跨平台包装脚本
├─ lib/                   # 技能发现/解析等通用逻辑
├─ skills/                # 核心技能库，每个技能一个目录
├─ spec/                  # 详细设计模板（前端 / 后端）
└─ tests/                 # Claude Code / OpenCode / 触发行为 / 子代理开发测试
```

### 关键目录说明

- `.claude-plugin/plugin.json`：Claude Code 插件元信息
- `.claude-plugin/marketplace.json`：本地开发时使用的 marketplace 配置
- `hooks/hooks.json`：注册 `SessionStart` 钩子
- `hooks/session-start`：启动时注入 `using-superpowers` 技能上下文，并按需复制 `spec/`
- `commands/*.md`：把常用工作流包装成 Claude Code 命令
- `skills/*/SKILL.md`：真正的技能定义与执行约束
- `tests/claude-code/`：通过 `claude -p` 做自动化验证

## 安装概览

### Claude Code

先添加 marketplace：

```bash
/plugin marketplace add obra/superpowers-marketplace
```

再安装插件：

```bash
/plugin install superpowers@superpowers-marketplace
```

详细说明见 `docs/README.claude-code.zh-CN.md`。

### Cursor

在 Cursor Agent Chat 中执行：

```text
/plugin-add superpowers
```

### Codex

让 Codex 按安装说明执行：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

详细说明见 `docs/README.codex.md`。

### OpenCode

让 OpenCode 按安装说明执行：

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

详细说明见 `docs/README.opencode.md`。

## 如何验证安装成功

启动一个新会话，直接给出一个会触发技能的请求，例如：

- “帮我规划一个新功能”
- “帮我系统性排查这个 bug”
- “先帮我做方案设计再写计划”

如果集成正常，代理应能自动匹配并调用相关技能，而不是直接无流程编码。

## 本项目的实现机制

以 Claude Code 为例，核心链路如下：

1. 插件在会话开始时触发 `SessionStart`
2. `hooks/run-hook.cmd` 负责在 Windows / macOS / Linux 间兼容执行
3. `hooks/session-start` 将 `using-superpowers` 的内容注入当前会话上下文
4. 如果当前项目没有 `spec/`，钩子会自动从插件仓库复制模板过去
5. 用户后续可以通过自然语言、命令入口或显式技能名触发工作流

也就是说，这个仓库的核心不只是“提供提示词”，而是把提示词、插件、命令、钩子和测试组合成一套可运行的工程系统。

## 测试与验证

仓库内已经提供了多类自动化测试：

- `tests/claude-code/`：Claude Code CLI 的技能与集成测试
- `tests/skill-triggering/`：技能是否会被正确触发
- `tests/explicit-skill-requests/`：显式请求技能时的行为验证
- `tests/subagent-driven-dev/`：子代理驱动开发场景验证
- `tests/opencode/`：OpenCode 插件与技能集成测试

常用入口：

```bash
cd tests/claude-code
./run-skill-tests.sh
```

更多说明见 `docs/testing.md` 与 `tests/claude-code/README.md`。

## 贡献方式

如果你要为仓库新增或改进技能，建议遵循以下顺序：

1. Fork 仓库并创建分支
2. 使用 `writing-skills` 技能设计技能内容
3. 补充或更新测试，尤其是 `tests/claude-code/`
4. 本地验证技能行为后提交 PR

可以从 `skills/writing-skills/SKILL.md` 开始了解技能编写规范。

## 更新方式

如果你通过 Claude Code 插件市场安装了 Superpowers，可直接更新：

```bash
/plugin update superpowers
```

## 相关文档

- 英文主页：`README.md`
- Claude Code 中文说明：`docs/README.claude-code.zh-CN.md`
- Codex 说明：`docs/README.codex.md`
- OpenCode 说明：`docs/README.opencode.md`
- 测试说明：`docs/testing.md`
- Windows 钩子兼容说明：`docs/windows/polyglot-hooks.md`

## License

本项目使用 MIT License，详见 `LICENSE`。
