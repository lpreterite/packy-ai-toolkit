# 发布流程与故障排查

> 由 wx-newspic-sop §四 下沉。发布命令和排查表不需要每次加载，仅在发布步骤或遇到错误时参考。

## 前置条件

- `wx-newspic` CLI 已安装：`npm install -g @packy-tang/wx-newspic`
- 中转服务器已部署运行（见 [ops/relay-config.md](../ops/relay-config.md)）
- OpenClaw `skills.entries.wx-newspic-sop` 已配置凭证（自动注入）

## 发布命令

```bash
source ~/.zshrc && \
  wx-newspic publish \
    --title "标题（最长32字）" \
    --content "纯文本正文" \
    --author "叶帕奇" \
    --digest "摘要（最长128字）" \
    --images slide-01.png slide-02.png ... slide-NN.png
```

**必填参数**：`--title`、`--content`、`--images`
**选填参数**：`--author`、`--digest`

`--server` 和 `--api-key` 由 OpenClaw 自动注入。

## 发布后

- 返回 `{ media_id, created_at, success }` 表示成功
- 只推送到草稿箱，不自动发布
- 用户需到公众号后台 → 草稿箱 → 手动点击「发布」

## 故障排查

| 错误 | 原因 | 解决 |
|------|------|------|
| `invalid media_id` | CLI 图片上传流程 bug | 升级 wx-newspic 或用 curl 分步调用 |
| `invalid content` | 正文包含特殊字符或超 1105 字 | 检查不可见字符，确认字数 |
| `SERVER_UNREACHABLE` | 中转服务器未运行 | 检查服务器状态和端口 |
| `CREDENTIAL_NOT_FOUND` | 凭证未注入 | 检查 `openclaw.json` 配置 |
| `UPLOAD_FAILED` | 图片格式/大小不符 | 确认 PNG/JPEG，单张 ≤ 10MB |
| errcode: 40164 | 服务器 IP 未加白名单 | 公众号后台 → 开发 → 基本配置 → IP 白名单 |
| `/health` 返回 404 | relay 无 `/health` 路由（正常） | 用 `--dry-run` 验证 |
| 正文被截断 | 超 1105 字符 | 微信官方说 2 万，实测小绿书约 1105 字符 |
