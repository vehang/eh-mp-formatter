#!/bin/bash
# 监控脚本 - 定期检查 claude-code 进度
# 每 10 分钟汇报一次

WORKSPACE="/home/node/.openclaw/workspace"
LOG_FILE="/home/node/.openclaw/workspace/memory/claude-code-monitor.log"
INTERVAL_MS=600000  # 10 分钟
LAST_REPORT_FILE="/home/node/.openclaw/workspace/memory/claude-code-last-report.txt"

# 创建必要的目录
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
mkdir -p "$(dirname "$LAST_REPORT_FILE")" 2>/dev/null || true

mkdir -p /home/node/.openclaw/workspace/memory 2>/dev/null

true

# 初始化日志文件
echo "[$(date '+%T')] 🤖 Claude Code 监控启动" >> "$LOG_FILE"
echo "[$(date '+%T')] 🤖 Claude Code 监控启动" >> "$LAST_REPORT_FILE"

# 监控函数
monitor() {
    local timestamp=$(date '+%T')
    local timestamp_str="[$timestamp]"
    
    # 捕获 claude-code 终端输出
    local output=$(tmux capture-pane -t claude-code -p -S - 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "$timestamp_str ❌ 无法获取 claude-code 输出" >> "$LOG_FILE"
        echo "$timestamp_str ❌ 无法获取 claude-code 输出" >> "$LAST_REPORT_FILE"
        return
    fi
    
    # 检查是否需要自动确认
    if echo "$output" | grep -qE "Proceed\|Yes\|y/n" > /dev/null; then
        tmux send-keys -t claude-code Enter
        echo "$timestamp_str ⏳ 检测到需要确认，自动发送 Enter" >> "$LOG_FILE"
        return
    fi
    
    # 检查是否卡住（等待输入)
    if echo "$output" | grep -qE "Waiting for input\|Waiting for confirmation\|y/n" > /dev/null; then
        # 检查是否需要按回车
        if echo "$output" | grep -q "No such process\|y/n" > /dev/null; then
            tmux send-keys -t claude-code Enter
            echo "$timestamp_str ⏳ 检测到等待输入，自动发送 Enter" >> "$LOG_FILE"
            return
        fi
    fi
    
    # 检查是否有新的提交
    local commit_hash=$(cd "$WORKSPACE" && git rev-parse --short HEAD 2>/dev/null)
    if [ -n "$commit_hash" ]; then
        local last_commit=$(cat "$LAST_REPORT_FILE" 2>/dev/null)
        if [ "$commit_hash" != "$last_commit" ]; then
            echo "$timestamp_str 📝 新提交: $commit_hash" >> "$LOG_FILE"
            echo "$timestamp_str 📝 新提交: $commit_hash" >> "$LAST_REPORT_FILE"
            # 保存当前提交哈希
            echo "$commit_hash" > "$LAST_REPORT_FILE"
        fi
    fi
    
    # 记录输出到日志文件（仅最后 50 行)
    echo "$output" | tail -50 >> "$LOG_FILE"
}

# 主监控循环
while true; do
    monitor
    sleep $INTERVAL_MS
done
