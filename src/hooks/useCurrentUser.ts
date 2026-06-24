import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../lib/oauthConfig'
import { useToast } from '../components/Toast'
import type { CurrentUser } from './useOAuthLogin'

/**
 * 后端统一约定的「认证失败，请重新登录」错误码。
 * 宝盒撤销授权 / token 过期 / token 被禁用都会返回这个码，
 * nav 与 md 两端都按它判定登录态失效。
 */
const AUTH_EXPIRED_CODE = 9996

/** 非 9996 的业务错误：携带后端 errorMsg，用于在 UI 上提示 */
class ServerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServerError'
  }
}

/**
 * 读取当前登录用户
 *
 * 挂载时会拿本地存的 access_token 去后端 /api/md/user/me 校验一次：
 *   - token 仍有效 → 用服务端最新用户信息刷新本地缓存
 *   - token 已被撤销 / 失效（code === 9996）→ 清空本地登录态，回到未登录
 *   - 其它非 0 错误（服务异常等）→ 保留本地登录态，但弹出后端返回的错误描述
 *   - 网络错误 → 保留本地登录态，弹出弱网提示
 *
 * 监听 md-user-changed / storage 事件用于多 tab 与同页登录后同步。
 */
export function useCurrentUser() {
  const toast = useToast()
  const [user, setUser] = useState<CurrentUser | null>(() => readUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // 组件挂载后重新读一次（处理 SSR/HMR 边界情况）
    const initialUser = readUser()
    setUser(initialUser)

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    // 没有本地登录态 / 本地时间戳已过期：直接结束 loading，不必打后端
    if (!initialUser || !token || isTokenExpired()) {
      setLoading(false)
    } else {
      // 拿本地缓存先渲染，再异步向后端核对 token 有效性
      validateTokenOnServer()
        .then((result) => {
          if (cancelled) return
          if (result.valid) {
            // 用服务端最新信息刷新缓存（昵称 / 头像可能在宝盒端被改过）
            if (result.user) {
              localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(result.user))
              setUser(result.user)
            }
          } else {
            // token 已被撤销 / 失效：清空本地登录态
            clearLocalSession()
            setUser(null)
          }
        })
        .catch((err: unknown) => {
          if (cancelled) return
          // 非登录态失效的异常：保留本地状态，把错误描述提示给用户
          const msg =
            err instanceof Error && err.message
              ? err.message
              : '校验登录态失败，请稍后重试'
          toast.showToast(msg, 'error')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    const onChange = () => setUser(readUser())
    window.addEventListener('md-user-changed', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      cancelled = true
      window.removeEventListener('md-user-changed', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [toast])

  return {
    user,
    loading,
    isAuthenticated: user !== null && !isTokenExpired(),
  }
}

function readUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_INFO)
    if (!raw) return null
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
}

function isTokenExpired(): boolean {
  const expireStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRE)
  if (!expireStr) return true
  const expire = Number(expireStr)
  return !expire || Date.now() > expire
}

function clearLocalSession() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER_INFO)
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRE)
}

/**
 * 调用 /api/md/user/me 校验 token 当前是否仍被后端认可。
 * 后端在「宝盒端撤销授权」时会同步把对应的 access_token 置为 status=0，
 * 该接口随即返回 9996（认证失败），前端据此清登录态。
 *
 * 返回值约定：
 *   - { valid: true, user }      token 有效
 *   - { valid: false }           9996 / 401：登录态失效，调用方清登录态（不弹 toast）
 *   - throw ServerError(msg)     其它非 0 错误码：调用方保留登录态 + 弹出 msg
 *   - throw Error('...')         网络异常：调用方保留登录态 + 弹出提示
 */
async function validateTokenOnServer(): Promise<{ valid: boolean; user?: CurrentUser }> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (!token) return { valid: false }

  let resp: Response
  try {
    resp = await fetch('/api/md/user/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    // 网络层失败：弱网 / DNS / CORS 等
    throw new Error('网络异常，未能校验登录态')
  }

  if (resp.status === 401) {
    // 401 直接等价于 9996（部分网关会吞掉业务 code）
    return { valid: false }
  }

  let json: { code?: number; errorMsg?: string; data?: CurrentUser }
  try {
    json = await resp.json()
  } catch {
    throw new Error('服务返回格式异常')
  }

  if (json.code === 0) {
    return { valid: true, user: json.data }
  }
  if (json.code === AUTH_EXPIRED_CODE) {
    // token 被撤销 / 已过期 / 无效：确认为登录失效
    return { valid: false }
  }
  // 其它非 0 业务错误码：把后端返回的错误描述抛给 UI
  throw new ServerError(json.errorMsg || `登录态校验失败（${json.code}）`)
}
