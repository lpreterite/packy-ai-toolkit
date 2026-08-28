# 中转服务器配置

> 由 wx-newspic-sop §三 下沉。运维配置信息，日常工作流中不需要每次加载，仅在排障或重新部署时查阅。

## 架构

wx-newspic 支持两种发布模式：
1. **直连模式** — 本地直接调用微信 API（需要本地公网 IP 在微信白名单中）
2. **中转模式（推荐）** — 通过固定 IP 的 VPS 代理微信 API

当前使用中转模式，部署在荧光云服务器。

## 荧光云中转服务器

| 项目 | 值 |
|------|-----|
| 地址 | `http://154.93.104.176:4849` |
| API Key | `Packy1980-newspic-2026` |
| 用途 | wx-newspic relay，代理微信 API 上传图片 + 创建草稿 |
| 部署位置 | 荧光云（固定公网 IP，已在微信后台加白名单） |
| API 基础路径 | `/api/wechat`（CLI 自动拼接） |

> ⚠️ `/health` 路由不存在，应通过 `--dry-run` 验证连通性。

## 凭证注入

通过 OpenClaw `skills.entries.wx-newspic-sop` 自动注入到环境变量：

| 环境变量 | 值/来源 |
|---------|---------|
| `WX_NEWSPIC_SERVER` | `http://154.93.104.176:4849` |
| `WX_NEWSPIC_API_KEY` | `${OPENCLAW_WECHAT_SHORT_PPT_WX_NEWSPIC_API_KEY}` |
| `WECHAT_APP_ID` | `wx2e06c5563761daef` |
| `WECHAT_APP_SECRET` | `${OPENCLAW_WECHAT_SHORT_PPT_APP_SECRET}` |

CLI 读取顺序：CLI 参数 > 环境变量 > `.env` 文件。

## 备用服务

荧光云 `154.93.104.176:4848` 运行旧的 wenyan v2.0.8 服务，用于微信长文发布，与 wx-newspic relay（4849）互不干扰。

## 本地启动

```bash
wx-newspic serve --api-key "sk-your-key" --port 4849
```

参数：`--api-key`（必填）、`--port`（默认 3000）、`--host`（默认 0.0.0.0）。

## 配置变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-17 | 部署 wenyan v2.0.8 到 4848 端口 |
| 2026-05-20 | 部署 wx-newspic relay 到 4849 端口 |
| 2026-06-21 | 确认 4849 relay 运行正常 |
