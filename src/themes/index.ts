import type { Theme } from './types'
import { generateThemeStyles } from './types'

export type { Theme } from './types'

// ═══════════════════════════════════════════════════════════════
// 主题定义
// ═══════════════════════════════════════════════════════════════

// 1. 靛青雅致 - 商务、技术
export const indigoElegant: Theme = {
  id: 'indigo',
  name: '靛青雅致',
  description: '专业商务风格，适合技术文章',
  colors: {
    primary: '#3B5998',
    secondary: '#6B7FA1',
    accent: '#4A7C59',
    background: '#FAFBFC',
    text: '#2C3E50',
    textLight: '#5D6D7E',
    border: '#E1E8ED',
    code: {
      inline: { background: '#F0F4F8', color: '#E74C3C' },
      block: { background: '#1E272E', color: '#ABB2BF' }
    },
    blockquote: {
      background: '#F0F4F8',
      borderLeft: '#3B5998',
      color: '#5D6D7E'
    },
    table: {
      headerBg: '#F0F4F8',
      evenRowBg: '#FAFBFC',
      border: '#E1E8ED'
    }
  }
}

// 2. 樱花粉嫩 - 生活、情感
export const sakuraPink: Theme = {
  id: 'sakura',
  name: '樱花粉嫩',
  description: '温柔浪漫风格，适合生活情感类文章',
  colors: {
    primary: '#E91E63',
    secondary: '#F48FB1',
    accent: '#AD1457',
    background: '#FFF5F7',
    text: '#4A4A4A',
    textLight: '#757575',
    border: '#F8BBD9',
    code: {
      inline: { background: '#FCE4EC', color: '#C2185B' },
      block: { background: '#2D2D2D', color: '#F8BBD9' }
    },
    blockquote: {
      background: '#FCE4EC',
      borderLeft: '#E91E63',
      color: '#6D4C41'
    },
    table: {
      headerBg: '#FCE4EC',
      evenRowBg: '#FFF5F7',
      border: '#F8BBD9'
    }
  }
}

// 3. 森林绿意 - 自然、健康
export const forestGreen: Theme = {
  id: 'forest',
  name: '森林绿意',
  description: '清新自然风格，适合健康环保类文章',
  colors: {
    primary: '#2E7D32',
    secondary: '#81C784',
    accent: '#1B5E20',
    background: '#F1F8E9',
    text: '#33691E',
    textLight: '#558B2F',
    border: '#C5E1A5',
    code: {
      inline: { background: '#E8F5E9', color: '#2E7D32' },
      block: { background: '#1B2E1B', color: '#A5D6A7' }
    },
    blockquote: {
      background: '#E8F5E9',
      borderLeft: '#2E7D32',
      color: '#33691E'
    },
    table: {
      headerBg: '#E8F5E9',
      evenRowBg: '#F1F8E9',
      border: '#C5E1A5'
    }
  }
}

// 4. 海洋深蓝 - 科技、专业
export const oceanBlue: Theme = {
  id: 'ocean',
  name: '海洋深蓝',
  description: '专业科技风格，适合技术文档',
  colors: {
    primary: '#1565C0',
    secondary: '#64B5F6',
    accent: '#0D47A1',
    background: '#E3F2FD',
    text: '#1A237E',
    textLight: '#303F9F',
    border: '#90CAF9',
    code: {
      inline: { background: '#BBDEFB', color: '#1565C0' },
      block: { background: '#0D1B2A', color: '#64B5F6' }
    },
    blockquote: {
      background: '#BBDEFB',
      borderLeft: '#1565C0',
      color: '#1A237E'
    },
    table: {
      headerBg: '#BBDEFB',
      evenRowBg: '#E3F2FD',
      border: '#90CAF9'
    }
  }
}

// 5. 日落橙金 - 活力、创意
export const sunsetOrange: Theme = {
  id: 'sunset',
  name: '日落橙金',
  description: '温暖活力风格，适合创意类文章',
  colors: {
    primary: '#E65100',
    secondary: '#FFB74D',
    accent: '#BF360C',
    background: '#FFF8E1',
    text: '#5D4037',
    textLight: '#795548',
    border: '#FFCC80',
    code: {
      inline: { background: '#FFE0B2', color: '#E65100' },
      block: { background: '#3E2723', color: '#FFCC80' }
    },
    blockquote: {
      background: '#FFE0B2',
      borderLeft: '#E65100',
      color: '#5D4037'
    },
    table: {
      headerBg: '#FFE0B2',
      evenRowBg: '#FFF8E1',
      border: '#FFCC80'
    }
  }
}

// 6. 薰衣紫韵 - 优雅、艺术
export const lavenderPurple: Theme = {
  id: 'lavender',
  name: '薰衣紫韵',
  description: '优雅浪漫风格，适合艺术类文章',
  colors: {
    primary: '#7B1FA2',
    secondary: '#BA68C8',
    accent: '#4A148C',
    background: '#F3E5F5',
    text: '#4A148C',
    textLight: '#6A1B9A',
    border: '#CE93D8',
    code: {
      inline: { background: '#E1BEE7', color: '#7B1FA2' },
      block: { background: '#2A1A3E', color: '#CE93D8' }
    },
    blockquote: {
      background: '#E1BEE7',
      borderLeft: '#7B1FA2',
      color: '#4A148C'
    },
    table: {
      headerBg: '#E1BEE7',
      evenRowBg: '#F3E5F5',
      border: '#CE93D8'
    }
  }
}

// 7. 中国红韵 - 传统、热情
export const chineseRed: Theme = {
  id: 'chinese-red',
  name: '中国红韵',
  description: '传统热情风格，适合节日庆典类文章',
  colors: {
    primary: '#C62828',
    secondary: '#EF5350',
    accent: '#B71C1C',
    background: '#FFEBEE',
    text: '#424242',
    textLight: '#616161',
    border: '#FFCDD2',
    code: {
      inline: { background: '#FFCDD2', color: '#C62828' },
      block: { background: '#2C1212', color: '#FFCDD2' }
    },
    blockquote: {
      background: '#FFCDD2',
      borderLeft: '#C62828',
      color: '#424242'
    },
    table: {
      headerBg: '#FFCDD2',
      evenRowBg: '#FFEBEE',
      border: '#FFCDD2'
    }
  }
}

// 8. 极简黑白 - 简约、专业
export const minimalBW: Theme = {
  id: 'minimal',
  name: '极简黑白',
  description: '简约专业风格，适合严肃内容',
  colors: {
    primary: '#212121',
    secondary: '#757575',
    accent: '#424242',
    background: '#FAFAFA',
    text: '#212121',
    textLight: '#616161',
    border: '#E0E0E0',
    code: {
      inline: { background: '#F5F5F5', color: '#D32F2F' },
      block: { background: '#212121', color: '#E0E0E0' }
    },
    blockquote: {
      background: '#F5F5F5',
      borderLeft: '#212121',
      color: '#424242'
    },
    table: {
      headerBg: '#F5F5F5',
      evenRowBg: '#FAFAFA',
      border: '#E0E0E0'
    }
  }
}

// 9. 莫兰迪灰 - 高级、低调
export const morandiGray: Theme = {
  id: 'morandi',
  name: '莫兰迪灰',
  description: '高级低调风格，适合精品内容',
  colors: {
    primary: '#607D8B',
    secondary: '#90A4AE',
    accent: '#455A64',
    background: '#ECEFF1',
    text: '#37474F',
    textLight: '#546E7A',
    border: '#B0BEC5',
    code: {
      inline: { background: '#CFD8DC', color: '#546E7A' },
      block: { background: '#263238', color: '#B0BEC5' }
    },
    blockquote: {
      background: '#CFD8DC',
      borderLeft: '#607D8B',
      color: '#37474F'
    },
    table: {
      headerBg: '#CFD8DC',
      evenRowBg: '#ECEFF1',
      border: '#B0BEC5'
    }
  }
}

// 10. 薄荷清新 - 清新、舒适
export const mintFresh: Theme = {
  id: 'mint',
  name: '薄荷清新',
  description: '清新舒适风格，适合生活方式类文章',
  colors: {
    primary: '#00897B',
    secondary: '#4DB6AC',
    accent: '#00695C',
    background: '#E0F2F1',
    text: '#004D40',
    textLight: '#00695C',
    border: '#80CBC4',
    code: {
      inline: { background: '#B2DFDB', color: '#00897B' },
      block: { background: '#1A3C3A', color: '#80CBC4' }
    },
    blockquote: {
      background: '#B2DFDB',
      borderLeft: '#00897B',
      color: '#004D40'
    },
    table: {
      headerBg: '#B2DFDB',
      evenRowBg: '#E0F2F1',
      border: '#80CBC4'
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 导出所有主题
// ═══════════════════════════════════════════════════════════════

export const themes: Theme[] = [
  indigoElegant,
  sakuraPink,
  forestGreen,
  oceanBlue,
  sunsetOrange,
  lavenderPurple,
  chineseRed,
  minimalBW,
  morandiGray,
  mintFresh
]

// 应用主题到页面
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

// 根据 ID 获取主题
export function getThemeById(id: string): Theme | undefined {
  return themes.find(t => t.id === id)
}

// 默认主题
export const defaultTheme = indigoElegant
