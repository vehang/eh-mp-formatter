import type { Theme, ThemeColor } from './types'
import { generateThemeStyles, generateInlineStyles } from './types'

// ═══════════════════════════════════════════════════════════════
// 专业主题配色系统 v2.0
// 优化后的配色更柔和、更专业、更易阅读
// ═══════════════════════════════════════════════════════════════

// 1. 靛青 - 专业商务（升级版）
const indigoColors: ThemeColor = {
  primary: '#3730A3',
  secondary: '#6366F1',
  accent: '#4F46E5',
  background: '#FEFEFE',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
  code: {
    inline: { background: '#EEF2FF', color: '#4338CA' },
    block: { background: '#1E293B', color: '#E2E8F0' }
  },
  blockquote: {
    background: '#F8FAFF',
    borderLeft: '#6366F1',
    color: '#475569'
  },
  table: {
    headerBg: '#F1F5F9',
    evenRowBg: '#F8FAFC',
    border: '#E2E8F0'
  }
}

export const indigoTheme: Theme = {
  id: 'indigo',
  name: '靛青',
  description: '专业商务风格',
  colors: indigoColors,
  styles: generateInlineStyles(indigoColors),
  headingStyle: 'tech'
}

// 2. 森林 - 自然清新（升级版）
const forestColors: ThemeColor = {
  primary: '#166534',
  secondary: '#22C55E',
  accent: '#15803D',
  background: '#FEFEFE',
  text: '#1E293B',
  textLight: '#166534',
  border: '#E2E8F0',
  code: {
    inline: { background: '#F0FDF4', color: '#166534' },
    block: { background: '#14532D', color: '#DCFCE7' }
  },
  blockquote: {
    background: '#F0FDF4',
    borderLeft: '#22C55E',
    color: '#475569'
  },
  table: {
    headerBg: '#F0FDF4',
    evenRowBg: '#F8FAFC',
    border: '#E2E8F0'
  }
}

export const forestTheme: Theme = {
  id: 'forest',
  name: '森林',
  description: '自然清新风格',
  colors: forestColors,
  styles: generateInlineStyles(forestColors),
  headingStyle: 'nature'
}

// 3. 玫瑰 - 温柔浪漫（升级版）
const roseColors: ThemeColor = {
  primary: '#9F1239',
  secondary: '#F43F5E',
  accent: '#E11D48',
  background: '#FFFBFC',
  text: '#1E293B',
  textLight: '#9F1239',
  border: '#FCE7F3',
  code: {
    inline: { background: '#FFF1F2', color: '#9F1239' },
    block: { background: '#4C0519', color: '#FEE2E2' }
  },
  blockquote: {
    background: '#FFF1F2',
    borderLeft: '#F43F5E',
    color: '#475569'
  },
  table: {
    headerBg: '#FFF1F2',
    evenRowBg: '#FFFBFC',
    border: '#FCE7F3'
  }
}

export const roseTheme: Theme = {
  id: 'rose',
  name: '玫瑰',
  description: '温柔浪漫风格',
  colors: roseColors,
  styles: generateInlineStyles(roseColors),
  headingStyle: 'elegant'
}

// 4. 琥珀 - 温暖活力（升级版）
const amberColors: ThemeColor = {
  primary: '#92400E',
  secondary: '#F59E0B',
  accent: '#D97706',
  background: '#FFFBF5',
  text: '#1E293B',
  textLight: '#92400E',
  border: '#FEF3C7',
  code: {
    inline: { background: '#FFFBEB', color: '#92400E' },
    block: { background: '#451A03', color: '#FEF3C7' }
  },
  blockquote: {
    background: '#FFFBEB',
    borderLeft: '#F59E0B',
    color: '#475569'
  },
  table: {
    headerBg: '#FFFBEB',
    evenRowBg: '#FFFBF5',
    border: '#FEF3C7'
  }
}

export const amberTheme: Theme = {
  id: 'amber',
  name: '琥珀',
  description: '温暖活力风格',
  colors: amberColors,
  styles: generateInlineStyles(amberColors),
  headingStyle: 'warm-sun'
}

// 5. 石板 - 极简专业（升级版）
const slateColors: ThemeColor = {
  primary: '#1E293B',
  secondary: '#64748B',
  accent: '#0EA5E9',
  background: '#FAFBFC',
  text: '#1E293B',
  textLight: '#0EA5E9',
  border: '#E2E8F0',
  code: {
    inline: { background: '#F1F5F9', color: '#334155' },
    block: { background: '#0F172A', color: '#E2E8F0' }
  },
  blockquote: {
    background: '#F8FAFC',
    borderLeft: '#94A3B8',
    color: '#475569'
  },
  table: {
    headerBg: '#F1F5F9',
    evenRowBg: '#F8FAFC',
    border: '#E2E8F0'
  }
}

export const slateTheme: Theme = {
  id: 'slate',
  name: '石板',
  description: '极简专业风格',
  colors: slateColors,
  styles: generateInlineStyles(slateColors),
  headingStyle: 'nordic'
}

// ═══════════════════════════════════════════════════════════════
// 新增专业主题 v3.0
// ═══════════════════════════════════════════════════════════════

// 6. Ocean Deep - 深海蓝主题（亮色版本，白天可读）
const oceanDeepColors: ThemeColor = {
  primary: '#1E40AF',
  secondary: '#3B82F6',
  accent: '#0EA5E9',
  background: '#F0F9FF',
  text: '#0F172A',
  textLight: '#1E40AF',
  border: '#BFDBFE',
  code: {
    inline: { background: '#DBEAFE', color: '#1E40AF' },
    block: { background: '#1E3A5F', color: '#E0F2FE' }
  },
  blockquote: {
    background: '#EFF6FF',
    borderLeft: '#3B82F6',
    color: '#1E3A5F'
  },
  table: {
    headerBg: '#DBEAFE',
    evenRowBg: '#F0F9FF',
    border: '#BFDBFE'
  }
}

export const oceanDeepTheme: Theme = {
  id: 'ocean-deep',
  name: '深海蓝',
  description: '清爽蓝色主题',
  colors: oceanDeepColors,
  styles: generateInlineStyles(oceanDeepColors),
  headingStyle: 'ocean'
}

// 7. Forest Night - 森林之夜主题（优化对比度）
const forestNightColors: ThemeColor = {
  primary: '#16A34A',
  secondary: '#22C55E',
  accent: '#4ADE80',
  background: '#F0FDF4',
  text: '#14532D',
  textLight: '#166534',
  border: '#BBF7D0',
  code: {
    inline: { background: '#DCFCE7', color: '#166534' },
    block: { background: '#14532D', color: '#DCFCE7' }
  },
  blockquote: {
    background: '#ECFDF5',
    borderLeft: '#22C55E',
    color: '#166534'
  },
  table: {
    headerBg: '#DCFCE7',
    evenRowBg: '#F0FDF4',
    border: '#BBF7D0'
  }
}

export const forestNightTheme: Theme = {
  id: 'forest-night',
  name: '森林之夜',
  description: '清新森林绿主题',
  colors: forestNightColors,
  styles: generateInlineStyles(forestNightColors),
  headingStyle: 'night-forest'
}

// 8. Rosé Pine - 优雅玫瑰松主题（亮色版本，高对比度）
const rosePineColors: ThemeColor = {
  primary: '#B91C1C',
  secondary: '#EB6F92',
  accent: '#C084FC',
  background: '#FFFBFC',
  text: '#1F1F1F',
  textLight: '#BE123C',
  border: '#FECDD3',
  code: {
    inline: { background: '#FFF1F2', color: '#9F1239' },
    block: { background: '#4C1D25', color: '#FEE2E2' }
  },
  blockquote: {
    background: '#FFF1F2',
    borderLeft: '#EB6F92',
    color: '#881337'
  },
  table: {
    headerBg: '#FCE7F3',
    evenRowBg: '#FFFBFC',
    border: '#FBCFE8'
  }
}

export const rosePineTheme: Theme = {
  id: 'rose-pine',
  name: '玫瑰松',
  description: '浪漫玫瑰粉主题',
  colors: rosePineColors,
  styles: generateInlineStyles(rosePineColors),
  headingStyle: 'rose-pine'
}

// 9. Nord - 北欧冷调主题（亮色版本，清爽干净）
const nordColors: ThemeColor = {
  primary: '#2E5A82',
  secondary: '#5B8BA0',
  accent: '#88C0D0',
  background: '#FBFCFD',
  text: '#2E3440',
  textLight: '#3B6B8C',
  border: '#D8E2EC',
  code: {
    inline: { background: '#E8EFF7', color: '#4C6B8A' },
    block: { background: '#2E4A5E', color: '#E8F0F8' }
  },
  blockquote: {
    background: '#F0F5F9',
    borderLeft: '#5B8BA0',
    color: '#3B4A5A'
  },
  table: {
    headerBg: '#E3EDF5',
    evenRowBg: '#F7FAFC',
    border: '#C5D8E8'
  }
}

export const nordTheme: Theme = {
  id: 'nord',
  name: '北欧',
  description: '清爽北欧蓝主题',
  colors: nordColors,
  styles: generateInlineStyles(nordColors),
  headingStyle: 'nordic'
}

// 10. Dracula - 经典德古拉主题（亮色版本，白天可读）
const draculaColors: ThemeColor = {
  primary: '#6B21A8',
  secondary: '#9333EA',
  accent: '#A855F7',
  background: '#FAF5FF',
  text: '#1F1F1F',
  textLight: '#7C3AED',
  border: '#E9D5FF',
  code: {
    inline: { background: '#F3E8FF', color: '#6B21A8' },
    block: { background: '#3B1D5E', color: '#F3E8FF' }
  },
  blockquote: {
    background: '#FAF5FF',
    borderLeft: '#9333EA',
    color: '#581C87'
  },
  table: {
    headerBg: '#F3E8FF',
    evenRowBg: '#FAF5FF',
    border: '#E9D5FF'
  }
}

export const draculaTheme: Theme = {
  id: 'dracula',
  name: '德古拉',
  description: '神秘紫色主题',
  colors: draculaColors,
  styles: generateInlineStyles(draculaColors),
  headingStyle: 'gothic'
}

// 11. Solarized - 太阳能主题
const solarizedColors: ThemeColor = {
  primary: '#268BD2',
  secondary: '#2AA198',
  accent: '#859900',
  background: '#FDF6E3',
  text: '#657B83',
  textLight: '#268BD2',
  border: '#EEE8D5',
  code: {
    inline: { background: '#EEE8D5', color: '#B58900' },
    block: { background: '#073642', color: '#839496' }
  },
  blockquote: {
    background: '#EEE8D5',
    borderLeft: '#268BD2',
    color: '#586E75'
  },
  table: {
    headerBg: '#EEE8D5',
    evenRowBg: '#FDF6E3',
    border: '#EEE8D5'
  }
}

export const solarizedTheme: Theme = {
  id: 'solarized',
  name: '太阳能',
  description: 'Solarized 经典亮色主题',
  colors: solarizedColors,
  styles: generateInlineStyles(solarizedColors),
  headingStyle: 'retro'
}

// 12. Monokai - 经典编辑器主题（亮色版本，高对比度）
const monokaiColors: ThemeColor = {
  primary: '#BE185D',
  secondary: '#F92672',
  accent: '#66D9EF',
  background: '#FFFBFC',
  text: '#1A1A1A',
  textLight: '#BE123C',
  border: '#FECDD3',
  code: {
    inline: { background: '#FFF1F2', color: '#BE185D' },
    block: { background: '#3D1F2D', color: '#FCE7F3' }
  },
  blockquote: {
    background: '#FFF1F2',
    borderLeft: '#F92672',
    color: '#881337'
  },
  table: {
    headerBg: '#FCE7F3',
    evenRowBg: '#FFFBFC',
    border: '#FBCFE8'
  }
}

export const monokaiTheme: Theme = {
  id: 'monokai',
  name: 'Monokai',
  description: '经典粉红主题',
  colors: monokaiColors,
  styles: generateInlineStyles(monokaiColors),
  headingStyle: 'code'
}

// 13. Gruvbox - 复古温暖主题（亮色版本，高对比度）
const gruvboxColors: ThemeColor = {
  primary: '#B45309',
  secondary: '#D97706',
  accent: '#059669',
  background: '#FFFBEB',
  text: '#1C1917',
  textLight: '#92400E',
  border: '#FED7AA',
  code: {
    inline: { background: '#FEF3C7', color: '#92400E' },
    block: { background: '#451A03', color: '#FEF3C7' }
  },
  blockquote: {
    background: '#FEF3C7',
    borderLeft: '#D97706',
    color: '#78350F'
  },
  table: {
    headerBg: '#FEF3C7',
    evenRowBg: '#FFFBEB',
    border: '#FED7AA'
  }
}

export const gruvboxTheme: Theme = {
  id: 'gruvbox',
  name: 'Gruvbox',
  description: '温暖复古主题',
  colors: gruvboxColors,
  styles: generateInlineStyles(gruvboxColors),
  headingStyle: 'retro'
}

// 14. Tokyo Night - 东京之夜主题
const tokyoNightColors: ThemeColor = {
  primary: '#7AA2F7',
  secondary: '#BB9AF7',
  accent: '#7DCFFF',
  background: '#1A1B26',
  text: '#C0CAF5',
  textLight: '#7AA2F7',
  border: '#292E42',
  code: {
    inline: { background: '#292E42', color: '#E0AF68' },
    block: { background: '#16161E', color: '#C0CAF5' }
  },
  blockquote: {
    background: '#292E42',
    borderLeft: '#7AA2F7',
    color: '#A9B1D6'
  },
  table: {
    headerBg: '#292E42',
    evenRowBg: '#1A1B26',
    border: '#292E42'
  }
}

export const tokyoNightTheme: Theme = {
  id: 'tokyo-night',
  name: '东京之夜',
  description: 'Tokyo Night 深邃紫色主题',
  colors: tokyoNightColors,
  styles: generateInlineStyles(tokyoNightColors),
  headingStyle: 'neon'
}

// 15. One Dark - Atom 经典主题
const oneDarkColors: ThemeColor = {
  primary: '#61AFEF',
  secondary: '#C678DD',
  accent: '#98C379',
  background: '#282C34',
  text: '#ABB2BF',
  textLight: '#61AFEF',
  border: '#3E4451',
  code: {
    inline: { background: '#3E4451', color: '#E5C07B' },
    block: { background: '#21252B', color: '#ABB2BF' }
  },
  blockquote: {
    background: '#3E4451',
    borderLeft: '#61AFEF',
    color: '#ABB2BF'
  },
  table: {
    headerBg: '#3E4451',
    evenRowBg: '#282C34',
    border: '#3E4451'
  }
}

export const oneDarkTheme: Theme = {
  id: 'one-dark',
  name: 'One Dark',
  description: 'Atom 经典编辑器主题',
  colors: oneDarkColors,
  styles: generateInlineStyles(oneDarkColors),
  headingStyle: 'code'
}

// 16. Material - Material Design 主题（亮色版本，清晰可读）
const materialColors: ThemeColor = {
  primary: '#00796B',
  secondary: '#26A69A',
  accent: '#FF7043',
  background: '#FAFAFA',
  text: '#212121',
  textLight: '#00695C',
  border: '#B2DFDB',
  code: {
    inline: { background: '#E0F2F1', color: '#00695C' },
    block: { background: '#004D40', color: '#E0F2F1' }
  },
  blockquote: {
    background: '#E0F2F1',
    borderLeft: '#26A69A',
    color: '#004D40'
  },
  table: {
    headerBg: '#E0F2F1',
    evenRowBg: '#FAFAFA',
    border: '#B2DFDB'
  }
}

export const materialTheme: Theme = {
  id: 'material',
  name: 'Material',
  description: '清新青绿主题',
  colors: materialColors,
  styles: generateInlineStyles(materialColors),
  headingStyle: 'material'
}

// 17. Sakura - 樱花主题（粉红色调，浪漫优雅）
const sakuraColors: ThemeColor = {
  primary: '#DB2777',
  secondary: '#EC4899',
  accent: '#F472B6',
  background: '#FDF2F8',
  text: '#1F1F1F',
  textLight: '#BE185D',
  border: '#FBCFE8',
  code: {
    inline: { background: '#FCE7F3', color: '#9D174D' },
    block: { background: '#831843', color: '#FCE7F3' }
  },
  blockquote: {
    background: '#FCE7F3',
    borderLeft: '#EC4899',
    color: '#831843'
  },
  table: {
    headerBg: '#FCE7F3',
    evenRowBg: '#FDF2F8',
    border: '#FBCFE8'
  }
}

export const sakuraTheme: Theme = {
  id: 'sakura',
  name: '樱花',
  description: '浪漫樱花主题',
  colors: sakuraColors,
  styles: generateInlineStyles(sakuraColors),
  headingStyle: 'cute'
}

// 18. Ayu - 阿尤主题（亮色版本，温暖橙色）
const ayuColors: ThemeColor = {
  primary: '#C2410C',
  secondary: '#EA580C',
  accent: '#F97316',
  background: '#FFFBEB',
  text: '#1C1917',
  textLight: '#9A3412',
  border: '#FED7AA',
  code: {
    inline: { background: '#FFEDD5', color: '#9A3412' },
    block: { background: '#7C2D12', color: '#FFEDD5' }
  },
  blockquote: {
    background: '#FFEDD5',
    borderLeft: '#EA580C',
    color: '#7C2D12'
  },
  table: {
    headerBg: '#FFEDD5',
    evenRowBg: '#FFFBEB',
    border: '#FED7AA'
  }
}

export const ayuTheme: Theme = {
  id: 'ayu',
  name: 'Ayu',
  description: '温暖橙色主题',
  colors: ayuColors,
  styles: generateInlineStyles(ayuColors),
  headingStyle: 'japanese'
}

// ═══════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════

export const themes: Theme[] = [
  amberTheme,
  indigoTheme,
  forestTheme,
  roseTheme,
  slateTheme,
  oceanDeepTheme,
  forestNightTheme,
  rosePineTheme,
  nordTheme,
  draculaTheme,
  solarizedTheme,
  monokaiTheme,
  gruvboxTheme,
  tokyoNightTheme,
  oneDarkTheme,
  materialTheme,
  sakuraTheme,
  ayuTheme
]

export function applyTheme(theme: Theme): void {
  const styleId = 'theme-styles'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = generateThemeStyles(theme)

  // 设置预览区域的 data 属性
  const previewEl = document.querySelector('.mp-preview')
  if (previewEl) {
    previewEl.setAttribute('data-theme-style', theme.id)
    previewEl.setAttribute('data-heading-style', theme.headingStyle || 'modern')
  }
}

export function getThemeById(id: string): Theme | undefined {
  return themes.find(t => t.id === id)
}

export const defaultTheme = amberTheme
