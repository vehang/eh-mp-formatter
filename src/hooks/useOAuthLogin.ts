import { useCallback } from 'react'
import { useToast } from '../components/Toast'
import {
  OAUTH_AUTHORIZE_URL,
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  OAUTH_SCOPE,
  STORAGE_KEYS,
  DEFAULT_TOKEN_TTL_MS,
} from '../lib/oauthConfig'

/** md 端存储的用户信息（与后端 OAuthUserInfo 对应，camelCase） */
export interface CurrentUser {
  userId: number
  username: string
  nickname: string
  avatarUrl: string
}

/** token 交换响应（与后端 OAuthTokenResponse 对应） */
interface TokenExchangeResponse {
  code: number
  errorMsg: string
  currentTime: number
  data: {
    accessToken: string
    tokenType: string
    expiresIn: number
    scope: string
    userInfo: CurrentUser
  } | null
}

/**
 * 生成随机 state（防 CSRF）
 */
function generateState(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 跳转到 www 的授权页
 * state 写入 sessionStorage，callback 时校验
 */
export function redirectToAuthorize() {
  const state = generateState()
  sessionStorage.setItem(STORAGE_KEYS.OAUTH_STATE, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    scope: OAUTH_SCOPE,
    state,
  })

  window.location.href = `${OAUTH_AUTHORIZE_URL}?${params.toString()}`
}

/**
 * md 登录 / 回调处理 Hook
 */
export function useOAuthLogin() {
  const toast = useToast()

  /**
   * 处理回调：从 URL 取 code+state，调后端 /api/md/auth/exchange
   * 返回 true 表示成功消费了回调（调用方应清理 URL）
   */
  const handleCallback = useCallback(async (): Promise<boolean> => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    // URL 里没有 code 也没有 error，说明不是回调场景
    if (!code && !error) return false

    // 授权被拒绝
    if (error) {
      const desc = params.get('error_description') || '授权失败'
      toast.showToast(desc, 'error')
      cleanUrl()
      return true
    }

    // 校验 state（防 CSRF）
    const savedState = sessionStorage.getItem(STORAGE_KEYS.OAUTH_STATE)
    if (!state || state !== savedState) {
      toast.showToast('登录失败：state 校验不通过', 'error')
      cleanUrl()
      return true
    }
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_STATE)

    try {
      const resp = await fetch('/api/md/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      })
      const json: TokenExchangeResponse = await resp.json()

      if (!resp.ok || json.code !== 0 || !json.data) {
        toast.showToast(json.errorMsg || '登录失败', 'error')
        cleanUrl()
        return true
      }

      // 持久化
      const { accessToken, expiresIn, userInfo } = json.data
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))
      const ttl = (expiresIn || DEFAULT_TOKEN_TTL_MS / 1000) * 1000
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRE, String(Date.now() + ttl))

      toast.showToast(`欢迎回来，${userInfo.nickname || userInfo.username}`, 'success')
      cleanUrl()

      // 触发全局事件，让 useCurrentUser 重新读
      window.dispatchEvent(new Event('md-user-changed'))
      return true
    } catch (err) {
      console.error('[OAuth] exchange failed:', err)
      toast.showToast('网络错误，登录失败', 'error')
      cleanUrl()
      return true
    }
  }, [toast])

  /**
   * 退出登录：调后端 revoke + 清本地存储
   */
  const logout = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    try {
      if (token) {
        await fetch('/api/md/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (err) {
      console.warn('[OAuth] logout api failed:', err)
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRE)
      toast.showToast('已退出登录', 'success')
      window.dispatchEvent(new Event('md-user-changed'))
    }
  }, [toast])

  return { handleCallback, logout, redirectToAuthorize }
}

/** 清理 URL：去掉 query 参数，同时把路径重置为根路径（md 是无路由 SPA） */
function cleanUrl() {
  window.history.replaceState({}, document.title, window.location.origin + '/')
}
