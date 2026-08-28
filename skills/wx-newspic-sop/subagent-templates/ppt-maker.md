# ppt-maker — 子 Agent B：PPT 制作

## 适用阶段
第二阶段（串行），content-writer 完成且内容门通过后。

## 模型
`cliproxyapi/deepseek-v4-flash`

## 任务描述
你是莱兹的PPT制作子Agent。任务：根据以下内容制作小绿书配图PPT。

### 前置动作
首先 exec cat 读取以下文件了解渲染规则：
```
cat ~/.openclaw/skills/html-ppt/SKILL.md
cat ~/.openclaw/skills/html-ppt/rendering.md
cat ~/.openclaw/skills/wx-newspic-sop/guides/design-guide.md
```

### 输入占位
```
{内容提纲}
{原始正文 Markdown}
{主题（已在§零前置确认中由队长选定）}
{配图数量（已在§零前置确认中由队长确定）}
```

### 核心规则

| 规则 | 值 |
|------|-----|
| 尺寸 | **675×900（DPR=2 输出 1350×1800）🔒 不可修改，禁止覆盖** |
| 主题 | tokyo-night |
| 每页 footer 左下 | `叶帕奇 · {分类名}`（分类名如 工具介绍，在§零确认） |
| 每页 footer 中间 | 页码（如 `2 / 11`） |
| 每页 footer 右下 | 固定日期（YYYY-MM-DD） |
| HTTP 渲染 | `http://localhost:8765`，禁止 `file://` |
| 末尾页 | 居中对齐 |
| 封面页 | 可无 footer |

### ⚠️ 硬规则（来自验证发现）
- `position:absolute` 元素（如步骤卡片的序号圆圈）必须确保 `top` 值不超出父容器边界。建议 `top ≥ 0px`，不要用负值

### 输出
1. HTML deck → `~/.openclaw/skills/html-ppt/examples/{deck名}/index.html`
2. 渲染截图 → `{assets路径}/slide-NN.png`（如 slide-01.png）

## 验证记录
- 2026-06-21: vue-tui 验证，11 张截图，4m55s，一次修复（圆圈 top:-18px → top:8px）

## 失败回退
- 渲染失败 → 重试 2 次
- 2 次后仍失败 → 汇报队长，回退到串行模式
