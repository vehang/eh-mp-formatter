/**
 * 图床配置管理 Hook
 * 支持传统图床和 OSS 云存储
 */

import { useState, useCallback } from 'react'
import {
  type ImageHostType,
  type ImageHostSettings,
  type UploadProgress,
  type UploadResult,
  IMAGE_HOSTS,
  HOST_REQUIRES_TOKEN,
} from '../types/imageHost'
import { uploadImage } from '../utils/imageUploader'

const STORAGE_KEY = 'mp-formatter-image-host'

// 默认设置
const defaultSettings: ImageHostSettings = {
  // 传统图床
  dk: { token: '', isConfigured: false },
  bolt: { token: '', isConfigured: false },

  // OSS 云存储
  aliyun: { config: {}, isConfigured: false },
  tencent: { config: {}, isConfigured: false },
  qiniu: { config: {}, isConfigured: false },
  aws: { config: {}, isConfigured: false },
  upyun: { config: {}, isConfigured: false },
  huawei: { config: {}, isConfigured: false },
  netease: { config: {}, isConfigured: false },
  jd: { config: {}, isConfigured: false },

  defaultHost: null,
}

// 图床顺序（用于失败时的备选顺序）
const HOST_ORDER: ImageHostType[] = [
  'dk', 'bolt',
  'aliyun', 'tencent', 'qiniu', 'aws', 'upyun', 'huawei', 'netease', 'jd'
]

// 传统图床列表
const TRADITIONAL_HOSTS: ImageHostType[] = ['dk', 'bolt']

// 从 localStorage 读取设置
function loadSettings(): ImageHostSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultSettings, ...parsed }
    }
  } catch (e) {
    console.warn('Failed to load image host settings:', e)
  }
  return { ...defaultSettings }
}

// 保存设置到 localStorage
function saveSettings(settings: ImageHostSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save image host settings:', e)
  }
}

export function useImageHost() {
  const [settings, setSettings] = useState<ImageHostSettings>(loadSettings)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    statusText: '',
  })

  // 更新图床配置
  const updateHostConfig = useCallback((
    hostType: ImageHostType,
    config: any
  ) => {
    setSettings((prev) => {
      const isTraditional = TRADITIONAL_HOSTS.includes(hostType)

      // 判断是否已配置
      let isConfigured = false
      if (isTraditional) {
        isConfigured = HOST_REQUIRES_TOKEN[hostType]
          ? !!(config.token?.trim())
          : true
      } else {
        // OSS 配置需要检查必填字段
        const hostInfo = IMAGE_HOSTS[hostType]
        isConfigured = hostInfo.requiredFields.every(
          field => config[field]?.trim()
        )
      }

      const newSettings: ImageHostSettings = {
        ...prev,
        [hostType]: isTraditional
          ? { token: config.token || '', isConfigured }
          : { config: config || {}, isConfigured },
      }

      // 如果这是第一个配置的图床，自动设为默认
      if (isConfigured && !prev.defaultHost) {
        newSettings.defaultHost = hostType
      }

      // 如果当前默认图床被取消配置，需要重新选择
      if (!isConfigured && prev.defaultHost === hostType) {
        // 找到下一个已配置的图床
        const configuredHosts = HOST_ORDER.filter(
          (h) => h !== hostType && newSettings[h].isConfigured
        )
        newSettings.defaultHost = configuredHosts[0] || null
      }

      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  // 设置默认图床
  const setDefaultHost = useCallback((hostType: ImageHostType) => {
    setSettings((prev) => {
      // 只有已配置的图床才能设为默认
      if (!prev[hostType].isConfigured) {
        return prev
      }
      // 设置新的默认图床（自动覆盖之前的默认）
      const newSettings = { ...prev, defaultHost: hostType }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  // 获取当前可用的图床
  const getAvailableHosts = useCallback(() => {
    return HOST_ORDER
      .filter((h) => settings[h].isConfigured)
      .map((h) => ({
        type: h,
        name: IMAGE_HOSTS[h].name,
        ...settings[h],
      }))
  }, [settings])

  // 检查是否有任何已配置的图床
  const hasAnyConfiguredHost = useCallback(() => {
    return HOST_ORDER.some((h) => settings[h].isConfigured)
  }, [settings])

  // 获取图床配置（用于上传）
  const getHostConfig = useCallback((hostType: ImageHostType) => {
    const hostSettings = settings[hostType]
    if (!hostSettings.isConfigured) {
      return null
    }

    const isTraditional = TRADITIONAL_HOSTS.includes(hostType)
    if (isTraditional) {
      return { token: (hostSettings as any).token }
    } else {
      return (hostSettings as any).config
    }
  }, [settings])

  // 上传图片
  const handleUpload = useCallback(async (
    file: File,
    hostType?: ImageHostType
  ): Promise<UploadResult> => {
    // 检查是否有任何已配置的图床
    if (!hasAnyConfiguredHost()) {
      return { success: false, error: '请先配置图床' }
    }

    // 确定图床尝试顺序：优先使用指定的或默认图床，然后是其他已配置的图床
    let hostsToTry: ImageHostType[] = []

    if (hostType && settings[hostType].isConfigured) {
      // 如果指定了图床且已配置，只使用这个
      hostsToTry = [hostType]
    } else if (settings.defaultHost && settings[settings.defaultHost].isConfigured) {
      // 优先使用默认图床，然后按顺序尝试其他已配置的图床
      hostsToTry = [
        settings.defaultHost,
        ...HOST_ORDER.filter(h => h !== settings.defaultHost && settings[h].isConfigured)
      ]
    } else {
      // 没有默认图床，按顺序尝试所有已配置的图床
      hostsToTry = HOST_ORDER.filter(h => settings[h].isConfigured)
    }

    // 尝试上传
    for (const targetHost of hostsToTry) {
      const hostConfig = getHostConfig(targetHost)
      if (!hostConfig) continue

      const result = await uploadImage(
        file,
        targetHost,
        hostConfig,
        setUploadProgress
      )

      if (result.success) {
        // 上传成功，重置进度
        setTimeout(() => {
          setUploadProgress({
            isUploading: false,
            progress: 0,
            statusText: '',
          })
        }, 1000)
        return result
      }

      // 如果还有其他图床要尝试，显示正在尝试下一个
      const currentIndex = hostsToTry.indexOf(targetHost)
      if (currentIndex < hostsToTry.length - 1) {
        setUploadProgress({
          isUploading: true,
          progress: 0,
          statusText: `${IMAGE_HOSTS[targetHost].name}上传失败，正在尝试其他图床...`,
        })
      }
    }

    // 所有图床都失败了
    setTimeout(() => {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        statusText: '',
      })
    }, 2000)

    return {
      success: false,
      error: '所有图床上传失败，请检查配置',
    }
  }, [settings, hasAnyConfiguredHost, getHostConfig])

  // 清除图床配置
  const clearHostConfig = useCallback((hostType: ImageHostType) => {
    setSettings((prev) => {
      const isTraditional = TRADITIONAL_HOSTS.includes(hostType)

      const newSettings: ImageHostSettings = {
        ...prev,
        [hostType]: isTraditional
          ? { token: '', isConfigured: false }
          : { config: {}, isConfigured: false },
      }

      // 如果清除的是默认图床，重新选择
      if (prev.defaultHost === hostType) {
        const configuredHosts = HOST_ORDER.filter(
          (h) => h !== hostType && newSettings[h].isConfigured
        )
        newSettings.defaultHost = configuredHosts[0] || null
      }

      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  return {
    settings,
    uploadProgress,
    updateHostConfig,
    setDefaultHost,
    getAvailableHosts,
    handleUpload,
    clearHostConfig,
    hasConfiguredHost: hasAnyConfiguredHost(),
  }
}
