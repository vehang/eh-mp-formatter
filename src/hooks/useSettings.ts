import { useState, useCallback } from 'react'

/**
 * 统一的设置缓存 Hook
 * 所有设置项都会自动保存到 localStorage
 */

// 设置存储的 key
const SETTINGS_KEY = 'mp-formatter-settings'
const SETTINGS_VERSION = '2.0' // 缓存版本号（与 index.html 中的 CACHE_VERSION 保持一致）

// 设置项类型定义
export interface AppSettings {
  // 预览主题（配色方案）
  themeId: string
  // 代码高亮风格
  codeStyle: string
  // 预览模式
  previewMode: 'mobile' | 'pad' | 'desktop'
  // 同步滚动
  syncScroll: boolean
  // UI 主题（深色/浅色）由 useUITheme 单独管理
}

// 默认设置
const defaultSettings: AppSettings = {
  themeId: 'amber',
  codeStyle: 'github-dark',
  previewMode: 'desktop',
  syncScroll: true,
}

// 从 localStorage 读取设置
function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      
      // 检查版本号，如果不匹配则清除缓存
      if (parsed._version !== SETTINGS_VERSION) {
        console.log('[Settings] Version mismatch, clearing cache')
        localStorage.removeItem(SETTINGS_KEY)
        return { ...defaultSettings }
      }
      
      // 合并默认值，确保新增字段有默认值
      const { _version, ...settings } = parsed
      return { ...defaultSettings, ...settings }
    }
  } catch (e) {
    console.warn('[Settings] Failed to load, clearing cache:', e)
    localStorage.removeItem(SETTINGS_KEY)
  }
  return { ...defaultSettings }
}

// 保存设置到 localStorage
function saveSettings(settings: AppSettings): void {
  try {
    // 添加版本号
    const dataToSave = { ...settings, _version: SETTINGS_VERSION }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(dataToSave))
  } catch (e) {
    console.warn('[Settings] Failed to save:', e)
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)

  // 更新单个设置项
  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettingsState(prev => {
      const newSettings = { ...prev, [key]: value }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  // 批量更新设置
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const newSettings = { ...prev, ...updates }
      saveSettings(newSettings)
      return newSettings
    })
  }, [])

  // 重置为默认设置
  const resetSettings = useCallback(() => {
    setSettingsState({ ...defaultSettings })
    saveSettings(defaultSettings)
  }, [])

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    // 便捷访问器
    themeId: settings.themeId,
    codeStyle: settings.codeStyle,
    previewMode: settings.previewMode,
    syncScroll: settings.syncScroll,
    setThemeId: (value: string) => updateSetting('themeId', value),
    setCodeStyle: (value: string) => updateSetting('codeStyle', value),
    setPreviewMode: (value: 'mobile' | 'pad' | 'desktop') => updateSetting('previewMode', value),
    setSyncScroll: (value: boolean) => updateSetting('syncScroll', value),
  }
}
