import { CodeMirrorEditor, type EditorHandle } from './CodeMirrorEditor'

interface EditorProps {
  editorRef: React.RefObject<EditorHandle | null>
  value: string
  onChange: (value: string) => void
  onImagePaste: (file: File) => void
  isMobile: boolean
  isSaving: boolean
  uploadProgress: {
    isUploading: boolean
    progress: number
    statusText: string
  }
}

export function Editor({
  editorRef,
  value,
  onChange,
  onImagePaste,
  isMobile,
  isSaving,
  uploadProgress,
}: EditorProps) {
  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
        display: 'flex',
      }}
    >
      <div className="flex-1 min-h-0">
        <CodeMirrorEditor
          ref={editorRef}
          value={value}
          onChange={onChange}
          placeholder="在这里写 Markdown..."
          onImagePaste={onImagePaste}
          compactMode={isMobile}
        />
      </div>

      {/* Bottom status bar - Only shown on left editor, hidden on mobile */}
      {!isMobile && (
        <div
          className="flex items-center justify-between"
          style={{
            height: '32px',
            padding: '0 var(--space-4)',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '12px',
          }}
        >
          {/* Left side hint text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
          >
            <span
              className="iconify icon-sm"
              data-icon="lucide:clipboard-paste"
              style={{ color: 'var(--text-muted)' }}
            ></span>
            <span>支持直接粘贴</span>
            <span style={{ color: '#07C160', fontWeight: 500 }}>公众号</span>
            <span>、</span>
            <span style={{ color: '#3370FF', fontWeight: 500 }}>飞书</span>
            <span>、</span>
            <span style={{ color: '#2B579A', fontWeight: 500 }}>Word</span>
            <span>等富文本，自动转为Markdown</span>
          </div>

          {/* Right side status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Upload progress */}
            {uploadProgress.isUploading && (
              <div className="upload-progress-bar">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
                <span className="upload-progress-text">{uploadProgress.statusText}</span>
              </div>
            )}
            {/* Save status */}
            {isSaving ? (
              <span style={{ color: 'var(--text-muted)' }}>保存中...</span>
            ) : (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--green-500)',
                }}
              >
                <span className="iconify icon-sm" data-icon="lucide:check-circle"></span>
                已保存
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
