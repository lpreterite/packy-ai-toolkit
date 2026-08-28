# subagent-templates 索引

子 Agent 任务模板目录，用于小绿书短文制作（SKILL.md §6 Task Flow）。

## 模板列表

| 模板 | 子 Agent | 阶段 | 模型 |
|------|---------|------|------|
| [content-writer.md](content-writer.md) | 帕秋莉：正文写作+内容门 | Step 1 | 默认模型 |
| [ppt-maker.md](ppt-maker.md) | 帕秋莉：PPT 制作+渲染+视觉门 | Step 2 | cliproxyapi/deepseek-v4-flash |
| [publisher.md](publisher.md) | 帕秋莉：搬运+更新MD（不发布） | Step 3 | 默认模型 |

## 使用方式

莱兹在 spawn 子 Agent 时，将对应模板的 task 内容传入 `sessions_spawn` 的 `task` 参数，根据模板中的「输入占位」替换实际内容。

## 时序

```
🔒 §零 前置确认 → 队长确认通过
       ↓
莱兹：收集资料后，将类型/主题/数量写入输入占位
       ↓
Step 1：sessions_spawn(content-writer.md) → 正文写作+内容门
       ↓ sessions_yield → 莱兹验证内容门 PASS
Step 2：sessions_spawn(ppt-maker.md) → PPT 制作+渲染+视觉门
       ↓ sessions_yield → 莱兹验证视觉门+风格门 PASS
Step 3：sessions_spawn(publisher.md) → 搬运+更新MD（不发布）
       ↓ sessions_yield
🔒 产出物验收门 → 莱兹核查搬运完整性
       ↓ PASS
莱兹手动 exec wx-newspic publish（仅一次）
       ↓
莱兹回执队长
```