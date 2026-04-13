# OpenClaw Easy - App API 认证体系方案 & 实施明细

> 创建时间：2026-04-14
> 版本：1.0.0.6 (versionCode: 1006)
> 状态：✅ 已实施（待部署）

---

## 一、背景

当前 App 端接口（`/api/config/simple` 等）无需任何认证即可直接调用，存在安全隐患。
需要增加一套轻量级认证机制，确保只有经过授权的设备才能调用 App API。

## 二、认证流程

```
App 启动
  │
  ▼
本地是否有缓存的 accessToken 且未过期？
  │                    │
 有                   无/过期
  │                    │
  │              POST /api/app/auth
  │              { token, barCode }
  │                    │
  │                    ▼
  │         调用远程验证接口
  │         https://api.yun.tilldream.com/api/im/openClaw/verifyByAdmin
  │         { token, barCode }
  │                    │
  │            ┌───────┴───────┐
  │         成功│            失败│
  │            ▼               ▼
  │     生成 accessToken    返回错误
  │     有效期 7 天         提示重新登录
  │     绑定 barCode
  │     持久化到文件
  │            │
  │            ▼
  │     App 本地缓存 accessToken
  │            │
  ▼            ▼
后续 App API 请求（携带 accessToken）
  │
  ▼
appAuthMiddleware 校验
  │
  ├─ appAuthRequired=false → 直接放行（兼容旧版）
  │
  └─ appAuthRequired=true
       │
       ├─ accessToken 有效 → 放行，注入 req.appDevice
       │
       └─ accessToken 无效/过期 → 返回 code:4001
```

## 三、新增接口

### POST /api/app/auth

用 token + barCode 换取 accessToken，不受 appAuthMiddleware 保护。

**请求参数：**

| 参数 | 类型 | 必传 | 说明 |
|------|------|------|------|
| token | string | ✅ | 用户授权 token（App 登录凭证） |
| barCode | string | ✅ | 设备标识 |

**验证逻辑：**
1. 调用远程接口 `https://api.yun.tilldream.com/api/im/openClaw/verifyByAdmin`
2. 传参 `{ token, barCode }`（复用现有 Web 端 token+barCode 验证接口）
3. 验证成功后检查该 barCode 是否已有未过期的 accessToken
   - 有 → 直接返回已有的（避免重复生成）
   - 没有 → 生成新的 `ac_` + `crypto.randomBytes(32).toString('hex')`
4. 旧 token 自动失效（一个 barCode 只保留一个 accessToken）
5. 存储 + 返回

**成功响应：**

```json
{
  "code": 0,
  "msg": "认证成功",
  "currentTime": 1713000000,
  "data": {
    "accessToken": "ac_a1b2c3d4e5f6g7h8i9j0...",
    "expiresIn": 604800,
    "barCode": "DEVICE001"
  }
}
```

**失败响应：**

```json
{
  "code": 1003,
  "msg": "验证失败：token 无效",
  "currentTime": 1713000000
}
```

## 四、appAuthMiddleware 中间件

### Token 提取策略（按优先级）

| 优先级 | 来源 | 示例 |
|--------|------|------|
| 1 | Header `Authorization` | `Bearer ac_xxx` |
| 2 | Header `X-Access-Token` | `ac_xxx` |
| 3 | Query 参数 | `?accessToken=ac_xxx` |
| 4 | Body 字段 | `{ "accessToken": "ac_xxx" }` |
| 5 | Cookie | `access_token=ac_xxx` |

### 校验逻辑

```
1. 读取 version.json 中的 appAuthRequired
2. appAuthRequired=false → next() 直接放行
3. appAuthRequired=true → 从 5 种来源提取 accessToken
4. 找不到 token → 返回 code:4001
5. token 不存在或已过期 → 返回 code:4001
6. token 有效 → 注入 req.appDevice = { barCode, createdAt, expiresAt }, next()
```

### 错误响应

```json
{
  "code": 4001,
  "msg": "accessToken 无效或已过期，请重新认证",
  "currentTime": 1713000000
}
```

## 五、接口保护分类

### 受保护（需 accessToken，当 appAuthRequired=true）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/config/simple` | 写入配置 |
| GET | `/api/config/simple` | 读取配置 |
| POST | `/api/fix` | 触发修复 |
| POST | `/api/weixin/qr/start` | 启动微信扫码 |
| GET | `/api/weixin/qr/status` | 查询扫码状态 |

### 不受保护（App 可直接访问）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/app/auth` | 认证入口（新增） |
| GET | `/api/status` | 系统状态 |
| GET | `/api/version` | 版本信息 |
| GET | `/api/update/check` | 检查更新 |
| POST | `/api/update` | 一键更新 |

### Web 端接口（保持原 session 认证不变，共 11 个）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/setup/password` | 首次设置密码 |
| POST | `/api/login` | 登录 |
| POST | `/api/logout` | 退出 |
| POST | `/api/verify-token` | token 验证登录 |
| POST | `/api/password/change` | 修改密码 |
| GET | `/api/config` | 获取完整配置 |
| GET | `/api/config/raw` | 获取原始配置 |
| GET | `/api/config/status` | 配置状态 |
| POST | `/api/config/validate` | 校验配置 |
| POST | `/api/config` | 保存完整配置 |
| POST | `/api/gateway/restart` | 重启 Gateway |
| POST | `/api/test/ai` | 测试 AI 连接 |
| GET | `/api/weixin/login` | 微信登录（SSE） |
| GET | `/api/weixin/bound` | 查看已绑定微信 |
| POST | `/api/weixin/bound` | 解绑微信 |

## 六、Token 存储

### 文件：~/.openclaw/.app-tokens.json

```json
[
  {
    "accessToken": "ac_a1b2c3d4e5f6g7h8i9j0...",
    "barCode": "DEVICE001",
    "createdAt": 1713000000,
    "expiresAt": 1713604800
  }
]
```

### 规则

- 一个 barCode 只对应一个 accessToken
- 重新认证时旧 token 自动替换
- 服务启动时从文件加载到内存 Map
- 每次写入同步到文件
- 过期 token 在加载时自动清理

### 内存结构

```javascript
// Map<accessToken, { barCode, createdAt, expiresAt }>
const appAccessTokens = new Map();
```

## 七、version.json 变更

### 变更前

```json
{
  "versionName": "1.0.0.0",
  "versionCode": 1000,
  "releaseDate": "2026-04-10",
  "changelog": [...]
}
```

### 变更后

```json
{
  "versionName": "1.0.0.6",
  "versionCode": 1006,
  "releaseDate": "2026-04-14",
  "appAuthRequired": true,
  "changelog": [
    "初始版本",
    "支持简化配置接口",
    "支持微信扫码登录",
    "支持 Gateway 服务管理",
    "支持多种压缩格式解压",
    "/api/fix 异步执行",
    "barCode 设备标识参数",
    "新增 App API 认证体系",
    "新增 POST /api/app/auth 认证接口",
    "新增 appAuthMiddleware 中间件",
    "支持 5 种 accessToken 传递方式（Header/Query/Body/Cookie）",
    "version.json 增加 appAuthRequired 开关"
  ]
}
```

### 开关说明

| 值 | 效果 |
|----|------|
| `true` | App 接口需要 accessToken 认证 |
| `false` | App 接口直接访问，兼容旧版 App |

## 八、server.js 实施明细

### 新增常量（第 39-41 行附近）

```javascript
const VERSION_FILE = path.join(__dirname, 'version.json');  // 从原位置提前
const APP_TOKENS_FILE = path.join(OPENCLAW_DIR, '.app-tokens.json');
const ACCESS_TOKEN_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 7 天
const ACCESS_TOKEN_PREFIX = 'ac_';
```

### 新增函数（第 53-200 行附近）

| 函数 | 说明 |
|------|------|
| `loadAppTokens()` | 启动时从文件加载 token 到内存，自动清理过期的 |
| `saveAppTokens()` | 持久化内存中的 token 到文件 |
| `generateAccessToken(barCode)` | 生成新 token，同 barCode 旧 token 自动失效 |
| `isValidAccessToken(token)` | 校验 token 是否存在且未过期 |
| `getAppTokenInfo(token)` | 获取 token 绑定的设备信息 |
| `isAppAuthRequired()` | 读取 version.json 的 appAuthRequired 开关 |

### 新增中间件（第 152 行附近）

```javascript
function appAuthMiddleware(req, res, next)
```

- 5 种来源提取 accessToken（Header/Query/Body/Cookie）
- 开关关闭时直接放行
- 有效时注入 `req.appDevice`

### 新增路由（第 1221 行附近）

```
POST /api/app/auth — token + barCode → accessToken
```

- 调用远程 `verifyByAdmin` 验证身份
- 验证成功生成/返回 accessToken
- 不受 appAuthMiddleware 保护

### 修改的 5 个路由（挂载 appAuthMiddleware）

| 原代码 | 修改后 |
|--------|--------|
| `app.post('/api/config/simple', async ...)` | `app.post('/api/config/simple', appAuthMiddleware, async ...)` |
| `app.get('/api/config/simple', ...)` | `app.get('/api/config/simple', appAuthMiddleware, ...)` |
| `app.post('/api/fix', async ...)` | `app.post('/api/fix', appAuthMiddleware, async ...)` |
| `app.post('/api/weixin/qr/start', async ...)` | `app.post('/api/weixin/qr/start', appAuthMiddleware, async ...)` |
| `app.get('/api/weixin/qr/status', ...)` | `app.get('/api/weixin/qr/status', appAuthMiddleware, ...)` |

### 启动时加载（第 202 行）

```javascript
loadAppTokens();  // 服务启动时自动加载已持久化的 token
```

## 九、兼容性

- `appAuthRequired = false` 时所有 App 接口行为不变，**完全兼容旧版 App**
- App 端升级后检测到 `appAuthRequired = true` 再走认证流程
- Web 端所有接口不受影响
- `/api/status`、`/api/version` 等基础接口始终可访问

## 十、部署步骤

```bash
# 1. 将修改后的文件上传到服务器
scp -P 22345 server.js version.json root@192.168.1.123:/app/openclaw-easy/

# 2. 重启服务
ssh -p 22345 root@192.168.1.123 "supervisorctl restart openclaw-easy"

# 3. 验证
curl http://192.168.1.123:18780/api/version
# 应返回 versionCode: 1006, appAuthRequired: true
```

### 关闭认证（如需回退）

修改服务器上 `/app/openclaw-easy/version.json`：
```json
"appAuthRequired": false
```
然后重启服务即可，无需改代码。

## 十一、文件清单

| 文件 | 改动类型 | 工作区路径 |
|------|----------|-----------|
| `server.js` | 修改 | `projects/openclaw-easy/server.js` |
| `version.json` | 修改 | `projects/openclaw-easy/version.json` |
| `openclaw-easy-app-auth.md` | 新增 | `docs/openclaw-easy-app-auth.md`（本文档） |

---

_方案设计 & 实施：2026-04-14_
