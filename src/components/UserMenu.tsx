import { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useOAuthLogin, redirectToAuthorize } from '../hooks/useOAuthLogin'

/**
 * 头部用户菜单：
 *   未登录 → 显示「登录」按钮（跳转 www 授权）
 *   已登录 → 头像 + 下拉菜单（昵称 / 退出）
 */
export function UserMenu({ isMobile }: { isMobile?: boolean }) {
  const { user, isAuthenticated } = useCurrentUser()
  const { logout, handleCallback } = useOAuthLogin()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 处理 OAuth 回调（URL 带 code&state 时自动触发一次）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('code') || params.get('error')) {
      setBusy(true)
      handleCallback().finally(() => setBusy(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 回调进行中
  if (busy) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        <Icon icon="lucide:loader-2" style={{ animation: 'spin 1s linear infinite', fontSize: 16 }} />
        登录中
      </div>
    )
  }

  // 未登录
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => redirectToAuthorize()}
        className="user-menu-login-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: isMobile ? '6px 12px' : '7px 14px',
          background: 'var(--orange-500)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: isMobile ? 12 : 13,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(249, 115, 22, 0.3)',
        }}
        title="使用 baoboxs 账号登录"
      >
        <Icon icon="lucide:log-in" style={{ fontSize: 15 }} />
        {!isMobile && '登录'}
      </button>
    )
  }

  // 已登录：头像 + 下拉
  const initial = (user?.nickname || user?.username || 'U').charAt(0).toUpperCase()
  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 8px 4px 4px',
          background: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 20,
          cursor: 'pointer',
        }}
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--orange-500)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {initial}
          </div>
        )}
        {!isMobile && (
          <span style={{ fontSize: 13, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.nickname || user?.username}
          </span>
        )}
        <Icon
          icon="lucide:chevron-down"
          style={{ fontSize: 14, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 180,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: 6,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 4,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.nickname || user?.username}
            </div>
            {user?.username && user.username !== user.nickname && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                @{user.username}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false)
              logout()
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon icon="lucide:log-out" style={{ fontSize: 15 }} />
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
