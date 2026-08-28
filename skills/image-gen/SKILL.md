---
name: image-gen
description: 通过 OpenAI 兼容接口生图，支持 /v1/images/generations 和 /v1/chat/completions 双路线，适配 Gemini 等模型。
---

# Image Gen Skill

**触发词**：生图、出图、出封面、配图、封面配图

---

## Step 0 — 读取配置 [自由度：低]

从 `openclaw.json` 的 `skills.image-gen` 节点读取非敏感配置；从 `~/.openclaw/secrets.env` 读取 API Key。

```json
{
  "skills": {
    "image-gen": {
      "baseUrl": "http://localhost:8090/v1",
      "defaultModel": "gpt-image-2",
      "outputDir": "/home/node/.openclaw/workspace/assets/images"
    }
  }
}
```

`secrets.env` 中需设置：
```bash
export OPENAI_API_KEY=sk-xxx
```

Agent 将配置字段映射为环境变量后传给 `generate-image`：

| 配置字段 | 映射为环境变量 | 脚本默认值 |
|---------|---------------|-----------|
| `baseUrl` | `OPENAI_BASE_URL` | `http://localhost:8090/v1` |
| `defaultModel` | `IMAGE_GEN_MODEL` | 无（必须设置此变量或传 `--model`） |
| `outputDir` | `IMAGE_GEN_OUTPUT_DIR` | `./output` |

> 模型必须通过 `IMAGE_GEN_MODEL` 环境变量或 `--model` 参数指定，脚本没有硬编码默认模型。若两者均未设置，脚本报错退出。

## 双路线路由

脚本根据模型名自动选择请求端点：

| 路线 | 端点 | 匹配模型 |
|------|------|---------|
| **images/generations**（默认） | `/v1/images/generations` | `gpt-image-*`, `grok-*-image`, `kling-image`, `qwen-image`, `imagen-*` |
| **chat/completions**（Gemini） | `/v1/chat/completions` | `gemini-*-image*`, `gemini-*-flash-image*` |

可通过以下方式扩展/覆盖路由：
- 环境变量 `IMAGE_GEN_CHAT_MODELS` — 逗号分隔的 glob 模式，追加到 chat 路由表
- CLI 参数 `--chat-model MODEL` — 强制指定模型走 `/v1/chat/completions`

### 自动回退

若 `/v1/images/generations` 返回 400/503 且模型名匹配 chat 路由表，脚本自动重试 `/v1/chat/completions`。

---

## Step 1 — 查可用模型 [自由度：低]

> 此步骤由 Agent 独立执行，`generate-image` 脚本本身不提供模型列表功能。

通过 `GET /v1/models` 拉取模型列表，筛选生图模型（如 `gpt-image-2`、`grok-4.2-image`、`imagen-4.0-generate-001` 等）。

```bash
curl -s $OPENAI_BASE_URL/models -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## Step 2 — 询问用户并执行 [自由度：中]

Agent 向队长询问使用哪个模型。若队长未指定，使用 `defaultModel`（需通过 `--model` 参数或 `IMAGE_GEN_MODEL` 环境变量传入脚本）。若两者均未设置，脚本报错退出。

### 执行生图

```bash
# 默认模型
generate-image "你的 prompt" output.png

# 指定模型
generate-image "你的 prompt" -m grok-4.2-image

# Gemini 等模型走 chat 路线
generate-image "你的 prompt" --chat-model gemini-3.1-flash-image

# 指定输出尺寸（横向配图）
generate-image "你的 prompt" -s 1536x1024 output.png

# 切后端
OPENAI_BASE_URL=https://api.siliconflow.cn/v1 generate-image "猫"
```

**尺寸控制**：`-s`/`--size WxH` 指定输出尺寸（如横版 `1536x1024`、竖版 `1024x1536`），默认 `1024x1024`。尺寸原样透传后端，不校验合法性；Gemini 路线不使用该参数（靠 prompt 描述比例）。

### 输出交付

脚本最终输出 `MEDIA:/绝对路径/image.png`，OpenClaw 收到后自动回传给对话。

**文件名规则**：
- 相对路径 → 拼在 `outputDir` 下
- 绝对路径 → 原路使用
- 不传文件名 → 自动生成 `image-<timestamp>.png`

---

## 失败回退 [自由度：低]

| 错误 | 脚本行为 | Agent 处理建议 |
|------|---------|---------------|
| API 返回非 200 | 打印错误信息后 `exit(1)` | Agent 可自行切换模型重试，最多 2 轮 |
| 返回无图片数据 | 打印响应内容后 `exit(1)` | 报错给队长「模型返回无图片，建议换模型」 |
| 后端不可达 / 网络错误 | 打印 `Fatal: <错误信息>` 后 `exit(1)` | 提示检查后端状态后重试 |
| `OPENAI_API_KEY` 未设置 | 打印 `ERROR: OPENAI_API_KEY not set` 后 `exit(1)` | 提示 `source ~/.openclaw/secrets.env` |
| 模型未指定 | 打印用法提示后 `exit(1)` | 设置 `IMAGE_GEN_MODEL` 或传 `--model` 重试 |

---

## 引用文件

- `generate-image` — CLI 入口（可执行脚本）