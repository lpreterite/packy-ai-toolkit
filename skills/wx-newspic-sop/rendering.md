# 渲染配置固定配方

> 本文件由 SKILL.md 步骤 2/3 触发加载。包含 HTML 样式规范、渲染环境配置、file:// vs HTTP 说明。

---

## 1. HTML 样式规范

### deck / slide 固定尺寸

```css
.deck {
  width: 810px;
  height: 1080px;
}
.slide {
  width: 810px;
  height: 1080px;
  box-sizing: border-box; /* 必须！否则 padding 撑破容器 */
}
```

> ⚠️ **不能用 `width:100%; height:100%`**。`position:absolute; inset:0` 的子元素在 `height:100%` 父级（仅 `min-height:100vh`）下塌缩为 0，导致截图空白。deck/slide 必须用固定 px。

### 内部内容 clamp() 自适应

所有字号、间距、内边距、绝对定位偏移量都用 `clamp(最小值, 首选值, 最大值)`：

| 元素 | clamp 配方（示例） |
|------|-------------------|
| h1 | `clamp(28px, 7vw, 64px)` |
| p / .lede | `clamp(14px, 2.8vw, 24px)` |
| slide padding | `clamp(24px, 6.5%, 70px) clamp(20px, 5.5%, 64px)` |
| border-radius | `clamp(12px, 2.5vw, 28px)` |
| 绝对定位 top/right/bottom | 也要 clamp()，不能只改内容元素 |

**完整配方参考**：`cases/html-ppt-mobile-css.md`（含 8B 模型封面改造的完整对照表）

### 其他要点

- `box-sizing: border-box` 必须加在 `.slide` 上
- HTML 内联 style 也要改 clamp()，CSS 的 clamp 不会覆盖内联固定 px
- sticker / 贴纸等绝对定位元素的 `top`/`right` 也要自适应

### footer 布局规则
- **左下角**：固定「叶帕奇 · {分类名}」（分类名如 工具介绍/观点评论，参考 content-gate.md §分类判定）
- **中间**：页码（如 `2 / 11`）
- **右下角**：固定日期（YYYY-MM-DD）
- 封面页不需要 footer
- **⚠️ "叶帕奇"为固定署名，不得替换为子 Agent 名（如帕秋莉）**
- 示例 footer-line 结构：
  ```html
  <div class="footer-line">
    <span class="dim">叶帕奇 · 工具介绍</span>
    <span class="slide-number" data-current="N" data-total="T"></span>
    <span class="dim">2026-05-20</span>
  </div>
  ```

## 2. 渲染配置

### 环境变量（必须与命令同行）

```bash
MOBILE=1 VIEWPORT_W=<deck宽> VIEWPORT_H=<deck高> DPR=2 HTTP_BASE=http://localhost:8765
```

> ⚠️ `DPR` **必须为 2**，否则截图模糊（1x 分辨率在手机上看不清文字）。
> ⚠️ `VIEWPORT_W/H` **必须与 HTML 中 `.deck` 的固定宽高一致**，否则内容溢出或留白。
> ⚠️ 环境变量不能换行后再写命令！换行后变量不继承给 for 循环。

### HTTP Server

```bash
cd ~/.openclaw/skills/html-ppt
python3 -m http.server 8765
```

- 从 html-ppt 根目录启动，确保 `../../../assets/` 相对路径可访问
- 渲染 URL：`http://localhost:8765/dist/<deck-name>/index.html`

### 截图方式（优先级从高到低）

**❌ 禁止：自写 playwright 脚本手动切换 slide 可见性**

自写脚本用 `display:none/block` 操作 absolute 叠放的 slide，但 `runtime.js` 在页面加载后接管 slide 切换，**会覆盖手动样式**，导致多张截图完全相同。这在 2026-05-19 ZCoder deck 中已复现。

**✅ 方式 1：官方 `render.sh`（推荐，有 runtime.js 的 deck 首选）**

`render.sh` 通过 URL hash `#/N` 驱动 `runtime.js` 切换 slide，每张独立渲染，内容正确。

```bash
MOBILE=1 VIEWPORT_W=675 VIEWPORT_H=900 DPR=2 \
  bash ~/.openclaw/skills/html-ppt/scripts/render.sh \
  dist/<deck-name>/index.html all /path/to/output-dir/
```

```bash
MOBILE=1 VIEWPORT_W=675 VIEWPORT_H=900 DPR=2 \
  bash ~/.openclaw/skills/html-ppt/scripts/render.sh \
  dist/<deck-name>/index.html 8 /path/to/output-dir/
```

> `all` = 自动检测 slide 数量；数字 N = 只截前 N 张。
> 输出文件名格式：`<stem>_01.png`, `<stem>_02.png`, ...

**✅ 方式 2：`_render-single-slide.mjs`（无 runtime.js 的静态 deck）**

```bash
MOBILE=1 VIEWPORT_W=675 VIEWPORT_H=900 DPR=2 HTTP_BASE=http://localhost:8765 \
  node ~/.openclaw/skills/html-ppt/scripts/_render-single-slide.mjs \
  "/dist/<deck-name>/index.html" <slide-num> "/path/to/output.png"
```

**参数说明**：位置参数 `file slideNum target`，非 flag 形式。`<slide-num>` 从 1 开始。

> ⚠️ 脚本必须放在 `~/.openclaw/skills/html-ppt/scripts/` 目录下执行，不能放 `/tmp/`（node 模块解析依赖本地 node_modules）。

## 3. 截图尺寸与搬运

- `DPR=2` 时，675×900 deck 输出 1350×1800，**无需缩放**，直接搬运
- 若 deck 用了 810×1080 视口，输出为 1620×2160，需 sips 缩放到 1350×1800（或保持原始高清尺寸）
- **禁止 1x 截图后再放大**（画质不可逆）
- 搬运到短文 assets 目录：`短文/assets/文章名/slide-NN.png`

> 短文 md 中引用宽度固定为 `300`。

## 4. file:// vs HTTP

| 方式 | 结果 | 原因 |
|------|------|------|
| `file://` | ❌ 截图空白/字体缺失 | Chrome 安全策略限制 file:// 协议加载远程字体和部分资源 |
| `http://localhost:8765` | ✅ 正常 | HTTP 协议无此限制 |

**永远不要用 file:// 渲染截图。**

## 5. 历史配方（已废弃）

> ⚠️ 以下为旧版配方，**已由 §3 取代**。保留仅供回溯。
>
> 旧版使用 `DPR=1` + 810×1080 视口 + sips 缩放到 675×900，分辨率不足导致截图模糊。2026-05-19 确认废弃。

## 6. HTML 预览翻页支持

必须在 HTML 末尾 `</body>` 前添加键盘 + 触摸翻页 JS，方便在浏览器中预览翻页：

- 支持左右箭头、上下箭头、触摸滑动
- 翻页 JS 不影响截图（`_render-single-slide.mjs` 会覆盖 display 属性）

> ⚠️ 翻页 JS 在加载时可能将非首屏 slide 设为 `display:none`，这会导致 `_render-single-slide.mjs` 截取 slide 2~N 时黑屏。脚本内部已处理：目标 slide 会显式恢复 `s.style.display=''`。

## 7. 截图重复问题（已解决 + 加固方案 B）

### 症状

多张截图 MD5 相同，内容完全一致。

### 已发生的同类事故

| 日期 | 场景 | 根因 | 修复 |
|------|------|------|------|
| 2026-05-19 | ZCoder deck | 自写 playwright 脚本用 `display:none/block` 切换 slide，`runtime.js` 通过 hash 路由接管可见性，覆盖手动样式 | 改用 `render.sh all` |
| 2026-05-20 | OpenWeRead deck | HTML 中 `.slide { opacity: 1 !important; transform: none !important; }` 覆盖 runtime.js 的 slide 显隐控制，所有 slide 堆叠，每张截到封面 | 删除全局 `!important` 覆盖，改用 `_render-single-slide.mjs` 逐张渲染 |

### 验收流程加固方案 B（渲染后必须执行）

#### B1. MD5 去重快速检查

渲染后立即执行。详细步骤见 [checkpoints/quality-checklist.md](checkpoints/quality-checklist.md) 步骤 1。

- 有输出 → 存在内容重复的截图，立即终止并排查根因
- 无输出 → 进入下一步内容多样性抽检

#### B2. Gemini 内容多样性抽检

抽检首、中、尾三张截图，用 Gemini 描述主要内容并对比：

```bash
for i in 1 4 9; do
  n=$(printf "%02d" $i)
  OPENAI_API_KEY="sk-..." /path/to/ui-check verify \
    --api-base http://localhost:8317 \
    --model gemini-3-flash-preview \
    -i "用一句话描述这张PPT截图的主要内容（标题和核心元素），然后检查：1) 文字是否完整无截断 2) 布局是否正常无溢出错位 3) 字体是否正常加载。每项 PASS/FAIL，最后总判定 PASS/FAIL。" \
    /path/to/index_${n}.png
done
```

验收标准：
- 首/中/尾三张内容描述必须不同 → 内容多样性 ✅
- 首/中/尾三张全部 PASS → 质量 ✅
- 任一 FAIL → 修复后重新渲染验收

#### B3. 全量质量验收

内容多样性验证通过后，再执行全量质量验收（所有截图逐张检查）。

---

## 8. base.css 已知冲突与修复（方案 C）

### 冲突说明

`~/.openclaw/skills/html-ppt/assets/base.css` 中 `.slide` 默认样式（第 47-55 行）：

```css
.slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateX(30px);
}
```

runtime.js 通过 `.is-active` class 控制当前 slide `opacity: 1; transform: none;`，其他 slide 保持隐藏。

### ❌ 错误做法（2026-05-20 事故根因）

```css
/* 不要这样写！会破坏 runtime.js 的 slide 切换机制 */
.slide {
  opacity: 1 !important;
  transform: none !important;
}
```

全局 `!important` 覆盖所有 slide（包括非当前 slide），所有 slide 堆叠在一起不可见区域 → 每次截图总是截到最上层。

### ✅ 正确做法

**如果使用 `render.sh`（依赖 runtime.js hash 路由）**：
- 不需要额外覆盖 `.slide` 的 opacity/transform
- runtime.js 通过 `#/N` URL hash 控制当前 slide 的 `.is-active` class
- 不要加全局 `!important`，不要加显式 display 控制

**如果使用 `_render-single-slide.mjs`（不依赖 runtime.js）**：
- 脚本内部会处理 `s.style.display=''` 恢复目标 slide 可见性
- 也不需要全局 `!important` 覆盖

### 适用场景选择

| 渲染方式 | 适用场景 | 需要修改 HTML |
|---------|---------|--------------|
| `render.sh`（hash 路由） | 有 runtime.js 的 deck | 无需修改 |
| `_render-single-slide.mjs` | 无 runtime.js 的静态 deck | 无需修改 |
| 两者都行 | deck 有 runtime.js 也可用 _render-single-slide | 确保 HTML 最后有 runtime.js |

## 9. 微信文章抓取备选

遇到 `mp.weixin.qq.com` 域名时，`web_fetch` 和 `browser` 均不可用（安全策略拦截）：

1. **CDP**（主要方案）：通过 Chrome DevTools Protocol 连接本地 Chrome，`document.body.innerText` 提取文本
2. **curl + Python**（备选）：仅对源码中有 `js_content` 容器的文章有效，纯动态渲染文章必须走 CDP

## 10. 引用来源

- `cases/html-ppt-mobile-css.md` — clamp() 完整对照表 + 历史教训（8B 模型封面改造、移动端适配）
- `~/.openclaw/skills/html-ppt/SKILL.md` — 底层渲染引擎（模板、主题、动画、运行时）
