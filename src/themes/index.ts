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
  styles: generateInlineStyles(indigoColors)
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
  styles: generateInlineStyles(forestColors)
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
  styles: generateInlineStyles(roseColors)
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
  styles: generateInlineStyles(amberColors)
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
  styles: generateInlineStyles(slateColors)
}

// ═══════════════════════════════════════════════════════════════
// 新增专业主题 v3.0
// ═══════════════════════════════════════════════════════════════

// 6. Ocean Deep - 深海蓝主题（类似 Linear 风格）
const oceanDeepColors: ThemeColor = {
  primary: '#2563EB',
  secondary: '#3B82F6',
  accent: '#60A5FA',
  background: '#0A0F1E',
  text: '#E2E8F0',
  textLight: '#60A5FA',
  border: '#1E3A5F',
  code: {
    inline: { background: '#1E3A5F', color: '#93C5FD' },
    block: { background: '#0F172A', color: '#E2E8F0' }
  },
  blockquote: {
    background: '#111827',
    borderLeft: '#3B82F6',
    color: '#94A3B8'
  },
  table: {
    headerBg: '#1E3A5F',
    evenRowBg: '#0F172A',
    border: '#1E3A5F'
  }
}

export const oceanDeepTheme: Theme = {
  id: 'ocean-deep',
  name: '深海蓝',
  description: 'Linear 风格深色主题',
  colors: oceanDeepColors,
  styles: generateInlineStyles(oceanDeepColors)
}

// 7. Forest Night - 森林之夜主题
const forestNightColors: ThemeColor = {
  primary: '#22C55E',
  secondary: '#4ADE80',
  accent: '#86EFAC',
  background: '#0D1A0D',
  text: '#E2E8F0',
  textLight: '#4ADE80',
  border: '#1A3A1A',
  code: {
    inline: { background: '#1A3A1A', color: '#86EFAC' },
    block: { background: '#0A150A', color: '#DCFCE7' }
  },
  blockquote: {
    background: '#142014',
    borderLeft: '#22C55E',
    color: '#94A3B8'
  },
  table: {
    headerBg: '#1A3A1A',
    evenRowBg: '#0F1F0F',
    border: '#1A3A1A'
  }
}

export const forestNightTheme: Theme = {
  id: 'forest-night',
  name: '森林之夜',
  description: '暗色森林绿主题',
  colors: forestNightColors,
  styles: generateInlineStyles(forestNightColors)
}

// 8. Rosé Pine - 优雅玫瑰松主题
const rosePineColors: ThemeColor = {
  primary: '#EB6F92',
  secondary: '#F6C177',
  accent: '#9CCFD8',
  background: '#191724',
  text: '#E0DEF4',
  textLight: '#F6C177',
  border: '#26233A',
  code: {
    inline: { background: '#26233A', color: '#EBBCBA' },
    block: { background: '#1F1D2E', color: '#E0DEF4' }
  },
  blockquote: {
    background: '#1F1D2E',
    borderLeft: '#EB6F92',
    color: '#908CAA'
  },
  table: {
    headerBg: '#26233A',
    evenRowBg: '#1F1D2E',
    border: '#26233A'
  }
}

export const rosePineTheme: Theme = {
  id: 'rose-pine',
  name: '玫瑰松',
  description: 'Rosé Pine 暗色主题',
  colors: rosePineColors,
  styles: generateInlineStyles(rosePineColors)
}

// 9. Nord - 北欧冷调主题
const nordColors: ThemeColor = {
  primary: '#88C0D0',
  secondary: '#81A1C1',
  accent: '#5E81AC',
  background: '#2E3440',
  text: '#ECEFF4',
  textLight: '#88C0D0',
  border: '#3B4252',
  code: {
    inline: { background: '#3B4252', color: '#A3BE8C' },
    block: { background: '#242933', color: '#ECEFF4' }
  },
  blockquote: {
    background: '#3B4252',
    borderLeft: '#88C0D0',
    color: '#D8DEE9'
  },
  table: {
    headerBg: '#3B4252',
    evenRowBg: '#2E3440',
    border: '#3B4252'
  }
}

export const nordTheme: Theme = {
  id: 'nord',
  name: '北欧',
  description: 'Nord 冷色调主题',
  colors: nordColors,
  styles: generateInlineStyles(nordColors)
}

// 10. Dracula - 经典德古拉主题
const draculaColors: ThemeColor = {
  primary: '#BD93F9',
  secondary: '#FF79C6',
  accent: '#8BE9FD',
  background: '#282A36',
  text: '#F8F8F2',
  textLight: '#FF79C6',
  border: '#44475A',
  code: {
    inline: { background: '#44475A', color: '#50FA7B' },
    block: { background: '#1D1E26', color: '#F8F8F2' }
  },
  blockquote: {
    background: '#44475A',
    borderLeft: '#BD93F9',
    color: '#F8F8F2'
  },
  table: {
    headerBg: '#44475A',
    evenRowBg: '#282A36',
    border: '#44475A'
  }
}

export const draculaTheme: Theme = {
  id: 'dracula',
  name: '德古拉',
  description: 'Dracula 经典暗色主题',
  colors: draculaColors,
  styles: generateInlineStyles(draculaColors)
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
  styles: generateInlineStyles(solarizedColors)
}

// 12. Monokai - 经典编辑器主题
const monokaiColors: ThemeColor = {
  primary: '#F92672',
  secondary: '#A6E22E',
  accent: '#66D9EF',
  background: '#272822',
  text: '#F8F8F2',
  textLight: '#A6E22E',
  border: '#3E3D32',
  code: {
    inline: { background: '#3E3D32', color: '#FD971F' },
    block: { background: '#1E1F1C', color: '#F8F8F2' }
  },
  blockquote: {
    background: '#3E3D32',
    borderLeft: '#F92672',
    color: '#CFCFC2'
  },
  table: {
    headerBg: '#3E3D32',
    evenRowBg: '#272822',
    border: '#3E3D32'
  }
}

export const monokaiTheme: Theme = {
  id: 'monokai',
  name: 'Monokai',
  description: '经典编辑器主题',
  colors: monokaiColors,
  styles: generateInlineStyles(monokaiColors)
}

// 13. Gruvbox - 复古温暖主题
const gruvboxColors: ThemeColor = {
  primary: '#D79921',
  secondary: '#689D6A',
  accent: '#458588',
  background: '#282828',
  text: '#EBDBB2',
  textLight: '#D79921',
  border: '#3C3836',
  code: {
    inline: { background: '#3C3836', color: '#FE8019' },
    block: { background: '#1D2021', color: '#EBDBB2' }
  },
  blockquote: {
    background: '#3C3836',
    borderLeft: '#D79921',
    color: '#D5C4A1'
  },
  table: {
    headerBg: '#3C3836',
    evenRowBg: '#282828',
    border: '#3C3836'
  }
}

export const gruvboxTheme: Theme = {
  id: 'gruvbox',
  name: 'Gruvbox',
  description: '复古温暖暗色主题',
  colors: gruvboxColors,
  styles: generateInlineStyles(gruvboxColors)
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
  styles: generateInlineStyles(tokyoNightColors)
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
  styles: generateInlineStyles(oneDarkColors)
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
  oneDarkTheme
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
}

export function getThemeById(id: string): Theme | undefined {
  return themes.find(t => t.id === id)
}

export const defaultTheme = amberTheme
