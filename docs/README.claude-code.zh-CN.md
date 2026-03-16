# Superpowers for Claude Code CLI

本文只保留一种安装方式：

1. 安装 `Claude Code CLI`
2. 使用 `git clone` 拉取本仓库到本地
3. 进入 `claude` 会话，用插件命令安装本地插件

如果你的目标是本地开发、调试或维护这个仓库，这就是最直接的一条路径。

## 一、前置条件

请先确认本机已安装：

- `Node.js`
- `npm`
- `Git`

建议先执行：

```bash
node -v
npm -v
git --version
```

## 二、安装 Claude Code CLI

使用 npm 全局安装：

```bash
npm install -g @anthropic-ai/claude-code
```

安装完成后验证：

```bash
claude --version
```

首次使用时，直接执行下面命令并按提示完成登录：

```bash
claude
```

## 三、把 Superpowers clone 到本地

当前仓库地址：

```bash
https://github.com/786153747/superpowers.git
```

执行：

```bash
git clone https://github.com/786153747/superpowers.git
cd superpowers
```

如果你使用的是自己的 fork，请把仓库地址替换成你自己的 Git URL。

## 四、为什么可以本地安装

当前仓库已经包含 Claude Code 插件所需的本地元数据：

- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

因此，**仓库根目录本身就可以作为本地插件源目录**。

## 五、使用 `claude` 安装本地插件

### 1. 在仓库根目录启动 Claude Code

先进入仓库根目录：

```bash
cd /path/to/superpowers
```

例如在 Windows PowerShell 中：

```powershell
cd D:\workspace\workspace\ruoyi-superpowers\superpowers
```

然后启动 Claude Code：

```bash
claude
```

### 2. 在 Claude Code 会话中添加本地 marketplace

下面这条命令是在 **Claude Code 会话里输入**，不是在系统终端里执行：

```text
/plugin marketplace add .
```

如果你不是从仓库根目录启动 `claude`，可以改用绝对路径：

```text
/plugin marketplace add D:\workspace\workspace\ruoyi-superpowers\superpowers
```

当前仓库里的本地 marketplace 名称是：

```text
superpowers-dev
```

### 3. 安装插件

继续在 Claude Code 会话中执行：

```text
/plugin install superpowers@superpowers-dev
```

到这里就完成了“本地 clone → 本地插件安装”的整个流程。

## 六、验证是否安装成功

最简单的验证方法是新开一个 Claude Code 会话，输入类似请求：

```text
帮我先分析需求，再给出执行计划，不要直接写代码
```

如果插件已经生效，Claude 的行为会更偏向先分析、再规划，而不是直接开始编码。

如果你想进一步确认，也可以检查本地设置文件中是否出现启用项：

- Windows：`C:\Users\<你的用户名>\.claude\settings.json`
- macOS / Linux：`~/.claude/settings.json`

通常会看到类似内容：

```json
"superpowers@superpowers-dev": true
```

## 七、后续更新方式

如果你更新了本地仓库代码，例如：

```bash
git pull
```

建议按下面顺序刷新：

1. 关闭当前 Claude Code 会话
2. 回到仓库根目录
3. 重新执行 `claude`
4. 在 Claude Code 会话中重新执行：

```text
/plugin install superpowers@superpowers-dev
```

## 八、最短操作路径

### 终端执行

```bash
npm install -g @anthropic-ai/claude-code
git clone https://github.com/786153747/superpowers.git
cd superpowers
claude
```

### 进入 Claude Code 后执行

```text
/plugin marketplace add .
/plugin install superpowers@superpowers-dev
```

## 九、常见问题

### 1. 找不到 `claude` 命令

通常是终端没有刷新环境变量。请按顺序排查：

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

如果还不行，关闭终端重新打开后再试。

### 2. `/plugin marketplace add .` 失败

请检查：

- 当前目录是否为仓库根目录
- `.claude-plugin/marketplace.json` 是否存在
- 是否错误地把 slash command 当成系统终端命令执行了

### 3. 安装后效果不明显

建议：

- 新开一个 Claude Code 会话再试
- 使用更容易触发工作流的请求，例如“先分析、再规划、最后执行”
- 检查 `settings.json` 中是否启用了 `superpowers@superpowers-dev`

## 十、你真正需要记住的两段命令

### 系统终端

```bash
npm install -g @anthropic-ai/claude-code
git clone https://github.com/786153747/superpowers.git
cd superpowers
claude
```

### Claude Code 会话

```text
/plugin marketplace add .
/plugin install superpowers@superpowers-dev
```
