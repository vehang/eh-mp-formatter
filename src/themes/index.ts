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
// 导出
// ═══════════════════════════════════════════════════════════════

export const themes: Theme[] = [
  indigoTheme,
  forestTheme,
  roseTheme,
  amberTheme,
  slateTheme
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

export const defaultTheme = indigoTheme
