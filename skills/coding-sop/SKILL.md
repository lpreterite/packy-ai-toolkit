---
name: coding-sop
version: 1.2.0
description: 波塔斯基专用编码任务标准操作流程（SOP）。通过 ACP 协议（sessions_spawn runtime=acp）或 exec pty 兜底调用外部编码 harness（Claude Code / Codex / OpenCode）。触发：接收其他 Agent 委派的编码任务、ACP 调用、opencode/Claude Code/Codex 执行、需要在 ~/Documents/Works 下执行代码改动、项目技术执行、Git 操作、Issue 操作时加载。
metadata:
  openclaw:
    emoji: "🔧"
---

# 编码 SOP (Standard Operating Procedure)

波塔斯基专用的项目编码任务执行规则。本 Skill 定义工具调用策略、ACP/sessions_spawn 流程、exec pty 兜底方案和项目约束。

## 调用方式优先级

| 优先级 | 方式 | 触发条件 | 说明 |
|--------|------|---------|------|
| **1️⃣ 默认** | `sessions_spawn({ runtime: "acp" })` | ACP 已启用且 harness 可用 | 通过 ACP 协议调用，支持会话管理、steer、cancel |
| **2️⃣ 兜底** | `exec pty:true` | ACP 不可用或 spawn 失败 | 直接 CLI 调用，无会话持久化 |

**ACP 配置要求**：
- `acp.enabled = true`
- `acp.backend = "acpx"`
- `acp.allowedAgents` 包含目标 harness id
- acpx 插件已安装并启用

**何时用兜底**：
- ACP 未启用 / 配置缺失
- `/acp doctor` 报告后端不健康
- `sessions_spawn({ runtime: "acp" })` 返回错误
- harness 在 PATH 中找不到且 ACP 适配器拉取也失败

## Harness 选择

| Harness ID | CLI 命令 | 说明 |
|------------|---------|------|
| `claude` | `claude` | Claude Code，首选 |
| `codex` | `codex` | OpenAI Codex CLI |
| `opencode` | `npx -y opencode-ai acp`（ACP）或 `opencode`（exec） | OpenCode |

**用户指定 harness 时必须使用指定的**。未指定时默认 `claude`。

## ACP 调用方式（默认）

使用 `sessions_spawn` 发起 ACP session：

### 一次性任务（推荐）

```javascript
sessions_spawn({
  runtime: "acp",
  agentId: "claude",  // 或 "codex" / "opencode"
  task: "任务描述...",
  mode: "run",
  cwd: "/Users/packy/Documents/Works/<project-name>",
  model: "可选，覆盖模型"
})
```

### 持久会话（需要多轮交互）

```javascript
sessions_spawn({
  runtime: "acp",
  agentId: "claude",
  task: "任务描述...",
  cwd: "/Users/packy/Documents/Works/<project-name>"
})
```

### ACP 控制命令（通过飞书）

- `/acp spawn claude --bind here` — 绑定当前对话
- `/acp status` — 查看状态
- `/acp cancel` — 取消当前轮次
- `/acp close` — 关闭会话
- `/acp steer 补充指令` — 不替换上下文的补充

### AgentId 映射

用户说 "用 claude" → `agentId: "claude"`
用户说 "用 codex" → `agentId: "codex"`
用户说 "用 opencode" → `agentId: "opencode"`
未指定 → `agentId: "claude"`（与 `acp.defaultAgent` 对齐）

### Task 模板：五段式结构（已验证有效）

> **经验**：高质量 task 是 ACP 调用成功的关键。以下模板在 94 秒分析 CLIProxyAPI 项目中验证有效，opencode 拿到后直接开工，无需追问。

```
第一段：一句话定性 — 我要你做什么

第二段：编号问题清单 — 越具体越好，不要笼统提问

第三段：项目上下文坐标 — 仓库地址、配置文件路径、端口号等

第四段：源码定位指引 — 告诉它看哪里（路由注册、中间件、资源处理）

第五段：行为边界约束 — 哪些可以做，哪些绝对不能做
```

**完整示例**（分析任务）：

```javascript
sessions_spawn({
  runtime: "acp",
  agentId: "opencode",
  mode: "run",
  task: "分析 CLIProxyAPI 项目的管理面板功能。\n\n重点关注：\n1. 管理面板的访问路径是什么？\n2. allow-remote 配置项的作用？\n3. 前端资源从哪里加载？\n4. 认证机制如何？\n5. 有无安全风险？\n\n项目信息：\n- 源码仓库：https://github.com/router-for-me/CLIProxyAPI\n- 配置文件：/opt/homebrew/etc/cliproxyapi.conf\n- 服务端口：localhost:8317\n\n请查看 management 相关代码，特别是路由注册、认证中间件、面板资源处理。\n\n只做分析，不修改任何文件。"
})
```

**模板要点**：
- 不要在 task 中注入敏感信息（API Key、密钥）
- 通过 `cwd` 参数指定工作目录，让 harness 自行读取项目上下文
- 分析类任务务必加"不修改文件"约束，防止误写入
- 修改类任务要明确变更范围和交付物要求

## exec pty 兜底方式

> ⚠️ **ACP 路径可用时不要用 exec 模拟 ACP**
>
> `sessions_spawn({ runtime: "acp" })` 是调用外部 harness 的**唯一合法路径**。
> exec pty 兜底仅在以下情况使用：
> - ACP 未启用或配置缺失（`/acp doctor` 报告不健康）
> - `sessions_spawn({ runtime: "acp" })` 返回错误
> - 任务极其简单，不值得开 ACP 会话
>
> 不要用 `exec pty` 方式模拟 ACP 功能——exec 没有会话管理、没有 steer、没有 cancel。

ACP 不可用时降级为直接 CLI 调用：

### Claude Code

```javascript
exec({
  pty: true,
  workdir: "/Users/packy/Documents/Works/<project-name>",
  background: true,
  command: "claude --permission-mode bypassPermissions --print '任务描述'"
})
```

### Codex

```javascript
exec({
  pty: true,
  workdir: "/Users/packy/Documents/Works/<project-name>",
  background: true,
  command: "codex '任务描述'"
})
```

### OpenCode

> **经验**：opencode 通常不在系统 PATH 中（`which opencode → not found`），exec 兜底必须使用 npx 而非裸命令。

```javascript
exec({
  pty: true,
  workdir: "/Users/packy/Documents/Works/<project-name>",
  background: true,
  command: "npx -y opencode-ai run '任务描述'"
})
```

**前置检查**：`which npx 2>/dev/null` — 如果 npx 不可用则放弃 opencode 兜底，直接报错并推荐走 ACP 路径。

## 模式选择

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| **build**（默认） | 直接指令、委派任务 | 直接执行，不先规划 |
| **plan** | 疑问口吻 | 先列出计划，等待确认再执行 |

**疑问口吻判断**：消息包含「能不能」「可以吗」「是否可以」「行不行」「怎么样」「怎么做」「什么意思」等。

## 项目范围

- **限定目录**：`~/Documents/Works` 下的子目录
- **禁止目录**：`~/.openclaw`、`$OPENCLAW_STATE_DIR`
- **前置检查**：确认目录存在且有 Git 初始化
- **扫描方式**：每次任务前扫描目录识别目标

## 执行流程

1. 确认目标项目目录和 harness
2. 前置检查（目录存在、Git 初始化、CLI/ACP 可用）
3. 优先尝试 `sessions_spawn({ runtime: "acp" })`
4. ACP 失败则降级 `exec pty:true`
5. 监控执行状态（`subagents list` 或 `process poll`）
6. 检查输出和 `git diff`
7. `git commit`（conventional commits）+ `git push`
8. 汇报结果给委派者

## Prompt 传递规范

### ACP sessions_spawn 方式

- 上下文只传任务描述，不自动注入项目信息
- 敏感信息（API Key、密钥）不传入 task
- `cwd` 参数指定工作目录，让 harness 自行读取项目上下文

### exec pty 方式

- 命令中只包含任务描述
- 通过 `--permission-mode bypassPermissions` 避免 TTY 权限提示阻塞
- 长任务用 `background: true`，通过 `process poll` 监控

## 输出规范

- **写入类任务**：产出写入项目目录内，避免写入 `/tmp/`
- **解读/分析类任务**：要求输出到控制台，不写文件
- **长文本产出**：写入项目目录下临时文件并加入 `.gitignore`

## 交付物

- 代码变更（`git diff` / commit 记录）
- GitHub Issue 状态更新（如适用）
- 执行结果汇报给委派者

## 失败处理

| 场景 | 处理方式 |
|------|---------|
| ACP spawn 失败 | 检查是否缺少 model 参数或权限不足；若从 subagent 调用 → 改从主会话调用 |
| exec pty 也失败 | 汇报，附带错误信息 |
| 执行中途超时 | 检查 process 状态，必要时 cancel/kill |
| harness CLI 不存在 | 汇报，建议安装，推荐走 ACP 路径 |
| opencode ACP 报 model 错误 | sessions_spawn 中**省略 model 参数** |
| subagent 无法 ACP spawn | 先手动启动 opencode ACP 服务，再从主会话调用 |

## 已知失败场景（案例经验）

> **经验**：以下场景在真实调用中已验证失败，Agent 应避免重复踩坑。

### 场景 1：exec 路径假设 CLI 在 PATH 中

| 属性 | 值 |
|------|-----|
| 案例 | wx-newspic-sop review 任务 |
| 时间 | 2026-06-24 |
| 现象 | subagent 执行 `exec pty: true, command: "opencode 任务描述"` → `opencode not found` |
| 根因 | SKILL.md 中的 exec 命令假设 CLI 已安装到 PATH，但 opencode 全局未安装 |
| 规避 | 使用 npx 兜底（见 §OpenCode exec 兜底），或走 ACP 路径 |

### 场景 2：coding-sop SKILL.md 未被 Agent 找到

| 属性 | 值 |
|------|-----|
| 案例 | 同上 wx-newspic-sop review 任务 |
| 时间 | 2026-06-24 |
| 现象 | subagent 尝试读取 coding-sop SKILL.md 找解决方案 → 路径错误，读到其他 SKILL.md |
| 根因 | coding-sop 当时存放在 `~/Documents/Works/skills/coding-sop/`（2026-08 起随「帕奇的AI工具包」维护于 `pachi-ai-toolkit/skills/coding-sop/`），但 subagent 的工作目录是 `~/.openclaw/agents/.../workspace`，通过 AGENTS.md 引用路径失效 |
| 规避 | 确保 coding-sop 已通过 `skill_workshop apply` 安装到 OpenClaw skills 目录 |

### 场景 3：ACP 会话中注入敏感信息

| 属性 | 值 |
|------|-----|
| 现象 | task 中包含 API Key、Token 等，经过 ACP 会话传递到外部 harness |
| 风险 | 外部 harness 可能将敏感信息写入日志、缓存或网络请求 |
| 规避 | task 中不传任何敏感信息，通过环境变量或配置文件传递 |

### 场景 4：sessions_spawn 传了 model 参数导致 opencode ACP 失败

| 属性 | 值 |
|------|-----|
| 案例 | wx-mp 短文制作委派（2026-07-17） |
| 现象 | `sessions_spawn({runtime:"acp", agentId:"opencode", mode:"run", task:"..."})` → `Cannot apply --model "...": the ACP agent did not advertise model support` |
| 根因 | OpenClaw 默认会附带当前会话的 model 参数到 ACP spawn，但 opencode 的 ACP 适配器没有声明 model 支持 |
| 规避 | **不传 model 参数**。不要在 sessions_spawn 中显式或隐式携带 model 参数 |

### 场景 5：opencode ACP 服务未启动

| 属性 | 值 |
|------|-----|
| 案例 | wx-mp 短文制作委派（2026-07-17） |
| 现象 | subagent（如波塔斯基）尝试 `sessions_spawn({runtime:"acp", agentId:"opencode"})` → `agentId not allowed` |
| 根因 | subagent session 没有 ACP spawn 权限（`allowed: none`），且 opencode ACP 服务未启动 |
| 规避 | 必须两步走：(1) 先在项目目录手动启动 opencode ACP 服务；(2) 再从**主会话**（如飞书 DM）调用 sessions_spawn，不经过 subagent |

## CLI 路径探测

按优先级探测可用 harness：

1. `which <command>` — 标准 PATH
2. `~/.opencode/bin/opencode` — OpenCode 可能位置
3. `/Applications/OpenCode.app/Contents/MacOS/opencode-cli`
4. `~/bin/<command>` — 用户本地安装
5. ACP 适配器自动拉取（opencode 通过 `npx -y opencode-ai acp`）

**探测 → 执行流程**（整合到 exec 兜底时）：

```javascript
// 伪代码：exec 前先探测，再选路径
if (which claude)  → claude --permission-mode bypassPermissions --print '任务描述'
if (which codex)   → codex '任务描述'
if (which npx)     → npx -y opencode-ai run '任务描述'
else               → 报错：无可用的 CLI harness，建议走 ACP 路径
```

## 注意事项

- `sessions_spawn` 是 ACP 调用的**唯一合法路径**，不要用 `exec pty` 模拟 ACP
- 不要用 `subagents` runtime 调用 harness（那不是 ACP）
- ACP 会话以非交互方式运行，无需 TTY 权限提示
- `acp.allowedAgents` 白名单由配置管理，Skill 不自行绕过
- OpenClaw 工具默认**不会**暴露给 ACP harness（除非显式启用 MCP 桥接）

---

## ACP 实战经验（成功案例沉淀）

### 调用链全貌

```
# 正确链路（两步走）：
# Step 1：在项目目录手动启动 opencode ACP 服务
#         npx -y opencode-ai acp --port 18888
# Step 2：从主会话（飞书 DM）直接 spawn
委派者会话（飞书 DM）
  └─ sessions_spawn({ runtime: "acp", agentId: "opencode", mode: "run", task, cwd })
       └─ OpenClaw ACP 运行时
            └─ acpx 适配器
                 └─ 连接本地 opencode ACP 服务（端口 18888）
                      └─ opencode 执行任务
                      └─ 输出结果 → 委派者会话
```

**⚠️ 不要从 subagent 内调用 ACP spawn**：subagent session 没有 `sessions_spawn` 权限（`allowed: none`），必须从主会话直接 spawn。

### Harness 行为差异

| Harness | ACP 自动拉取 | PATH 依赖 | exec 兜底可行性 | 最佳场景 |
|---------|-------------|-----------|----------------|---------|
| Claude Code | ✅ 通过 acpx | ✅ claude 在 PATH 中 | ✅ 直接调用 | 复杂编码、重构 |
| Codex | ✅ 通过 acpx | ⚠️ 待验证 | ⚠️ 待验证 | 轻量任务 |
| OpenCode | ✅ `npx -y opencode-ai acp` | ❌ not found | ⚠️ npx 方式可行 | 分析、审查、简单修改 |

### ACP Session 生命周期

```
spawn → 会话创建（返回 sessionId）
  │
  ├─ mode: "run" → 一次性执行 → 等待 done/failed → 读取输出 → close
  │
  └─ 持久会话 → 多轮 steer → 最后 close
       ├─ /acp steer 补充指令   — 不替换上下文的补充
       ├─ /acp status          — 查看状态
       ├─ /acp cancel          — 取消当前轮次
       └─ /acp close           — 关闭会话
```

**实战要点**：
- 一次性任务用 `mode: "run"` — 阻塞等待完成，出错自动返回
- 持久会话适合需要多轮交互的复杂任务
- `steer` 不替换上下文，适合补充信息而非重定向
- 长时间运行的任务默认有超时保护，超时后需检查 process 状态

### 成功模式总结

以下模式在 Issue #1 执行中已验证有效：

| 模式 | 说明 |
|------|------|
| **ACP 路径优先** | sessions_spawn 自动拉取 harness，不受本地 PATH 限制 |
| **五段式 task 结构** | 一句话定性 + 问题清单 + 项目坐标 + 源码指引 + 边界约束 |
| **行为边界显式声明** | 分析类加"不修改文件"，修改类明确变更范围和交付物 |
| **不传敏感信息** | API Key 通过环境变量或配置文件传递，不写入 task |
| **cwd 按需指定** | 分析远程仓库可不传 cwd（harness 自行 clone）；修改本地项目必须传 cwd 指定工作目录 |
| **不传 model 参数** | opencode 的 ACP 适配器不支持 model 参数，调用 sessions_spawn 时必须省略 model |
| **两步走** | 先手动启动 opencode ACP 服务，再从主会话 spawn，不经过 subagent |

### ACP 调用模板（正确）

```js
// 正确：从主会话（飞书 DM）直接调用
sessions_spawn({
  runtime: "acp",
  agentId: "opencode",
  cwd: "/path/to/project",
  mode: "run",
  task: "..."
  // 不传 model 参数！
})
```

```js
// 错误：经过 subagent 中转 → agentId not allowed
sessions_spawn({runtime:"acp", agentId:"opencode", ...})
// 错误：传了 model 参数 → model not supported
sessions_spawn({runtime:"acp", agentId:"opencode", model:"xxx", ...})
```

### 故障恢复模式

| 场景 | 恢复策略 |
|------|---------|
| ACP spawn 失败 | 检查 `/acp doctor` → 降级 exec pty |
| exec 也失败 | 汇报错误，建议检查 CLI 安装 |
| 执行超时 | process poll 检查状态 → 必要时 cancel |
| harness 输出截断 | 检查输出长度，请求分段输出 |
| ACP 会话卡死 | `/acp cancel` → 重新 spawn |

---

_版本 1.2.0 — 从 Issue #1 成功案例沉淀 ACP 实战经验：五段式 task 模板、exec 兜底修复、已知失败场景、harness 行为差异。_
