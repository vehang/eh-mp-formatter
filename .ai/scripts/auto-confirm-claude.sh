#!/bin/bash

# 自动确认 Claude Code CLI 的脚本
# 每 3 秒检查一次确认框

LOG_FILE="/home/node/.openclaw/workspace/.ai/scripts/auto-confirm.log"
echo "自动确认脚本启动 - $(date)" >> "$LOG_FILE"

while true; do
  # 获取最后 5 行输出
  OUTPUT=$(tmux capture-pane -t claude-code -p 2>/dev/null | tail -5)
  
  # 检查是否有确认框
  if echo "$OUTPUT" | grep -q "Yes\|No\|Cancel"; then
    # 检查是否有 "Yes" 或 "Yes, and don't ask again" 选项
    if echo "$OUTPUT" | grep -q "Yes, and don't ask again"; then
      echo "检测到确认框，选择 'Yes, and don't ask again' - $(date)" >> "$LOG_FILE"
      tmux send-keys -t claude-code '2' C-m
      sleep 3
    elif echo "$OUTPUT" | grep -q "Yes"; then
      echo "检测到确认框，选择 'Yes' - $(date)" >> "$LOG_FILE"
      tmux send-keys -t claude-code '1' C-m
      sleep 3
    fi
  fi
  
  # 检查是否需要按 Enter（看到提示符 ❯）
  if echo "$OUTPUT" | grep -q "❯"; then
    echo "检测到提示符，按 Enter - $(date)" >> "$LOG_FILE"
    tmux send-keys -t claude-code C-m
    sleep 3
  fi
  
  sleep 3
done
