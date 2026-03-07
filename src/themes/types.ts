export interface ThemeColor {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  textLight: string
  border: string
  code: {
    inline: { background: string; color: string }
    block: { background: string; color: string }
  }
  blockquote: {
    background: string
    borderLeft: string
    color: string
  }
  table: {
    headerBg: string
    evenRowBg: string
    border: string
  }
}

// 标题样式变体类型
export type HeadingStyleVariant = 
  | 'modern'        // 现代简约 - 简洁线条装饰
  | 'gradient'      // 渐变科技 - 渐变色装饰条
  | 'soft'          // 柔和圆润 - 圆角背景
  | 'retro'         // 复古经典 - 复古装饰
  | 'code'          // 代码风格 - 类似终端
  | 'nature'        // 自然清新 - 叶片装饰
  | 'nordic'        // 北欧极简 - 极简线条
  | 'elegant'       // 优雅浪漫 - 精致装饰
  | 'brutalist'     // 粗犷工业 - 粗线条
  | 'minimal'       // 极简单色 - 无装饰

// 内联样式映射 - 用于公众号复制
export interface ThemeStyles {
  container: string
  h1: string
  h2: string
  h3: string
  h4: string
  h5: string
  h6: string
  p: string
  li: string
  blockquote: string
  code: string
  pre: string
  'pre code': string
  a: string
  hr: string
  th: string
  td: string
  table: string
  img: string
  strong: string
  em: string
}

export interface Theme {
  id: string
  name: string
  description: string
  colors: ThemeColor
  styles: ThemeStyles
  headingStyle?: HeadingStyleVariant  // 标题样式变体，默认 'modern'
}

export function generateThemeStyles(theme: Theme): string {
  const c = theme.colors
  const headingStyle = theme.headingStyle || 'modern'
  return `
.mp-preview[data-theme-style="${theme.id}"] {
  --theme-primary: ${c.primary};
  --theme-secondary: ${c.secondary};
  --theme-accent: ${c.accent};
  --theme-bg: ${c.background};
  --theme-text: ${c.text};
  --theme-text-light: ${c.textLight};
  --theme-border: ${c.border};
  --theme-code-inline-bg: ${c.code.inline.background};
  --theme-code-inline-color: ${c.code.inline.color};
  --theme-code-block-bg: ${c.code.block.background};
  --theme-code-block-color: ${c.code.block.color};
  --theme-blockquote-bg: ${c.blockquote.background};
  --theme-blockquote-border: ${c.blockquote.borderLeft};
  --theme-blockquote-color: ${c.blockquote.color};
  --theme-table-header-bg: ${c.table.headerBg};
  --theme-table-even-bg: ${c.table.evenRowBg};
  --theme-table-border: ${c.table.border};
  --theme-heading-style: ${headingStyle};
}

.mp-preview[data-theme-style="${theme.id}"] h1,
.mp-preview[data-theme-style="${theme.id}"] h2,
.mp-preview[data-theme-style="${theme.id}"] h3,
.mp-preview[data-theme-style="${theme.id}"] h4 { color: var(--theme-primary); }
.mp-preview[data-theme-style="${theme.id}"] h2 { border-bottom-color: var(--theme-border); }
.mp-preview[data-theme-style="${theme.id}"] p,
.mp-preview[data-theme-style="${theme.id}"] li { color: var(--theme-text); }
.mp-preview[data-theme-style="${theme.id}"] blockquote { background: var(--theme-blockquote-bg); border-left-color: var(--theme-blockquote-border); color: var(--theme-blockquote-color); }

/* 行内代码：受预览主题影响 */
.mp-preview[data-theme-style="${theme.id}"] code { background: var(--theme-code-inline-bg); color: var(--theme-code-inline-color); }

/* 代码块内的 code：不受预览主题影响，由代码主题控制 */
.mp-preview[data-theme-style="${theme.id}"] pre code { background: transparent !important; color: inherit !important; }

.mp-preview[data-theme-style="${theme.id}"] th { background: var(--theme-table-header-bg); border-color: var(--theme-table-border); }
.mp-preview[data-theme-style="${theme.id}"] td { border-color: var(--theme-table-border); }
.mp-preview[data-theme-style="${theme.id}"] tr:nth-child(even) { background: var(--theme-table-even-bg); }
.mp-preview[data-theme-style="${theme.id}"] a { color: var(--theme-accent); }
.mp-preview[data-theme-style="${theme.id}"] hr { border-top-color: var(--theme-border); }
  `.trim()
}

// 生成内联样式的辅助函数
export function generateInlineStyles(c: ThemeColor): ThemeStyles {
  return {
    container: `background-color: ${c.background}; color: ${c.text}; font-size: 16px; line-height: 1.8; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;`,
    h1: `color: ${c.primary}; font-size: 28px; font-weight: 700; margin: 24px 0 16px 0; line-height: 1.3;`,
    h2: `color: ${c.primary}; font-size: 24px; font-weight: 600; margin: 20px 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid ${c.border}; line-height: 1.4;`,
    h3: `color: ${c.primary}; font-size: 20px; font-weight: 600; margin: 18px 0 10px 0; line-height: 1.4;`,
    h4: `color: ${c.primary}; font-size: 18px; font-weight: 600; margin: 16px 0 8px 0; line-height: 1.5;`,
    h5: `color: ${c.primary}; font-size: 16px; font-weight: 600; margin: 14px 0 6px 0; line-height: 1.5;`,
    h6: `color: ${c.textLight}; font-size: 15px; font-weight: 600; margin: 12px 0 6px 0; line-height: 1.5;`,
    p: `color: ${c.text}; font-size: 16px; line-height: 1.8; margin: 12px 0;`,
    li: `color: ${c.text}; font-size: 16px; line-height: 1.8; margin: 4px 0;`,
    blockquote: `background: ${c.blockquote.background}; border-left: 4px solid ${c.blockquote.borderLeft}; color: ${c.blockquote.color}; margin: 16px 0; padding: 12px 16px; font-size: 15px; line-height: 1.7;`,
    code: `background: ${c.code.inline.background}; color: ${c.code.inline.color}; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;`,
    pre: `background: ${c.code.block.background}; color: ${c.code.block.color}; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; font-size: 14px; line-height: 1.6;`,
    'pre code': `background: transparent; color: inherit; padding: 0; font-size: inherit;`,
    a: `color: ${c.accent}; text-decoration: none; border-bottom: 1px solid ${c.accent};`,
    hr: `border: none; border-top: 1px solid ${c.border}; margin: 24px 0;`,
    th: `background: ${c.table.headerBg}; color: ${c.text}; font-weight: 600; padding: 10px 12px; border: 1px solid ${c.table.border}; text-align: left;`,
    td: `padding: 10px 12px; border: 1px solid ${c.table.border}; color: ${c.text};`,
    table: `width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 15px;`,
    img: `max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;`,
    strong: `font-weight: 700; color: ${c.primary};`,
    em: `font-style: italic; color: ${c.text};`,
  }
}
