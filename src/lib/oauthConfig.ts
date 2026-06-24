/**
 * OAuth SSO 配置
 *
 * md 是纯静态 SPA，后端由 baoboxs-service 统一承担（nginx 把 /api/* 代理过去）。
 * 这里只放「前端需要知道」的少量信息，绝不包含 client_secret。
 */

// 在 baoboxs-service 的 bb_oauth_client 表里登记的 client_id
export const OAUTH_CLIENT_ID = 'md_formatter'

// 当前环境判定（开发环境走 localhost，生产走 md.baoboxs.com）
const isDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// md 自己的回调地址：必须和 bb_oauth_client.redirect_uris 白名单里精确一致
export const OAUTH_REDIRECT_URI = isDev
  ? 'http://localhost:5173/auth/callback'
  : 'https://md.baoboxs.com/auth/callback'

// www 主站的 OAuth 授权页地址（Next.js 路由）
export const OAUTH_AUTHORIZE_URL = isDev
  ? 'http://localhost:3000/oauth/authorize'
  : 'https://www.baoboxs.com/oauth/authorize'

// www 主站首页（用于 md 页面「回到宝盒」跳转链接）
export const BAOBOXS_HOME_URL = isDev
  ? 'http://localhost:3000'
  : 'https://www.baoboxs.com'

// 申请的 scope
export const OAUTH_SCOPE = 'user_info'

// localStorage 存储键
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'md_access_token',
  USER_INFO: 'md_user_info',
  TOKEN_EXPIRE: 'md_token_expire',
  OAUTH_STATE: 'md_oauth_state', // sessionStorage 实际存放
} as const

// access_token 默认有效期（与后端 TOKEN_VALIDITY_MS 一致：2 小时）
export const DEFAULT_TOKEN_TTL_MS = 2 * 60 * 60 * 1000
