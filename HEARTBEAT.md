# Heartbeat 任务

## 任务监控（按需）

检查 `.task-monitor.json` 是否存在，有则抓取 tmux 会话进度并发送汇报。

**监控状态文件**: `/home/node/.openclaw/workspace/.task-monitor.json`

启动监控:
```bash
~/workspace/scripts/task-monitor.sh start <tmux-session> [间隔分钟]
```

停止监控:
```bash
~/workspace/scripts/task-monitor.sh stop
```
