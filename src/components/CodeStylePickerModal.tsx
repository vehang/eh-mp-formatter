import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import { Icon } from '@iconify/react'

interface CodeStyle {
  id: string
  name: string
  css: string
}

interface CodeStylePickerModalProps {
  isOpen: boolean
  onClose: () => void
  codeStyles: CodeStyle[]
  currentStyle: string
  onSelectStyle: (styleId: string) => void
  showCodeTitle: boolean
  onToggleCodeTitle: () => void
}

// Java Hello World 示例代码
const JAVA_HELLO_WORLD = `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`

/**
 * 代码预览组件 - 展示代码样式效果
 * 使用 Shadow DOM 隔离样式，确保每个预览卡片显示正确的代码样式
 */
function CodePreview({ css }: { css: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shadowRootRef = useRef<ShadowRoot | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // 如果还没有创建 Shadow Root，创建一个
    if (!shadowRootRef.current) {
      shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' })
    }

    const shadowRoot = shadowRootRef.current

    // 高亮代码
    const highlighted = hljs.highlight(JAVA_HELLO_WORLD, { language: 'java' }).value

    // 构建完整的 Shadow DOM 内容
    shadowRoot.innerHTML = `
      <style>
        ${css}
        .hljs {
          margin: 0;
          padding: 12px;
          border-radius: 6px;
          font-size: 11px;
          line-height: 1.5;
          overflow: auto;
          max-height: 140px;
          font-family: 'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace;
        }
        pre {
          margin: 0;
        }
        code {
          font-family: inherit;
        }
      </style>
      <pre class="hljs"><code>${highlighted}</code></pre>
    `
  }, [css])

  return (
    <div
      ref={containerRef}
      className="code-style-preview"
      style={{
        position: 'relative',
        borderRadius: '6px',
        overflow: 'hidden'
      }}
    />
  )
}

export function CodeStylePickerModal({
  isOpen,
  onClose,
  codeStyles,
  currentStyle,
  onSelectStyle,
  showCodeTitle,
  onToggleCodeTitle
}: CodeStylePickerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

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

  if (!isOpen) return null

  return (
    <div
      className="theme-picker-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-style-picker-title"
    >
      <div
        ref={modalRef}
        className="theme-picker-modal"
        tabIndex={-1}
        style={{ maxWidth: '720px' }}
      >
        {/* 头部 */}
        <div className="theme-picker-header">
          <h2 id="code-style-picker-title" className="theme-picker-title">
            <Icon icon="lucide:code-2" style={{ marginRight: '8px' }} />
            选择代码样式
          </h2>
          <button
            className="theme-picker-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <Icon icon="lucide:x" />
          </button>
        </div>

        {/* 代码样式卡片网格 */}
        <div className="theme-picker-grid">
          {codeStyles.map((style) => {
            const isSelected = style.id === currentStyle
            return (
              <button
                key={style.id}
                className={`theme-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectStyle(style.id)
                  onClose()
                }}
                aria-pressed={isSelected}
              >
                {/* 选中指示器 */}
                {isSelected && (
                  <div className="theme-card-selected-badge">
                    <Icon icon="lucide:check" />
                  </div>
                )}

                {/* 代码预览 */}
                <CodePreview css={style.css} />

                {/* 样式信息 */}
                <div className="theme-card-info" style={{ marginTop: '10px' }}>
                  <span className="theme-card-name">{style.name}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 代码块标题栏开关 */}
        <div className="theme-picker-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon icon="lucide:terminal" style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>代码块标题栏</span>
          </div>
          <button
            onClick={onToggleCodeTitle}
            style={{
              width: '40px',
              height: '22px',
              borderRadius: '11px',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s ease',
              backgroundColor: showCodeTitle ? 'var(--orange-500, #F97316)' : 'var(--bg-muted, #D4D4D8)',
              flexShrink: 0,
            }}
            title={showCodeTitle ? '关闭标题栏' : '开启标题栏'}
          >
            <span style={{
              position: 'absolute',
              top: '2px',
              left: showCodeTitle ? '20px' : '2px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        {/* 底部提示 */}
        <div className="theme-picker-footer">
          <Icon icon="lucide:info" style={{ marginRight: '6px' }} />
          点击卡片即可切换代码样式，设置会自动保存
        </div>
      </div>
    </div>
  )
}
