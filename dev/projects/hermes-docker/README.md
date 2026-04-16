# Hermes Docker 部署文档

## 目录
- [一、架构概览](#一架构概览)
- [二、构建镜像](#二构建镜像)
- [三、配置](#三配置)
- [四、运行](#四运行)
- [五、飞书平台配置](#五飞书平台配置)
- [六、LLM 模型配置](#六llm-模型配置)
- [七、常见问题](#七常见问题)

---

## 一、架构概览

### 分层镜像设计

```
hermes-agent (App 层)     4.75GB
  └── hermes-base (系统层)  1.79GB
        ├── debian:13.4
        ├── Python 3.13 + Node 20 + Playwright
        ├── uv 0.11.6
        └── lark-oapi (飞书 SDK)
```

- **hermes-base**: 系统依赖（不频繁变动）
- **hermes-agent**: 源码 + 应用依赖（更新频繁）

### 支持的国内平台

| 平台 | 状态 | 配置 key |
|------|------|---------|
| 飞书 (Feishu) | ✅ WebSocket 已连接 | `FEISHU_APP_ID` / `FEISHU_APP_SECRET` |
| 钉钉 (DingTalk) | 待配置 | `DINGTALK_*` |
| 企业微信 (WeCom) | 待配置 | `WECOM_*` |
| QQ Bot | 待配置 | `QQBOT_*` |

### 支持的 LLM

| 模型 | Provider | 备注 |
|------|----------|------|
| 智谱 GLM-5.1 | `zai` | ✅ 已配置 |
| Kimi / Moonshot | `kimi-coding` | 需配置 `KIMI_API_KEY` |
| MiniMax | `minimax-cn` | 需配置 `MINIMAX_CN_API_KEY` |

---

## 二、构建镜像

### 前置条件

- Docker 已安装
- 磁盘空间 > 10GB
- 网络通畅（访问 GitHub / Debian 源）

### 构建 base 镜像（系统依赖层）

```bash
cd ~/hermes-docker

# 构建（使用缓存，构建速度快）
docker build -f Dockerfile.base -t hermes-base:latest .
```

**注意事项：**
- 不要加 `--no-cache`，会导致 apt-get 内存不足被 kill
- base 镜像包含：Python 3.13、Node 20、Playwright、uv、ripgrep、ffmpeg 等

### 构建 app 镜像（应用层）

```bash
# 基于 base 构建 app 层
docker build -f Dockerfile.app -t hermes-agent:latest .

# 或者用 build.sh（两层一起构建）
./build.sh
```

### 验证镜像

```bash
# 检查镜像
docker images | grep hermes

# 验证 base 工具链
docker run --rm hermes-base:latest bash -c "which uv && uv --version && node --version"

# 验证 app
docker run --rm hermes-agent:latest hermes --help
```

**预期输出：**
```
hermes-base:     1.79GB
hermes-agent:    4.75GB
uv 0.11.6 (x86_64-unknown-linux-gnu)
v20.19.2
```

---

## 三、配置

### 配置文件位置

所有配置在 Docker 数据卷 `/opt/data/` 中：

```
/opt/data/
├── .env          # API Keys、平台凭证（敏感）
├── config.yaml   # 模型、工具、行为配置
└── SOUL.md      # AI 人格设定
```

### 配置方式

#### 方式 1：挂载本地目录（推荐）

```bash
# 创建本地配置目录
mkdir -p ~/hermes-data

# 运行容器（配置持久化到宿主机）
docker run -d \
  --name hermes-test \
  -p 49080:8080 \
  -v ~/hermes-data:/opt/data \
  -e TZ=Asia/Shanghai \
  --restart unless-stopped \
  hermes-agent:latest gateway run
```

#### 方式 2：进入容器直接编辑

```bash
# 进入容器
docker exec -it hermes-test bash

# 编辑配置
vi /opt/data/.env        # API Keys
vi /opt/data/config.yaml  # 模型配置

# 改完后重启
docker restart hermes-test

# 查看日志
docker logs -f hermes-test
```

### 快捷配置命令

```bash
# 查看当前 .env（不含敏感信息）
docker exec hermes-test bash -c 'cat /opt/data/.env | grep -v "^#" | grep -v "^$"'

# 查看当前模型配置
docker exec hermes-test bash -c 'grep -E "^  (default|provider|base_url):" /opt/data/config.yaml'

# 临时开启全用户访问（测试用）
docker exec hermes-test bash -c 'echo "GATEWAY_ALLOW_ALL_USERS=true" >> /opt/data/.env'
docker restart hermes-test
```

---

## 四、运行

### 快速启动（使用数据卷）

```bash
# 创建命名数据卷
docker volume create hermes-data

# 启动
docker run -d \
  --name hermes \
  -p 49080:8080 \
  -e TZ=Asia/Shanghai \
  -v hermes-data:/opt/data \
  --restart unless-stopped \
  hermes-agent:latest gateway run
```

### 首次运行会自动初始化

entrypoint 会自动创建以下目录和文件：

```
/opt/data/
├── .env           # 首次从 hermes.env.example 复制
├── config.yaml    # 首次从 cli-config.yaml.example 复制
├── SOUL.md        # AI 人格
├── cron/          # 定时任务
├── sessions/      # 会话
├── logs/          # 日志
├── skills/        # 技能
└── memories/      # 记忆
```

### 查看运行状态

```bash
# 查看日志
docker logs --tail 30 hermes-test

# 实时跟踪日志
docker logs -f hermes-test

# 检查飞书连接状态
docker logs hermes-test 2>&1 | grep -i "lark\|feishu\|connected"
```

**飞书连接成功的日志：**
```
[Lark] connected to wss://msg-frontier.feishu.cn/ws/v2...
```

---

## 五、飞书平台配置

### 步骤 1：在飞书开放平台创建应用

1. 打开 [飞书开放平台](https://open.feishu.cn/app)
2. 创建企业自建应用
3. 获取 **App ID** 和 **App Secret**
4. 配置权限（消息权限、事件订阅等）
5. 开启**长连接**（WebSocket）模式

### 步骤 2：写入配置

```bash
docker exec hermes-test bash -c 'cat >> /opt/data/.env << EOF

# 飞书平台
FEISHU_APP_ID=你的AppID
FEISHU_APP_SECRET=你的AppSecret
EOF'

docker restart hermes-test
```

### 步骤 3：验证连接

```bash
docker logs -f hermes-test
# 看到 [Lark] connected 表示成功
```

### 飞书权限配置（必选）

在飞书开放平台 → 应用功能 → 权限管理，添加以下权限：

| 权限 | 说明 |
|------|------|
| `im:message` | 读取和发送消息 |
| `im:message.receive_v1` | 接收消息事件 |
| `im:chat` | 获取群信息 |

### 常见问题

**Q: 飞书连接成功但收不到消息？**
- 检查应用是否已发布/上线
- 检查权限是否已审批
- 确认机器人是否被加入会话

---

## 六、LLM 模型配置

### 智谱 GLM（推荐国内使用）

```bash
# 写入 .env
docker exec hermes-test bash -c 'cat >> /opt/data/.env << EOF

# 智谱 GLM
GLM_API_KEY=你的APIKey
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
EOF'

# 修改 config.yaml
docker exec hermes-test bash -c '
sed -i "/^  default:/c\  default: \\"glm-5.1\\"" /opt/data/config.yaml
sed -i "/^  provider:/c\  provider: \\"zai\\"" /opt/data/config.yaml
sed -i "/^  base_url:/c\  base_url: \\"https://open.bigmodel.cn/api/paas/v4\\"" /opt/data/config.yaml
'

docker restart hermes-test
```

### Kimi / Moonshot

```bash
docker exec hermes-test bash -c 'cat >> /opt/data/.env << EOF

# Kimi
KIMI_API_KEY=你的KimiKey
EOF'

docker exec hermes-test bash -c '
sed -i "/^  default:/c\  default: \\"kimi-k2.5\\"" /opt/data/config.yaml
sed -i "/^  provider:/c\  provider: \\"kimi-coding\\"" /opt/data/config.yaml
'
docker restart hermes-test
```

### MiniMax

```bash
docker exec hermes-test bash -c 'cat >> /opt/data/.env << EOF

# MiniMax 中国
MINIMAX_CN_API_KEY=你的MiniMaxKey
MINIMAX_CN_BASE_URL=https://api.minimaxi.com/v1
EOF'

docker exec hermes-test bash -c '
sed -i "/^  default:/c\  default: \\"MiniMax-M2.7\\"" /opt/data/config.yaml
sed -i "/^  provider:/c\  provider: \\"minimax-cn\\"" /opt/data/config.yaml
'
docker restart hermes-test
```

---

## 七、常见问题

### 1. 端口被占用

```bash
# 查占用端口的进程
lsof -i :49080

# 换端口
docker run -d --name hermes -p 48080:8080 ...
```

### 2. 飞书 SDK (lark-oapi) 缺失

```bash
# 手动安装
docker exec hermes-test bash -c "cd /opt/hermes && .venv/bin/pip install lark-oapi"

# 更新 Dockerfile.app，下次构建自动包含
# 在 uv pip install 行末尾添加：&& uv pip install lark-oapi
```

### 3. 飞书连接失败

```bash
# 检查 lark_oapi 是否安装
docker exec hermes-test python3 -c "import lark_oapi; print('OK')"

# 检查 .env 配置
docker exec hermes-test grep FEISHU /opt/data/.env

# 查看详细错误
docker logs hermes-test 2>&1 | grep -i error
```

### 4. 模型不生效

```bash
# 确认 .env 中的 KEY 已写入
docker exec hermes-test grep GLM_API_KEY /opt/data/.env

# 确认 config.yaml 非注释行
docker exec hermes-test grep -E "^  (default|provider|base_url):" /opt/data/config.yaml

# 重启
docker restart hermes-test
```

### 5. 重建镜像后配置丢失

**重要：配置在数据卷中，不在镜像中！**

```bash
# 备份配置
docker exec hermes-test tar czf /tmp/hermes-config.tar.gz -C /opt/data .env config.yaml SOUL.md

# 导出到宿主机
docker cp hermes-test:/tmp/hermes-config.tar.gz ~/hermes-config.tar.gz

# 恢复（重建后）
docker cp ~/hermes-config.tar.gz 新容器ID:/opt/data/
docker exec 新容器ID bash -c "cd /opt/data && tar xzf /tmp/hermes-config.tar.gz"
```

### 6. 镜像太大，构建失败

磁盘空间不足，清理：

```bash
# 清理未使用的 Docker 对象
docker system prune -a --volumes

# 检查空间
df -h /

# 确认有 > 10GB 可用
```

---

## 附录：快速参考命令

```bash
# 构建
cd ~/hermes-docker
docker build -f Dockerfile.base -t hermes-base:latest .
docker build -f Dockerfile.app -t hermes-agent:latest .

# 启动
docker run -d --name hermes -p 49080:8080 \
  -v hermes-data:/opt/data \
  --restart unless-stopped \
  hermes-agent:latest gateway run

# 日志
docker logs -f hermes

# 进入容器
docker exec -it hermes bash

# 重启
docker restart hermes

# 停止
docker stop hermes

# 删除
docker rm -f hermes
```

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-04-16 | v1.0 | 初始文档，基础镜像分层 + 飞书配置 |
