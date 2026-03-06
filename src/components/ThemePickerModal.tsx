import { useEffect, useRef } from 'react'
import type { Theme, ThemeColor } from '../themes/types'

interface ThemePickerModalProps {
  isOpen: boolean
  onClose: () => void
  themes: Theme[]
  currentTheme: Theme
  onSelectTheme: (theme: Theme) => void
}

/**
 * 主题颜色预览组件 - 展示主题的配色方案
 */
function ColorPreview({ colors }: { colors: ThemeColor }) {
  return (
    <div className="theme-color-preview">
      {/* 主要颜色行 */}
      <div className="color-row">
        <div
          className="color-swatch primary"
          style={{ backgroundColor: colors.primary }}
          title={`主色: ${colors.primary}`}
        />
        <div
          className="color-swatch secondary"
          style={{ backgroundColor: colors.secondary }}
          title={`辅助色: ${colors.secondary}`}
        />
        <div
          className="color-swatch accent"
          style={{ backgroundColor: colors.accent }}
          title={`强调色: ${colors.accent}`}
        />
      </div>

      {/* 文字颜色行 */}
      <div className="color-row">
        <div
          className="color-swatch"
          style={{ backgroundColor: colors.text }}
          title={`文字色: ${colors.text}`}
        />
        <div
          className="color-swatch"
          style={{ backgroundColor: colors.textLight }}
          title={`浅色文字: ${colors.textLight}`}
        />
        <div
          className="color-swatch"
          style={{ backgroundColor: colors.border }}
          title={`边框色: ${colors.border}`}
        />
      </div>

      {/* 代码和引用块颜色 */}
      <div className="color-row">
        <div
          className="color-swatch code"
          style={{ backgroundColor: colors.code.inline.background }}
          title={`行内代码背景: ${colors.code.inline.background}`}
        />
        <div
          className="color-swatch blockquote"
          style={{ backgroundColor: colors.blockquote.background }}
          title={`引用块背景: ${colors.blockquote.background}`}
        />
        <div
          className="color-swatch table"
          style={{ backgroundColor: colors.table.headerBg }}
          title={`表格表头: ${colors.table.headerBg}`}
        />
      </div>
    </div>
  )
}

/**
 * 迷你预览 - 展示主题效果
 */
function MiniPreview({ colors }: { colors: ThemeColor }) {
  return (
    <div
      className="theme-mini-preview"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border
      }}
    >
      {/* 标题预览 */}
      <div
        className="mini-title"
        style={{ color: colors.primary }}
      >
        标题
      </div>
      {/* 正文预览 */}
      <div
        className="mini-text"
        style={{ color: colors.text }}
      >
        正文文字
      </div>
      {/* 行内代码预览 */}
      <span
        className="mini-code"
        style={{
          backgroundColor: colors.code.inline.background,
          color: colors.code.inline.color
        }}
      >
        code
      </span>
    </div>
  )
}

export function ThemePickerModal({
  isOpen,
  onClose,
  themes,
  currentTheme,
  onSelectTheme
}: ThemePickerModalProps) {
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
      aria-labelledby="theme-picker-title"
    >
      <div
        ref={modalRef}
        className="theme-picker-modal"
        tabIndex={-1}
      >
        {/* 头部 */}
        <div className="theme-picker-header">
          <h2 id="theme-picker-title" className="theme-picker-title">
            <span className="iconify" data-icon="lucide:palette" style={{ marginRight: '8px' }}></span>
            选择配色主题
          </h2>
          <button
            className="theme-picker-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <span className="iconify" data-icon="lucide:x"></span>
          </button>
        </div>

        {/* 主题卡片网格 */}
        <div className="theme-picker-grid">
          {themes.map((theme) => {
            const isSelected = theme.id === currentTheme.id
            return (
              <button
                key={theme.id}
                className={`theme-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectTheme(theme)
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

                {/* 迷你预览 */}
                <MiniPreview colors={theme.colors} />

                {/* 主题信息 */}
                <div className="theme-card-info">
                  <span className="theme-card-name">{theme.name}</span>
                  <span className="theme-card-desc">{theme.description}</span>
                </div>

                {/* 颜色预览 */}
                <ColorPreview colors={theme.colors} />
              </button>
            )
          })}
        </div>

        {/* 底部提示 */}
        <div className="theme-picker-footer">
          <span className="iconify" data-icon="lucide:info" style={{ marginRight: '6px' }}></span>
          点击卡片即可切换主题，设置会自动保存
        </div>
      </div>
    </div>
  )
}
