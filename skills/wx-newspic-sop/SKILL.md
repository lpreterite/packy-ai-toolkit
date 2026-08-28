---
name: wx-newspic-sop
description: "小绿书业务领域技能：短文编辑规则、PPT配图制作、小绿书发布到微信公众号草稿箱。触发词：小绿书、图片消息、微信短文发布、公众号短文推送、wechat-newspic、wx-newspic、短文配图、PPT配图、短文编辑、短文模板、竖屏配图、图文卡片、短文封面。"
metadata:
  {
    "openclaw":
      {
        "emoji": "🖼️",
      },
  }
---

# 小绿书业务领域 Skill

微信公众号「图片消息」（小绿书）的完整业务链路：短文编辑 → PPT 配图 → 小绿书发布。

**相关 Skill**：
- `html-ppt`：底层渲染引擎（PPT 制作时加载）
- `wechat-publisher`：复用其微信凭证配置

---

## 零、前置确认（自由度：低）

> 任何工作流启动前，莱兹必须先完成以下四项确认，并等待队长回复。队长回复前**不得**启动 Taskflow。

执行方式：莱兹发送以下确认消息给队长：

```
我来为这篇短文配图！先确认：
1️⃣ 内容方向 — 讲的是什么？技术向 / 观点向 / 产品向？
2️⃣ 短文类型 — 工具介绍 / 教程指南 / 观点评论 / 体验评测 / 感悟随笔 / 福利推广？
   → 加载 checkpoints/content-gate.md §分类判定
3️⃣ 风格偏好 — 推荐 tokyo-night（深色专业）或 xiaohongshu-white（白底清爽），或者你有其他想法？
   → 加载 guides/design-guide.md §主题推荐映射
4️⃣ 配图数量 — 默认 9 张（含封面+CTA）够吗？
```

队长回复后：
- **类型已确定** → 传入 content-writer 子 Agent 的输入占位
- **主题已确定** → 传入 ppt-maker 子 Agent 的输入占位
- **配图数量已确定** → 传入 ppt-maker 子 Agent 的输入占位

**尺寸规则**：固定 3:4 竖屏 675×900（DPR=2 输出 1350×1800），不需要问队长。

---

## 一、短文编辑规则

### 文件格式（Obsidian / 公众号本地存档）

短文文件必须符合 `短文模板.md` 格式：

```markdown
---
title: 文章标题
type: short
created: YYYY-MM-DD
tags: [标签1, 标签2]
status: draft
---

## 正文

正文内容。

## 相关图片

\```ad-info
title: 配图
collapse: closed

![描述|300](assets/slide-NN.png)
\```
```

### 图片命名与存放

- 统一命名为 `slide-NN.png`（NN 从 01 开始递增，补 0 两位数字，如 slide-01.png）
- 制作阶段存放路径：`wx-newspic/{文章名}/assets/`
- 发布后归档路径：`公众号运营/短文/assets/{文章名}/`
- MD 图片语法：`![描述|300](assets/slide-NN.png)`（相对于 `index.md` 所在目录）

### 详细写作规范

→ **加载 [guides/writing-guide.md](guides/writing-guide.md)**

包括：正文内容规范、AI 味说话结构禁用清单（10 条红线）、正文清理映射、话题标签规则。

---

## 二、PPT 配图制作流程

本 Skill 的核心制作链路。与 `html-ppt` 的关系：本 Skill 是上层业务流程，html-ppt 是底层渲染引擎。制作 PPT 时同时加载 html-ppt SKILL.md。

### 步骤 0：前置确认（§零 已完成）

此步骤已在启动工作流前的 **§零 前置确认** 中完成，此处仅回溯对照：

- **内容方向** ✓ 已确认
- **短文类型判定** ✓ 已确认（类型已传入 content-writer）
- **风格/主题偏好** ✓ 已确认（主题已传入 ppt-maker）
- **配图数量** ✓ 已确认（数量已传入 ppt-maker）

**尺寸规则**：固定 3:4 竖屏 675×900（DPR=2 输出 1350×1800），不需要问队长。

### 步骤 1：内容提炼 [自由度：高]
- 从短文提取核心信息点 → 映射为 PPT 页面结构
- 每页聚焦一个核心信息点，避免信息过载

→ **加载 [guides/design-guide.md](guides/design-guide.md)**：选宏观结构（禁止连续两篇相同）+ Enrichment 层级（默认 E1）
- 需要全 deck 模板？→ 加载 [references/templates.md](references/templates.md)

### 步骤 1→1.5：🔒 内容门 [自由度：低]

→ **加载 [checkpoints/content-gate.md](checkpoints/content-gate.md)**
- 产出「版面与内容对照表格」→ 逐条验收 → 通过进入 1.5 / ❌ 回退步骤 1

### 步骤 1.5：设计决策 [自由度：中]

→ **加载 [guides/design-guide.md](guides/design-guide.md)**（版式表 + 动效策略 + 三个隐形原则 + 主题色彩理解）
- 需要全 deck 模板？→ 加载 [references/templates.md](references/templates.md)

### 步骤 2：HTML 编写 [自由度：中]

→ **加载 [rendering.md](rendering.md)**（clamp 配方、deck/slide 固定尺寸、box-sizing）

**⚠️ Footer 署名规则（红线）**：每张 PPT 页面左下角必须包含公众号署名（格式：`叶帕奇 · {分类名}`，分类名参考 [checkpoints/content-gate.md](checkpoints/content-gate.md) §分类判定）。页码居中，日期靠右排列。署名使用 `text-3` 颜色（与 footer 其他信息一致），不抢主视觉焦点，但必须始终可见。

> **⚠️ "叶帕奇"为固定署名，不得替换为子 Agent 名（如帕秋莉）。** 子 Agent 执行过程中可能自动将自己的名字写入 footer，必须修正为叶帕奇。

### 步骤 3：渲染截图 [自由度：低]

→ **确认 rendering.md 已加载**（环境变量内联、DPR=2、viewport 匹配 deck 尺寸）
- 禁止 `file://` 协议，禁止自写 playwright 脚本

### 步骤 3→4：🔒 视觉门 [自由度：低]

→ **加载 [checkpoints/visual-gate.md](checkpoints/visual-gate.md)**
- 读图验收 → ✅ 通过进入 C4 / ❌ 回退步骤 2

### 步骤 4：硬质量验收 [自由度：低]

→ **加载 [checkpoints/quality-checklist.md](checkpoints/quality-checklist.md)**（5 项标准，全部 PASS）

### 步骤 4→5：🔒 风格门 [自由度：低]

→ **加载 [checkpoints/style-gate.md](checkpoints/style-gate.md)**
- A 六轴自评（≥ 3）+ B 反模式（全 PASS）+ C 版式（≥ 4/5）→ ✅ 进入 C5 / ❌ 回退步骤 2

### 步骤 5：搬运与发布

#### 5a. 制作阶段（workspace 保存）

- 截图保存到 `wx-newspic/{文章名}/assets/slide-NN.png`
- 短文正文保存到 `wx-newspic/{文章名}/index.md`
- → **完成后加载 [checkpoints/delivery-checklist.md](checkpoints/delivery-checklist.md)** 确认交付物齐全

#### 5b. 发布后（搬运到闭环人生）

发布成功后，莱兹执行搬运命令，见 §5.3 搬运流程。

### PPT 硬规则

| 规则 | 说明 |
|------|------|
| 3:4 竖屏 | 视口 = deck 固定尺寸 675×900；**DPR=2** 高清输出 |
| HTTP 渲染 | 必须 `http://localhost:8765`，禁止 `file://` |
| 环境变量内联 | `MOBILE=1 VIEWPORT_W=<W> VIEWPORT_H=<H> DPR=2 HTTP_BASE=http://localhost:8765` |

---

## 三、小绿书发布流程

### 前置条件

- wx-newspic CLI 已安装（`wx-newspic --version`）
- 中转服务器已部署运行 → **加载 [ops/relay-config.md](ops/relay-config.md)**
- OpenClaw `skills.entries.wx-newspic-sop` 已配置凭证（自动注入）

### 发布命令

```bash
source ~/.zshrc && \
  wx-newspic publish \
    --title "标题（最长32字）" \
    --content "纯文本正文（不含Markdown格式，文末加话题标签）" \
    --author "叶帕奇" \
    --digest "摘要（最长128字）" \
    --images slide-01.png slide-02.png ... slide-NN.png
```

**必填参数**：`--title`、`--content`、`--images`
**选填参数**：`--author`、`--digest`

> `--server` 和 `--api-key` 由 OpenClaw 自动注入到环境变量，无需手动指定。

### 发布前检查清单（逐项必过）

- [ ] 正文已清理 Markdown 格式（无 `**` `` ` `` `##` `- ` `*` `---`）
- [ ] 正文无禁止字符
- [ ] 段落间保留空行（双换行 `\n\n`），发布时检查 `--content` 中段落间有空行
- [ ] 正文 ≤ 1105 字符（微信 API 限制）
- [ ] **末尾关注引导已添加**：`▒▒▒▒▒▒▒▒▒▒` → 关注语 → `▒▒▒▒▒▒▒▒▒▒`（逐行对照，缺一不可）
- [ ] **frontmatter tags 全部已转换为文末 `#标签` 格式（逐条对照，缺一不可）**
- [ ] 中转服务器连通（使用 `wx-newspic publish --dry-run` 验证，而非 `/health` 端点）
- [ ] 标题 ≤ 32 字、作者 ≤ 16 字、摘要 ≤ 128 字

### 发布后

- 返回 `{ media_id, created_at, success }` 表示成功
- **⚠️ `wx-newspic publish` 只推送到草稿箱，不自动发布**
- 推送草稿箱成功后 → **莱兹立即执行 §5.3 搬运流程**，同步到闭环人生知识库
- 用户需到公众号后台 → 草稿箱 → 手动点击「发布」
- 话题标签在草稿箱中可能不显示，发布后生效
- 发布前在草稿箱预览检查正文、图片、标签是否完整

### 故障排查

| 错误 | 原因 | 解决 |
|------|------|------|
| `invalid media_id` | CLI 图片上传流程 bug | 升级 wx-newspic 或用 curl 分步调用 |
| `invalid content` | 正文包含微信不支持的特殊字符 | 检查是否有不可见字符或特殊控制符，确认正文 ≤ 1280 字符 |
| `SERVER_UNREACHABLE` | 中转服务器未运行或防火墙 | 检查服务器状态和端口 |
| `CREDENTIAL_NOT_FOUND` | 凭证未注入 | 检查 `openclaw.json` 中 `skills.entries.wx-newspic-sop.env` 配置 |
| `UPLOAD_FAILED` | 图片格式/大小不符 | 确认 PNG/JPEG，单张 ≤ 10MB |
| IP 白名单错误（errcode: 40164） | 服务器 IP 未加白名单 | 登录公众号后台 → 开发 → 基本配置 → IP 白名单，添加服务器出口 IP |
| `/health` 返回 404 | relay 没有 `/health` 路由（正常行为） | 改用 `--dry-run` 验证连通性，不是服务异常 |
| 正文被截断/报错 | 正文超 1105 字符 | 微信官方文档说 2 万字限制，实测小绿书正文限制约 1105 字符 |

---

## 四、工作流

本 Skill 主流程使用 **Lobster 管线**（确定性预检 → dry-run → 审批 → 发布）。
如未安装 Lobster，自动回退到 Task Flow 模式。

### 环境检测

工作流启动时，莱兹先执行：

```
lobster --version 2>/dev/null && echo "LOBSTER_AVAILABLE" || echo "LOBSTER_UNAVAILABLE"
```

| 结果 | 走哪个流程 |
|------|-----------|
| `LOBSTER_AVAILABLE` | §4.1 Lobster 管线（主流程） |
| `LOBSTER_UNAVAILABLE` | §4.2 Task Flow 回退模式 |

> 如 `wx-newspic --version` 也失败，停止并提示安装。

### 4.1 Lobster 管线（主流程）

创意阶段保留 Task Flow（sessions_spawn），发布阶段由 Lobster 接管：

```
🔒 前置确认（§零）→ 队长确认通过
       ↓
  ┌─ 创意阶段（Task Flow，无变化）──────────────┐
  │  Step 1: spawn 帕秋莉（正文写作+内容门）    │
  │  Step 2: spawn 帕秋莉（PPT+渲染+视觉门）    │
  │  Step 3: spawn 帕秋莉（搬运+更新MD）        │
  └──────────────────────────────────────────────┘
       ↓
  ┌─ 发布阶段（Lobster 接管）──────────────────┐
  │  lobster run --file .../wx-newspic.lobster  │
  │  → 预检 → MD5 → dry-run → 审批 → publish  │
  │  retry: 3 | timeout: 60s                   │
  └──────────────────────────────────────────────┘
       ↓
  ┌─ 同步阶段（莱兹执行）────────────────────────┐
  │  → 推送草稿箱成功 → 执行 §5.3 搬运到闭环人生  │
  │  → 回执队长：草稿已就绪，待手动发布            │
  └────────────────────────────────────────────────┘
```

莱兹调用 lobster 工具：

```
lobster run \
  --file skills/wx-newspic-sop/lobster-flows/wx-newspic.lobster \
  --args-json '{
    "topic":"文章标题",
    "md_path":"wx-newspic/文章名/index.md",
    "asset_dir":"wx-newspic/文章名/assets/"
  }'
```

Lobster 管线自动执行：文件检查 → MD5 去重 → dry-run 验证 → 审批门 → 发布。
莱兹仅需在 dry-run 审批门确认结果。

> **环境说明**：Lobster 管线的 MD5 去重步骤使用 `md5 -r` 命令（macOS 特有）。
> 如需在 Linux 环境运行，将 `md5 -r` 替换为 `md5sum`。

#### 失败回退

| 失败场景 | 回退动作 |
|---------|---------|
| preflight 失败 | 检查文件/字数后重跑 Lobster |
| dry-run 失败 | 检查内容/图片后重跑 Lobster |
| publish 失败（3 次重试耗尽） | 手动排查后执行 Task Flow 回退的发布命令 |

### 4.2 Task Flow 模式（回退）

> 仅当 Lobster 不可用时使用（`LOBSTER_UNAVAILABLE`）。

与现有流程兼容，创意阶段同 Lobster 主线，发布阶段由莱兹手动执行。

#### 角色与分工

| 角色 | 子 Agent | 职责 | 模型 |
|------|---------|------|------|
| 正文写作+内容门 | 帕秋莉 | 根据莱兹提供的资料和方向写正文、自检内容门 | 默认模型 |
| PPT制作 | 帕秋莉 | 读html-ppt SKILL.md、写HTML deck、渲染截图 | cliproxyapi/deepseek-v4-flash |
| 搬运+更新MD | 帕秋莉 | 搬运截图、更新MD引用、清理正文（不发布） | 默认模型 |

> ⚠️ 发布动作由莱兹手动执行，帕秋莉不参与。参见 §三 发布前检查清单。

#### 管线时序

```
🔒 前置确认（§零）→ 队长确认通过
       ↓
莱兹：收集资料、指导方向
       ↓
  ┌─ 第一阶段（串行）─────────────────────────────┐
  │  sessions_spawn 帕秋莉（正文写作+内容门）    │
  └───────────────────────────────────────────────┘
       ↓ sessions_yield → 莱兹验证内容门 PASS
  ┌─ 第二阶段（串行）─────────────────────────────┐
  │  sessions_spawn 帕秋莉（PPT制作+渲染+视觉门）│
  └───────────────────────────────────────────────┘
       ↓ sessions_yield → 莱兹验证视觉门+风格门 PASS
  ┌─ 第三阶段（串行）─────────────────────────────┐
  │  sessions_spawn 帕秋莉（搬运+更新MD，不发布）│
  └───────────────────────────────────────────────┘
       ↓ sessions_yield
  🔒 产出物验收门（莱兹核查搬运完整性）
       ↓
  ┌─ 第四阶段（莱兹手动执行）──────────────────────┐
  │  → 执行 wx-newspic publish 推送草稿箱          │
  │  → 推送成功后 → 执行 §5.3 搬运到闭环人生归档   │
  │  → 回执队长：草稿已就绪，待手动发布             │
  └─────────────────────────────────────────────────┘
```

#### 发布命令（回退模式 — 莱兹手动执行）

```bash
wx-newspic publish --type newspic \
  --title "标题" \
  --content "纯文本正文" \
  --author "叶帕奇" \
  --images "wx-newspic/文章名/assets/slide-*.png"
```

> ⚠️ 命令是 `wx-newspic publish`，不是 `publish-draft`
> ⚠️ 必须指定 `--type newspic`
> ⚠️ 发布失败最多重试 3 次。3 次后仍失败 → 停止排查

#### 子 Agent 任务模板

> 莱兹在 spawn 子 Agent 前 → **此时加载 [subagent-templates/](subagent-templates/README.md)** 目录下的对应模板文件。

| 模板 | 子 Agent | 阶段 | 模型 |
|------|---------|------|------|
| [subagent-templates/content-writer.md](subagent-templates/content-writer.md) | 帕秋莉：正文写作+内容门 | Step 1 | 默认模型 |
| [subagent-templates/ppt-maker.md](subagent-templates/ppt-maker.md) | 帕秋莉：PPT 制作+渲染+视觉门 | Step 2 | cliproxyapi/deepseek-v4-flash |
| [subagent-templates/publisher.md](subagent-templates/publisher.md) | 帕秋莉：搬运+更新MD（不发布） | Step 3 | 默认模型 |

**MD5去重检查（第二阶段，莱兹执行）：**
```
cd ~/.openclaw/agents/rats/workspace/wx-newspic/{文章名}/assets/
md5sum slide-*.png | awk '{print $4}' | sort | uniq -d
# 无输出 = 无重复，通过后触发子Agent C
```

#### 失败回退

| 阶段 | 失败场景 | 回退动作 |
|------|---------|---------|
| 第一阶段 | 子Agent A 验收未通过 | 回退到莱兹手动编辑正文 |
| 第一阶段 | 子Agent B 渲染失败或 MD5 有重复 | 回退到 §二 串行 PPT 配图制作 |
| 第三阶段 | 子Agent C 搬运失败 | 检查路径权限和文件存在，修正后重试 |
| 发布阶段 | 发布失败 | 检查内容/图片/凭证后重试，最多 3 次 |

---

## 五、产出物存放规范

### 5.1 目录结构

小绿书制作全流程在 workspace 下完成（确保 `image` tool 等工具可读取本地文件），发布后由莱兹搬运到闭环人生知识库归档。

```
~/.openclaw/agents/rats/workspace/wx-newspic/
  ├── assets/                       # 全局素材（Logo、底纹等跨篇共用）
  ├── {文章名}/                     # 每篇短文一个目录
  │   ├── index.md                  # 短文正文（制作中的版本）
  │   └── assets/
  │       ├── slide-01.png
  │       ├── slide-02.png
  │       └── ...
  └── archive/                      # 已发布归档（可选）
```

### 5.2 短文制作最终交付物

| 产出物 | 制作阶段（workspace） | 归档阶段（闭环人生） | 命名规范 |
|--------|---------------------|-------------------|---------|
| 短文正文 | `wx-newspic/{文章名}/index.md` | `公众号运营/短文/{文章名}.md` | 文章名用中文，与标题一致 |
| 配图截图 | `wx-newspic/{文章名}/assets/slide-NN.png` | `公众号运营/短文/assets/{文章名}/slide-NN.png` | NN 从 01 递增，补 0 |
| PPT 源码 | `~/.openclaw/skills/html-ppt/examples/{deck名}/index.html` | — | deck 名用英文 slug |
| 公众号草稿 | 微信后台草稿箱 | — | 待预览发布 |

### 5.3 搬运流程（莱兹执行，推送草稿箱成功后立即执行）

推送草稿箱成功后，莱兹执行以下搬运命令，将制作成果同步到闭环人生知识库：

```bash
# 搬运正文
cp "~/.openclaw/agents/rats/workspace/wx-newspic/{文章名}/index.md" \
   "/Users/packy/Documents/MyNodes/000闭环人生/40-表达/43-输出/公众号运营/短文/{文章名}.md"

# 搬运配图
mkdir -p "/Users/packy/Documents/MyNodes/000闭环人生/40-表达/43-输出/公众号运营/短文/assets/{文章名}/"
cp ~/.openclaw/agents/rats/workspace/wx-newspic/{文章名}/assets/slide-*.png \
   "/Users/packy/Documents/MyNodes/000闭环人生/40-表达/43-输出/公众号运营/短文/assets/{文章名}/"

# 可选：清理工作目录
rm -f ~/.openclaw/agents/rats/workspace/wx-newspic/{文章名}/index.md
rm -rf ~/.openclaw/agents/rats/workspace/wx-newspic/{文章名}/assets/
```

### 5.4 清理规则

| 类型 | 处理方式 |
|------|---------|
| 临时渲染文件（`/tmp/` 下） | 发布后立即清理 |
| PPT 源码（`html-ppt/examples/`） | 保留，便于后续复用或修改 |
| 短文 MD 和配图 | 永久保留到闭环人生，workspace 下制作目录可选清理 |

### 5.5 路径映射

→ **加载 [ops/domain-paths.md](ops/domain-paths.md)**

---

## 引用

### 内部文件

| 文件 | 用途 | 加载时机 |
|------|------|---------|
| [guides/writing-guide.md](guides/writing-guide.md) | 正文内容规范 + AI 味清单 + 标签规则 | §一 短文编辑 |
| [guides/design-guide.md](guides/design-guide.md) | 设计决策参考（主题/版式/动效/色彩） | §二 步骤1/1.5 |
| [checkpoints/content-gate.md](checkpoints/content-gate.md) | 内容门（分类判定 + 6 套验收问题集） | §零 前置确认 / §二 步骤1→1.5 |
| [checkpoints/visual-gate.md](checkpoints/visual-gate.md) | 视觉门（读图验收） | §二 步骤3→4 |
| [checkpoints/style-gate.md](checkpoints/style-gate.md) | 风格门（六轴 + 反模式 + 版式动效） | §二 步骤4→5 |
| [checkpoints/quality-checklist.md](checkpoints/quality-checklist.md) | 硬质量验收清单（5 项标准） | §二 步骤4 |
| [checkpoints/delivery-checklist.md](checkpoints/delivery-checklist.md) | 交付物与完成标准 | §二 步骤5 |
| [references/templates.md](references/templates.md) | 14 个全 deck 模板速查 | §二 步骤1/1.5 |
| [references/design-rules-card.md](references/design-rules-card.md) | 颜色铁律 + 反模式速查卡 | §二 HTML 编写 |
| [references/publish-guide.md](references/publish-guide.md) | 发布流程详细指南 | §三 发布 |
| [rendering.md](rendering.md) | 渲染配置固定配方 | §二 步骤2/3 |
| [ops/relay-config.md](ops/relay-config.md) | 中转服务器配置 | §三 前置条件 |
| [ops/domain-paths.md](ops/domain-paths.md) | 领域路径 | §五 |
| [lobster-flows/wx-newspic.lobster](lobster-flows/wx-newspic.lobster) | Lobster 发布管线（预检 → dry-run → 审批 → 发布） | §四 工作流 |

### 外部引用

- [wx-newspic GitHub](https://github.com/lpreterite/wx-newspic) — 仓库源码
- [wx-newspic Wiki](https://github.com/lpreterite/wx-newspic/wiki) — 官方文档（Quickstart / Publish / Serve / Deployment / Troubleshooting）
- [wx-newspic npm](https://www.npmjs.com/package/@packy-tang/wx-newspic) — npm 包

---

## 修订记录

| 版本 | 日期 | 修订内容 |
|------|------|----------|
| v1.0 | 2026-05-16 | wx-newspic-sop 初始版本（PPT 配图制作流程） |
| v1.1 | 2026-05-16 | skill-optimizer 审查优化（渐进式披露、失败回退、自由度分层） |
| v2.1 | 2026-06-16 | 新增 §1.2.1 AI 味说话结构禁用清单（10 条红线） |
| v2.2 | 2026-06-21 | 全面更新 §三中转服务器配置；更新 §4.3 检查清单；更新 §4.5 故障排查表；新增外部引用 wx-newspic Wiki |
| v3.0 | 2026-06-21 | 新增 §6.2 并行管线模式（子 Agent 专家模式） |
| v3.1 | 2026-06-21 | 子 Agent 任务模板从 SKILL.md 内联迁移到独立 `subagent-templates/` 目录 |
| v3.2 | 2026-06-24 | 全面重构：§6 串行/并行模式更新为三步 Task Flow；新增 §七 产出物存放规范；新增 lobster-flows；子 Agent 模板重命名 |
| **v4.0** | **2026-06-24** | **渐进式文档重构：SKILL.md 瘦身为流程骨架（从 539→~220 行），写作/设计/渲染/验收/运维按职责分层到 guides/ checkpoints/ ops/ 目录；content-gate 拆分为内容门 + 视觉门独立文件；checklist 更名为 quality-checklist** |
| **v4.1** | **2026-06-24** | **前置确认独立为 §零（自由度降为低），从 §二 步骤0 剥离；工作流流程图标注 §零 入口，队长确认后才能启动 Taskflow；content-writer 和 ppt-maker 子 Agent 模板移除类型判定/主题选择职责，改为从输入占位接收** |
| **v5.0** | **2026-07-09** | **目录体系重构：工作目录从闭环人生知识库迁移到 workspace/wx-newspic/，解决 image tool 路径白名单限制；§五 重写为双路径体系（制作阶段 workspace / 归档阶段闭环人生）；新增 §5.3 搬运流程** |