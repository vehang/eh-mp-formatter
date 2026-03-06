import { useEffect, useRef, useCallback } from 'react'

interface UseSyncScrollOptions {
  enabled: boolean
  editorSelector: string
  previewSelector: string
}

/**
 * 双向同步滚动 Hook
 * 当 enabled 为 true 时，编辑区和预览区的滚动会相互同步
 */
export function useSyncScroll({
  enabled,
  editorSelector,
  previewSelector,
}: UseSyncScrollOptions) {
  // 用于防止循环触发
  const isScrollingRef = useRef(false)
  const scrollSourceRef = useRef<'editor' | 'preview' | null>(null)

  const syncScroll = useCallback(
    (source: 'editor' | 'preview') => {
      if (!enabled || isScrollingRef.current) return

      const editorEl = document.querySelector(editorSelector)
      const previewEl = document.querySelector(previewSelector)

      if (!editorEl || !previewEl) return

      isScrollingRef.current = true
      scrollSourceRef.current = source

      try {
        if (source === 'editor') {
          // 编辑器滚动 -> 预览跟随
          const editorScroller = editorEl.querySelector('.cm-scroller') as HTMLElement
          if (!editorScroller) return

          const editorMaxScroll = editorScroller.scrollHeight - editorScroller.clientHeight
          const previewMaxScroll = previewEl.scrollHeight - previewEl.clientHeight

          if (editorMaxScroll > 0 && previewMaxScroll > 0) {
            const scrollRatio = editorScroller.scrollTop / editorMaxScroll
            const targetScroll = scrollRatio * previewMaxScroll
            previewEl.scrollTop = targetScroll
          }
        } else {
          // 预览滚动 -> 编辑器跟随
          const editorScroller = editorEl.querySelector('.cm-scroller') as HTMLElement
          if (!editorScroller) return

          const editorMaxScroll = editorScroller.scrollHeight - editorScroller.clientHeight
          const previewMaxScroll = previewEl.scrollHeight - previewEl.clientHeight

          if (editorMaxScroll > 0 && previewMaxScroll > 0) {
            const scrollRatio = previewEl.scrollTop / previewMaxScroll
            const targetScroll = scrollRatio * editorMaxScroll
            editorScroller.scrollTop = targetScroll
          }
        }
      } finally {
        // 使用 requestAnimationFrame 确保滚动完成后再解锁
        requestAnimationFrame(() => {
          isScrollingRef.current = false
        })
      }
    },
    [enabled, editorSelector, previewSelector]
  )

  useEffect(() => {
    if (!enabled) return

    const editorEl = document.querySelector(editorSelector)
    const previewEl = document.querySelector(previewSelector)

    if (!editorEl || !previewEl) return

    const editorScroller = editorEl.querySelector('.cm-scroller')
    if (!editorScroller) return

    const handleEditorScroll = () => {
      if (scrollSourceRef.current !== 'preview') {
        syncScroll('editor')
      }
    }

    const handlePreviewScroll = () => {
      if (scrollSourceRef.current !== 'editor') {
        syncScroll('preview')
      }
    }

    editorScroller.addEventListener('scroll', handleEditorScroll, { passive: true })
    previewEl.addEventListener('scroll', handlePreviewScroll, { passive: true })

    return () => {
      editorScroller.removeEventListener('scroll', handleEditorScroll)
      previewEl.removeEventListener('scroll', handlePreviewScroll)
    }
  }, [enabled, editorSelector, previewSelector, syncScroll])

  // 重置滚动源
  useEffect(() => {
    if (!enabled) {
      scrollSourceRef.current = null
    }
  }, [enabled])
}
