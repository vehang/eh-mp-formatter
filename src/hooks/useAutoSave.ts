import { useEffect, useState } from 'react'

const CACHE_VERSION = '2.0' // 与 index.html 中的 CACHE_VERSION 保持一致

export function useAutoSave<T>(
  key: string,
  value: T,
  delay: number = 1000
): { savedAt: Date | null; isSaving: boolean } {
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // 从本地存储加载初始值
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 检查版本号
        if (parsed._version === CACHE_VERSION) {
          setSavedAt(new Date())
        } else {
          // 版本不匹配，清除缓存
          console.log(`[AutoSave] Version mismatch for ${key}, clearing cache`)
          localStorage.removeItem(key)
        }
      }
    } catch (e) {
      console.warn(`[AutoSave] Failed to load ${key}:`, e)
      localStorage.removeItem(key)
    }
  }, [key])

  useEffect(() => {
    setIsSaving(true)
    const timer = setTimeout(() => {
      try {
        // 添加版本号
        const dataToSave = { _value: value, _version: CACHE_VERSION }
        localStorage.setItem(key, JSON.stringify(dataToSave))
        setSavedAt(new Date())
      } catch (e) {
        console.warn(`[AutoSave] Failed to save ${key}:`, e)
      }
      setIsSaving(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [key, value, delay])

  return { savedAt, isSaving }
}

// 辅助函数：加载带版本控制的缓存值
export function loadCachedValue<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 检查版本号
      if (parsed._version === CACHE_VERSION && parsed._value !== undefined) {
        return parsed._value
      } else {
        // 版本不匹配，清除缓存
        console.log(`[Cache] Version mismatch for ${key}, clearing cache`)
        localStorage.removeItem(key)
      }
    }
  } catch (e) {
    console.warn(`[Cache] Failed to load ${key}:`, e)
    localStorage.removeItem(key)
  }
  return defaultValue
}
