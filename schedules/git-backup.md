# Git Backup Schedule Configuration

## 自动备份配置

```yaml
name: git-backup
description: 自动备份工作区到 GitHub 私有仓库
schedule: "0 */4 * * *"  # 每4小时执行一次
command: /home/node/.openclaw/workspace/scripts/git-backup.sh
enabled: true
```

## 执行时间

- 00:00 (午夜)
- 04:00
- 08:00
- 12:00 (中午)
- 16:00
- 20:00

## 日志位置

`memory/git-backup.log`

## 仓库信息

- 仓库: https://github.com/vehang/openclaw_backup
- 分支: master
- 认证: GitHub PAT (存储在 remote URL 中)
