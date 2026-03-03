#!/bin/bash
# OpenClaw Workspace Auto Backup Script
# 自动备份工作区到 GitHub

WORKSPACE="/home/node/.openclaw/workspace"
LOG_FILE="/home/node/.openclaw/workspace/memory/git-backup.log"

cd "$WORKSPACE" || exit 1

# 记录时间
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..." >> "$LOG_FILE"

# 同步外部配置到备份目录
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Syncing external configs..." >> "$LOG_FILE"

# 同步 Skills
rsync -a --delete /home/node/.openclaw/skills/github-tools-publisher/ "$WORKSPACE/backup-configs/github-tools-publisher/" 2>> "$LOG_FILE"
rsync -a --delete /home/node/.openclaw/skills/multi-agent-dev/ "$WORKSPACE/backup-configs/multi-agent-dev/" 2>> "$LOG_FILE"
rsync -a --delete /home/node/.openclaw/skills/wechat-ai-publisher/ "$WORKSPACE/backup-configs/wechat-ai-publisher/" 2>> "$LOG_FILE"

# 同步 Cron 配置
cp /home/node/.openclaw/cron/jobs.json "$WORKSPACE/backup-configs/cron-jobs.json" 2>> "$LOG_FILE"

# 检查是否有变更
if git diff --quiet && git diff --staged --quiet; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No changes to commit" >> "$LOG_FILE"
    exit 0
fi

# 添加所有变更
git add -A

# 生成提交信息
CHANGES=$(git status --short | wc -l)
COMMIT_MSG="Auto backup: $CHANGES files changed ($(date '+%Y-%m-%d %H:%M'))"

# 提交
git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1

# 推送
git push origin master >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Backup completed: $CHANGES files" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Backup failed" >> "$LOG_FILE"
fi
