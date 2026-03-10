import { type EditorHandle } from './CodeMirrorEditor'
import type { Theme } from '../themes/types'

interface ToolbarProps {
  // Editor controls
  editorRef: React.RefObject<EditorHandle | null>
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  onClear: () => void

  // Theme and style selection
  currentTheme: Theme
  codeStyle: string
  codeStyles: Array<{ id: string; name: string; css: string }>
  onOpenThemePicker: () => void
  onOpenCodeStylePicker: () => void

  // Image host
  hasConfiguredHost: boolean
  onOpenImageHostModal: () => void
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void

  // Other controls
  syncScroll: boolean
  onToggleSyncScroll: () => void
  onOpenShortcutsModal: () => void
  onOpenUrlModal: () => void

  // Status
  markdownLength: number

  // Responsive
  isMobile: boolean
  isNarrow: boolean
}

export function Toolbar({
  editorRef,
  undo,
  redo,
  canUndo,
  canRedo,
  onClear,
  currentTheme,
  codeStyle,
  codeStyles,
  onOpenThemePicker,
  onOpenCodeStylePicker,
  hasConfiguredHost,
  onOpenImageHostModal,
  onImageUpload,
  syncScroll,
  onToggleSyncScroll,
  onOpenShortcutsModal,
  onOpenUrlModal,
  markdownLength,
  isMobile,
  isNarrow,
}: ToolbarProps) {
  return (
    <>
      {/* Panel header toolbar */}
      <div
        className="panel-header"
        style={{
          flexWrap: 'wrap',
          gap: isMobile ? '6px' : '8px',
          padding: isMobile ? '8px 12px' : undefined,
        }}
      >
        {!isMobile && (
          <>
            <span
              className="iconify icon-sm"
              data-icon="lucide:file-text"
              style={{ marginRight: '4px', color: 'var(--text-muted)' }}
            ></span>
            <span className="panel-title">Markdown</span>
            <div className="toolbar-divider" style={{ margin: '0 4px' }} />
          </>
        )}

        {/* Undo/Redo/Clear - Hidden on mobile */}
        {!isMobile && (
          <>
            <button
              onClick={undo}
              disabled={!canUndo}
              className="btn btn-ghost btn-icon"
              title="撤销 (Ctrl+Z)"
            >
              <span className="iconify icon-sm" data-icon="lucide:undo-2"></span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="btn btn-ghost btn-icon"
              title="重做 (Ctrl+Shift+Z)"
            >
              <span className="iconify icon-sm" data-icon="lucide:redo-2"></span>
            </button>
            <button
              onClick={onClear}
              className="btn btn-ghost btn-icon"
              title="清空内容"
              style={{ color: 'var(--red-500)' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:trash-2"></span>
            </button>
            <div className="toolbar-divider" style={{ margin: '0 4px' }} />
          </>
        )}

        {/* Theme selection - Icon only on narrow screens */}
        <button
          onClick={onOpenThemePicker}
          className="btn btn-ghost"
          title="选择配色主题"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isNarrow ? '6px' : '4px 10px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <span className="iconify icon-sm" data-icon="lucide:palette"></span>
          {!isNarrow && currentTheme.name}
        </button>

        {/* Code style selection - Icon only on narrow screens */}
        <button
          onClick={onOpenCodeStylePicker}
          className="btn btn-ghost"
          title="选择代码样式"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isNarrow ? '6px' : '4px 10px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <span className="iconify icon-sm" data-icon="lucide:code-2"></span>
          {!isNarrow && (codeStyles.find((s) => s.id === codeStyle)?.name || '代码样式')}
        </button>

        {/* Image host config - Icon only on narrow screens */}
        <button
          onClick={onOpenImageHostModal}
          className="btn btn-ghost"
          title="配置图床"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isNarrow ? '6px' : '4px 10px',
            fontSize: '12px',
            color: hasConfiguredHost ? 'var(--green-500)' : 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <span className="iconify icon-sm" data-icon="lucide:image-up"></span>
          {!isNarrow && '图床'}
        </button>

        {/* Sync scroll toggle - Hidden on mobile */}
        {!isMobile && (
          <button
            onClick={onToggleSyncScroll}
            className="btn btn-ghost"
            title={syncScroll ? '关闭同步滚动' : '开启同步滚动'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              color: syncScroll ? 'var(--orange-500)' : 'var(--text-muted)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span
              className="iconify icon-sm"
              data-icon={syncScroll ? 'lucide:link' : 'lucide:link-off'}
            ></span>
            {syncScroll ? '跟随开' : '跟随关'}
          </button>
        )}

        {/* Keyboard shortcuts button - Hidden on mobile */}
        {!isMobile && (
          <button
            onClick={onOpenShortcutsModal}
            className="btn btn-ghost"
            title="键盘快捷键"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span className="iconify icon-sm" data-icon="lucide:keyboard"></span>
          </button>
        )}

        <div className="flex-1" />

        {/* Fetch URL button - Hidden on mobile */}
        {!isMobile && (
          <button
            className="btn btn-ghost"
            onClick={onOpenUrlModal}
            title="抓取网页内容"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '12px',
            }}
          >
            <span className="iconify icon-sm" data-icon="lucide:link"></span>
            抓取链接
          </button>
        )}
        <span
          className="panel-meta"
          style={{ marginLeft: isMobile ? '0' : '8px', fontSize: '12px' }}
        >
          {markdownLength} 字
        </span>
      </div>

      {/* Markdown formatting toolbar - Second row */}
      <div
        className="formatting-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: isMobile ? '6px 12px' : '6px 16px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => editorRef.current?.insertBold()}
          className="btn btn-ghost btn-icon"
          title="加粗 (Ctrl+B)"
          style={{ padding: '4px' }}
        >
          <span
            className="iconify icon-sm"
            data-icon="lucide:bold"
            style={{ fontWeight: 700 }}
          ></span>
        </button>
        <button
          onClick={() => editorRef.current?.insertItalic()}
          className="btn btn-ghost btn-icon"
          title="斜体 (Ctrl+I)"
          style={{ padding: '4px' }}
        >
          <span className="iconify icon-sm" data-icon="lucide:italic"></span>
        </button>
        <button
          onClick={() => editorRef.current?.insertLink()}
          className="btn btn-ghost btn-icon"
          title="插入链接 (Ctrl+K)"
          style={{ padding: '4px' }}
        >
          <span className="iconify icon-sm" data-icon="lucide:link"></span>
        </button>
        <button
          onClick={() => editorRef.current?.insertImage()}
          className="btn btn-ghost btn-icon"
          title="插入图片 (Ctrl+Shift+I)"
          style={{ padding: '4px' }}
        >
          <span className="iconify icon-sm" data-icon="lucide:image"></span>
        </button>
        <button
          onClick={() => editorRef.current?.insertCode()}
          className="btn btn-ghost btn-icon"
          title="行内代码 (Ctrl+`)"
          style={{ padding: '4px' }}
        >
          <span className="iconify icon-sm" data-icon="lucide:code"></span>
        </button>
        <button
          onClick={() => editorRef.current?.insertCodeBlock()}
          className="btn btn-ghost btn-icon"
          title="代码块 (Ctrl+Shift+C)"
          style={{ padding: '4px' }}
        >
          <span className="iconify icon-sm" data-icon="lucide:file-code"></span>
        </button>
        <button
          onClick={() => editorRef.current?.insertHr()}
          className="btn btn-ghost btn-icon"
          title="分割线"
          style={{ padding: '4px' }}
        >
          <span className="iconify icon-sm" data-icon="lucide:minus"></span>
        </button>
        <button
          onClick={() => editorRef.current?.insertQuote()}
          className="btn btn-ghost btn-icon"
          title="引用"
          style={{ padding: '4px' }}
        >
          <span className="iconify icon-sm" data-icon="lucide:quote"></span>
        </button>

        <div className="toolbar-divider" style={{ margin: '0 4px', height: '16px' }} />

        {/* Upload image button */}
        <label
          className="btn btn-ghost btn-icon"
          title={hasConfiguredHost ? '上传图片到图床' : '上传图片（Base64）'}
          style={{ cursor: 'pointer', padding: '4px' }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            style={{ display: 'none' }}
          />
          <span
            className="iconify icon-sm"
            data-icon="lucide:upload"
            style={{ color: hasConfiguredHost ? 'var(--green-500)' : 'var(--text-muted)' }}
          ></span>
        </label>
      </div>
    </>
  )
}
