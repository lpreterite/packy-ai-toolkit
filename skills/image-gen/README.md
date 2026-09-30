# @packy-tang/image-gen

通过任意 OpenAI 兼容接口生成图片，支持 `/v1/images/generations` 和 `/v1/chat/completions` 双路线，适配 GPT、Grok、Gemini、Qwen、Imagen 等模型。

## 安装

### 方式一：npx skill（通用技能安装器）

```bash
SKILL_BASE_URL=https://github.com/lpreterite/packy-ai-toolkit/tree/main npx skill skills/image-gen
```

默认安装到 `.codebuddy/skills/image-gen/`。`npx skill` 是通用工具，不绑定特定 agent 平台。

### 方式二：OpenClaw 集成

```bash
# 在 packy-ai-toolkit 仓库根目录执行（技能本体位于该仓库 skills/image-gen/）
ln -s $(pwd)/skills/image-gen ~/.openclaw/skills/image-gen
```

软链到 `~/.openclaw/skills/` 后即可被 OpenClaw agent 识别使用。

### 方式三：npm（全局安装或临时运行）

```bash
# 全局安装
npm install -g @packy-tang/image-gen
generate-image "一只猫"

# 临时运行
npx -y @packy-tang/image-gen "一只猫"
```

> 技能本体随「帕奇的AI工具包」（lpreterite/packy-ai-toolkit）维护：\`npx skills add https://github.com/lpreterite/packy-ai-toolkit/tree/main/skills/image-gen\`

## 用法

```bash
generate-image "一只戴帽子的猫"
generate-image "一只猫" -m gpt-image-2
generate-image "一只猫" output.png
generate-image "一只猫" -s 1536x1024
generate-image "一只猫" --chat-model gemini-3.1-flash-image
OPENAI_BASE_URL=https://api.siliconflow.cn/v1 generate-image "猫"
```

## 环境变量

| 变量 | 默认值 | 必填 | 说明 |
|---|---|---|---|
| `OPENAI_API_KEY` | — | 是 | API Key |
| `OPENAI_BASE_URL` | `http://localhost:8090/v1` | 否 | OpenAI 兼容 API 地址 |
| `IMAGE_GEN_MODEL` | — | 否* | 默认模型 ID（或用 `--model`） |
| `IMAGE_GEN_OUTPUT_DIR` | `./output` | 否 | 输出目录 |
| `IMAGE_GEN_CHAT_MODELS` | — | 否 | 逗号分隔的 glob 列表，追加到 chat 路由表（如 `foo-*-image,bar-*`） |

\* `IMAGE_GEN_MODEL` 和 `--model` 必须设置其一。

## CLI 参数

```
generate-image <prompt> [filename] [-m|--model MODEL] [--chat-model MODEL] [-s|--size WIDTHxHEIGHT]
```

`-s`/`--size` 指定输出尺寸（如 `1536x1024`），默认 `1024x1024`；尺寸原样透传给后端，Gemini 路线不受其影响。

## 输出

stdout 打印 `MEDIA:<绝对路径>`，供 OpenClaw 回传给对话。

## 测试

```bash
npm test
```

测试基于 Node 内置 `node:test`，含单元测试（`generate-image-lib`）与 CLI 端到端测试（本地 mock 后端，不依赖真实 API）。

## License

MIT