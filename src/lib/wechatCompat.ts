import { themes } from '../themes'
import type { Theme } from '../themes/types'

/**
 * 将图片 URL 转换为 Base64 编码
 * 公众号不支持外部图片链接，需要转换为内联 base64
 */
async function imageToBase64(url: string): Promise<string> {
  // 已经是 base64 格式，直接返回
  if (url.startsWith('data:')) {
    return url
  }

  try {
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'default'
    })

    if (!response.ok) {
      return url
    }

    const blob = await response.blob()

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        if (typeof result === 'string') {
          resolve(result)
        } else {
          resolve(url)
        }
      }
      reader.onerror = () => resolve(url)
      reader.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}

/**
 * 获取主题的容器样式字符串
 */
function getContainerStyle(theme: Theme): string {
  const c = theme.colors
  const styles = [
    `background-color: ${c.background}`,
    `color: ${c.text}`,
    `font-size: 16px`,
    `line-height: 1.8`,
    `padding: 20px`,
    `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif`
  ]
  return styles.join('; ')
}

/**
 * 将 Flex 布局转换为 Table 布局
 * 公众号编辑器对 flex 布局支持不佳
 */
function convertFlexToTable(section: HTMLElement, doc: Document): void {
  // 查找所有可能是 flex 布局的元素
  const flexElements = section.querySelectorAll('div, p')

  flexElements.forEach((el) => {
    // 跳过代码块内的元素
    if (el.closest('pre, code')) return

    const htmlEl = el as HTMLElement
    const style = htmlEl.getAttribute('style') || ''

    // 检测是否为 flex 布局
    const isFlex = style.includes('display: flex') || style.includes('display:flex')
    if (!isFlex) return

    const children = Array.from(htmlEl.children)

    // 检查是否全部是图片元素
    const allImages = children.every(
      (child) => child.tagName === 'IMG' || child.querySelector('img')
    )

    if (allImages && children.length > 0) {
      // 转换为 table 布局
      const table = doc.createElement('table')
      table.setAttribute(
        'style',
        'width: 100%; border-collapse: collapse; margin: 16px 0; border: none;'
      )

      const tbody = doc.createElement('tbody')
      const tr = doc.createElement('tr')
      tr.setAttribute('style', 'border: none; background: transparent;')

      children.forEach((child) => {
        const td = doc.createElement('td')
        td.setAttribute(
          'style',
          'padding: 0 4px; vertical-align: top; border: none; background: transparent;'
        )

        // 如果是图片，调整宽度
        if (child.tagName === 'IMG') {
          const img = child as HTMLImageElement
          const currentStyle = img.getAttribute('style') || ''
          // 移除原有宽度设置，设置为 100%
          const newStyle = currentStyle
            .replace(/width:\s*[^;]+;?/g, '')
            .trim()
          img.setAttribute(
            'style',
            `${newStyle} width: 100%; display: block; margin: 0 auto;`
          )
        }

        td.appendChild(child)
        tr.appendChild(td)
      })

      tbody.appendChild(tr)
      table.appendChild(tbody)
      htmlEl.parentNode?.replaceChild(table, htmlEl)
    } else {
      // 非图片 flex 元素，移除 flex 属性
      const newStyle = style
        .replace(/display:\s*flex;?/gi, 'display: block;')
        .trim()
      htmlEl.setAttribute('style', newStyle)
    }
  })
}

/**
 * 扁平化列表项
 * 将 li 内的 p 标签转换为 span，避免样式问题
 */
function flattenListItems(section: HTMLElement, doc: Document): void {
  const listItems = section.querySelectorAll('li')

  listItems.forEach((li) => {
    const ps = li.querySelectorAll('p')

    ps.forEach((p) => {
      // 创建 span 替换 p
      const span = doc.createElement('span')
      span.innerHTML = p.innerHTML

      // 保留 p 的样式
      const pStyle = p.getAttribute('style')
      if (pStyle) {
        span.setAttribute('style', pStyle)
      }

      p.parentNode?.replaceChild(span, p)
    })
  })
}

/**
 * 强制样式继承
 * 公众号编辑器会覆盖继承的字体样式，需要手动应用到每个元素
 */
function forceStyleInheritance(section: HTMLElement, containerStyle: string): void {
  // 从容器样式中提取字体属性
  const fontMatch = containerStyle.match(/font-family:\s*([^;]+);/)
  const sizeMatch = containerStyle.match(/font-size:\s*([^;]+);/)
  const colorMatch = containerStyle.match(/color:\s*([^;]+);/)
  const lineHeightMatch = containerStyle.match(/line-height:\s*([^;]+);/)

  // 需要强制应用样式的文本元素
  const textElements = section.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, span')

  textElements.forEach((el) => {
    const htmlEl = el as HTMLElement

    // 跳过代码块内的 span（保留语法高亮）
    if (htmlEl.tagName === 'SPAN' && htmlEl.closest('pre, code')) {
      return
    }

    let currentStyle = htmlEl.getAttribute('style') || ''

    // 添加缺失的字体属性
    if (fontMatch && !currentStyle.includes('font-family:')) {
      currentStyle += ` font-family: ${fontMatch[1]};`
    }

    if (lineHeightMatch && !currentStyle.includes('line-height:')) {
      currentStyle += ` line-height: ${lineHeightMatch[1]};`
    }

    // 只对特定元素添加 font-size（避免影响标题大小）
    const shouldAddFontSize = ['P', 'LI', 'BLOCKQUOTE', 'SPAN'].includes(htmlEl.tagName)
    if (sizeMatch && !currentStyle.includes('font-size:') && shouldAddFontSize) {
      currentStyle += ` font-size: ${sizeMatch[1]};`
    }

    if (colorMatch && !currentStyle.includes('color:')) {
      currentStyle += ` color: ${colorMatch[1]};`
    }

    htmlEl.setAttribute('style', currentStyle.trim())
  })
}

/**
 * 处理标点符号
 * 使用零宽连接符防止标点符号与前面的强调文本断行
 */
function processPunctuation(section: HTMLElement, doc: Document): void {
  // 可能后面跟着标点的内联元素
  const inlineElements = section.querySelectorAll('strong, b, em, span, a, code')

  inlineElements.forEach((el) => {
    const nextSibling = el.nextSibling
    if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) return

    const text = nextSibling.textContent || ''
    // 匹配开头的中文或英文标点
    const match = text.match(/^(\s*)([：；，。！？、:.!?,])(.*)$/s)
    if (!match) return

    const [, _whitespace, punct, rest] = match

    // 将标点移到元素内部
    el.appendChild(doc.createTextNode(punct))

    // 更新或删除文本节点
    if (rest) {
      nextSibling.textContent = rest
    } else {
      nextSibling.parentNode?.removeChild(nextSibling)
    }
  })
}

/**
 * 将所有图片转换为 Base64
 */
async function convertImagesToBase64(section: HTMLElement): Promise<void> {
  const images = Array.from(section.querySelectorAll('img'))

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src')
      if (src && !src.startsWith('data:')) {
        const base64 = await imageToBase64(src)
        img.setAttribute('src', base64)
      }
    })
  )
}

/**
 * 将 HTML 转换为公众号兼容格式
 * @param html 原始 HTML 内容
 * @param themeId 主题 ID
 * @returns 处理后的 HTML 字符串
 */
export async function makeWeChatCompatible(
  html: string,
  themeId: string
): Promise<string> {
  // 解析 HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // 获取主题
  const theme = themes.find((t) => t.id === themeId) || themes[0]
  const containerStyle = getContainerStyle(theme)

  // 获取 body 的所有子元素
  const rootNodes = Array.from(doc.body.children)

  // 创建 section 作为根元素
  const section = doc.createElement('section')
  section.setAttribute('style', containerStyle)

  // 将内容移动到 section 中
  rootNodes.forEach((node) => {
    // 如果只有一个 div 根元素，展开其内容
    if (node.tagName === 'DIV' && rootNodes.length === 1) {
      Array.from(node.childNodes).forEach((child) => {
        section.appendChild(child)
      })
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
  await convertImagesToBase64(section)

  // 构建最终 HTML
  doc.body.innerHTML = ''
  doc.body.appendChild(section)

  // 后处理：在行内元素后的标点前添加零宽连接符，防止断行
  let outputHtml = doc.body.innerHTML
  outputHtml = outputHtml.replace(
    /(<\/(?:strong|b|em|span|a|code)>)\s*([：；，。！？、:.!?,])/g,
    '$1\u2060$2'
  )

  return outputHtml
}
