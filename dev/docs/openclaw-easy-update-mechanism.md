# OpenClaw Easy - 更新升级机制方案

> 基于版本：1.0.0.5 (versionCode: 1005, commit: 40e11d0)
> 重构时间：2026-04-13
> 状态：已实施

---

## 一、背景

原来的更新流程是**原地替换文件 + npm install + 重启**，存在以下问题：

| 问题 | 说明 |
|------|------|
| npm install 失败风险 | 更新过程中依赖安装可能失败，导致 18780 服务起不来 |
| 进程自重启竞态 | Node.js 进程自己重启自己，存在竞态条件 |
| 无回滚保护 | Web 更新路径没有回滚机制，更新失败无法恢复 |
| 路径不一致 | 三条更新路径（Web/自动/手动 shell）各自实现，逻辑不统一 |

---

## 二、方案设计

### 核心思路：备份 + 替换 + 自动回滚

```
下载更新包
    │
    ▼
备份当前文件 → /tmp/openclaw-easy-backup-{timestamp}/
    │
    ▼
解压更新包 → /tmp/openclaw-easy-update-{timestamp}/
    │
    ▼
替换 /app/openclaw-easy/ 中的文件（排除 node_modules/.git/tmp）
    │
    ▼
npm install --production
    │
    ▼
supervisorctl restart openclaw-easy
    │
    ▼
启动后 start-check.sh 检测：
  - 有标记文件 + 服务正常 → 清除标记，更新成功
  - 有标记文件 + 启动失败 → 自动回滚到备份版本
```

### 关键设计

1. **标记文件机制**：更新前写入 `/tmp/openclaw-easy-update-marker`，记录备份目录路径
2. **服务启动时自检**：`start-check.sh` 检测标记文件，有则尝试回滚
3. **回滚防死循环**：最多连续回滚 3 次，超过则停止并等待人工介入
4. **备份自动清理**：保留最近 5 个备份，超过自动删除最旧的

---

## 三、三条更新路径统一

所有更新路径最终都调用 `docker/update.sh update <url>`：

```
┌─────────────────────────────────────────────────────┐
│                   更新触发来源                        │
├─────────────┬───────────────┬───────────────────────┤
│  Web 一键更新 │  自动定时更新  │  手动 shell 执行      │
│  POST /update│  auto-update  │  update.sh update URL │
├─────────────┼───────────────┼───────────────────────┤
│ performUpdate│ performUpdate │  直接执行              │
│  (downloadUrl)│ (downloadUrl) │                      │
├─────────────┴───────────────┴───────────────────────┤
│              bash docker/update.sh update <URL>      │
│                      │                               │
│              ┌───────┴───────┐                       │
│              │  备份→下载→解压 │                       │
│              │  →替换→安装依赖│                       │
│              └───────┬───────┘                       │
│                      │                               │
│              supervisorctl restart                   │
│                      │                               │
│              start-check.sh 自检                     │
│              成功→清标记 / 失败→回滚                  │
└─────────────────────────────────────────────────────┘
```

### ① Web 一键更新

```
用户点击「一键更新」
  → POST /api/update
  → performUpdate(downloadUrl)
  → bash update.sh update <url>
  → supervisorctl restart openclaw-easy
```

- 如果未传 downloadUrl，自动先调用检查更新接口获取
- 后台执行，立即返回响应

### ② 自动定时更新

```
定时任务（可配置间隔）
  → performAutoUpdateCheck()
  → 检查远程是否有新版本
  → 有 → performUpdate(downloadUrl)
  → bash update.sh update <url>
  → supervisorctl restart openclaw-easy
```

- 启动后延迟 30 秒首次检查
- 默认检查间隔可配置

### ③ 手动 Shell 更新

```bash
bash /app/openclaw-easy/docker/update.sh update <下载地址>
```

- 直接执行，适用于 SSH 登录服务器手动操作

---

## 四、update.sh 脚本详解

### 脚本路径

`/app/openclaw-easy/docker/update.sh`

### 命令说明

| 命令 | 说明 |
|------|------|
| `update <URL>` | 下载并安装更新 |
| `rollback [备份目录]` | 回滚到指定备份（默认读取标记文件） |
| `status` | 查看当前更新状态 |
| `formats` | 显示支持的压缩格式和工具状态 |
| `clear-marker` | 清理更新标记文件 |

### update 流程（7 步）

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1/7 | 创建临时目录 | backup + update 目录 |
| 2/7 | 备份当前版本 | 复制 server.js、version.json、package.json、package-lock.json、public/ |
| 3/7 | 下载更新包 | 支持 wget/curl，自动检测 |
| 4/7 | 检测压缩格式 | 扩展名 + file 命令双重检测 |
| 5/7 | 解压更新包 | 自动识别单目录结构 |
| 6/7 | 替换文件 | 跳过 node_modules、.git、tmp |
| 7/7 | 安装依赖 | `npm install --production` |

### 支持的压缩格式

| 格式 | 扩展名 | 所需工具 |
|------|--------|----------|
| Gzip TAR | `.tar.gz` `.tgz` | gzip, tar |
| Bzip2 TAR | `.tar.bz2` | bzip2, tar |
| XZ TAR | `.tar.xz` | xz, tar |
| ZIP | `.zip` | unzip |
| Gzip 单文件 | `.gz` | gzip |
| 7-Zip | `.7z` | 7z |

格式检测：优先用 `file` 命令检测实际文件类型，再用扩展名匹配，双重保障。

### 备份与清理

- 备份位置：`/tmp/openclaw-easy-backup-{timestamp}/`
- 更新临时目录：`/tmp/openclaw-easy-update-{timestamp}/`（更新完成后自动删除）
- 标记文件：`/tmp/openclaw-easy-update-marker`（记录备份目录路径）
- 保留最近 5 个备份，超出的自动清理

---

## 五、start-check.sh 启动自检

### 脚本路径

`/app/openclaw-easy/docker/start-check.sh`

### 执行流程

```
supervisorctl start openclaw-easy
  → 启动 start-check.sh
      │
      ├─ 检查标记文件是否存在
      │   ├─ 不存在 → 正常启动
      │   └─ 存在 → 检查回滚次数
      │       ├─ ≥ 3 次 → 停止回滚，记录日志，等待人工介入
      │       └─ < 3 次 → 执行回滚 + 计数+1
      │
      ├─ 显示当前版本信息
      │
      └─ 启动 Node.js 服务
          │
          └─ 后台监控（10秒后检查）
              ├─ 进程存活 → 清除标记文件 + 回滚计数
              └─ 进程已死 → 保留标记，下次启动继续回滚
```

### 回滚防死循环

- 每次回滚计数写入 `/tmp/openclaw-easy-rollback-count`
- 连续回滚 ≥ 3 次 → 停止自动回滚，记录日志
- 需人工检查后手动清理：`bash update.sh clear-marker`

### 回滚操作

```
1. 从备份目录恢复文件（server.js, version.json, package.json 等）
2. 原文件重命名为 .broken 保留
3. 执行 npm install --production
4. 清除标记文件
```

---

## 六、server.js 相关改动

### PORT 环境变量覆盖

```javascript
const PORT = process.env.PORT || 18780;
```

支持通过环境变量指定端口，为后续测试启动预留能力。

### performUpdate() 函数

```javascript
async function performUpdate(downloadUrl) {
    const updateScript = path.join(__dirname, 'docker', 'update.sh');
    const output = execSync(`bash "${updateScript}" update "${downloadUrl}"`, {
        encoding: 'utf8',
        timeout: 300000  // 5分钟超时
    });
    await restartEasy();
}
```

- Web 和自动更新都调用此函数
- 统一走 shell 脚本执行
- 脚本失败时自动触发下次启动回滚

### restartEasy() 重启函数

按优先级尝试重启方式：

| 优先级 | 方式 | 命令 |
|--------|------|------|
| 1 | supervisorctl | `supervisorctl restart openclaw-easy` |
| 2 | pm2 | `pm2 restart openclaw-easy` |
| 3 | systemctl | `systemctl restart openclaw-easy` |
| 4 | service | `service openclaw-easy restart` |

---

## 七、安全机制总结

| 机制 | 说明 |
|------|------|
| 备份保护 | 每次更新前自动备份，保留最近 5 份 |
| 标记文件 | 记录更新状态，异常退出时触发回滚 |
| 启动自检 | 每次启动检查是否有未完成的更新 |
| 自动回滚 | 检测到更新失败自动恢复到备份版本 |
| 防死循环 | 最多连续回滚 3 次，超过需人工介入 |
| 文件校验 | 解压后检查 server.js/package.json 是否存在 |
| 格式兼容 | 支持 7 种压缩格式，扩展名+文件类型双重检测 |

---

## 八、修改文件清单

| 文件 | 改动 |
|------|------|
| `server.js` | PORT 环境变量覆盖；performUpdate() 统一更新入口；restartEasy() 重启函数 |
| `docker/update.sh` | 完全重写：7 步更新流程 + 多格式支持 + 备份/回滚机制 |
| `docker/start-check.sh` | 重写：启动自检 + 自动回滚 + 防死循环 + 后台监控 |

---

## 九、运维操作手册

### 手动更新

```bash
# 检查当前版本
cat /app/openclaw-easy/version.json

# 执行更新
bash /app/openclaw-easy/docker/update.sh update <下载地址>

# 查看更新状态
bash /app/openclaw-easy/docker/update.sh status

# 查看支持的格式
bash /app/openclaw-easy/docker/update.sh formats
```

### 手动回滚

```bash
# 回滚到最近的备份（自动读取标记文件）
bash /app/openclaw-easy/docker/update.sh rollback

# 回滚到指定备份
bash /app/openclaw-easy/docker/update.sh rollback /tmp/openclaw-easy-backup-1713000000
```

### 查看日志

```bash
# 更新日志
cat /var/log/supervisor/update.log

# 启动日志
cat /var/log/supervisor/startup.log

# Supervisor 日志
tail -f /var/log/supervisor/openclaw-easy-stdout*.log
```

### 清理标记文件

```bash
# 当自动回滚超过 3 次停止后，人工确认无问题后清理
bash /app/openclaw-easy/docker/update.sh clear-marker
```

---

_方案设计 & 实施：2026-04-13_
