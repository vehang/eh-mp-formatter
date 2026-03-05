#!/bin/bash
# 持续监控 Claude Code 并自动处理确认框
# 每5分钟汇报进度

SESSION="claude-code"
LOG="/home/node/.openclaw/workspace/scripts/monitor.log"
LAST_REPORT=$(date +%s)
REPORT_INTERVAL=300  # 5分钟

log() {
  echo "[$(date '+%H:%M:%S')] $1" >> "$LOG"
}

while true; do
  # 检查 session 是否存在
  if ! tmux has-session -t $SESSION 2>/dev/null; then
    log "⚠️ Session 不存在，重启..."
    tmux new-session -d -s $SESSION -x 200 -y 50
    sleep 2
    tmux send-keys -t $SESSION 'cd /home/node/.openclaw/workspace && /home/node/.openclaw/npm-global/bin/claude' Enter
    sleep 10
    continue
  fi
  
  # 获取屏幕内容
  OUTPUT=$(tmux capture-pane -t $SESSION -p 2>/dev/null)
  
  # 检测确认框并自动选择
  if echo "$OUTPUT" | grep -q "Do you want to make this edit\?"; then
    tmux send-keys -t $SESSION '2' Enter
    log "✅ 自动确认: 编辑 (选项2)"
    sleep 2
    continue
  fi
  
  if echo "$OUTPUT" | grep -q "Do you want to proceed\?"; then
    tmux send-keys -t $SESSION '2' Enter
    log "✅ 自动确认: 继续 (选项2)"
    sleep 2
    continue
  fi
  
  if echo "$OUTPUT" | grep -q "Do you want to overwrite\?"; then
    tmux send-keys -t $SESSION '2' Enter
    log "✅ 自动确认: 覆盖 (选项2)"
    sleep 2
    continue
  fi
  
  # 每5分钟汇报
  NOW=$(date +%s)
  if [ $((NOW - LAST_REPORT)) -ge $REPORT_INTERVAL ]; then
    # 提取任务状态
    TASKS=$(echo "$OUTPUT" | grep -E "✔|◼|◻|Error|Running" | head -10)
    log "📊 进度汇报:\n$TASKS"
    LAST_REPORT=$NOW
  fi
  
  sleep 5
done
