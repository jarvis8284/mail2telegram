# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mail2telegram 是一个基于 Cloudflare Email Routing Worker 的 Telegram Bot，将收到的邮件转发为 Telegram 消息。它运行在 Cloudflare Workers 平台上，使用 Cloudflare KV 存储邮件缓存和黑白名单。

## Commands

```bash
# 本地开发（Wrangler dev server）
pnpm dev

# 部署到 Cloudflare Workers
pnpm pub

# 构建为单一 bundle（输出到 build/index.js，用于复制粘贴部署）
pnpm build

# Lint & 自动修复
pnpm lint

# 运行测试（需要 example/nodemailer.eml 文件）
pnpm test
```

## Architecture

Worker 有两个入口点，均在 `src/index.ts` 导出：

- **`email`** (`src/handler/mail/index.ts`): 处理 Cloudflare Email Routing 传入的邮件。流程：检查黑白名单 → 转发备份邮箱 → 解析邮件并缓存到 KV → 发送 Telegram 通知。
- **`fetch`** (`src/handler/fetch/index.ts`): HTTP 路由，使用 `itty-router`。主要端点：
  - `GET /init` — 绑定 Telegram Webhook 并注册 Bot 命令
  - `POST /telegram/:token/webhook` — 接收 Telegram 更新（命令和 callback）
  - `GET /email/:id` — 邮件预览页面（text/html 模式）
  - `GET /tma` — Telegram Mini App HTML 页面
  - `/api/address/*` — 黑白名单管理 API（需要 TMA auth）

### Module Layout

```
src/
├── index.ts          # Worker 入口，导出 fetch 和 email handler
├── types/index.ts    # Environment 接口和核心类型定义
├── handler/
│   ├── fetch/        # HTTP 请求处理，路由注册
│   └── mail/         # 邮件接收主流程
├── mail/
│   ├── parse.ts      # 用 postal-mime 解析原始邮件流，支持截断策略
│   ├── check.ts      # 黑白名单匹配（精确匹配或正则）
│   ├── render.ts     # 构建 Telegram 消息内容（list/preview/summary/debug 四种模式）
│   ├── summarization.ts  # Workers AI / OpenAI 摘要生成
│   └── resend.ts     # 通过 Resend API 回复邮件
├── telegram/
│   ├── api.ts        # Telegram Bot API 封装
│   ├── telegram.ts   # Webhook 处理：命令路由、callback 处理
│   ├── const.ts      # Bot 命令定义和 TMA 模式描述
│   └── tma.html      # Telegram Mini App 前端（esbuild 以 text loader 打包）
├── db/index.ts       # Dao 类，封装所有 KV 操作
└── polyfill/index.ts # 为 Workers 环境提供 Buffer polyfill
```

### Key Design Points

**KV 存储结构**：
- `{messageId}` → `EmailHandleStatus`（仅 Guardian 模式下写入，防重复处理）
- `{uuid}` → `EmailCache`（邮件内容缓存，TTL 由 `MAIL_TTL` 控制）
- `TelegramID2MailID:{telegramMsgId}` → `{uuid}`（用于回复邮件功能）
- `BLOCK_LIST` / `WHITE_LIST` → JSON 数组字符串

**邮件渲染模式**（对应 Telegram callback_data 前缀）：
- `l:` list mode — 初始通知，显示标题和按钮
- `p:` preview mode — 内联文本预览（截断至 4096 字符）
- `s:` summary mode — AI 摘要（Workers AI 优先，其次 OpenAI）
- `d:` debug mode — 显示邮件元数据和黑白名单匹配结果

**黑白名单逻辑**：环境变量中的列表与 KV 中的列表合并使用。白名单优先于黑名单——只要匹配白名单即放行，不再检查黑名单。

**构建**：`.html` 文件通过 esbuild 的 `text` loader 内联为字符串，因此 TMA HTML 直接打包进 Worker bundle。

## Configuration

复制 `wrangler.example.jsonc` 为 `wrangler.jsonc` 并填入配置。必填项：`TELEGRAM_TOKEN`、`TELEGRAM_ID`、`DOMAIN`，以及绑定名为 `DB` 的 KV Namespace。

测试用例需要在 `example/nodemailer.eml` 放置一个 `.eml` 文件。
