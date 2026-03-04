export function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 2px 4px rgba(102, 126, 234, 0.25), 0 4px 12px rgba(102, 126, 234, 0.15)'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 2L2 7L10 12L18 7L10 2Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 13L10 18L18 13"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}
        >
          公众号排版工具
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            marginTop: '2px'
          }}
        >
          专业 · 高效 · 美观
        </span>
      </div>
    </div>
  )
}
