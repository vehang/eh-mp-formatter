/**
 * 图床配置弹窗组件
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  type ImageHostType,
  type ImageHostSettings,
  HOST_REQUIRES_TOKEN,
} from '../types/imageHost'
import { uploadImage } from '../utils/imageUploader'

// 1x1 透明像素 PNG（用于验证）
const TEST_PIXEL_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

interface ImageHostConfigModalProps {
  isOpen: boolean
  onClose: () => void
  settings: ImageHostSettings
  onUpdateConfig: (hostType: ImageHostType, config: { token?: string }) => void
  onSetDefault: (hostType: ImageHostType) => void
  onClearConfig: (hostType: ImageHostType) => void
}

type TabType = ImageHostType
type ValidationStatus = 'idle' | 'validating' | 'success' | 'error'

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
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle')
  const [validationError, setValidationError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // 同步表单状态
  useEffect(() => {
    if (isOpen) {
      const currentConfig = settings[activeTab]
      setToken(currentConfig.token || '')
      setValidationStatus('idle')
      setValidationError('')
    }
  }, [activeTab, isOpen, settings])

  // 验证配置
  const validateConfig = useCallback(async () => {
    // 检查是否需要 token 且已填写
    if (HOST_REQUIRES_TOKEN[activeTab] && !token.trim()) {
      setValidationError('请输入 API Token')
      setValidationStatus('error')
      return false
    }

    setValidationStatus('validating')
    setValidationError('')

    try {
      // 创建测试文件
      const response = await fetch(TEST_PIXEL_PNG_BASE64)
      const blob = await response.blob()
      const testFile = new File([blob], 'test.png', { type: 'image/png' })

      // 尝试上传
      const result = await uploadImage(
        testFile,
        activeTab,
        token.trim() || undefined
      )

      if (result.success) {
        setValidationStatus('success')
        return true
      } else {
        setValidationStatus('error')
        setValidationError(result.error || '验证失败')
        return false
      }
    } catch (error) {
      setValidationStatus('error')
      setValidationError(error instanceof Error ? error.message : '验证失败')
      return false
    }
  }, [activeTab, token])

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
  const handleSave = async () => {
    // 所有图床都需要先验证 API 是否可用
    const isValid = await validateConfig()
    if (isValid) {
      onUpdateConfig(activeTab, { token: token.trim() || undefined })
    }
  }

  // 判断是否可以保存
  const canSave = !HOST_REQUIRES_TOKEN[activeTab] || token.trim().length > 0

  // 清除配置
  const handleClear = () => {
    setToken('')
    onClearConfig(activeTab)
  }

  // 设为默认（需要先验证 API 是否可用）
  const handleSetDefault = async () => {
    // 如果是闪电图床且未验证过，先验证
    if (!HOST_REQUIRES_TOKEN[activeTab]) {
      const isValid = await validateConfig()
      if (!isValid) {
        return
      }
    } else if (validationStatus !== 'success') {
      // 其他图床如果未验证过，先验证
      const isValid = await validateConfig()
      if (!isValid) {
        return
      }
    }
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

          {/* Token 输入 - 闪电图床不需要 */}
          {HOST_REQUIRES_TOKEN[activeTab] && (
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
                onChange={(e) => {
                  setToken(e.target.value)
                  setValidationStatus('idle')
                  setValidationError('')
                }}
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
          )}

          {/* 闪电图床说明 */}
          {!HOST_REQUIRES_TOKEN[activeTab] && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="iconify icon-sm" data-icon="lucide:zap" style={{ color: 'var(--green-500)' }}></span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>闪电图床</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                闪电图床无需配置 Token，点击保存即可直接使用。
              </p>
            </div>
          )}

          {/* 验证状态提示 */}
          {validationStatus === 'validating' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--blue-500)',
                fontSize: '13px',
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:loader-2" style={{ animation: 'spin 1s linear infinite' }}></span>
              正在验证配置...
            </div>
          )}

          {validationStatus === 'success' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                borderRadius: '6px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: 'var(--green-500)',
                fontSize: '13px',
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:check-circle"></span>
              验证成功！
            </div>
          )}

          {validationStatus === 'error' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--red-500)',
                fontSize: '13px',
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:x-circle"></span>
              {validationError || '验证失败'}
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
              disabled={!canSave || validationStatus === 'validating'}
              style={{ flex: 1 }}
            >
              {validationStatus === 'validating' ? (
                <>
                  <span className="iconify icon-sm" data-icon="lucide:loader-2" style={{ animation: 'spin 1s linear infinite' }}></span>
                  验证中...
                </>
              ) : (
                <>
                  <span className="iconify icon-sm" data-icon="lucide:save"></span>
                  {HOST_REQUIRES_TOKEN[activeTab] ? '验证并保存' : '保存配置'}
                </>
              )}
            </button>
            {isConfigured && (
              <button
                onClick={handleSetDefault}
                className={`btn ${isDefault ? 'btn-primary' : 'btn-secondary'}`}
                disabled={isDefault}
                title={isDefault ? '当前已是默认图床' : '设为默认图床'}
              >
                <span className="iconify icon-sm" data-icon={isDefault ? 'lucide:star' : 'lucide:star'}></span>
                {isDefault ? '默认' : '设为默认'}
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
