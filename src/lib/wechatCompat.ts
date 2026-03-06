import { themes } from '../themes'

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
 * 将 Flex 布局转换为 Table 布局
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
      table.setAttribute('style', 'width: 100%; border-collapse: collapse; margin: 16px 0; border: none;')

      const tbody = doc.createElement('tbody')
      const tr = doc.createElement('tr')
      tr.setAttribute('style', 'border: none; background: transparent;')

      children.forEach((child) => {
        const td = doc.createElement('td')
        td.setAttribute('style', 'padding: 0 4px; vertical-align: top; border: none; background: transparent;')

        if (child.tagName === 'IMG') {
          const img = child as HTMLImageElement
          const currentStyle = img.getAttribute('style') || ''
          img.setAttribute('style', currentStyle.replace(/width:\s*[^;]+;?/g, '') + ' width: 100%; display: block; margin: 0 auto;')
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
    li.querySelectorAll('p').forEach((p) => {
      const span = doc.createElement('span')
      span.innerHTML = p.innerHTML
      const pStyle = p.getAttribute('style')
      if (pStyle) span.setAttribute('style', pStyle)
      p.parentNode?.replaceChild(span, p)
    })
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
 * 将 HTML 转换为公众号兼容格式
 * @param html 原始 HTML 内容（已内联样式）
 * @param themeId 主题 ID
 * @returns 处理后的 HTML 字符串
 */
export async function makeWeChatCompatible(html: string, themeId: string): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const theme = themes.find((t) => t.id === themeId) || themes[0]
  const c = theme.colors
  const containerStyle = [
    `background-color: ${c.background}`,
    `color: ${c.text}`,
    `font-size: 16px`,
    `line-height: 1.8`,
    `padding: 20px`,
    `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif`
  ].join('; ')

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
