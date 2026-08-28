---
name: skill-optimizer
description: "Skill 创建后审查与持续优化。触发：审查/优化已有 Skill、新 Skill 创建后做质量检查、Skill 使用中发现问题需要改进时加载。"
---

# skill-optimizer — Skill 质检与优化

对已有 Skill 做质量审查、差距识别、优化落地。不替代 skill-builder（创建阶段），是创建后的"质检员"。

### 触发条件
- 队长要求审查/优化某个 Skill
- 新 Skill 创建完成后（作为 post-creation 质量保障）
- Skill 使用中发现问题需要改进

## 工作流

### 步骤 1：加载目标 Skill
- 读取目标 Skill 的 SKILL.md
- 读取其引用文件（references/、checklist.md 等）
- → **此时加载目标 Skill 全部文件**

### 步骤 2：定位 Skill 类型
- → **此时加载 [references/classification.md](references/classification.md)**
- 按 5 种分类确定主类型 + 辅类型
- 类型决定审查侧重点（如 Type 3 更关注工作流完整性，Type 4 更关注领域知识准确性）

### 步骤 3：逐项审查
- → **此时加载 [references/review-checklist.md](references/review-checklist.md)**
- 按 7 维度逐项对照，记录合格/不合格
- 不合格项 = 差距，进入步骤 4

### 步骤 4：产出优化方案
- 每个差距写明：现状 → 建议 → 影响
- 区分两类：
  - **可直接执行**：纯规范修复，不涉及偏好决策（如补加载指引、加回退路径）
  - **需队长确认**：涉及触发词选择、是否建模板、自由度分级等偏好项

### 步骤 5：队长确认
- 将「需队长确认」的优化项逐项列出，附建议和理由
- 队长确认后，合并「可直接执行」+「已确认」项，形成最终执行清单

### 步骤 6：执行优化
- 按执行清单修改 SKILL.md 和引用文件
- 更新关联的任务文件（记录优化内容和版本变更）
- 优化完成后标记任务状态

## 与现有 Skill 的关系

| Skill | 关系 |
|-------|------|
| `skill-builder` | 互补：skill-builder 管"创建"，skill-optimizer 管"审查优化" |
| `skill-creator`（Anthropic） | skill-creator 规范是审查维度来源之一 |
| 任何已有 Skill | skill-optimizer 是这些 Skill 的"质检员" |

## 引用

- [references/classification.md](references/classification.md) — 5 种 Skill 分类体系 + 定位方法
- [references/review-checklist.md](references/review-checklist.md) — 7 维度审查清单 + 合格标准 + 修复建议
