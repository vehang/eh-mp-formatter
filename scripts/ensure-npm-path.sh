#!/bin/bash
# 确保 npm 全局路径正确
# 如果发现路径不对，自动修复

NPM_PREFIX="/home/node/.openclaw/npm-global"
EXPECTED_PREFIX="$NPM_PREFIX"
CURRENT_PREFIX=$(npm config get prefix 2>/dev/null)

if [ "$CURRENT_PREFIX" != "$EXPECTED_PREFIX" ]; then
    echo "⚠️ npm prefix 不正确，正在修复..."
    echo "当前: $CURRENT_PREFIX"
    echo "期望: $EXPECTED_PREFIX"
    
    npm config set prefix "$EXPECTED_PREFIX"
    echo "✅ 已修复 npm prefix"
else
    echo "✅ npm prefix 正确: $EXPECTED_PREFIX"
fi

# 确保 PATH 包含自定义目录
export PATH="$NPM_PREFIX/bin:$PATH"

# 检查 claude 是否可用
if command -v claude &>/dev/null; then
    echo "✅ claude 命令可用: $(claude --version 2>&1 | head -1)"
elif [ -x "$NPM_PREFIX/bin/claude" ]; then
    echo "✅ claude 已安装: $NPM_PREFIX/bin/claude"
    echo "   使用: $NPM_PREFIX/bin/claude"
else
    echo "⚠️ claude 未安装，正在安装..."
    npm install -g @anthropic-ai/claude-code
fi
