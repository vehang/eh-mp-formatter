import { useState, useEffect, useRef } from 'react'

interface UrlFetchModalProps {
  isOpen: boolean
  onClose: () => void
  onFetch: (url: string) => void
  isLoading: boolean
}

export function UrlFetchModal({ isOpen, onClose, onFetch, isLoading }: UrlFetchModalProps) {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onFetch(url.trim())
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          width: '100%',
          maxWidth: '480px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            抓取网页内容
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-tertiary)',
            }}
          >
            输入网页 URL，自动抓取并转换为 Markdown
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                fontSize: '14px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color var(--duration-fast) var(--ease-out)',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-3)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isLoading ? (
                <>
                  <span
                    className="iconify icon-sm"
                    data-icon="lucide:loader-2"
                    style={{ animation: 'spin 1s linear infinite' }}
                  ></span>
                  抓取中...
                </>
              ) : (
                <>
                  <span className="iconify icon-sm" data-icon="lucide:download"></span>
                  抓取内容
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
