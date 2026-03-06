/**
 * 图床配置弹窗组件
 */

import { useState, useEffect, useRef } from 'react'
import {
  type ImageHostType,
  type ImageHostSettings,
} from '../types/imageHost'

interface ImageHostConfigModalProps {
  isOpen: boolean
  onClose: () => void
  settings: ImageHostSettings
  onUpdateConfig: (hostType: ImageHostType, config: { token: string; storage?: string }) => void
  onSetDefault: (hostType: ImageHostType) => void
  onClearConfig: (hostType: ImageHostType) => void
}

type TabType = ImageHostType

export function ImageHostConfigModal({
  isOpen,
  onClose,
  settings,
  onUpdateConfig,
  onSetDefault,
  onClearConfig,
}: ImageHostConfigModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('hello')
  const [token, setToken] = useState('')
  const [storage, setStorage] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // 同步表单状态
  useEffect(() => {
    if (isOpen) {
      const currentConfig = settings[activeTab]
      setToken(currentConfig.token)
      setStorage('storage' in currentConfig ? (currentConfig.storage || '') : '')
    }
  }, [activeTab, isOpen, settings])

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 打开时聚焦到弹窗
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // 保存配置
  const handleSave = () => {
    if (token.trim()) {
      onUpdateConfig(activeTab, { token: token.trim(), storage: storage.trim() || undefined })
    }
  }

  // 清除配置
  const handleClear = () => {
    setToken('')
    setStorage('')
    onClearConfig(activeTab)
  }

  // 设为默认
  const handleSetDefault = () => {
    onSetDefault(activeTab)
  }

  if (!isOpen) return null

  const currentConfig = settings[activeTab]
  const isConfigured = currentConfig.isConfigured
  const isDefault = settings.defaultHost === activeTab

  return (
    <div
      className="theme-picker-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-host-title"
    >
      <div
        ref={modalRef}
        className="theme-picker-modal"
        tabIndex={-1}
        style={{ maxWidth: '500px' }}
      >
        {/* 头部 */}
        <div className="theme-picker-header">
          <h2 id="image-host-title" className="theme-picker-title">
            <span className="iconify" data-icon="lucide:image-up" style={{ marginRight: '8px' }}></span>
            图床配置
          </h2>
          <button
            className="theme-picker-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <span className="iconify" data-icon="lucide:x"></span>
          </button>
        </div>

        {/* Tab 切换 */}
        <div style={{ padding: '16px 20px 0' }}>
          <div className="toggle-group" style={{ width: '100%', justifyContent: 'center' }}>
            {(['hello', 'dk', 'bolt'] as TabType[]).map((host) => (
              <button
                key={host}
                onClick={() => setActiveTab(host)}
                className={`toggle-btn ${activeTab === host ? 'active' : ''}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                }}
              >
                {host === 'hello' && (
                  <>
                    <span className="iconify icon-sm" data-icon="lucide:image"></span>
                    Hello图床
                  </>
                )}
                {host === 'dk' && (
                  <>
                    <span className="iconify icon-sm" data-icon="lucide:hard-drive"></span>
                    DK图床
                  </>
                )}
                {host === 'bolt' && (
                  <>
                    <span className="iconify icon-sm" data-icon="lucide:zap"></span>
                    闪电图床
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 配置表单 */}
        <div style={{ padding: '20px' }}>
          {/* 状态提示 */}
          {isConfigured && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                borderRadius: '6px',
                background: isDefault
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
                color: isDefault
                  ? 'var(--green-500)'
                  : 'var(--blue-500)',
                fontSize: '13px',
              }}
            >
              <span className="iconify icon-sm" data-icon={isDefault ? 'lucide:check-circle' : 'lucide:info'}></span>
              {isDefault ? '当前默认图床' : '已配置'}
            </div>
          )}

          {/* Token 输入 */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              API Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="请输入图床 API Token"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--orange-500)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-default)'
              }}
            />
          </div>

          {/* Storage 选择（仅 Hello 图床） */}
          {activeTab === 'hello' && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                }}
              >
                存储位置（可选）
              </label>
              <select
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="select"
                style={{ width: '100%' }}
              >
                <option value="">默认存储</option>
                <option value="s3">S3</option>
                <option value="oss">阿里云 OSS</option>
                <option value="cos">腾讯云 COS</option>
                <option value="r2">Cloudflare R2</option>
              </select>
            </div>
          )}

          {/* 操作按钮 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
            }}
          >
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={!token.trim()}
              style={{ flex: 1 }}
            >
              <span className="iconify icon-sm" data-icon="lucide:save"></span>
              保存配置
            </button>
            {isConfigured && !isDefault && (
              <button
                onClick={handleSetDefault}
                className="btn btn-secondary"
              >
                <span className="iconify icon-sm" data-icon="lucide:star"></span>
                设为默认
              </button>
            )}
            {isConfigured && (
              <button
                onClick={handleClear}
                className="btn btn-danger"
              >
                <span className="iconify icon-sm" data-icon="lucide:trash-2"></span>
              </button>
            )}
          </div>
        </div>

        {/* 安全提醒 */}
        <div className="theme-picker-footer">
          <span
            className="iconify"
            data-icon="lucide:alert-triangle"
            style={{ marginRight: '6px', color: 'var(--amber-500)' }}
          ></span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            安全提醒：图片将上传到第三方平台，请注意隐私保护，不要上传敏感信息。
          </span>
        </div>
      </div>
    </div>
  )
}
