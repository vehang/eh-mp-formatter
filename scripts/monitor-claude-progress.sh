#!/bin/bash
# Claude Code 进度监控脚本
# 每10分钟检查并汇报进度

SESSION="claude-code"
LOG_FILE="/home/node/.openclaw/workspace/scripts/claude-progress.log"
LAST_HASH_FILE="/home/node/.openclaw/workspace/scripts/claude-last-hash.txt"
INTERVAL=600  # 10分钟

send_progress() {
  local msg="$1"
  # 使用 message 工具发送到飞书
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

while true; do
  # 获取屏幕内容
  OUTPUT=$(tmux capture-pane -t $SESSION -p 2>/dev/null)
  
  # 计算内容hash用于检测变化
  CURRENT_HASH=$(echo "$OUTPUT" | md5sum | cut -d' ' -f1)
  
  # 检查session是否存在
  if ! tmux has-session -t $SESSION 2>/dev/null; then
    send_progress "⚠️ Claude Code session 不存在，正在重启..."
    tmux new-session -d -s $SESSION -x 200 -y 50
    sleep 3
    tmux send-keys -t $SESSION '/home/node/.openclaw/npm-global/bin/claude' Enter
    sleep 10
    continue
  fi
  
  # 提取任务进度
  TASKS=$(echo "$OUTPUT" | grep -E "✔|◼|◻|Running|Error" | head -15)
  
  # 检测是否有确认对话框
  if echo "$OUTPUT" | grep -qE "Do you want|proceed\?|overwrite\?"; then
    # 自动选择选项 1 或 2
    if echo "$OUTPUT" | grep -q "don't ask again"; then
      tmux send-keys -t $SESSION '2' Enter
      send_progress "✅ 自动选择: 2 (don't ask again)"
    else
      tmux send-keys -t $SESSION '1' Enter
      send_progress "✅ 自动选择: 1 (Yes)"
    fi
    sleep 3
    continue
  fi
  
  # 检测是否有输入提示
  if echo "$OUTPUT" | grep -q "❯"; then
    send_progress "⏳ Claude Code 等待输入..."
  fi
  
  # 如果内容有变化，记录进度
  if [ "$CURRENT_HASH" != "$(cat $LAST_HASH_FILE 2>/dev/null)" ]; then
    echo "$CURRENT_HASH" > "$LAST_HASH_FILE"
    send_progress "📊 进度更新:\n$TASKS"
  fi
  
  # 检测错误
  if echo "$OUTPUT" | grep -qE "error|Error|failed|Failed"; then
    ERRORS=$(echo "$OUTPUT" | grep -iE "error|failed" | head -5)
    send_progress "❌ 检测到错误:\n$ERRORS"
  fi
  
  # 检测完成状态
  if echo "$OUTPUT" | grep -qE "completed|success|finished|完成|成功"; then
    send_progress "🎉 任务可能已完成"
  fi
  
  sleep $INTERVAL
done
