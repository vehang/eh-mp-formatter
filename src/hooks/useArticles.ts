import { useState, useCallback, useRef, useEffect } from 'react'
import { defaultMarkdown } from '../constants/defaultTemplate'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Article {
  id: string        // 本地唯一ID，uuid v4
  shortId: string   // 8位短地址（a-z0-9），全局唯一标识，用于后续同步
  title: string
  content: string
  createdAt: number // 创建时间戳
  updatedAt: number // 修改时间戳
}

type SortOrder = 'updatedAt' | 'createdAt'

interface SaveResult {
  success: boolean
  error?: 'storage_full' | 'content_too_large'
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY_ARTICLES = 'eh-mp-articles'
const STORAGE_KEY_CURRENT_ID = 'eh-mp-current-article-id'
const MAX_CONTENT_LENGTH = 512000 // 500KB

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateUUID(): string {
  // crypto.randomUUID() requires Secure Context (HTTPS / localhost)
  // Fall back to manual UUID v4 for HTTP environments
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 安全读取 localStorage */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** 安全写入 localStorage，返回是否成功 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** 从 localStorage 读取文章列表 */
function readArticles(): Article[] {
  const raw = safeGetItem(STORAGE_KEY_ARTICLES)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/** 将文章列表写入 localStorage */
function writeArticles(articles: Article[]): boolean {
  return safeSetItem(STORAGE_KEY_ARTICLES, JSON.stringify(articles))
}

/** 读取当前文章 ID */
function readCurrentId(): string | null {
  return safeGetItem(STORAGE_KEY_CURRENT_ID)
}

/** 写入当前文章 ID */
function writeCurrentId(id: string | null): boolean {
  if (id === null) {
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_ID)
      return true
    } catch {
      return false
    }
  }
  return safeSetItem(STORAGE_KEY_CURRENT_ID, id)
}

// ─── shortId 唯一性检查 ──────────────────────────────────────────────────────

function generateUniqueShortId(existingArticles: Article[]): string {
  const existingIds = new Set(existingArticles.map(a => a.shortId))
  let shortId = generateShortId()
  let attempts = 0
  while (existingIds.has(shortId) && attempts < 100) {
    shortId = generateShortId()
    attempts++
  }
  return shortId
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useArticles() {
  // 文章列表（排序前的原始列表存在 ref 中，排序后的列表作为 state）
  const [articles, setArticles] = useState<Article[]>(() => {
    const list = readArticles()
    return list
  })
  const [currentArticle, setCurrentArticle] = useState<Article | null>(() => {
    const list = readArticles()
    const currentId = readCurrentId()
    if (currentId) {
      return list.find(a => a.id === currentId) || null
    }
    return list[0] || null
  })
  const [sortOrder, setSortOrder] = useState<SortOrder>('updatedAt')

  // 内容脏标记：跟踪当前文章是否有未保存的内容变化
  const dirtyContentRef = useRef<string | null>(null)

  // debounce timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── 初始化：首次使用时创建默认文章 ────────────────────────────────────────
  useEffect(() => {
    const existing = readArticles()
    if (existing.length === 0) {
      const now = Date.now()
      const defaultArticle: Article = {
        id: generateUUID(),
        shortId: generateShortId(),
        title: formatTimestamp(now),
        content: defaultMarkdown,
        createdAt: now,
        updatedAt: now,
      }
      writeArticles([defaultArticle])
      writeCurrentId(defaultArticle.id)
      setArticles([defaultArticle])
      setCurrentArticle(defaultArticle)
    }
  }, [])

  // ─── 排序后的文章列表 ──────────────────────────────────────────────────────
  const sortedArticles = articles.slice().sort((a, b) => {
    if (sortOrder === 'updatedAt') {
      return b.updatedAt - a.updatedAt
    }
    return b.createdAt - a.createdAt
  })

  // ─── 暴露方法 ──────────────────────────────────────────────────────────────

  /** 保存文章（带容量保护） */
  const saveArticle = useCallback((content: string): SaveResult => {
    // 容量保护：单篇 content 上限
    if (content.length > MAX_CONTENT_LENGTH) {
      return { success: false, error: 'content_too_large' }
    }

    setCurrentArticle(prev => {
      if (!prev) return prev
      // 只有内容真正变化才更新 updatedAt
      const contentChanged = prev.content !== content
      const updated = contentChanged
        ? { ...prev, content, updatedAt: Date.now() }
        : prev
      if (contentChanged) {
        setArticles(prevList => {
          const newList = prevList.map(a => a.id === updated.id ? updated : a)
          const ok = writeArticles(newList)
          if (!ok) {
            // localStorage 满了，不更新 state（回滚）
            return prevList
          }
          return newList
        })
      }
      return updated
    })
    return { success: true }
  }, [])

  /** 加载文章（先保存当前文章，再切换） */
  const loadArticle = useCallback((id: string) => {
    // 先保存当前文章的脏内容
    if (dirtyContentRef.current !== null && currentArticle) {
      saveArticle(dirtyContentRef.current)
      dirtyContentRef.current = null
    }

    const list = readArticles()
    const target = list.find(a => a.id === id)
    if (target) {
      writeCurrentId(id)
      setCurrentArticle(target)
    }
  }, [currentArticle, saveArticle])

  /** 新建文章 */
  const createArticle = useCallback(() => {
    // 先保存当前文章的脏内容
    if (dirtyContentRef.current !== null && currentArticle) {
      saveArticle(dirtyContentRef.current)
      dirtyContentRef.current = null
    }

    const now = Date.now()
    const list = readArticles()
    const newArticle: Article = {
      id: generateUUID(),
      shortId: generateUniqueShortId(list),
      title: formatTimestamp(now),
      content: '',
      createdAt: now,
      updatedAt: now,
    }

    const newList = [...list, newArticle]
    const ok = writeArticles(newList)
    if (!ok) {
      return // localStorage 满了，无法创建
    }

    writeCurrentId(newArticle.id)
    setArticles(newList)
    setCurrentArticle(newArticle)
  }, [currentArticle, saveArticle])

  /** 重命名文章 */
  const renameArticle = useCallback((id: string, title: string) => {
    setArticles(prevList => {
      const newList = prevList.map(a =>
        a.id === id ? { ...a, title, updatedAt: Date.now() } : a
      )
      writeArticles(newList)
      return newList
    })

    setCurrentArticle(prev => {
      if (prev && prev.id === id) {
        return { ...prev, title, updatedAt: Date.now() }
      }
      return prev
    })
  }, [])

  /** 删除文章 */
  const deleteArticle = useCallback((id: string) => {
    const list = readArticles()
    const newList = list.filter(a => a.id !== id)

    // 如果删除的是当前文章，切换到最近修改的另一篇
    if (currentArticle?.id === id) {
      if (newList.length > 0) {
        // 按 updatedAt 降序，取第一篇
        const sorted = newList.slice().sort((a, b) => b.updatedAt - a.updatedAt)
        const next = sorted[0]
        writeCurrentId(next.id)
        setCurrentArticle(next)
      } else {
        // 没有文章了，创建一篇新的
        const now = Date.now()
        const freshArticle: Article = {
          id: generateUUID(),
          shortId: generateUniqueShortId([]),
          title: formatTimestamp(now),
          content: '',
          createdAt: now,
          updatedAt: now,
        }
        writeArticles([freshArticle])
        writeCurrentId(freshArticle.id)
        setArticles([freshArticle])
        setCurrentArticle(freshArticle)
        return
      }
    }

    writeArticles(newList)
    setArticles(newList)
  }, [currentArticle])

  // ─── 自动保存（debounce 1秒） ─────────────────────────────────────────────

  const triggerAutoSave = useCallback((content: string) => {
    // 标记脏内容
    dirtyContentRef.current = content

    // 清除旧 timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // 1秒后保存
    autoSaveTimerRef.current = setTimeout(() => {
      saveArticle(content)
      dirtyContentRef.current = null
    }, 1000)
  }, [saveArticle])

  /** 立即保存（Ctrl+S） */
  const immediateSave = useCallback((content: string) => {
    // 清除 debounce timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    dirtyContentRef.current = null
    return saveArticle(content)
  }, [saveArticle])

  // ─── 清理 timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  return {
    articles: sortedArticles,
    currentArticle,
    loadArticle,
    createArticle,
    saveArticle,
    renameArticle,
    deleteArticle,
    sortOrder,
    setSortOrder,
    triggerAutoSave,
    immediateSave,
  }
}
