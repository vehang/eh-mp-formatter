# Hermes Agent Docker 部署

基于 [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) 官方 Dockerfile 构建。

## 快速开始

### 1. 构建镜像

```bash
docker build -t hermes-agent:latest .
```

### 2. 启动

```bash
# 基础启动（CLI 模式）
docker run -it --rm \
  -v hermes-data:/opt/data \
  hermes-agent:latest

# 启动 Gateway（Telegram/Discord 等消息平台）
docker run -d --name hermes \
  -v hermes-data:/opt/data \
  -p 8080:8080 \
  --env-file .env \
  hermes-agent:latest gateway start

# 从 OpenClaw 迁移
docker run -it --rm \
  -v hermes-data:/opt/data \
  -v ~/.openclaw:/root/.openclaw:ro \
  hermes-agent:latest claw migrate
```

### 3. 配置

首次启动后进入容器配置：

```bash
docker exec -it hermes hermes setup
```

或挂载配置文件：

```bash
docker run -d --name hermes \
  -v hermes-data:/opt/data \
  -v ./config.yaml:/opt/data/config.yaml \
  -v ./.env:/opt/data/.env \
  hermes-agent:latest gateway start
```

## docker-compose 部署

```bash
# 修改 .env 中的配置后
docker compose up -d

# 查看日志
docker compose logs -f hermes

# 进入容器
docker compose exec hermes bash

# 运行设置向导
docker compose exec hermes hermes setup
```

## 数据持久化

所有数据存储在 `/opt/data` 卷中：

```
/opt/data/
├── .env              # 环境变量（API Key 等）
├── config.yaml       # 主配置文件
├── SOUL.md           # Agent 人格
├── memories/         # 记忆数据
├── skills/           # 自定义 Skill
├── sessions/         # 会话历史
├── logs/             # 日志
├── cron/             # 定时任务
├── hooks/            # 钩子脚本
└── workspace/        # 工作目录
```

## 环境变量

在 `.env` 文件中配置：

| 变量 | 说明 | 示例 |
|------|------|------|
| `DEFAULT_MODEL` | 默认模型 | `openrouter:auto` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-...` |
| `OPENROUTER_API_KEY` | OpenRouter API Key | `sk-or-...` |
| `ZAI_API_KEY` | z.ai/GLM API Key | `xxx` |
| `TELEGRAM_BOT_TOKEN` | Telegram 机器人 Token | `123456:ABC` |
| `DISCORD_BOT_TOKEN` | Discord 机器人 Token | `xxx` |

## 更新

```bash
# 重新拉取代码并构建
docker compose build --no-cache
docker compose up -d
```

## 故障排查

```bash
# 诊断
docker compose exec hermes hermes doctor

# 查看日志
docker compose logs -f hermes --tail 100
```
