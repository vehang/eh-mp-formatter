/**
 * 图床配置弹窗组件
 * 左侧 Tabbar 布局，支持多个 OSS 平台
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  type ImageHostType,
  type ImageHostSettings,
  IMAGE_HOSTS,
  ALIYUN_REGIONS,
  TENCENT_REGIONS,
  AWS_REGIONS,
  HUAWEI_REGIONS,
  JD_REGIONS,
  NETEASE_REGIONS,
} from '../types/imageHost'
import { uploadImage } from '../utils/imageUploader'

// 1x1 透明像素 PNG（用于验证）
const TEST_PIXEL_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

interface ImageHostConfigModalProps {
  isOpen: boolean
  onClose: () => void
  settings: ImageHostSettings
  onUpdateConfig: (hostType: ImageHostType, config: any) => void
  onSetDefault: (hostType: ImageHostType) => void
  onClearConfig: (hostType: ImageHostType) => void
}

type ValidationStatus = 'idle' | 'validating' | 'success' | 'error'

// 配置字段组件
interface ConfigFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password'
  placeholder?: string
  required?: boolean
  helpText?: string
}

function ConfigField({ label, value, onChange, type = 'text', placeholder, required, helpText }: ConfigFieldProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--red-500)' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--orange-500)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-default)'
        }}
      />
      {helpText && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
          {helpText}
        </p>
      )}
    </div>
  )
}

// 选择框组件
interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}

function SelectField({ label, value, onChange, options, required }: SelectFieldProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-secondary)',
          marginBottom: '6px',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--red-500)' }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          background: 'var(--bg-base)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
          outline: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <option value="">请选择</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ImageHostConfigModal({
  isOpen,
  onClose,
  settings,
  onUpdateConfig,
  onSetDefault,
  onClearConfig,
}: ImageHostConfigModalProps) {
  const [activeTab, setActiveTab] = useState<ImageHostType>('hello')
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle')
  const [validationError, setValidationError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // OSS 配置状态
  const [ossConfig, setOssConfig] = useState<Record<string, any>>({})

  // 传统图床 token
  const [token, setToken] = useState('')

  // 获取图床列表（按分类）
  const hostList = useMemo(() => {
    const traditional = Object.entries(IMAGE_HOSTS).filter(([_, info]) => info.category === 'traditional')
    const ossDomestic = Object.entries(IMAGE_HOSTS).filter(([_, info]) => info.category === 'oss-domestic')
    const ossInternational = Object.entries(IMAGE_HOSTS).filter(([_, info]) => info.category === 'oss-international')
    return { traditional, ossDomestic, ossInternational }
  }, [])

  // 同步表单状态
  useEffect(() => {
    if (isOpen) {
      const currentConfig = settings[activeTab as keyof ImageHostSettings]
      if (currentConfig && typeof currentConfig === 'object' && 'token' in currentConfig) {
        setToken((currentConfig as any).token || '')
      }
      if (currentConfig && typeof currentConfig === 'object' && 'config' in currentConfig) {
        setOssConfig((currentConfig as any).config || {})
      }
      setValidationStatus('idle')
      setValidationError('')
    }
  }, [activeTab, isOpen, settings])

  // 获取当前配置
  const getCurrentConfig = useCallback(() => {
    const hostInfo = IMAGE_HOSTS[activeTab]
    if (hostInfo.category === 'traditional') {
      return { token: token.trim() || undefined }
    }
    return ossConfig
  }, [activeTab, token, ossConfig])

  // 验证配置
  const validateConfig = useCallback(async () => {
    const hostInfo = IMAGE_HOSTS[activeTab]
    const config = getCurrentConfig()

    // 检查必填字段
    if (hostInfo.category === 'traditional') {
      if (hostInfo.requiresToken && !token.trim()) {
        setValidationError('请输入 API Token')
        setValidationStatus('error')
        return false
      }
    } else {
      for (const field of hostInfo.requiredFields) {
        if (!config[field]?.trim()) {
          setValidationError(`请填写 ${field}`)
          setValidationStatus('error')
          return false
        }
      }
    }

    setValidationStatus('validating')
    setValidationError('')

    try {
      const response = await fetch(TEST_PIXEL_PNG_BASE64)
      const blob = await response.blob()
      const testFile = new File([blob], 'test.png', { type: 'image/png' })

      const result = await uploadImage(testFile, activeTab, config)

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
  }, [activeTab, token, ossConfig, getCurrentConfig])

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
    const isValid = await validateConfig()
    if (isValid) {
      onUpdateConfig(activeTab, getCurrentConfig())
    }
  }

  // 清除配置
  const handleClear = () => {
    setToken('')
    setOssConfig({})
    onClearConfig(activeTab)
  }

  // 设为默认
  const handleSetDefault = async () => {
    const currentConfig = settings[activeTab as keyof ImageHostSettings]
    if (!currentConfig || typeof currentConfig !== 'object' || !('isConfigured' in currentConfig) || !currentConfig.isConfigured) {
      const isValid = await validateConfig()
      if (!isValid) return
    }
    onSetDefault(activeTab)
  }

  if (!isOpen) return null

  const currentSettings = settings[activeTab as keyof ImageHostSettings]
  const isConfigured = currentSettings && typeof currentSettings === 'object' && 'isConfigured' in currentSettings && currentSettings.isConfigured
  const isDefault = settings.defaultHost === activeTab
  const hostInfo = IMAGE_HOSTS[activeTab]

  // 渲染配置表单
  const renderConfigForm = () => {
    if (hostInfo.category === 'traditional') {
      if (!hostInfo.requiresToken) {
        return (
          <div
            style={{
              padding: '16px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="iconify icon-sm" data-icon="lucide:zap" style={{ color: 'var(--green-500)' }}></span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{hostInfo.name}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {hostInfo.description}，无需配置 Token，点击保存即可直接使用。
            </p>
          </div>
        )
      }

      return (
        <ConfigField
          label="API Token"
          value={token}
          onChange={setToken}
          type="password"
          placeholder="请输入图床 API Token"
          required
        />
      )
    }

    // OSS 配置表单
    const updateOssConfig = (key: string, value: string) => {
      setOssConfig((prev: any) => ({ ...prev, [key]: value }))
      setValidationStatus('idle')
    }

    switch (activeTab) {
      case 'aliyun':
        return (
          <>
            <ConfigField
              label="AccessKey ID"
              value={ossConfig.accessKeyId || ''}
              onChange={(v) => updateOssConfig('accessKeyId', v)}
              placeholder="请输入 AccessKey ID"
              required
            />
            <ConfigField
              label="AccessKey Secret"
              value={ossConfig.accessKeySecret || ''}
              onChange={(v) => updateOssConfig('accessKeySecret', v)}
              type="password"
              placeholder="请输入 AccessKey Secret"
              required
            />
            <ConfigField
              label="Bucket 名称"
              value={ossConfig.bucket || ''}
              onChange={(v) => updateOssConfig('bucket', v)}
              placeholder="请输入 Bucket 名称"
              required
            />
            <SelectField
              label="地域节点"
              value={ossConfig.region || ''}
              onChange={(v) => updateOssConfig('region', v)}
              options={ALIYUN_REGIONS}
              required
            />
            <ConfigField
              label="自定义域名"
              value={ossConfig.customDomain || ''}
              onChange={(v) => updateOssConfig('customDomain', v)}
              placeholder="例如: cdn.example.com（可选）"
              helpText="如已绑定自定义域名，请填写"
            />
            <ConfigField
              label="存储路径前缀"
              value={ossConfig.pathPrefix || ''}
              onChange={(v) => updateOssConfig('pathPrefix', v)}
              placeholder="例如: images（可选）"
            />
          </>
        )

      case 'tencent':
        return (
          <>
            <ConfigField
              label="SecretId"
              value={ossConfig.secretId || ''}
              onChange={(v) => updateOssConfig('secretId', v)}
              placeholder="请输入 SecretId"
              required
            />
            <ConfigField
              label="SecretKey"
              value={ossConfig.secretKey || ''}
              onChange={(v) => updateOssConfig('secretKey', v)}
              type="password"
              placeholder="请输入 SecretKey"
              required
            />
            <ConfigField
              label="Bucket 名称"
              value={ossConfig.bucket || ''}
              onChange={(v) => updateOssConfig('bucket', v)}
              placeholder="格式: bucketname-appid"
              required
            />
            <SelectField
              label="地域"
              value={ossConfig.region || ''}
              onChange={(v) => updateOssConfig('region', v)}
              options={TENCENT_REGIONS}
              required
            />
            <ConfigField
              label="自定义域名"
              value={ossConfig.customDomain || ''}
              onChange={(v) => updateOssConfig('customDomain', v)}
              placeholder="例如: cdn.example.com（可选）"
            />
            <ConfigField
              label="存储路径前缀"
              value={ossConfig.pathPrefix || ''}
              onChange={(v) => updateOssConfig('pathPrefix', v)}
              placeholder="例如: images（可选）"
            />
          </>
        )

      case 'qiniu':
        return (
          <>
            <ConfigField
              label="AccessKey"
              value={ossConfig.accessKey || ''}
              onChange={(v) => updateOssConfig('accessKey', v)}
              placeholder="请输入 AccessKey"
              required
            />
            <ConfigField
              label="SecretKey"
              value={ossConfig.secretKey || ''}
              onChange={(v) => updateOssConfig('secretKey', v)}
              type="password"
              placeholder="请输入 SecretKey"
              required
            />
            <ConfigField
              label="Bucket 名称"
              value={ossConfig.bucket || ''}
              onChange={(v) => updateOssConfig('bucket', v)}
              placeholder="请输入 Bucket 名称"
              required
            />
            <ConfigField
              label="加速域名"
              value={ossConfig.domain || ''}
              onChange={(v) => updateOssConfig('domain', v)}
              placeholder="例如: cdn.example.com"
              required
              helpText="七牛云必须配置加速域名"
            />
            <ConfigField
              label="存储路径前缀"
              value={ossConfig.pathPrefix || ''}
              onChange={(v) => updateOssConfig('pathPrefix', v)}
              placeholder="例如: images（可选）"
            />
          </>
        )

      case 'aws':
        return (
          <>
            <ConfigField
              label="Access Key ID"
              value={ossConfig.accessKeyId || ''}
              onChange={(v) => updateOssConfig('accessKeyId', v)}
              placeholder="请输入 Access Key ID"
              required
            />
            <ConfigField
              label="Secret Access Key"
              value={ossConfig.secretAccessKey || ''}
              onChange={(v) => updateOssConfig('secretAccessKey', v)}
              type="password"
              placeholder="请输入 Secret Access Key"
              required
            />
            <ConfigField
              label="Bucket 名称"
              value={ossConfig.bucket || ''}
              onChange={(v) => updateOssConfig('bucket', v)}
              placeholder="请输入 Bucket 名称"
              required
            />
            <SelectField
              label="Region"
              value={ossConfig.region || ''}
              onChange={(v) => updateOssConfig('region', v)}
              options={AWS_REGIONS}
              required
            />
            <ConfigField
              label="自定义域名"
              value={ossConfig.customDomain || ''}
              onChange={(v) => updateOssConfig('customDomain', v)}
              placeholder="例如: cdn.example.com（可选）"
            />
          </>
        )

      case 'upyun':
        return (
          <>
            <ConfigField
              label="操作员"
              value={ossConfig.operator || ''}
              onChange={(v) => updateOssConfig('operator', v)}
              placeholder="请输入操作员名称"
              required
            />
            <ConfigField
              label="操作员密码"
              value={ossConfig.password || ''}
              onChange={(v) => updateOssConfig('password', v)}
              type="password"
              placeholder="请输入操作员密码"
              required
            />
            <ConfigField
              label="服务名称"
              value={ossConfig.bucket || ''}
              onChange={(v) => updateOssConfig('bucket', v)}
              placeholder="请输入云存储服务名称"
              required
            />
            <ConfigField
              label="加速域名"
              value={ossConfig.domain || ''}
              onChange={(v) => updateOssConfig('domain', v)}
              placeholder="例如: cdn.example.com"
              required
            />
            <ConfigField
              label="存储路径前缀"
              value={ossConfig.pathPrefix || ''}
              onChange={(v) => updateOssConfig('pathPrefix', v)}
              placeholder="例如: images（可选）"
            />
          </>
        )

      case 'huawei':
        return (
          <>
            <ConfigField
              label="AccessKey ID"
              value={ossConfig.accessKeyId || ''}
              onChange={(v) => updateOssConfig('accessKeyId', v)}
              placeholder="请输入 AccessKey ID"
              required
            />
            <ConfigField
              label="AccessKey Secret"
              value={ossConfig.accessKeySecret || ''}
              onChange={(v) => updateOssConfig('accessKeySecret', v)}
              type="password"
              placeholder="请输入 AccessKey Secret"
              required
            />
            <ConfigField
              label="Bucket 名称"
              value={ossConfig.bucket || ''}
              onChange={(v) => updateOssConfig('bucket', v)}
              placeholder="请输入 Bucket 名称"
              required
            />
            <SelectField
              label="地域"
              value={ossConfig.region || ''}
              onChange={(v) => updateOssConfig('region', v)}
              options={HUAWEI_REGIONS}
              required
            />
            <ConfigField
              label="自定义域名"
              value={ossConfig.customDomain || ''}
              onChange={(v) => updateOssConfig('customDomain', v)}
              placeholder="例如: cdn.example.com（可选）"
            />
          </>
        )

      case 'netease':
        return (
          <>
            <ConfigField
              label="AccessKey"
              value={ossConfig.accessKeyId || ''}
              onChange={(v) => updateOssConfig('accessKeyId', v)}
              placeholder="请输入 AccessKey"
              required
            />
            <ConfigField
              label="AccessKey Secret"
              value={ossConfig.accessKeySecret || ''}
              onChange={(v) => updateOssConfig('accessKeySecret', v)}
              type="password"
              placeholder="请输入 AccessKey Secret"
              required
            />
            <ConfigField
              label="Bucket 名称"
              value={ossConfig.bucket || ''}
              onChange={(v) => updateOssConfig('bucket', v)}
              placeholder="请输入 Bucket 名称"
              required
            />
            <SelectField
              label="地域"
              value={ossConfig.region || ''}
              onChange={(v) => updateOssConfig('region', v)}
              options={NETEASE_REGIONS}
              required
            />
            <ConfigField
              label="自定义域名"
              value={ossConfig.customDomain || ''}
              onChange={(v) => updateOssConfig('customDomain', v)}
              placeholder="例如: cdn.example.com（可选）"
            />
          </>
        )

      case 'jd':
        return (
          <>
            <ConfigField
              label="AccessKey ID"
              value={ossConfig.accessKeyId || ''}
              onChange={(v) => updateOssConfig('accessKeyId', v)}
              placeholder="请输入 AccessKey ID"
              required
            />
            <ConfigField
              label="AccessKey Secret"
              value={ossConfig.accessKeySecret || ''}
              onChange={(v) => updateOssConfig('accessKeySecret', v)}
              type="password"
              placeholder="请输入 AccessKey Secret"
              required
            />
            <ConfigField
              label="Bucket 名称"
              value={ossConfig.bucket || ''}
              onChange={(v) => updateOssConfig('bucket', v)}
              placeholder="请输入 Bucket 名称"
              required
            />
            <SelectField
              label="地域"
              value={ossConfig.region || ''}
              onChange={(v) => updateOssConfig('region', v)}
              options={JD_REGIONS}
              required
            />
            <ConfigField
              label="自定义域名"
              value={ossConfig.customDomain || ''}
              onChange={(v) => updateOssConfig('customDomain', v)}
              placeholder="例如: cdn.example.com（可选）"
            />
          </>
        )

      default:
        return null
    }
  }

  // 渲染侧边栏项目
  const renderSidebarItem = (type: ImageHostType, info: typeof IMAGE_HOSTS[ImageHostType]) => {
    const isActive = activeTab === type
    const config = settings[type as keyof ImageHostSettings]
    const configured = config && typeof config === 'object' && 'isConfigured' in config && config.isConfigured
    const isDef = settings.defaultHost === type

    return (
      <button
        key={type}
        onClick={() => setActiveTab(type)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '10px 12px',
          background: isActive ? 'var(--bg-active)' : 'transparent',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.15s',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        <span
          className="iconify"
          data-icon={info.icon}
          style={{ fontSize: '18px', flexShrink: 0 }}
        ></span>
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{info.name}</span>
        {isDef && (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: 'var(--orange-500)',
              color: 'white',
              borderRadius: '4px',
            }}
          >
            默认
          </span>
        )}
        {configured && !isDef && (
          <span
            style={{
              width: '6px',
              height: '6px',
              background: 'var(--green-500)',
              borderRadius: '50%',
            }}
          ></span>
        )}
      </button>
    )
  }

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
        className="image-host-modal"
        tabIndex={-1}
        style={{
          display: 'flex',
          width: '800px',
          maxWidth: '95vw',
          height: '600px',
          maxHeight: '85vh',
          overflow: 'hidden',
        }}
      >
        {/* 左侧边栏 */}
        <div
          style={{
            width: '200px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* 标题 */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <h2
              id="image-host-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: '600',
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              <span className="iconify" data-icon="lucide:cloud-upload"></span>
              图床配置
            </h2>
          </div>

          {/* 图床列表 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '8px',
            }}
          >
            {/* 传统图床 */}
            <div style={{ marginBottom: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  padding: '8px 12px 4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                免费图床
              </div>
              {hostList.traditional.map(([type, info]) => renderSidebarItem(type as ImageHostType, info))}
            </div>

            {/* 国内 OSS */}
            <div style={{ marginBottom: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  padding: '8px 12px 4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                国内云存储
              </div>
              {hostList.ossDomestic.map(([type, info]) => renderSidebarItem(type as ImageHostType, info))}
            </div>

            {/* 国际 OSS */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  padding: '8px 12px 4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                国际云存储
              </div>
              {hostList.ossInternational.map(([type, info]) => renderSidebarItem(type as ImageHostType, info))}
            </div>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* 头部 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {hostInfo.name}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {hostInfo.description}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
              aria-label="关闭"
            >
              <span className="iconify" data-icon="lucide:x" style={{ fontSize: '20px' }}></span>
            </button>
          </div>

          {/* 快捷链接 */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border-default)',
              background: 'var(--bg-secondary)',
            }}
          >
            <a
              href={hostInfo.links.official}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'var(--bg-primary)',
                borderRadius: '4px',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              <span className="iconify" data-icon="lucide:globe" style={{ fontSize: '14px' }}></span>
              官网
            </a>
            {hostInfo.links.console && (
              <a
                href={hostInfo.links.console}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
              >
                <span className="iconify" data-icon="lucide:layout-dashboard" style={{ fontSize: '14px' }}></span>
                控制台
              </a>
            )}
            <a
              href={hostInfo.links.docs}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'var(--bg-primary)',
                borderRadius: '4px',
                textDecoration: 'none',
              }}
            >
              <span className="iconify" data-icon="lucide:book-open" style={{ fontSize: '14px' }}></span>
              API 文档
            </a>
          </div>

          {/* 表单区域 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
            }}
          >
            {/* 状态提示 */}
            {isConfigured && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  borderRadius: '6px',
                  background: isDefault
                    ? 'rgba(249, 115, 22, 0.15)'
                    : 'rgba(34, 197, 94, 0.15)',
                  color: isDefault
                    ? 'var(--orange-500)'
                    : 'var(--green-500)',
                  fontSize: '13px',
                }}
              >
                <span className="iconify icon-sm" data-icon={isDefault ? 'lucide:star' : 'lucide:check-circle'}></span>
                {isDefault ? '当前默认图床' : '已配置'}
              </div>
            )}

            {/* 配置表单 */}
            {renderConfigForm()}

            {/* 验证状态提示 */}
            {validationStatus === 'validating' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
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
                  padding: '10px 14px',
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
                  padding: '10px 14px',
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
          </div>

          {/* 底部操作栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: '1px solid var(--border-default)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-muted)',
                fontSize: '12px',
              }}
            >
              <span className="iconify" data-icon="lucide:alert-triangle" style={{ color: 'var(--amber-500)' }}></span>
              图片将上传到第三方平台，请注意隐私保护
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {isConfigured && (
                <button
                  onClick={handleClear}
                  className="btn btn-danger"
                  style={{ padding: '8px 16px' }}
                >
                  <span className="iconify icon-sm" data-icon="lucide:trash-2"></span>
                  清除
                </button>
              )}
              {isConfigured && !isDefault && (
                <button
                  onClick={handleSetDefault}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  <span className="iconify icon-sm" data-icon="lucide:star"></span>
                  设为默认
                </button>
              )}
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={validationStatus === 'validating'}
                style={{ padding: '8px 20px' }}
              >
                {validationStatus === 'validating' ? (
                  <>
                    <span className="iconify icon-sm" data-icon="lucide:loader-2" style={{ animation: 'spin 1s linear infinite' }}></span>
                    验证中...
                  </>
                ) : (
                  <>
                    <span className="iconify icon-sm" data-icon="lucide:save"></span>
                    验证并保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
