# MEMORY.md - 长期记忆

## 技术发现

### Feishu 消息发送
- **图片发送**：不能使用 `media` 参数发送本地文件路径，必须使用 `buffer` 参数发送 base64 编码的数据
- **必需参数**：`buffer`（base64 数据）、`mimeType`（如 image/png）、`message`（文本消息）
- **日期**：2026-03-02

## 重要配置

### Feishu
- 用户 ID：`ou_d1561ab7efa7c3915dbc48da95564b6a`
- 新闻推送群：`oc_ffc3e3276fcf68d1759933ec0e494ae8`
- 模板备份文档：`Fj7sddouPohl5KxNoRkcTmqknxB`

### Git 自动备份
- 仓库：https://github.com/vehang/openclaw_backup
- 分支：master
- 备份频率：每 4 小时（00:00, 04:00, 08:00, 12:00, 16:00, 20:00）
- 脚本：`/home/node/.openclaw/workspace/scripts/git-backup.sh`
- 日志：`/home/node/.openclaw/workspace/memory/git-backup.log`
- Cron ID：`3b73210c-7ecf-4523-a1b7-a780c5a925cd`

### 模型配置
- 只有 GLM-5（智谱）可用
- default/glm-5：通用任务
- coding/glm-5：开发任务

### 网络限制
- 可访问：GitHub、Baidu、Zhipu AI
- 不可访问：Hacker News、Bing 等国际站点

## 已安装的 Skills
- wechat-ai-publisher：微信公众号自动发布
- github-tools-publisher：程序员宝盒公众号
- multi-agent-dev：多 Agent 协作开发

## 待办事项
- [ ] 等待用户提供微信公众号 AppID/AppSecret
- [ ] 用户考虑是否安装 Claude Code
