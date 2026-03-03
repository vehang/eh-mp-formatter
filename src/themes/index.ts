export interface Theme {
  id: string
  name: string
  description?: string
  styles: ThemeStyles
}

export interface ThemeStyles {
  // 标题样式
  h1: { fontSize: string; color: string; fontWeight: string; marginBottom: string }
  h2: { fontSize: string; color: string; fontWeight: string; marginBottom: string; borderBottom?: string; paddingBottom?: string }
  h3: { fontSize: string; color: string; fontWeight: string; marginBottom: string }
  
  // 正文样式
  p: { color: string; lineHeight: string; marginBottom: string; textAlign: string }
  
  // 引用块样式
  blockquote: { 
    background: string
    borderLeft: string
    color: string
    padding: string
    marginBottom: string
  }
  
  // 代码样式
  code: { background: string; color: string; padding: string; borderRadius: string; fontSize: string }
  pre: { background: string; color: string; padding: string; borderRadius: string; marginBottom: string }
  
  // 列表样式
  ul: { marginBottom: string; paddingLeft: string }
  ol: { marginBottom: string; paddingLeft: string }
  li: { marginBottom: string }
  
  // 表格样式
  table: { width: string; borderCollapse: string; marginBottom: string }
  th: { background: string; fontWeight: string; border: string; padding: string }
  td: { border: string; padding: string }
  
  // 链接样式
  a: { color: string }
  
  // 图片样式
  img: { maxWidth: string; borderRadius: string; marginBottom: string }
  
  // 分割线
  hr: { border: string; marginBottom: string; borderBottom?: string }
}

// 紫色经典主题
export const purpleTheme: Theme = {
  id: 'purple',
  name: '紫色经典',
  description: '优雅的紫色主题，适合技术文章',
  styles: {
    h1: { fontSize: '24px', color: '#8064a9', fontWeight: '700', marginBottom: '20px' },
    h2: { fontSize: '20px', color: '#8064a9', fontWeight: '700', marginBottom: '18px', borderBottom: '1px solid #eee', paddingBottom: '8px' },
    h3: { fontSize: '18px', color: '#8064a9', fontWeight: '600', marginBottom: '16px' },
    
    p: { color: '#444444', lineHeight: '1.8', marginBottom: '12px', textAlign: 'justify' },
    
    blockquote: {
      background: '#f4f2f9',
      borderLeft: '4px solid #8064a9',
      color: '#555',
      padding: '12px 16px',
      marginBottom: '16px'
    },
    
    code: { background: '#f0f0f0', color: '#e83e8c', padding: '2px 6px', borderRadius: '4px', fontSize: '14px' },
    pre: { background: '#282c34', color: '#abb2bf', padding: '16px', borderRadius: '8px', marginBottom: '16px' },
    
    ul: { marginBottom: '12px', paddingLeft: '24px' },
    ol: { marginBottom: '12px', paddingLeft: '24px' },
    li: { marginBottom: '4px' },
    
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '16px' },
    th: { background: '#f4f2f9', fontWeight: '600', border: '1px solid #ddd', padding: '10px 12px' },
    td: { border: '1px solid #ddd', padding: '10px 12px' },
    
    a: { color: '#576b95' },
    img: { maxWidth: '100%', borderRadius: '4px', marginBottom: '12px' },
    hr: { border: 'none', borderBottom: '1px solid #eee', marginBottom: '20px' }
  }
}

// 橙心暖色主题
export const orangeHeartTheme: Theme = {
  id: 'orangeheart',
  name: '橙心暖色',
  description: '温暖的橙色主题，适合生活类文章',
  styles: {
    h1: { fontSize: '24px', color: '#ef7060', fontWeight: '700', marginBottom: '20px' },
    h2: { fontSize: '20px', color: '#ef7060', fontWeight: '700', marginBottom: '18px', borderBottom: '1px solid #eee', paddingBottom: '8px' },
    h3: { fontSize: '18px', color: '#ef7060', fontWeight: '600', marginBottom: '16px' },
    
    p: { color: '#000000', lineHeight: '1.8', marginBottom: '12px', textAlign: 'justify' },
    
    blockquote: {
      background: '#fff5f5',
      borderLeft: '4px solid #ef7060',
      color: '#555',
      padding: '12px 16px',
      marginBottom: '16px'
    },
    
    code: { background: '#fff5f5', color: '#ef7060', padding: '2px 6px', borderRadius: '4px', fontSize: '14px' },
    pre: { background: '#282c34', color: '#abb2bf', padding: '16px', borderRadius: '8px', marginBottom: '16px' },
    
    ul: { marginBottom: '12px', paddingLeft: '24px' },
    ol: { marginBottom: '12px', paddingLeft: '24px' },
    li: { marginBottom: '4px' },
    
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '16px' },
    th: { background: '#fff5f5', fontWeight: '600', border: '1px solid #ddd', padding: '10px 12px' },
    td: { border: '1px solid #ddd', padding: '10px 12px' },
    
    a: { color: '#ef7060' },
    img: { maxWidth: '100%', borderRadius: '4px', marginBottom: '12px' },
    hr: { border: 'none', borderBottom: '1px solid #eee', marginBottom: '20px' }
  }
}

// GitHub 风格主题
export const githubTheme: Theme = {
  id: 'github',
  name: 'GitHub风格',
  description: '简洁的 GitHub 风格，适合技术文档',
  styles: {
    h1: { fontSize: '24px', color: '#333333', fontWeight: '600', marginBottom: '20px' },
    h2: { fontSize: '20px', color: '#333333', fontWeight: '600', marginBottom: '18px', borderBottom: '1px solid #eaecef', paddingBottom: '8px' },
    h3: { fontSize: '18px', color: '#333333', fontWeight: '600', marginBottom: '16px' },
    
    p: { color: '#333333', lineHeight: '1.8', marginBottom: '12px', textAlign: 'justify' },
    
    blockquote: {
      background: '#f6f8fa',
      borderLeft: '4px solid #dfe2e5',
      color: '#6a737d',
      padding: '12px 16px',
      marginBottom: '16px'
    },
    
    code: { background: '#f6f8fa', color: '#d73a49', padding: '2px 6px', borderRadius: '4px', fontSize: '14px' },
    pre: { background: '#f6f8fa', color: '#333', padding: '16px', borderRadius: '6px', marginBottom: '16px' },
    
    ul: { marginBottom: '12px', paddingLeft: '24px' },
    ol: { marginBottom: '12px', paddingLeft: '24px' },
    li: { marginBottom: '4px' },
    
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '16px' },
    th: { background: '#f6f8fa', fontWeight: '600', border: '1px solid #dfe2e5', padding: '10px 12px' },
    td: { border: '1px solid #dfe2e5', padding: '10px 12px' },
    
    a: { color: '#0366d6' },
    img: { maxWidth: '100%', borderRadius: '4px', marginBottom: '12px' },
    hr: { border: 'none', borderBottom: '1px solid #eaecef', marginBottom: '20px' }
  }
}

// 所有主题
export const themes: Theme[] = [purpleTheme, orangeHeartTheme, githubTheme]

// 根据主题生成内联 CSS
export function generateInlineCSS(theme: Theme): string {
  const s = theme.styles
  return `
.mp-preview h1 { font-size: ${s.h1.fontSize}; color: ${s.h1.color}; font-weight: ${s.h1.fontWeight}; margin-bottom: ${s.h1.marginBottom}; }
.mp-preview h2 { font-size: ${s.h2.fontSize}; color: ${s.h2.color}; font-weight: ${s.h2.fontWeight}; margin-bottom: ${s.h2.marginBottom}; ${s.h2.borderBottom ? `border-bottom: ${s.h2.borderBottom}; padding-bottom: ${s.h2.paddingBottom};` : ''} }
.mp-preview h3 { font-size: ${s.h3.fontSize}; color: ${s.h3.color}; font-weight: ${s.h3.fontWeight}; margin-bottom: ${s.h3.marginBottom}; }
.mp-preview p { color: ${s.p.color}; line-height: ${s.p.lineHeight}; margin-bottom: ${s.p.marginBottom}; text-align: ${s.p.textAlign}; }
.mp-preview blockquote { background: ${s.blockquote.background}; border-left: ${s.blockquote.borderLeft}; color: ${s.blockquote.color}; padding: ${s.blockquote.padding}; margin-bottom: ${s.blockquote.marginBottom}; }
.mp-preview code { background: ${s.code.background}; color: ${s.code.color}; padding: ${s.code.padding}; border-radius: ${s.code.borderRadius}; font-size: ${s.code.fontSize}; }
.mp-preview pre { background: ${s.pre.background}; color: ${s.pre.color}; padding: ${s.pre.padding}; border-radius: ${s.pre.borderRadius}; margin-bottom: ${s.pre.marginBottom}; }
.mp-preview ul { margin-bottom: ${s.ul.marginBottom}; padding-left: ${s.ul.paddingLeft}; }
.mp-preview ol { margin-bottom: ${s.ol.marginBottom}; padding-left: ${s.ol.paddingLeft}; }
.mp-preview li { margin-bottom: ${s.li.marginBottom}; }
.mp-preview table { width: ${s.table.width}; border-collapse: ${s.table.borderCollapse}; margin-bottom: ${s.table.marginBottom}; }
.mp-preview th { background: ${s.th.background}; font-weight: ${s.th.fontWeight}; border: ${s.th.border}; padding: ${s.th.padding}; }
.mp-preview td { border: ${s.td.border}; padding: ${s.td.padding}; }
.mp-preview a { color: ${s.a.color}; }
.mp-preview img { max-width: ${s.img.maxWidth}; border-radius: ${s.img.borderRadius}; margin-bottom: ${s.img.marginBottom}; }
.mp-preview hr { border: none; border-bottom: ${s.hr.border}; margin-bottom: ${s.hr.marginBottom}; }
`.trim()
}

// 将样式应用到 DOM
export function applyTheme(theme: Theme, _container: HTMLElement): void {
  const styleEl = document.createElement('style')
  styleEl.id = 'theme-styles'
  styleEl.textContent = generateInlineCSS(theme)
  
  // 移除旧的主题样式
  const oldStyle = document.getElementById('theme-styles')
  if (oldStyle) {
    oldStyle.remove()
  }
  
  document.head.appendChild(styleEl)
}
