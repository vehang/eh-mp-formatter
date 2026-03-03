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
- 备份频率：每小时（有更新才备份）
- 脚本：`/home/node/.openclaw/workspace/scripts/git-backup.sh`
- 日志：`/home/node/.openclaw/workspace/memory/git-backup.log`
- Cron ID：`3b73210c-7ecf-4523-a1b7-a780c5a925cd`

**备份内容：**
1. 工作区配置（AGENTS.md, SOUL.md, USER.md, MEMORY.md 等）
2. Skills 配置（github-tools-publisher, multi-agent-dev, wechat-ai-publisher）
3. Cron 任务配置（cron-jobs.json）
4. OpenClaw 主配置模板（openclaw.json.template，敏感信息已脱敏）

**恢复指南：** `backup-configs/README.md`

### 模型配置
- 只有 GLM-5（智谱）可用
- default/glm-5：通用任务
- coding/glm-5：开发任务

### 网络限制
- 可访问：GitHub、Baidu、Zhipu AI
- 不可访问：Hacker News、Bing 等国际站点

## 已安装的 Skills

### ClawHub Skills
- multi-search-engine：17 个搜索引擎（8 国内 + 9 国际）
- x-reader：国内链接解析（微信/小红书/B站/X）
- find-skills：搜索发现更多 skill

### cafe3310 Skills（16个）
- remove-model-cliche：去 AI 腔
- content-research-writer：深度文章写作
- weekly-report-writer：周报撰写
- project-learner：项目学习
- im-local-kb：IM 知识库整理
- long-audio-transcript-processor：长语音转写
- git-snapshot-rollback：Git 安全回退
- doc-todo-log-loop：轻量开发循环
- project-management：项目管理范式
- pmp-dev-process：PMP 式迭代
- project-design-concept-organizer：设计理念整理
- tdd-dev-cycle：TDD 工作流
- browser-testing：浏览器测试
- code-naming-auditor：代码术语审计
- media-organizer：媒体库整理
- im-contact-sorter：IM 联系人整理

### 自定义 Skills
- wechat-ai-publisher：微信公众号自动发布
- github-tools-publisher：程序员宝盒公众号
- multi-agent-dev：多 Agent 协作开发

## 待办事项
- [ ] 测试 Feishu 图片发送（升级到 2026.3.2 后）
- [ ] 等待用户提供微信公众号 AppID/AppSecret
- [ ] 用户考虑是否安装 Claude Code

## 技术发现

### Docker 部署升级
- **升级方式**：以 root 用户执行 `npm install -g openclaw@latest @openclaw/feishu@latest`
- **PATH 问题**：`node` 和 `root` 用户 PATH 不同，升级后需更新符号链接
- **解决方案**：
  ```bash
  ln -sf /home/node/.npm-global/lib/node_modules/openclaw /usr/local/lib/node_modules/openclaw
  ln -sf /home/node/.npm-global/bin/openclaw /usr/local/bin/openclaw
  ```

### Agent 超时配置
- 配置文件：`/home/node/.openclaw/openclaw.json`
- 添加 `agents.defaults.timeoutSeconds: 120`
- 解决 "Request timed out before a response was generated" 错误

### x-reader 使用
- **命令**：`x-reader <URL>`
- **支持**：微信公众号、小红书、B站、X/Twitter
- **原理**：Jina AI 抓取 → Playwright 浏览器回退
- **存储**：`unified_inbox.json`（当前目录）
