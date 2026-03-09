import { htmlToMarkdown } from './htmlToMarkdown'

interface FetchResult {
  success: boolean
  content?: string
  error?: string
}

/**
 * 使用 AllOrigins 代理抓取网页内容
 */
export async function fetchUrlContent(url: string): Promise<FetchResult> {
  try {
    // 验证 URL
    new URL(url)

    // 使用 AllOrigins 代理绕过 CORS
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`

    const response = await fetch(proxyUrl)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()

    // 提取主要内容（尝试从 article 标签或 main 标签获取）
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // 尝试找到主要内容区域
    const contentElement =
      doc.querySelector('article') ||
      doc.querySelector('main') ||
      doc.querySelector('.content') ||
      doc.querySelector('.post') ||
      doc.querySelector('.article') ||
      doc.querySelector('#content') ||
      doc.body

    // 移除不需要的元素
    const removeSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.sidebar',
      '.navigation',
      '.comments',
      '.advertisement',
      '.ads',
    ]

    removeSelectors.forEach((selector) => {
      contentElement.querySelectorAll(selector).forEach((el) => el.remove())
    })

    const contentHtml = contentElement.innerHTML
    const markdown = htmlToMarkdown(contentHtml)

    return {
      success: true,
      content: markdown,
    }
  } catch (error) {
    console.error('Failed to fetch URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '抓取失败，请检查 URL 是否正确',
    }
  }
}
