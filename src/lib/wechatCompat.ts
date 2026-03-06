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

    // 跳过代码块内的 span（section 包裹 pre 的结构）
    if (htmlEl.tagName === 'SPAN' && htmlEl.closest('pre.hljs, code')) return

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
 * 注意：已禁用，因为可能导致空格和引号问题
 */
// function processPunctuation(section: HTMLElement, doc: Document): void {
//   section.querySelectorAll('strong, b, em, span, a, code').forEach((el) => {
//     // 跳过代码块内的元素
//     if (el.closest('pre.hljs, code')) return
//
//     const nextSibling = el.nextSibling
//     if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) return
//
//     const text = nextSibling.textContent || ''
//     const match = text.match(/^(\s*)([：；，。！？、:.!?,])(.*)$/s)
//     if (!match) return
//
//     const [, , punct, rest] = match
//     el.appendChild(doc.createTextNode(punct))
//
//     if (rest) {
//       nextSibling.textContent = rest
//     } else {
//       nextSibling.parentNode?.removeChild(nextSibling)
//     }
//   })
// }

/**
 * 将样式内联到 HTML 元素（关键函数）
 * @param previewEl 预览区域的 DOM 元素，用于读取计算后的样式
 * @param theme 主题对象
 */
export function applyInlineStyles(previewEl: HTMLElement, theme: Theme): string {
  // ⭐ 使用 cloneNode 而不是 DOMParser，确保空格和换行符不丢失
  // DOMParser 会合并多个空格，导致代码格式错误
  const clone = previewEl.cloneNode(true) as HTMLElement
  const doc = document.implementation.createHTMLDocument()
  doc.body.appendChild(clone)
  const style = theme.styles

  // 标题内联元素覆盖样式
  const headingInlineOverrides: Record<string, string> = {
    strong: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
    em: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
    a: 'color: inherit !important; text-decoration: none !important; border-bottom: 1px solid currentColor !important; background-color: transparent !important;',
    code: 'color: inherit !important; background-color: transparent !important; border: none !important; padding: 0 !important;',
  }

  // ═══════════════════════════════════════════════════════════════
  // 代码块处理：完全匹配网页预览效果 + 公众号兼容
  // 核心原则：网页效果 = 公众号效果
  //
  // 关键修复：公众号编辑器不支持 white-space: pre
  // 解决方案：将普通空格替换为 &nbsp;（不间断空格）
  // ═══════════════════════════════════════════════════════════════
  const previewPreElements = previewEl.querySelectorAll('pre.hljs')
  const docPreElements = doc.querySelectorAll('pre.hljs')

  previewPreElements.forEach((previewPre, index) => {
    const docPre = docPreElements[index]
    if (!docPre) return

    // 从预览区域读取 pre 的计算样式
    const preComputed = window.getComputedStyle(previewPre)
    const bgColor = preComputed.getPropertyValue('background-color')
    const borderRadius = preComputed.getPropertyValue('border-radius')
    const marginTop = preComputed.getPropertyValue('margin-top')
    const marginBottom = preComputed.getPropertyValue('margin-bottom')
    const paddingLeft = preComputed.getPropertyValue('padding-left')
    const paddingRight = preComputed.getPropertyValue('padding-right')
    const paddingTop = preComputed.getPropertyValue('padding-top')
    const paddingBottom = preComputed.getPropertyValue('padding-bottom')

    // ⭐ pre 元素样式：完全匹配网页效果
    // 注意：不使用 white-space: pre，因为公众号不支持
    const preStyle = `
      margin: ${marginTop} 0px ${marginBottom};
      padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};
      border-radius: ${borderRadius};
      background: ${bgColor};
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, 'Liberation Mono', monospace;
      text-align: left;
    `.trim().replace(/\s+/g, ' ')

    docPre.setAttribute('style', preStyle)

    // ⭐ code 元素样式：从 code 元素读取样式
    const previewCode = previewPre.querySelector('code')
    const docCode = docPre.querySelector('code')
    if (previewCode && docCode) {
      const codeComputed = window.getComputedStyle(previewCode)
      const color = codeComputed.getPropertyValue('color')
      const fontSize = codeComputed.getPropertyValue('font-size')
      const lineHeight = codeComputed.getPropertyValue('line-height')

      const codeStyle = `
        padding: 0;
        background: transparent;
        color: ${color};
        font-size: ${fontSize};
        line-height: ${lineHeight};
        font-family: inherit;
        font-weight: 400;
        display: block;
      `.trim().replace(/\s+/g, ' ')

      docCode.setAttribute('style', codeStyle)

      // ⭐ 关键修复：将 code 内的普通空格替换为 &nbsp;，换行符替换为 <br>
      // 这样即使公众号不支持 white-space: pre，代码格式也能正确显示
      const processNode = (node: Node, parent: Element): void => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || ''
          if (text.includes(' ') || text.includes('\n')) {
            // 将空格和换行符分开处理
            const parts = text.split(/(\n)/)
            const fragment = doc.createDocumentFragment()

            parts.forEach(part => {
              if (part === '\n') {
                // 换行符替换为 <br>
                fragment.appendChild(doc.createElement('br'))
              } else if (part) {
                // 普通文本中的空格替换为不间断空格
                const textNode = doc.createTextNode(part.replace(/ /g, '\u00A0'))
                fragment.appendChild(textNode)
              }
            })

            parent.replaceChild(fragment, node)
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // 递归处理子节点（需要复制数组，因为处理过程中会修改 childNodes）
          Array.from(node.childNodes).forEach(child => processNode(child, node as Element))
        }
      }
      Array.from(docCode.childNodes).forEach(child => processNode(child, docCode))
    }
  })

  // 代码高亮 span：从预览区域读取计算后的颜色（只取颜色，不加背景）
  const previewCodeSpans = previewEl.querySelectorAll('pre.hljs span')
  const docCodeSpans = doc.querySelectorAll('pre.hljs span')

  previewCodeSpans.forEach((previewSpan, index) => {
    const docSpan = docCodeSpans[index]
    if (!docSpan) return

    const computed = window.getComputedStyle(previewSpan)
    const color = computed.getPropertyValue('color')
    const fontWeight = computed.getPropertyValue('font-weight')
    const fontStyle = computed.getPropertyValue('font-style')

    // 只设置颜色和字体样式，不设置背景
    let inlineStyle = `color: ${color};`
    if (fontWeight && fontWeight !== '400' && fontWeight !== 'normal') {
      inlineStyle += ` font-weight: ${fontWeight};`
    }
    if (fontStyle && fontStyle !== 'normal') {
      inlineStyle += ` font-style: ${fontStyle};`
    }

    docSpan.setAttribute('style', inlineStyle)
  })

  // ═══════════════════════════════════════════════════════════════
  // 常规元素处理：使用主题样式
  // ═══════════════════════════════════════════════════════════════
  const selectors: (keyof typeof style)[] = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'li', 'blockquote', 'code', 'a', 'hr', 'th', 'td', 'table', 'strong', 'em'
  ]

  selectors.forEach((selector) => {
    const elements = doc.querySelectorAll(selector)
    elements.forEach((el) => {
      // 跳过代码块内的 code（代码块已单独处理）
      if (selector === 'code' && el.closest('pre.hljs')) return

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

  // ═══════════════════════════════════════════════════════════════
  // 图片处理
  // ═══════════════════════════════════════════════════════════════
  doc.querySelectorAll('img').forEach((img) => {
    const inGrid = Boolean(img.closest('.image-grid'))
    const currentStyle = img.getAttribute('style') || ''
    const appendedStyle = inGrid
      ? 'display:block; max-width:100%; height:auto; margin:0 !important; border-radius:8px;'
      : 'display:block; width:100%; max-width:100%; height:auto; margin:20px auto; border-radius:8px;'
    img.setAttribute('style', `${currentStyle}; ${appendedStyle}`)
  })

  // ═══════════════════════════════════════════════════════════════
  // 图片注解处理：识别紧跟在图片后面的斜体文字
  // ═══════════════════════════════════════════════════════════════
  doc.querySelectorAll('p').forEach((p) => {
    // 检查是否只包含 em 元素（图片注解格式）
    const emOnly = p.children.length === 1 && p.children[0].tagName === 'EM'
    const textContent = p.textContent?.trim() || ''
    const isShortText = textContent.length < 100 // 注解通常较短

    if (emOnly && isShortText) {
      // 应用图片注解样式
      p.setAttribute('style', `
        text-align: center;
        font-size: 14px;
        color: #6B7280;
        margin-top: -12px;
        margin-bottom: 16px;
        line-height: 1.5;
      `.trim().replace(/\s+/g, ' '))
    }
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

  // 4. 标点符号处理 - 暂时禁用，可能是空格和引号问题的根源
  // processPunctuation(section, doc)

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
