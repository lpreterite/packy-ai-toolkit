# 全 Deck 模板速查

> 由 wx-newspic-sop 步骤 1.5「设计决策」触发加载。快速选出适合内容方向的全 deck 模板。

所有模板位于 `html-ppt/templates/full-decks/<name>/`。每个模板是一份完整的 deck（index.html + scoped CSS），**可以直接复制整份文件夹到 `examples/` 下改内容**，比从空白拼装高效得多。

## 按使用场景速查

| 场景 | 模板 | 视觉特征 | 页数 |
|------|------|---------|------|
| **小红书图文 3:4 竖屏** | `xhs-post` | 手写便签+贴纸，暖米色，粉色/黄色 sticker | 9 |
| **白底杂志风小红书** | `xhs-white-editorial` | 纯白+渐变色标题+马卡龙卡片 | 7+ |
| **柔和马卡龙慢生活** | `xhs-pastel-card` | 奶油底+柔和模糊色块+衬线斜体 | 8+ |
| **技术内部分享** | `tech-sharing` | GitHub 暗色+终端代码块+Agenda/Q&A | 8 |
| **CLI/开发者工具评测** | `hermes-cyber-terminal` | 黑底终端+荧光绿+扫描线+CRT 暗角 | 7+ |
| **知识图谱/数据可视化** | `graphify-dark-graph` | 深夜渐变+力导向图+彩虹渐变标题 | 7+ |
| **开发者工作流/教程** | `obsidian-claude-gradient` | GitHub 暗紫渐变+紫色 pill+居中排布 | 7+ |
| **系统架构/工程白皮书** | `knowledge-arch-blueprint` | 奶油纸+蓝图网格+锈红 accent | 7+ |
| **安全/事故复盘** | `testing-safety-alert` | 红黑警示条纹+红叉大标题+分级卡片 | 7+ |
| **融资路演/投资** | `pitch-deck` | YC 风白底+蓝紫渐变大数字+图表 | 10 |
| **产品发布会** | `product-launch` | 暗色开场+暖色特性卡片+定价+CTA | 8 |
| **单页一句话演讲** | `dir-key-nav-minimal` | 8 色纯色背景+160px 大字+超大留白 | 8 |
| **教学模块/课程** | `course-module` | 暖纸+衬线+左栏学习目标+自测 | 7 |
| **周报/团队同步** | `weekly-report` | 商务清晰+KPI 指标+柱状图+下周计划 | 7 |

## 使用方式

```bash
# 复制整个模板到 examples/
cp -r ~/.openclaw/skills/html-ppt/templates/full-decks/xhs-post examples/my-post/

# 修改 examples/my-post/index.html 中的内容
# 保留 HTML 结构 class，只替换文案和图片
```

## 选择建议

- **第一次用**：如果面向小红书/公众号，优先选 `xhs-post`（已配好 3:4 竖屏尺寸）
- **时间紧张**：选 `tech-sharing` 或 `product-launch`，改文案即可
- **追求视觉差异**：选特征最强的模板（`hermes-cyber-terminal`/`knowledge-arch-blueprint`/`testing-safety-alert`），与常见公众号排版拉开差距
