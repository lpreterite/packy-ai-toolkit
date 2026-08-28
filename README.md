# 帕奇的AI工具包 · Pachi's AI Toolkit

> 叶帕奇（lpreterite）维护的可复用 Agent Skills 集合，统一通过 `npx skills`（vercel-labs/skills）发现、安装与维护。

## 技能总表

| 技能 | 图标 | 触发词 | 说明 | 依赖 |
|---|---|---|---|---|
| `coding-sop` | 🔧 | 编码任务、ACP 调用、项目技术执行 | 编码任务标准操作流程：ACP → exec pty 兜底，harness 选择与安全约束 | 外部编码 harness（Claude Code / Codex / OpenCode） |
| `image-gen` | 🎨 | 生图、出图、出封面、配图 | 通过 OpenAI 兼容接口生图，双路线（images/generations + chat/completions）适配 Gemini 等 | CLI：`npm i -g @packy-tang/image-gen` |
| `remove-bg` | ✂️ | 去除背景、抠图、透明背景 | 基于 rembg + RMBG-2.0 离线移除图片背景，输出透明 PNG | Python + `rembg`（pip） |
| `topic-engine` | 📡 | 找选题、挖选题、热点选题 | 热点选题引擎：圈人群 / 建信任 / 搞线索三方向，含五道筛与证据门槛 | 无（外部台账/案例库由用户自管） |
| `wx-newspic-sop` | 🖼️ | 小绿书、图片消息、微信短文发布、PPT配图 | 小绿书全链路 SOP：短文编辑 → PPT 配图 → 发布公众号草稿箱 | html-ppt 技能、wx-newspic CLI、微信凭证 |

## 安装

### npx skills（推荐，全量）

```bash
# 预览仓库中有哪些技能
npx skills add lpreterite/pachi-ai-toolkit --list

# 全量安装到检测到的所有 Agent（claude / codex / openclaw / ...）
npx skills add lpreterite/pachi-ai-toolkit

# 只安装某一个技能
npx skills add https://github.com/lpreterite/pachi-ai-toolkit/tree/main/skills/topic-engine
```

### 兼容旧安装方式（codebuddy 系 npx skill，单数）

```bash
SKILL_BASE_URL=https://github.com/lpreterite/pachi-ai-toolkit/tree/main npx skill skills/image-gen
```

### 本机多 Agent 开发（软链）

```bash
node scripts/link.mjs --dry-run   # 预览
node scripts/link.mjs             # 软链到 ~/.agents/skills、~/.openclaw/skills、~/.claude/skills
node scripts/unlink.mjs           # 移除软链
```

## 开发规范

- 新增技能先读 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- 提交前跑 `node scripts/verify.mjs`
- 结构变更历史见 [docs/migration-plan.md](docs/migration-plan.md)

## License

MIT © 叶帕奇（Packy Tang）
