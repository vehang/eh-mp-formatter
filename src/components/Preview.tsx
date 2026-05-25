import { useEffect, useMemo, type RefObject } from 'react'
import type { Theme } from '../themes/types'
import { Icon } from '@iconify/react'

interface PreviewProps {
  previewRef: RefObject<HTMLDivElement | null>
  html: string
  previewMode: 'mobile' | 'pad' | 'desktop'
  currentTheme: Theme
  isMobile: boolean
  isDownloading: boolean
  onDownloadPDF: () => void
  onCopyHTML: () => void
  onPreviewModeChange: (mode: 'mobile' | 'pad' | 'desktop') => void
  showCodeTitle: boolean
}

export function Preview({
  previewRef,
  html,
  previewMode,
  currentTheme,
  isMobile,
  isDownloading,
  onDownloadPDF,
  onCopyHTML,
  onPreviewModeChange,
  showCodeTitle,
}: PreviewProps) {

  // 预处理 HTML：处理标题栏开关（颜色由 CSS 变量 --theme-code-block-bg 控制）
  const processedHtml = useMemo(() => {
    if (showCodeTitle) return html
    // 关闭标题栏：加 no-title class + 去掉 header
    return html
      .replace(/<div class="code-block-wrapper">/g, '<div class="code-block-wrapper no-title">')
      .replace(/<div class="code-block-header">[\s\S]*?<\/div>\s*(<pre)/g, '$1')
  }, [html, showCodeTitle])

  // 测量 H2 文字宽度并设置 CSS 变量
  useEffect(() => {
    const previewEl = previewRef.current
    if (!previewEl) return
    const h2s = previewEl.querySelectorAll('.mp-preview h2')
    h2s.forEach((h2) => {
      const el = h2 as HTMLElement
      const range = document.createRange()
      range.selectNodeContents(el)
      const textWidth = Math.round(range.getBoundingClientRect().width)
      const cs = window.getComputedStyle(el)
      const paddingLeft = parseFloat(cs.paddingLeft) || 0
      const before = window.getComputedStyle(el, '::before')
      const beforeContent = before.getPropertyValue('content')
      let beforeWidth = 0
      if (beforeContent && beforeContent !== 'none') {
        const bText = beforeContent.replace(/^["']|["']$/g, '')
        if (bText && before.getPropertyValue('position') !== 'absolute') {
          beforeWidth = (parseFloat(before.width) || 0) + (parseFloat(before.marginRight) || 0)
        }
      }
      const totalWidth = textWidth + beforeWidth + (beforeWidth === 0 ? paddingLeft : 0)
      el.style.setProperty('--h2-deco-width', Math.max(totalWidth, 40) + 'px')
    })
  })

  // 事件委托：复制按钮（只绑定一次，不受 React 重渲染影响）
  useEffect(() => {
    const previewEl = previewRef.current
    if (!previewEl) return

    const handler = async (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.code-block-copy-btn') as HTMLElement | null
      if (!target) return
      e.preventDefault()
      e.stopPropagation()

      const wrapper = target.closest('.code-block-wrapper')
      const code = wrapper?.querySelector('code')
      const text = code?.textContent || ''
      try {
        // navigator.clipboard 在非 HTTPS 环境不可用，需 fallback
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text)
        } else {
          const textarea = document.createElement('textarea')
          textarea.value = text
          textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        target.textContent = '✓'
        target.classList.add('copied')
        setTimeout(() => {
          target.textContent = '复制'
          target.classList.remove('copied')
        }, 2000)
      } catch { /* fallback */ }
    }

    previewEl.addEventListener('click', handler)
    return () => previewEl.removeEventListener('click', handler)
  }, [])

  // 代码块颜色由 loadCodeStyle 追加的 CSS 规则控制（从 hljs 主题提取背景色）
  // 此处无额外 DOM 操作

  return (
    <div
      className="flex flex-col"
      style={{
        background: 'var(--bg-muted)',
        width: '100%',
        height: '100%',
        display: 'flex',
      }}
    >
      <div className="panel-header" style={{ padding: isMobile ? '8px 12px' : undefined }}>
        {!isMobile && (
          <>
            <Icon icon="lucide:eye" width={14} height={14} style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
            {previewMode !== 'mobile' && <span className="panel-title">预览</span>}
            <span className="panel-badge">{currentTheme.name}</span>
          </>
        )}

        {!isMobile && (
          <div
            className="toggle-group"
            style={{
              marginLeft: '12px',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <button
              onClick={() => onPreviewModeChange('desktop')}
              className={`toggle-btn ${previewMode === 'desktop' ? 'active' : ''}`}
              title="宽屏模式"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              <Icon icon="lucide:monitor" width={14} height={14} />
              {previewMode !== 'mobile' && '宽屏'}
            </button>
            <button
              onClick={() => onPreviewModeChange('pad')}
              className={`toggle-btn ${previewMode === 'pad' ? 'active' : ''}`}
              title="Pad 模式"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              <Icon icon="lucide:tablet" width={14} height={14} />
              {previewMode !== 'mobile' && 'Pad'}
            </button>
            <button
              onClick={() => onPreviewModeChange('mobile')}
              className={`toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`}
              title="手机模式"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              <Icon icon="lucide:smartphone" width={14} height={14} />
              {previewMode !== 'mobile' && '手机'}
            </button>
          </div>
        )}

        <div className="flex-1" />

        <button
          className="btn btn-ghost"
          onClick={onDownloadPDF}
          disabled={isDownloading}
          title="下载 PDF"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '6px' : '4px 10px', fontSize: '13px', marginRight: '8px' }}
        >
          {isDownloading ? (
            <Icon icon="lucide:loader-2" width={14} height={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Icon icon="lucide:download" width={14} height={14} />
          )}
          {!isMobile && previewMode !== 'mobile' && '下载 PDF'}
        </button>

        <button
          className="btn btn-primary"
          onClick={onCopyHTML}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: isMobile ? '4px 10px' : '4px 10px', fontSize: '13px' }}
        >
          <Icon icon="lucide:copy" width={14} height={14} />
          复制排版
        </button>

        {!isMobile && previewMode !== 'mobile' && (
          <span className="panel-meta" style={{ marginLeft: '12px' }}>
            {previewMode === 'pad' ? '768px' : '自适应'}
          </span>
        )}
      </div>

      <div
        className="flex-1 overflow-auto flex justify-center"
        style={{ padding: isMobile ? '0' : 'var(--space-6)', background: 'var(--bg-base)' }}
      >
        <div
          ref={previewRef}
          className="card"
          style={{
            width: previewMode === 'mobile' ? '375px' : previewMode === 'pad' ? '768px' : '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            transition: 'width 0.3s ease-in-out',
          }}
        >
          <div
            className="overflow-auto theme-transition preview-scroll-container"
            style={{
              padding: isMobile ? 'var(--space-4)' : 'var(--space-6)',
              maxHeight: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 180px)',
            }}
          >
            <div
              className="mp-preview"
              style={{ maxWidth: 'none' }}
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
