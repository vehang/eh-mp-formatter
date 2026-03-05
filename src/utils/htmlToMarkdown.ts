import TurndownService from 'turndown'

// 配置 turndown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
})

// 自定义规则：处理飞书的特殊格式
turndownService.addRule('feishuCode', {
  filter: (node) => {
    return node.nodeName === 'CODE' && node.parentElement?.nodeName === 'PRE'
  },
  replacement: (content, node) => {
    const lang = (node as HTMLElement).getAttribute('class')?.match(/language-(\w+)/)?.[1] || ''
    return `\`\`\`${lang}\n${content}\n\`\`\``
  },
})

// 自定义规则：处理带颜色的文本（飞书、公众号）
turndownService.addRule('coloredText', {
  filter: (node) => {
    return node.nodeName === 'SPAN' && !!(node as HTMLElement).style.color
  },
  replacement: (content) => {
    return content
  },
})

// 处理图片
turndownService.addRule('image', {
  filter: 'img',
  replacement: (_content, node) => {
    const alt = (node as HTMLElement).getAttribute('alt') || ''
    const src = (node as HTMLElement).getAttribute('src') || ''
    return src ? `![${alt}](${src})` : ''
  },
})

/**
 * 将 HTML 转换为 Markdown
 */
export function htmlToMarkdown(html: string): string {
  try {
    // 清理一些常见的 HTML 问题
    const cleanHtml = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\u00A0/g, ' ')

    return turndownService.turndown(cleanHtml)
  } catch (error) {
    console.error('HTML to Markdown conversion failed:', error)
    return ''
  }
}

/**
 * 检查剪贴板内容是否为富文本
 */
export function isRichTextClipboard(items: DataTransferItemList): boolean {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type === 'text/html') {
      return true
    }
  }
  return false
}

/**
 * 从剪贴板获取 HTML 内容
 */
export async function getHtmlFromClipboard(items: DataTransferItemList): Promise<string | null> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type === 'text/html') {
      const blob = item.getAsFile()
      if (blob) {
        return await blob.text()
      }
    }
  }
  return null
}
