# 新技能入驻规范（CONTRIBUTING）

欢迎为「帕奇的AI工具包」贡献技能。请遵循以下验收标准：

## 目录规则

```
skills/<skill-name>/
├── SKILL.md                  # 必填：技能主文件
└── references/ 或 resources/ # 细节下沉目录（可选）
```

- 技能名：小写连字符（`kebab-case`），全仓库唯一
- **技能目录内不放置 README.md / package.json 等冗余文件**（遵照 skill-optimizer 反模式清单），说明统一收进仓库根 README 技能总表
- 技能依赖的 CLI / npm 包如需随仓库发布，放 `tools/<name>/`，与技能目录隔离

## SKILL.md frontmatter

```markdown
---
name: my-skill
description: 做什么 + 何时触发（含至少 5 种触发场景/触发词）
---
```

- `name`：必填，小写连字符，全仓唯一
- `description`：必填，写明触发场景

## 内容规范（参考 skill-optimizer 标准）

- SKILL.md 建议 30–80 行，超过 80 行必须把细节下沉到 references/
- 每个引用文件标注「何时加载」
- 关键步骤标注自由度（高/中/低）
- 有前置检查与完成标准；失败有回退路径与重试上限

## 提交检查

1. 登记进 README 技能总表
2. `node scripts/verify.mjs` 无报错
3. 如带工具包，`cd tools/<name> && npm test` 通过
