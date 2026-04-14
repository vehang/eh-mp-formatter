#!/bin/bash
# 构建并启动 Hermes Agent
set -e

echo "=========================================="
echo "  Hermes Agent Docker 部署"
echo "=========================================="

# 检查 .env
if [ ! -f .env ]; then
    echo "📋 创建 .env 配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 填入 API Key 后再启动"
    echo "   vi .env"
    echo ""
fi

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker compose build

echo ""
echo "✅ 构建完成！"
echo ""
echo "下一步："
echo "  1. 编辑 .env 填入 API Key"
echo "  2. 启动服务: docker compose up -d"
echo "  3. 进入配置: docker compose exec hermes hermes setup"
echo "  4. 查看日志: docker compose logs -f hermes"
