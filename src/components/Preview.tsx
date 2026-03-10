import { type RefObject } from 'react'
import type { Theme } from '../themes/types'

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
}: PreviewProps) {
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
            <span
              className="iconify icon-sm"
              data-icon="lucide:eye"
              style={{ marginRight: '8px', color: 'var(--text-muted)' }}
            ></span>
            {previewMode !== 'mobile' && <span className="panel-title">预览</span>}
            <span className="panel-badge">{currentTheme.name}</span>
          </>
        )}

        {/* Preview mode toggle - Hidden on mobile */}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:monitor"></span>
              {previewMode !== 'mobile' && '宽屏'}
            </button>
            <button
              onClick={() => onPreviewModeChange('pad')}
              className={`toggle-btn ${previewMode === 'pad' ? 'active' : ''}`}
              title="Pad 模式"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:tablet"></span>
              {previewMode !== 'mobile' && 'Pad'}
            </button>
            <button
              onClick={() => onPreviewModeChange('mobile')}
              className={`toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`}
              title="手机模式"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:smartphone"></span>
              {previewMode !== 'mobile' && '手机'}
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* Download PDF button - Icon only on mobile */}
        <button
          className="btn btn-ghost"
          onClick={onDownloadPDF}
          disabled={isDownloading}
          title="下载 PDF"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px' : '4px 10px',
            fontSize: '13px',
            marginRight: '8px',
          }}
        >
          {isDownloading ? (
            <span
              className="iconify icon-sm"
              data-icon="lucide:loader-2"
              style={{ animation: 'spin 1s linear infinite' }}
            ></span>
          ) : (
            <span className="iconify icon-sm" data-icon="lucide:download"></span>
          )}
          {!isMobile && previewMode !== 'mobile' && '下载 PDF'}
        </button>

        {/* Copy formatting button */}
        <button
          className="btn btn-primary"
          onClick={onCopyHTML}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '4px 10px' : '4px 10px',
            fontSize: '13px',
          }}
        >
          <span className="iconify icon-sm" data-icon="lucide:copy"></span>
          复制排版
        </button>

        {/* Size display - Hidden on mobile */}
        {!isMobile && previewMode !== 'mobile' && (
          <span className="panel-meta" style={{ marginLeft: '12px' }}>
            {previewMode === 'pad' ? '768px' : '自适应'}
          </span>
        )}
      </div>

      <div
        className="flex-1 overflow-auto flex justify-center"
        style={{
          padding: isMobile ? '0' : 'var(--space-6)',
          background: 'var(--bg-base)',
        }}
      >
        <div
          ref={previewRef}
          className="card"
          style={{
            width:
              previewMode === 'mobile' ? '375px' : previewMode === 'pad' ? '768px' : '100%',
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
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
