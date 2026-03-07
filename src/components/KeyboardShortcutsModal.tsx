interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string
  description: string
}

interface ShortcutGroup {
  title: string
  items: ShortcutItem[]
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '文本格式',
    items: [
      { keys: 'Ctrl + B', description: '加粗 (**text**)' },
      { keys: 'Ctrl + I', description: '斜体 (*text*)' },
      { keys: 'Ctrl + `', description: '行内代码 (`text`)' },
    ],
  },
  {
    title: '插入内容',
    items: [
      { keys: 'Ctrl + K', description: '插入链接 [text](url)' },
      { keys: 'Ctrl + Shift + I', description: '插入图片 ![alt](url)' },
      { keys: 'Ctrl + Shift + C', description: '插入代码块' },
      { keys: 'Ctrl + /', description: '插入注释 <!-- text -->' },
    ],
  },
  {
    title: '编辑操作',
    items: [
      { keys: 'Tab', description: '缩进（插入空格）' },
      { keys: 'Shift + Tab', description: '取消缩进' },
      { keys: 'Ctrl + D', description: '删除当前行' },
      { keys: 'Ctrl + Shift + K', description: '删除到行尾' },
    ],
  },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="theme-picker-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="theme-picker-modal"
        style={{ maxWidth: '480px' }}
        tabIndex={-1}
      >
        {/* 头部 */}
        <div className="theme-picker-header">
          <h2 id="shortcuts-title" className="theme-picker-title">
            <span className="iconify" data-icon="lucide:keyboard" style={{ marginRight: '8px' }}></span>
            键盘快捷键
          </h2>
          <button
            className="theme-picker-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <span className="iconify" data-icon="lucide:x"></span>
          </button>
        </div>

        {/* 快捷键列表 */}
        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          {shortcutGroups.map((group) => (
            <div key={group.title} style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {group.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-base)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {item.description}
                    </span>
                    <kbd
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-muted)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.keys.split(' + ').map((key, i, arr) => (
                        <span key={i}>
                          <span style={{ color: 'var(--orange-400)' }}>{key}</span>
                          {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}> + </span>}
                        </span>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="theme-picker-footer">
          <span className="iconify" data-icon="lucide:info" style={{ marginRight: '6px' }}></span>
          <span>
            Mac 用户使用{' '}
            <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 4px', background: 'var(--bg-base)', borderRadius: '3px' }}>⌘</kbd>
            {' '}键，Windows 用户使用{' '}
            <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 4px', background: 'var(--bg-base)', borderRadius: '3px' }}>Ctrl</kbd>
            {' '}键
          </span>
        </div>
      </div>
    </div>
  )
}
