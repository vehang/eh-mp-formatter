#!/bin/bash
# 自动确认 Claude Code 的对话框
# 检测到确认选项时，自动选择 "2" (Yes, and don't ask again)

SESSION="claude-code"
LOG_FILE="/home/node/.openclaw/workspace/scripts/claude-auto-confirm.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

while true; do
  # 获取屏幕内容
  OUTPUT=$(tmux capture-pane -t $SESSION -p 2>/dev/null)
  
  # 检测是否有确认对话框
  if echo "$OUTPUT" | grep -q "Do you want to proceed\?"; then
    log "检测到确认对话框，自动选择选项 2"
    tmux send-keys -t $SESSION '2' Enter
    sleep 2
  elif echo "$OUTPUT" | grep -q "Do you want to overwrite\?"; then
    log "检测到覆盖确认，自动选择选项 2"
    tmux send-keys -t $SESSION '2' Enter
    sleep 2
  elif echo "$OUTPUT" | grep -q "Do you want to make this edit\?"; then
    log "检测到编辑确认，自动选择选项 2"
    tmux send-keys -t $SESSION '2' Enter
    sleep 2
  fi
  
  # 每3秒检查一次
  sleep 3
done
