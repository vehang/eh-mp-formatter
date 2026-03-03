import type { Theme } from './types'
import { generateThemeStyles } from './types'

// ═══════════════════════════════════════════════════════════════
// 专业主题配色系统（柔和、专业、不刺眼）
// ═══════════════════════════════════════════════════════════════

// 1. 靛青 - 专业商务
export const indigoTheme: Theme = {
  id: 'indigo',
  name: '靛青',
  description: '专业商务风格',
  colors: {
    primary: '#4338CA',
    secondary: '#6366F1',
    accent: '#4F46E5',
    background: '#FAFAFA',
    text: '#1F2937',
    textLight: '#4B5563',
    border: '#E5E7EB',
    code: {
      inline: { background: '#EEF2FF', color: '#4338CA' },
      block: { background: '#1E293B', color: '#E2E8F0' }
    },
    blockquote: {
      background: '#F5F3FF',
      borderLeft: '#6366F1',
      color: '#4B5563'
    },
    table: {
      headerBg: '#F5F3FF',
      evenRowBg: '#FAFAFA',
      border: '#E5E7EB'
    }
  }
}

// 2. 森林 - 自然清新
export const forestTheme: Theme = {
  id: 'forest',
  name: '森林',
  description: '自然清新风格',
  colors: {
    primary: '#166534',
    secondary: '#22C55E',
    accent: '#15803D',
    background: '#FAFAFA',
    text: '#1F2937',
    textLight: '#4B5563',
    border: '#E5E7EB',
    code: {
      inline: { background: '#F0FDF4', color: '#166534' },
      block: { background: '#1E293B', color: '#E2E8F0' }
    },
    blockquote: {
      background: '#F0FDF4',
      borderLeft: '#22C55E',
      color: '#4B5563'
    },
    table: {
      headerBg: '#F0FDF4',
      evenRowBg: '#FAFAFA',
      border: '#E5E7EB'
    }
  }
}

// 3. 玫瑰 - 温柔浪漫
export const roseTheme: Theme = {
  id: 'rose',
  name: '玫瑰',
  description: '温柔浪漫风格',
  colors: {
    primary: '#BE123C',
    secondary: '#F43F5E',
    accent: '#E11D48',
    background: '#FAFAFA',
    text: '#1F2937',
    textLight: '#4B5563',
    border: '#E5E7EB',
    code: {
      inline: { background: '#FFF1F2', color: '#BE123C' },
      block: { background: '#1E293B', color: '#E2E8F0' }
    },
    blockquote: {
      background: '#FFF1F2',
      borderLeft: '#F43F5E',
      color: '#4B5563'
    },
    table: {
      headerBg: '#FFF1F2',
      evenRowBg: '#FAFAFA',
      border: '#E5E7EB'
    }
  }
}

// 4. 琥珀 - 温暖活力
export const amberTheme: Theme = {
  id: 'amber',
  name: '琥珀',
  description: '温暖活力风格',
  colors: {
    primary: '#B45309',
    secondary: '#F59E0B',
    accent: '#D97706',
    background: '#FAFAFA',
    text: '#1F2937',
    textLight: '#4B5563',
    border: '#E5E7EB',
    code: {
      inline: { background: '#FFFBEB', color: '#B45309' },
      block: { background: '#1E293B', color: '#E2E8F0' }
    },
    blockquote: {
      background: '#FFFBEB',
      borderLeft: '#F59E0B',
      color: '#4B5563'
    },
    table: {
      headerBg: '#FFFBEB',
      evenRowBg: '#FAFAFA',
      border: '#E5E7EB'
    }
  }
}

// 5. 石板 - 极简专业
export const slateTheme: Theme = {
  id: 'slate',
  name: '石板',
  description: '极简专业风格',
  colors: {
    primary: '#1E293B',
    secondary: '#64748B',
    accent: '#475569',
    background: '#FAFAFA',
    text: '#1F2937',
    textLight: '#4B5563',
    border: '#E2E8F0',
    code: {
      inline: { background: '#F1F5F9', color: '#334155' },
      block: { background: '#1E293B', color: '#E2E8F0' }
    },
    blockquote: {
      background: '#F8FAFC',
      borderLeft: '#94A3B8',
      color: '#4B5563'
    },
    table: {
      headerBg: '#F8FAFC',
      evenRowBg: '#FAFAFA',
      border: '#E2E8F0'
    }
  }
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
