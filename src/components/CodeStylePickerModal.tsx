import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js'

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
}

// Java Hello World 示例代码
const JAVA_HELLO_WORLD = `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`

/**
 * 代码预览组件 - 展示代码样式效果
 */
function CodePreview({ css }: { css: string }) {
  const [highlightedCode, setHighlightedCode] = useState('')

  useEffect(() => {
    // 高亮代码
    const highlighted = hljs.highlight(JAVA_HELLO_WORLD, { language: 'java' }).value
    setHighlightedCode(highlighted)
  }, [])

  return (
    <div
      className="code-style-preview"
      style={{
        position: 'relative'
      }}
    >
      <style>{css}</style>
      <pre
        className="hljs"
        style={{
          margin: 0,
          padding: '12px',
          borderRadius: '6px',
          fontSize: '11px',
          lineHeight: '1.5',
          overflow: 'auto',
          maxHeight: '140px',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  )
}

export function CodeStylePickerModal({
  isOpen,
  onClose,
  codeStyles,
  currentStyle,
  onSelectStyle
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
            <span className="iconify" data-icon="lucide:code-2" style={{ marginRight: '8px' }}></span>
            选择代码样式
          </h2>
          <button
            className="theme-picker-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <span className="iconify" data-icon="lucide:x"></span>
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
                    <span className="iconify" data-icon="lucide:check"></span>
                  </div>
                )}

                {/* 代码预览 */}
                <CodePreview css={style.css} />

                {/* 样式信息 */}
                <div className="theme-card-info" style={{ marginTop: '10px' }}>
                  <span className="theme-card-name">{style.name}</span>
                  <span className="theme-card-desc">Java 语法高亮</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 底部提示 */}
        <div className="theme-picker-footer">
          <span className="iconify" data-icon="lucide:info" style={{ marginRight: '6px' }}></span>
          点击卡片即可切换代码样式，设置会自动保存
        </div>
      </div>
    </div>
  )
}
