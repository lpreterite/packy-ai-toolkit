# 设计决策参考

> 由 SKILL.md §二 步骤 0（前置确认）和步骤 1.5（设计决策）触发加载。内容提炼完成后、HTML 编写前，必须据此做设计决策。

---

## 主题推荐映射（按内容方向）

步骤 0 确认风格/主题偏好时参考。若队长未明确指定，按方向从高到低推荐。

| 短文内容方向 | 推荐主题（按优先级排列） |
|-------------|------------------------|
| 技术分享 / 工具评测 / 开源项目 | `tokyo-night`（蓝夜专业）→ `catppuccin-mocha`（开发者友好）→ `dracula`（紫红醒目） |
| 观点评论 / 深度思考 / 方法论 | `xiaohongshu-white`（小红书本色）→ `minimal-white`（克制简洁）→ `editorial-serif`（杂志感） |
| 产品发布 / 功能亮点 / 趋势解读 | `glassmorphism`（Apple 风）→ `aurora`（极光渐变）→ `rainbow-gradient`（活力） |
| 数据报告 / 分析对比 / 科普 | `corporate-clean`（正式）→ `nord`（冷静）→ `arctic-cool`（理性） |
| 生活美学 / 轻松话题 / 品牌故事 | `soft-pastel`（柔和）→ `sunset-warm`（温暖）→ `xiaohongshu-white`（小红书） |
| 宣言 / 表态 / 强观点 | `sharp-mono`（冲击力）→ `neo-brutalism`（大胆）→ `cyberpunk-neon`（赛博） |

## 快速推荐话术

步骤 0 对队长推荐主题时参考：

```markdown
> 我来为这篇短文配图！先确认一下：
> 1️⃣ 讲的是什么方向？技术向 / 观点向 / 产品向？
> 2️⃣ 风格偏好？我推荐 `tokyo-night`（深色专业）或 `xiaohongshu-white`（白底清爽），或者你有其他想法？
> 3️⃣ 配多少张？默认 9 张够吗？
```

---

## 宏观结构选择

不同文章选不同结构，**禁止连续两篇相同。** 在任务日志中记录上次使用的结构。

| 宏观结构 | 适用场景 | 典型节奏 |
|---------|---------|---------|
| **Problem-Solution** | 工具评测、痛点解决类 | 痛点→方案→对比→案例→CTA |
| **Storytelling** | 观点评论、深度思考类 | 背景→冲突→转折→结论→CTA |
| **Data-led** | 数据报告、分析对比类 | 数字→趋势→对比→洞察→CTA |
| **Manifesto** | 宣言表态、强观点类 | 宣言→原则→论证→行动号召 |
| **How-to** | 教程、操作指南类 | 问题→步骤→成果→拓展 |
| **Listicle** | 推荐清单、盘点类 | 主题→N 个要点→总结→CTA |

---

## Enrichment 层级

| 层级 | 含义 | 适用 |
|------|------|------|
| E0 | 纯排版（无图） | 宣言类、强观点类 |
| E1 | 排版 + 1 个 SVG logo | 封面 logo + 纯文字内容页 |
| E2 | 排版 + 产品截图 | 工具评测、教程类 |
| E3 | 排版 + 截图 + 装饰图 | 多案例展示 |
| E4 | 全图为主 | 视觉故事 |

**规则**：默认 E1。需要截图时升级到 E2。不轻易升级。

---

## 版式选择 — 每页一个版式，不连续重复

依当前页的角色从下表选取。**铁律：相邻两页不能使用同一版式。**

| 叙事角色 | 推荐版式 | 什么时候用 |
|---------|---------|-----------|
| 封面 | `cover.html` | 每套 PPT 唯一，开场定调 |
| 目录/总览 | `toc.html` | 页面数 ≥ 6 时展示结构 |
| 章节切换 | `section-divider.html` | 正文分 2-3 个大章节时，每章前插入 |
| 核心论述 | `bullets.html` / `two-column.html` / `three-column.html` | 列举观点、概念解释、并列要素 |
| 前后对比 | `comparison.html` / `pros-cons.html` / `diff.html` | 对比方案、优缺点、before/after |
| 数据展示 | `stat-highlight.html`（1 个大数字）、`kpi-grid.html`（4 指标）、`chart-bar/line/pie/radar.html` | 有具体数据需要呈现 |
| 架构/流程 | `arch-diagram.html` / `flow-diagram.html` / `process-steps.html` / `timeline.html` / `roadmap.html` | 系统图、步骤说明、时间线、路线图 |
| 代码/终端 | `code.html` / `terminal.html` / `diff.html` | 展示代码片段、CLI 效果、改动对比 |
| 引用强调 | `big-quote.html` | 金句、用户证言、核心结论 |
| 行动号召 | `cta.html` | 结尾引导关注/下载/试用 |
| 结尾致谢 | `thanks.html` | 每套 PPT 唯一，结束收尾 |

**选择策略**：
- 从 `html-ppt/templates/single-page/` 中复制对应版式的 `<section class="slide">` 块
- 每页的角色不同，版式自然不同——但即使角色相同（如连续两页论述），也要用不同版式（如第一页用 `bullets`，第二页用 `two-column`）
- 竖屏 deck 复制后需验证布局是否适配 810×1080

---

## 动效选择 — 一页最多 1-2 种

html-ppt 提供 27 种 CSS 入场动效 + 20 种 Canvas 持续动效。**一页最多 1-2 种。**

| 页面位置 | 推荐动效 | 替代方案 |
|---------|---------|---------|
| 封面标题 | `rise-in`（抬升入场） | `blur-in`（模糊清晰） |
| 正文标题 | `fade-up` | `rise-in` |
| 列表/网格（多元素） | `stagger-list`（逐个亮相） | — |
| 大数字/指标 | `counter-up`（从 0 跳到目标） | — |
| 章节切换页 | `perspective-zoom`（拉近） | `cube-rotate-3d` |
| 对比/展示页 | `fade-left` + `fade-right`（左右对开） | — |
| CTA/结尾 | `confetti-burst`（彩纸） | — |
| 背景氛围（Canvas FX） | `gradient-blob`（色块流动）、`constellation`（星点） | 一页一个 FX，不要叠加 |

**规则**：
- 封面 1 个动效（标题）就够了，不要再加次级入场
- 正文页：1 个标题入场动效 + 1 个自选（如列表 stagger 或 canvas FX 背景）
- Canvas FX 与 CSS 动效可以共存，但每页总动效数 ≤ 2
- 使用 `data-anim="..."` 而非 `class="anim-..."`，以便 runtime.js 每页重新触发

---

## 主题色彩理解 ⚠️ 必执行

**选完主题后、写 HTML 之前，必须先理解这个主题的色彩体系。**

### 执行步骤

1. **读取主题 CSS 文件**：`html-ppt/assets/themes/<主题名>.css`
2. **识别三层色彩**：
   - **底色层**：`--bg`, `--bg-soft` → 页面底色
   - **表面层**：`--surface`, `--surface-2`, `--border`, `--border-strong` → 卡片/容器
   - **文字层**：`--text-1`, `--text-2`, `--text-3` → 正文/说明/次要文字
3. **识别语义色**：`--accent`, `--accent-2`, `--accent-3`, `--good`, `--warn`, `--bad` → 强调/状态
4. **识别特效色**：`--grad`, `--grad-soft` → 渐变
5. **对照 demo deck 看官方用法**：`html-ppt/examples/demo-deck/index.html`，按 T 键切换到目标主题，观察官方怎么搭配色彩

---

## 三个隐形设计原则

### ① 留白是贵的
每页只讲一件事。slide padding 预留充足（竖屏至少 40-60px），不要在视觉上填满每一寸空间。

### ② 视觉节奏感
PPT 的视觉密度像音乐节拍，有疏有密：
```
封面（疏）→ 目录（网格密）→ 章节切换（大字疏）→ 正文双栏（中）→ 数据图表（密）→ 章节切换（疏）→ ... → CTA（中）→ 感谢（大留白）
```

### ③ 一个 deck 只用一个主题
T 键是给你预览对比用的，不要在一份 deck 里混搭两个主题。但可以用 `gradient-text` 给关键标题加渐变特效，这不算换主题。

---

## Footer 署名规则（红线）

每张 PPT 页面左下角必须包含公众号署名（格式：`叶帕奇 · {分类名}`，分类名参考 `checkpoints/content-gate.md` §分类判定）。页码居中，日期靠右排列。署名使用 `text-3` 颜色（与 footer 其他信息一致），不抢主视觉焦点，但必须始终可见。

> **⚠️ "叶帕奇"为固定署名，不得替换为子 Agent 名（如帕秋莉）。** 子 Agent 执行过程中可能自动将自己的名字写入 footer，必须修正为叶帕奇。

封面页不需要 footer。
