# 「帕奇的AI工具包」单仓库整合方案

> 目标：把 `~/Documents/Works/skills/` 下的 6 个独立技能仓库（coding-sop / image-gen / remove-bg / skill-optimizer / topic-engine / wx-newspic-sop）整合进一个名为 **pachi-ai-toolkit**（中文品牌：**帕奇的AI工具包**）的 GitHub 单仓库，统一用 `npx skills`（vercel-labs/skills）发现、安装和维护。
>
> 已确认决策：仓库 `lpreterite/pachi-ai-toolkit` ｜ 平面结构 `skills/<name>/` ｜ 直接复制文件、干净重建（旧仓库冻结归档，不保留 git 历史）｜ 本次范围仅这 6 个技能。
>
> **执行顺序调整（用户 2026-02 确认）**：skill-optimizer 的迁移**整体放到最后一阶段**，迁移前必须先做「本机已安装拷贝 vs 仓库版本」的版本对比，确认无误后再进行复制与换软链。

---

## 一、现状盘点

| 技能 | 当前仓库布局 | 安装现状 | 特殊资产 / 风险点 |
|---|---|---|---|
| coding-sop | `SKILL.md` 在仓库**根**（无 skills/ 目录） | 软链 → `~/.openclaw/skills/coding-sop` | SKILL.md 有**未提交改动**；无 LICENSE 文件；SKILL.md 硬编码旧路径 `~/Documents/Works/skills/coding-sop/` |
| image-gen | `skills/image-gen/`（SKILL.md + CLI 脚本 + lib + 测试）+ 根 package.json（npm 发布 `@packy-tang/image-gen`） | 软链 → `~/.openclaw/skills/image-gen` | 同一仓库身兼「技能 + npm CLI」两职；`bin` 路径为 `./skills/image-gen/generate-image`；有 node:test 单测 |
| remove-bg | `skills/remove-bg/`（SKILL.md + references/）+ 根 README/LICENSE | 软链 → `~/.agents/skills/remove-bg` | 依赖本机 rembg（运行期，不随迁移变化） |
| skill-optimizer | `skills/skill-optimizer/`（SKILL.md + references/ ×2） | `~/.agents/skills/skill-optimizer` 是**真实目录拷贝**（非软链）；另有 `~/.openclaw/skills`、`~/.claude/skills` 软链 | **后置迁移**：最后一阶段先做版本对比（已安装拷贝 vs 仓库），确认一致再复制+换软链；README 安装命令指向旧仓库 |
| topic-engine | `SKILL.md` + `resources/` 在仓库**根**（无 skills/ 目录） | 软链 → `~/.agents/skills/topic-engine`（指向仓库根） | 需要包成 `skills/topic-engine/`；软链目标会变 |
| wx-newspic-sop | `skills/wx-newspic-sop/`（多级引用、lobster 管线、subagent 模板、dist/） | 软链 → `~/.openclaw/skills/wx-newspic-sop` | `dist/` 目前**未提交**（? 状态）；SKILL.md/README 的安装说明指向旧仓库；运行期依赖 `~/.openclaw/skills/html-ppt`（迁仓库不影响） |

现状共 6 个技能名均唯一，frontmatter 均为合法 `name + description`，无需改名。

---

## 二、目标仓库结构（平面结构）

```
pachi-ai-toolkit/                          # GitHub: lpreterite/pachi-ai-toolkit
├── README.md                              # 「帕奇的AI工具包」品牌页：技能总表 + 安装 + 贡献入口
├── LICENSE                                # MIT（作者：叶帕奇，统一一份即可）
├── .gitignore                             # 合并各仓库忽略规则
├── docs/
│   └── CONTRIBUTING.md                    # 新技能入驻规范（frontmatter、目录、verify）
├── scripts/                               # 仓库维护脚本（非技能内容）
│   ├── link.mjs                           # 一键软链到 Agent 技能目录（幂等、dry-run）
│   ├── unlink.mjs                         # 移除软链
│   └── verify.mjs                         # 结构/frontmatter/引用完整性校验
├── tools/                                 # （image-gen 方案 A 时存在）
│   └── image-gen/                         # npm CLI 包：package.json / bin / lib / tests / README
└── skills/                                # npx skills 发现根（每层最多 3 级，平面结构只 1 级）
    ├── coding-sop/
    │   └── SKILL.md
    ├── image-gen/
    │   └── SKILL.md                       # 方案 A：仅保留技能说明
    ├── remove-bg/
    │   ├── SKILL.md
    │   └── references/troubleshooting.md
    ├── skill-optimizer/
    │   ├── SKILL.md
    │   └── references/{classification,review-checklist}.md
    ├── topic-engine/
    │   ├── SKILL.md
    │   └── resources/{methodology,structures,examples}.md
    └── wx-newspic-sop/
        ├── SKILL.md
        ├── guides/ checkpoints/ references/ ops/ render.md(原 rendering.md)
        ├── lobster-flows/wx-newspic.lobster
        ├── subagent-templates/
        └── dist/ai-native-token-max/
```

要点：
- **技能目录内不放 README.md / package.json 等“冗余文件”**（遵照 skill-optimizer 自己的反模式清单），各技能说明统一收进仓库根 README 的技能总表。
- 仓库根**不放置 SKILL.md**（npx skills 会把根目录本身也识别为技能，避免多出一个“仓库级技能”）。
- 所有技能共用一份根 LICENSE（MIT）；原 remove-bg / skill-optimizer 的 LICENSE 若署名一致可并入，coding-sop 补 LICENSE。

---

## 三、逐技能改造映射

| 技能 | 从（旧仓库） | 到（新仓库） | 必须做的改动 |
|---|---|---|---|
| coding-sop | 根 SKILL.md | `skills/coding-sop/SKILL.md` | ①先把未提交改动 commit 或备份；②SKILL.md 第 255 行附近旧路径 `~/Documents/Works/skills/coding-sop/` → 仓库内说明改为「本技能位于 `skills/coding-sop/`」；③软链改指 `skills/coding-sop` |
| image-gen（方案 A，推荐） | `skills/image-gen/` 整体 + 根 package.json | skill → `skills/image-gen/SKILL.md`；CLI → `tools/image-gen/`（package.json/bin/lib/tests/README） | ①`package.json` 的 bin 改 `{"generate-image": "./generate-image"}`；②测试路径改 `node --test *.test.js`；③README 安装命令 URL 改新仓库；④`repository` 字段迁到新仓库 |
| image-gen（方案 B，备选） | 同上 | `skills/image-gen/` 整体搬入（含 CLI/lib/tests/package.json） | ①包内放 package.json（`npm i -g ./skills/image-gen`），npx skills 安装时多余文件无害；适合“少动结构” |
| remove-bg | `skills/remove-bg/` | `skills/remove-bg/` 原样 | README 中的软链命令 `ln -s ~/Documents/Works/skills/remove-bg/skills/remove-bg …` → 指向新仓库 `skills/remove-bg` |
| skill-optimizer（**后置**） | `skills/skill-optimizer/` | `skills/skill-optimizer/` 原样 | ①迁移整体放到最后一阶段；②先做版本对比：`diff -r ~/.agents/skills/skill-optimizer vs 仓库 skills/skill-optimizer`，确认一致（或经用户确认差异）后再复制；③README 安装命令改 `npx skills add lpreterite/pachi-ai-toolkit`（或单选 URL）；④`~/.agents/skills/skill-optimizer` 真实目录先备份再改软链 |
| topic-engine | 根 SKILL.md + resources/ | `skills/topic-engine/{SKILL.md,resources/}` | ①README 软链命令改指新路径；②`~/.agents/skills/topic-engine` 软链改指 `skills/topic-engine`；③验证 resources 相对引用仍然有效 |
| wx-newspic-sop | `skills/wx-newspic-sop/` | `skills/wx-newspic-sop/` 原样 | ①`dist/` 纳入 git（先复制）；②README 的 `npx skill` URL 改新仓库；③SKILL.md 中相对仓库根的 `--file skills/wx-newspic-sop/lobster-flows/...` 在新仓库**保持不变**（路径层次恰好一致）；④ `~/.openclaw/skills/html-ppt` 等运行期路径不动 |

---

## 四、品牌与安装命令

### 品牌
- GitHub 仓库：`lpreterite/pachi-ai-toolkit`
- 仓库 description：`帕奇的AI工具包 · Pachi's AI Toolkit — 可复用 Agent Skills 集合`
- README 首页给出中文品牌头 + 技能总表（emoji、名称、触发词、依赖、说明）。

### 安装（npx skills，vercel-labs）
```bash
# 预览仓库里有哪些技能
npx skills add lpreterite/pachi-ai-toolkit --list

# 全量安装到检测到的所有 Agent（claude/codex/openclaw/...）
npx skills add lpreterite/pachi-ai-toolkit

# 只装某一个技能
npx skills add https://github.com/lpreterite/pachi-ai-toolkit/tree/main/skills/topic-engine
```

### 兼容旧安装方式
```bash
# npx skill（单数，codebuddy 系通用安装器，image-gen/wx-newspic-sop 现用）
SKILL_BASE_URL=https://github.com/lpreterite/pachi-ai-toolkit/tree/main npx skill skills/image-gen

# 本地开发软链（本机多 Agent 场景）
node scripts/link.mjs --dry-run   # 预览
node scripts/link.mjs             # 软链到 ~/.agents/skills、~/.openclaw/skills、~/.claude/skills
node scripts/unlink.mjs
```

---

## 五、骨架文件规格

1. **README.md**：品牌头 → 技能总表（6 行：名称/emoji/触发词/说明/依赖）→ 安装（上节命令）→ 新技能入驻链接 docs/CONTRIBUTING.md → License。
2. **.gitignore**（合并）：`node_modules/`、`.DS_Store`、`output/`、`*.log`、`.env`、`.skill/`、`__pycache__/`、`*.pyc`。
3. **LICENSE**：MIT，作者叶帕奇。
4. **docs/CONTRIBUTING.md**：新增技能的验收标准——frontmatter 必须有 name（小写连字符、全仓唯一）+ description（含触发词）；SKILL.md 建议 ≤80 行、细节下沉到 references/；资源文件必须被 SKILL.md 引用；登记进 README 技能总表；提交前跑 `node scripts/verify.mjs`。
5. **scripts/verify.mjs**：①遍历 `skills/*/`，要求每个目录含 SKILL.md 且 frontmatter 合法；②name 全仓唯一；③README 总表与目录一一对应；④SKILL.md 内引用的相对文件（`references/`、`resources/`、`guides/` 等）真实存在；⑤image-gen 的 CLI 包单测可跑。
6. **scripts/link.mjs**：默认装到 `~/.agents/skills`、`~/.openclaw/skills`、`~/.claude/skills`；支持 `--only agents|openclaw|claude`；幂等（已存在同名软链且指向正确则跳过）；发现同名**真实目录**（如 skill-optimizer）时先备份再替换并提示。

---

## 六、关键风险与对策

| 风险 | 对策 |
|---|---|
| `~/.agents/skills/skill-optimizer` 是真实目录拷贝，直接换软链会丢本地改动 | 迁移整体后置：先 `diff -r` 已安装拷贝 vs 仓库版本并展示差异，确认无误后才复制+换软链；执行前备份到 `~/Documents/Works/tmp/skill-optimizer-backup` |
| coding-sop、wx-newspic-sop 有未提交改动 / 未跟踪文件（dist/） | 第 0 阶段先 git commit 或复制快照，确保迁移源是完整状态 |
| SKILL.md 内硬编码旧绝对路径（coding-sop、topic-engine README、remove-bg README、wx-newspic-sop 的公众号业务路径） | 全局 grep `Works/skills` 逐条改为新仓库路径；业务路径（MyNodes 下的公众号目录）**不改** |
| npx skills 会把仓库根 SKILL.md 也当技能 | 根目录只放 README，不放 SKILL.md |
| 旧仓库冻结后，GitHub 老链接（README/徽章）失效 | 各技能 README 内容并入新仓库 README；旧仓库 description 标注「已迁移至 pachi-ai-toolkit」并可 Archive |
| npm 包 `@packy-tang/image-gen` 的 repository 字段指旧仓库 | 并入后同步更新，保持 npm 与 GitHub 一致 |

---

## 七、分阶段执行步骤（P0 ～ P7，skill-optimizer 后置）

**Phase 0 快照与备份**
```bash
# 1) coding-sop 提交未提交改动
cd ~/Documents/Works/skills/coding-sop && git add -A && git commit -m "chore: snapshot before monorepo migration"
# 2) wx-newspic-sop 提交 dist/ 与改动的 SKILL.md（或先归档）
cd ~/Documents/Works/skills/wx-newspic-sop && git add -A && git commit -m "chore: snapshot (incl. dist/) before migration"
# 3) 整目录备份，防意外
tar -czf ~/Documents/Works/tmp/works-skills-backup-$(date +%Y%m%d).tgz ~/Documents/Works/skills
# 4) 备份 ~/.agents/skills/skill-optimizer
cp -R ~/.agents/skills/skill-optimizer ~/Documents/Works/tmp/skill-optimizer-backup
```

**Phase 1 建仓骨架**
```bash
mkdir -p ~/Documents/Works/pachi-ai-toolkit && cd ~/Documents/Works/pachi-ai-toolkit
git init && git branch -M main
# 创建 README.md / LICENSE / .gitignore / docs/ / scripts/（内容见第五节）
```

**Phase 2 迁移目录**（按第三节映射复制，不移动源，旧仓库保持冻结不动）
```bash
mkdir -p skills
cp -R ~/Documents/Works/skills/coding-sop/SKILL.md   skills/coding-sop/SKILL.md
cp -R ~/Documents/Works/skills/image-gen/skills/image-gen/SKILL.md  skills/image-gen/            # 方案A，仅SKILL.md
cp -R ~/Documents/Works/skills/image-gen             tools/image-gen/                             # 方案A，CLI包
# cp -R ~/Documents/Works/skills/image-gen/skills/image-gen skills/image-gen                      # 方案B
cp -R ~/Documents/Works/skills/remove-bg/skills/remove-bg        skills/remove-bg
# （skill-optimizer 后置：不在本阶段复制，留到 Phase 6）
mkdir -p skills/topic-engine && cp -R ~/Documents/Works/skills/topic-engine/SKILL.md ~/Documents/Works/skills/topic-engine/resources skills/topic-engine/
cp -R ~/Documents/Works/skills/wx-newspic-sop/skills/wx-newspic-sop skills/wx-newspic-sop
```

**Phase 3 内容修正**（逐个改 README/package.json/SKILL.md 中的路径与安装说明，见第三节“必须做的改动”）

**Phase 4 软链重建 + 验证**
```bash
node scripts/verify.mjs
node scripts/link.mjs --dry-run && node scripts/link.mjs
# 冒烟：
cd tools/image-gen && npm test                       # image-gen 单测
# 其余技能做一次「触发词加载」实测（在各自的 Agent 会话里触发一次）
```

**Phase 5 提交并发布（skill-optimizer 尚未迁入）**
```bash
git add -A && git commit -m "feat: 帕奇的AI工具包 · aggregate 5 skills (skill-optimizer 待 Phase 6)"
gh repo create lpreterite/pachi-ai-toolkit --public --source . --push
# 云验证（此时应为 5 个；第 6 个在 Phase 6 迁入后再验证）
npx skills add lpreterite/pachi-ai-toolkit --list
npx skills add https://github.com/lpreterite/pachi-ai-toolkit/tree/main/skills/topic-engine --dry-run
# 旧仓库 GitHub 上逐个 Archive（可选，建议等 Phase 6 完成后再归档 skill-optimizer）
```

**Phase 6 skill-optimizer 后置迁移（版本对比先行）**
```bash
# ① 版本对比：已安装拷贝 vs 仓库版本
mkdir -p /tmp/skill-optimizer-diff
cp -R ~/Documents/Works/skills/skill-optimizer/skills/skill-optimizer /tmp/skill-optimizer-diff/repo-version
diff -r /tmp/skill-optimizer-diff/repo-version ~/.agents/skills/skill-optimizer
# ② 若存在差异：逐条确认（以哪份为准、是否合入），确认无误后再继续；差异为空则可直接进行
cp -R ~/Documents/Works/skills/skill-optimizer/skills/skill-optimizer skills/skill-optimizer
# ③ README 安装命令、verify 配置等按第三节更新（技能目录内容一般无需改动）
node scripts/verify.mjs
# ④ 备份后换软链
mv ~/.agents/skills/skill-optimizer ~/Documents/Works/tmp/skill-optimizer-pre-migration
ln -s "$(pwd)/skills/skill-optimizer" ~/.agents/skills/skill-optimizer
# ⑤ 提交并推送
npx skills add lpreterite/pachi-ai-toolkit --list    # 此时应恰好列出 6 个
git add -A && git commit -m "feat: 迁入 skill-optimizer（版本对比确认一致）" && git push
```

**Phase 7 收尾**

**Phase 6 收尾**
- 确认 `~/.agents/skills`、`~/.openclaw/skills`、`~/.claude/skills` 下 6 条软链全部指向新仓库后，再删除旧 `~/Documents/Works/skills` 副本（或改名 `skills-archived` 观察一周）。
- 全盘 grep 还有没有指向旧路径的文档/脚本（`Works/skills`、`lpreterite/(skill-optimizer|image-gen|...)`）。
- 更新依赖它的项目说明（如 coding-sop 的 AGENTS.md 引用）。

---

## 八、验收清单（Definition of Done）

- [ ] GitHub 存在 `lpreterite/pachi-ai-toolkit`，README 显示「帕奇的AI工具包」品牌与 6 技能总表
- [ ] `npx skills add lpreterite/pachi-ai-toolkit --list` 恰好列出 6 个技能，且单个技能 URL 可装
- [ ] `node scripts/verify.mjs` 零报错；`tools/image-gen` 的 `npm test` 通过
- [ ] skill-optimizer：迁移前版本对比（已安装拷贝 vs 仓库）已完成并经确认，差异（若有）已说明
- [ ] 3 个 Agent 技能目录中的 6 条软链均指向新仓库，重装/重载后技能可被触发
- [ ] coding-sop / wx-newspic-sop 的未提交改动已入档，`dist/` 已入库
- [ ] 全仓无 `Works/skills` 旧路径残留；旧仓库已冻结/归档
