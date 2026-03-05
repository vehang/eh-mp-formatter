#!/bin/bash
SESSION="claude-code"
LOG_FILE="/home/node/.openclaw/workspace/scripts/claude-code-progress.log"

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  OUTPUT=$(tmux capture-pane -t $SESSION -p 2>/dev/null | tail -50)
  
  # 检查任务进度
  TASKS=$(echo "$OUTPUT" | grep -E "✔|◼|◻" | head -10)
  
  echo "[$TIMESTAMP] === 进度检查 ===" >> $LOG_FILE
  echo "$TASKS" >> $LOG_FILE
  echo "" >> $LOG_FILE
  
  sleep 600  # 每10分钟
done
