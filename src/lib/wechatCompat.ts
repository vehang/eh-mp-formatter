import type { Theme } from '../themes/types'

/**
 * 将图片 URL 转换为 Base64 编码
 */
async function imageToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url

  try {
    const response = await fetch(url, { mode: 'cors', cache: 'default' })
    if (!response.ok) return url

    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string || url)
      reader.onerror = () => resolve(url)
      reader.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}

/**
 * 将 Flex 布局转换为 Table 布局（公众号不支持 flex）
 */
function convertFlexToTable(section: HTMLElement, doc: Document): void {
  const flexElements = section.querySelectorAll('div, p')

  flexElements.forEach((el) => {
    if (el.closest('pre, code')) return

    const htmlEl = el as HTMLElement
    const style = htmlEl.getAttribute('style') || ''
    const isFlex = style.includes('display: flex') || style.includes('display:flex')

    if (!isFlex) return

    const children = Array.from(htmlEl.children)
    const allImages = children.every(
      (child) => child.tagName === 'IMG' || child.querySelector('img')
    )

    if (allImages && children.length > 0) {
      const table = doc.createElement('table')
      table.setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 16px 0; border: none !important;')

      const tbody = doc.createElement('tbody')
      const tr = doc.createElement('tr')
      tr.setAttribute('style', 'border: none !important; background: transparent !important;')

      children.forEach((child) => {
        const td = doc.createElement('td')
        td.setAttribute('style', 'padding: 0 4px; vertical-align: top; border: none !important; background: transparent !important;')

        if (child.tagName === 'IMG') {
          const img = child as HTMLImageElement
          const currentStyle = img.getAttribute('style') || ''
          img.setAttribute('style', currentStyle.replace(/width:\s*[^;]+;?/g, '') + ' width: 100% !important; display: block; margin: 0 auto;')
        }

        td.appendChild(child)
        tr.appendChild(td)
      })

      tbody.appendChild(tr)
      table.appendChild(tbody)
      htmlEl.parentNode?.replaceChild(table, htmlEl)
    } else {
      htmlEl.setAttribute('style', style.replace(/display:\s*flex;?/gi, 'display: block;'))
    }
  })
}

/**
 * 扁平化列表项内的 p 标签
 */
function flattenListItems(section: HTMLElement, doc: Document): void {
  section.querySelectorAll('li').forEach((li) => {
    const hasBlockChildren = Array.from(li.children).some(child =>
      ['P', 'DIV', 'UL', 'OL', 'BLOCKQUOTE'].includes(child.tagName)
    )

    if (hasBlockChildren) {
      li.querySelectorAll('p').forEach((p) => {
        const span = doc.createElement('span')
        span.innerHTML = p.innerHTML
        const pStyle = p.getAttribute('style')
        if (pStyle) span.setAttribute('style', pStyle)
        p.parentNode?.replaceChild(span, p)
      })
    }
  })
}

/**
 * 强制样式继承 - 将字体属性应用到所有文本元素
 */
function forceStyleInheritance(section: HTMLElement, containerStyle: string): void {
  const fontMatch = containerStyle.match(/font-family:\s*([^;]+);/)
  const sizeMatch = containerStyle.match(/font-size:\s*([^;]+);/)
  const colorMatch = containerStyle.match(/color:\s*([^;]+);/)
  const lineHeightMatch = containerStyle.match(/line-height:\s*([^;]+);/)

  section.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, span').forEach((el) => {
    const htmlEl = el as HTMLElement

    // 跳过代码块内的 span
    if (htmlEl.tagName === 'SPAN' && htmlEl.closest('pre, code')) return

    let currentStyle = htmlEl.getAttribute('style') || ''

    if (fontMatch && !currentStyle.includes('font-family:')) {
      currentStyle += ` font-family: ${fontMatch[1]};`
    }
    if (lineHeightMatch && !currentStyle.includes('line-height:')) {
      currentStyle += ` line-height: ${lineHeightMatch[1]};`
    }
    if (sizeMatch && !currentStyle.includes('font-size:') && ['P', 'LI', 'BLOCKQUOTE', 'SPAN'].includes(htmlEl.tagName)) {
      currentStyle += ` font-size: ${sizeMatch[1]};`
    }
    if (colorMatch && !currentStyle.includes('color:')) {
      currentStyle += ` color: ${colorMatch[1]};`
    }

    htmlEl.setAttribute('style', currentStyle.trim())
  })
}

/**
 * 处理标点符号，防止断行
 */
function processPunctuation(section: HTMLElement, doc: Document): void {
  section.querySelectorAll('strong, b, em, span, a, code').forEach((el) => {
    const nextSibling = el.nextSibling
    if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) return

    const text = nextSibling.textContent || ''
    const match = text.match(/^(\s*)([：；，。！？、:.!?,])(.*)$/s)
    if (!match) return

    const [, , punct, rest] = match
    el.appendChild(doc.createTextNode(punct))

    if (rest) {
      nextSibling.textContent = rest
    } else {
      nextSibling.parentNode?.removeChild(nextSibling)
    }
  })
}

/**
 * 将样式内联到 HTML 元素（关键函数）
 * 参考 raphael-publish 的 applyTheme 实现
 */
export function applyInlineStyles(html: string, theme: Theme): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const style = theme.styles

  // 标题内联元素覆盖样式
  const headingInlineOverrides: Record<string, string> = {
    strong: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
    em: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
    a: 'color: inherit !important; text-decoration: none !important; border-bottom: 1px solid currentColor !important; background-color: transparent !important;',
    code: 'color: inherit !important; background-color: transparent !important; border: none !important; padding: 0 !important;',
  }

  // 遍历所有选择器并应用内联样式
  const selectors: (keyof typeof style)[] = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'li', 'blockquote', 'code', 'pre', 'pre code',
    'a', 'hr', 'th', 'td', 'table', 'img', 'strong', 'em'
  ]

  selectors.forEach((selector) => {
    if (selector === 'pre code') return // 跳过，单独处理

    const elements = doc.querySelectorAll(selector)
    elements.forEach((el) => {
      // 跳过 pre 内的 code（代码块）
      if (selector === 'code' && el.parentElement?.tagName === 'PRE') return
      // 跳过图片网格中的图片
      if (el.tagName === 'IMG' && el.closest('.image-grid')) return

      const currentStyle = el.getAttribute('style') || ''
      const newStyle = style[selector]
      if (newStyle) {
        el.setAttribute('style', currentStyle + '; ' + newStyle)
      }
    })
  })

  // 恢复列表标记（Tailwind preflight 会移除）
  doc.querySelectorAll('ul').forEach((ul) => {
    const currentStyle = ul.getAttribute('style') || ''
    ul.setAttribute('style', `${currentStyle}; list-style-type: disc !important; list-style-position: outside; padding-left: 24px;`)
  })
  doc.querySelectorAll('ul ul').forEach((ul) => {
    const currentStyle = ul.getAttribute('style') || ''
    ul.setAttribute('style', `${currentStyle}; list-style-type: circle !important;`)
  })
  doc.querySelectorAll('ul ul ul').forEach((ul) => {
    const currentStyle = ul.getAttribute('style') || ''
    ul.setAttribute('style', `${currentStyle}; list-style-type: square !important;`)
  })
  doc.querySelectorAll('ol').forEach((ol) => {
    const currentStyle = ol.getAttribute('style') || ''
    ol.setAttribute('style', `${currentStyle}; list-style-type: decimal !important; list-style-position: outside; padding-left: 24px;`)
  })

  // 处理代码高亮 span
  const hljsStyles: Record<string, string> = {
    'hljs-comment': 'color: #6a737d; font-style: italic;',
    'hljs-quote': 'color: #6a737d; font-style: italic;',
    'hljs-keyword': 'color: #d73a49; font-weight: 600;',
    'hljs-selector-tag': 'color: #d73a49; font-weight: 600;',
    'hljs-string': 'color: #032f62;',
    'hljs-title': 'color: #6f42c1; font-weight: 600;',
    'hljs-section': 'color: #6f42c1; font-weight: 600;',
    'hljs-type': 'color: #005cc5; font-weight: 600;',
    'hljs-number': 'color: #005cc5;',
    'hljs-literal': 'color: #005cc5;',
    'hljs-built_in': 'color: #005cc5;',
    'hljs-variable': 'color: #e36209;',
    'hljs-template-variable': 'color: #e36209;',
    'hljs-tag': 'color: #22863a;',
    'hljs-name': 'color: #22863a;',
    'hljs-attr': 'color: #6f42c1;',
  }

  doc.querySelectorAll('.hljs span').forEach((span) => {
    let inlineStyle = span.getAttribute('style') || ''
    if (inlineStyle && !inlineStyle.endsWith(';')) inlineStyle += '; '
    span.classList.forEach((cls) => {
      if (hljsStyles[cls]) {
        inlineStyle += hljsStyles[cls] + '; '
      }
    })
    if (inlineStyle) {
      span.setAttribute('style', inlineStyle)
    }
  })

  // 处理标题内的内联元素
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading) => {
    Object.keys(headingInlineOverrides).forEach((tag) => {
      heading.querySelectorAll(tag).forEach((node) => {
        const override = headingInlineOverrides[tag]
        node.setAttribute('style', `${node.getAttribute('style') || ''}; ${override}`)
      })
    })
  })

  // 统一图片样式
  doc.querySelectorAll('img').forEach((img) => {
    const inGrid = Boolean(img.closest('.image-grid'))
    const currentStyle = img.getAttribute('style') || ''
    const appendedStyle = inGrid
      ? 'display:block; max-width:100%; height:auto; margin:0 !important; padding:8px !important; border-radius:14px !important; box-sizing:border-box; box-shadow:0 12px 28px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.12); border:1px solid rgba(255,255,255,0.75);'
      : 'display:block; width:100%; max-width:100%; height:auto; margin:30px auto !important; padding:8px !important; border-radius:14px !important; box-sizing:border-box; box-shadow:0 16px 34px rgba(15,23,42,0.22), 0 4px 10px rgba(15,23,42,0.12); border:1px solid rgba(15,23,42,0.12);'
    img.setAttribute('style', `${currentStyle}; ${appendedStyle}`)
  })

  // 创建容器
  const container = doc.createElement('div')
  container.setAttribute('style', style.container)
  container.innerHTML = doc.body.innerHTML

  return container.outerHTML
}

/**
 * 将 HTML 转换为公众号兼容格式
 * @param html 原始 HTML 内容（已内联样式）
 * @param theme 主题对象
 * @returns 处理后的 HTML 字符串
 */
export async function makeWeChatCompatible(html: string, theme: Theme): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const containerStyle = theme.styles.container

  const rootNodes = Array.from(doc.body.children)

  const section = doc.createElement('section')
  section.setAttribute('style', containerStyle)

  rootNodes.forEach((node) => {
    if (node.tagName === 'DIV' && rootNodes.length === 1) {
      Array.from(node.childNodes).forEach((child) => section.appendChild(child))
    } else {
      section.appendChild(node)
    }
  })

  // 1. Flex 布局转 Table 布局
  convertFlexToTable(section, doc)

  // 2. 列表项扁平化
  flattenListItems(section, doc)

  // 3. 强制样式继承
  forceStyleInheritance(section, containerStyle)

  // 4. 标点符号处理
  processPunctuation(section, doc)

  // 5. 图片转 Base64
  const images = Array.from(section.querySelectorAll('img'))
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src')
      if (src && !src.startsWith('data:')) {
        img.setAttribute('src', await imageToBase64(src))
      }
    })
  )

  doc.body.innerHTML = ''
  doc.body.appendChild(section)

  // 后处理：添加零宽连接符防止断行
  let outputHtml = doc.body.innerHTML
  outputHtml = outputHtml.replace(
    /(<\/(?:strong|b|em|span|a|code)>)\s*([：；，。！？、:.!?,])/g,
    '$1\u2060$2'
  )

  return outputHtml
}
