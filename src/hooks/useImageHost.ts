/**
 * 图床配置管理 Hook
 */

import { useState, useCallback } from 'react'
import {
  type ImageHostType,
  type ImageHostSettings,
  type UploadProgress,
  type UploadResult,
  IMAGE_HOSTS,
} from '../types/imageHost'
import { uploadImage } from '../utils/imageUploader'

const STORAGE_KEY = 'mp-formatter-image-host'

// 默认设置
const defaultSettings: ImageHostSettings = {
  hello: { token: '', isConfigured: false },
  dk: { token: '', isConfigured: false },
  bolt: { token: '', isConfigured: false },
  defaultHost: null,
}

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
    config: { token: string; storage?: string }
  ) => {
    setSettings((prev) => {
      const isConfigured = !!config.token.trim()
      const newSettings: ImageHostSettings = {
        ...prev,
        [hostType]: {
          ...prev[hostType],
          token: config.token,
          ...(config.storage !== undefined && { storage: config.storage }),
          isConfigured,
        },
      }

      // 如果这是第一个配置的图床，自动设为默认
      if (isConfigured && !prev.defaultHost) {
        newSettings.defaultHost = hostType
      }

      // 如果当前默认图床被取消配置，需要重新选择
      if (!isConfigured && prev.defaultHost === hostType) {
        // 找到下一个已配置的图床
        const configuredHosts = (['hello', 'dk', 'bolt'] as ImageHostType[]).filter(
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
      if (!prev[hostType].isConfigured) {
        return prev
      }
      const newSettings = { ...prev, defaultHost: hostType }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  // 获取当前可用的图床
  const getAvailableHosts = useCallback(() => {
    return (['hello', 'dk', 'bolt'] as ImageHostType[])
      .filter((h) => settings[h].isConfigured)
      .map((h) => ({
        type: h,
        name: IMAGE_HOSTS[h].name,
        ...settings[h],
      }))
  }, [settings])

  // 上传图片
  const handleUpload = useCallback(async (
    file: File,
    hostType?: ImageHostType
  ): Promise<UploadResult> => {
    // 确定使用的图床
    const targetHost = hostType || settings.defaultHost

    if (!targetHost) {
      return { success: false, error: '请先配置图床' }
    }

    const hostConfig = settings[targetHost]
    if (!hostConfig.isConfigured) {
      return { success: false, error: '请先配置图床 Token' }
    }

    const result = await uploadImage(
      file,
      targetHost,
      hostConfig.token,
      'storage' in hostConfig ? hostConfig.storage : undefined,
      setUploadProgress
    )

    // 上传完成后，重置进度（延迟一下让用户看到完成状态）
    if (!result.success) {
      setTimeout(() => {
        setUploadProgress({
          isUploading: false,
          progress: 0,
          statusText: '',
        })
      }, 2000)
    } else {
      setTimeout(() => {
        setUploadProgress({
          isUploading: false,
          progress: 0,
          statusText: '',
        })
      }, 1000)
    }

    return result
  }, [settings])

  // 清除图床配置
  const clearHostConfig = useCallback((hostType: ImageHostType) => {
    setSettings((prev) => {
      const newSettings: ImageHostSettings = {
        ...prev,
        [hostType]: { token: '', isConfigured: false },
      }

      // 如果清除的是默认图床，重新选择
      if (prev.defaultHost === hostType) {
        const configuredHosts = (['hello', 'dk', 'bolt'] as ImageHostType[]).filter(
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
    hasConfiguredHost: !!settings.defaultHost,
  }
}
