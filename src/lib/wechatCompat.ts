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
  const fontMatch = containerStyle.match(/(?:^|;\s*)font-family:\s*([^;]+);/)
  const sizeMatch = containerStyle.match(/(?:^|;\s*)font-size:\s*([^;]+);/)
  // 注意：用 (?:^|;\s*) 前缀避免匹配到 background-color 中的 color
  const colorMatch = containerStyle.match(/(?:^|;\s*)color:\s*([^;]+);/)
  const lineHeightMatch = containerStyle.match(/(?:^|;\s*)line-height:\s*([^;]+);/)

  section.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, span').forEach((el) => {
    const htmlEl = el as HTMLElement

    // 跳过代码块内的 span（section 包裹 pre 的结构）
    if (htmlEl.tagName === 'SPAN' && htmlEl.closest('pre.hljs, code')) return

    // 跳过 KaTeX/MathJax 数学公式元素（它们有自己的精确排版字体，不能被覆盖）
    if (htmlEl.closest('.katex, .katex-display, .katex-block, mjx-container, [class*="math"]')) return

    // 跳过伪元素转换生成的装饰 span（它们不需要继承字体样式）
    if (htmlEl.tagName === 'SPAN' && htmlEl.getAttribute('style')?.includes('pointer-events: none')) return

    let currentStyle = htmlEl.getAttribute('style') || ''

    // 确保以分号结尾再追加，防止属性粘连
    if (currentStyle && !currentStyle.trimEnd().endsWith(';')) {
      currentStyle += ';'
    }

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
 * 将 CSS color(srgb R G B / A) 函数转换为 rgba() —— 公众号不支持 color() 语法
 */
function normalizeCssValue(value: string): string {
  return value.replace(
    /color\(srgb\s+([\d.]+(?:e[+-]?\d+)?)\s+([\d.]+(?:e[+-]?\d+)?)\s+([\d.]+(?:e[+-]?\d+)?)(?:\s*\/\s*([\d.]+(?:e[+-]?\d+)?))?\)/g,
    (_match: string, r: string, g: string, b: string, a?: string) => {
      const ri = Math.round(parseFloat(r) * 255)
      const gi = Math.round(parseFloat(g) * 255)
      const bi = Math.round(parseFloat(b) * 255)
      const ai = a !== undefined ? parseFloat(a) : 1
      return `rgba(${ri}, ${gi}, ${bi}, ${ai})`
    }
  )
}

/**
 * 将 linear-gradient 降级为纯色（公众号不支持渐变）
 * 提取第一个色值作为 background-color
 */
function downgradeGradient(value: string): { cssProp: string; cssValue: string } | null {
  // 匹配 linear-gradient 的第一个色值
  // 注意：色值可能是 color(srgb R G B / A) 格式，包含括号嵌套
  // 策略：找到第一个逗号后，提取到下一个逗号或末尾括号
  const commaIdx = value.indexOf(',')
  if (commaIdx === -1) return null

  const afterComma = value.substring(commaIdx + 1).trim()

  // 提取第一个色值（可能包含括号嵌套如 color(srgb ...)）
  let depth = 0
  let endIdx = 0
  for (let i = 0; i < afterComma.length; i++) {
    if (afterComma[i] === '(') depth++
    else if (afterComma[i] === ')') {
      if (depth > 0) depth--
      else { endIdx = i; break } // 外层闭括号 = gradient 结束
    }
    else if (afterComma[i] === ',' && depth === 0) { endIdx = i; break }
  }
  if (endIdx === 0) endIdx = afterComma.length

  let firstColor = afterComma.substring(0, endIdx).trim()
  // 处理带透明度格式：rgba(0, 0, 0, 0) → 透明，跳过
  if (firstColor === 'rgba(0, 0, 0, 0)' || firstColor === 'transparent') return null

  // 可能包含百分比: "rgb(146, 64, 14) 0%" → 提取颜色部分
  const colorOnly = firstColor.replace(/\s+\d+%?\s*$/, '').trim()
  return { cssProp: 'background-color', cssValue: normalizeCssValue(colorOnly) }
}

/**
 * 从预览元素的计算样式中提取有意义的属性，生成公众号兼容的内联样式
 */
function extractInlineStyles(computed: CSSStyleDeclaration): string {
  const parts: string[] = []

  // 需要提取的属性列表
  const props: Array<{ name: string; skipDefaults: string[] }> = [
    { name: 'color', skipDefaults: [] },
    { name: 'font-size', skipDefaults: [] },
    { name: 'font-weight', skipDefaults: ['400', 'normal'] },
    { name: 'font-family', skipDefaults: [] },
    { name: 'font-style', skipDefaults: ['normal'] },
    { name: 'line-height', skipDefaults: [] },
    { name: 'letter-spacing', skipDefaults: ['normal'] },
    { name: 'text-align', skipDefaults: ['start', 'left'] },
    { name: 'text-decoration', skipDefaults: ['none'] },
    { name: 'text-shadow', skipDefaults: ['none'] },
    { name: 'word-spacing', skipDefaults: ['normal'] },
    { name: 'background-color', skipDefaults: ['rgba(0, 0, 0, 0)', 'transparent'] },
    { name: 'background-image', skipDefaults: ['none'] },
    { name: 'border-left', skipDefaults: [] },
    { name: 'border-top', skipDefaults: [] },
    { name: 'border-bottom', skipDefaults: [] },
    { name: 'border-radius', skipDefaults: ['0px'] },
    { name: 'margin-top', skipDefaults: [] },
    { name: 'margin-bottom', skipDefaults: [] },
    { name: 'margin-left', skipDefaults: [] },
    { name: 'margin-right', skipDefaults: [] },
    { name: 'padding-top', skipDefaults: ['0px'] },
    { name: 'padding-bottom', skipDefaults: ['0px'] },
    { name: 'padding-left', skipDefaults: ['0px'] },
    { name: 'padding-right', skipDefaults: ['0px'] },
    { name: 'box-shadow', skipDefaults: ['none'] },
    { name: 'display', skipDefaults: [] },
    // 不提取 width/max-width —— 内部元素应自动铺满容器宽度，硬编码 width 会导致背景色不铺满
  ]

  for (const { name, skipDefaults } of props) {
    const val = computed.getPropertyValue(name).trim()
    if (!val) continue
    // 跳过默认值
    if (skipDefaults.some(dv => val === dv)) continue
    // 跳过 border 默认值（如 "0px none rgb(0, 0, 0)"）
    // 注意：border-radius 值如 "0px 12px 12px 0px" 不应被跳过，只跳过 border-left/top/bottom
    if (name.startsWith('border-') && name !== 'border-radius' && (val.startsWith('0px') || val === 'none')) continue

    // 公众号不支持 linear-gradient → 直接跳过
    // 原因：降级为纯色 background-color 效果完全不同（渐变有方向性），
    // 例如 h1 的 135deg 渐变降级后变成整个块都有背景色，预览中却是透明。
    // 与其输出错误的纯色背景，不如跳过让标题保持无背景。
    if (name === 'background-image' && val.includes('linear-gradient')) {
      continue
    }

    parts.push(`${name}: ${normalizeCssValue(val)}`)
  }

  return parts.join('; ')
}

/**
 * 将标题的 ::before / ::after 伪元素转换为真实 <span> 元素（公众号不支持伪元素）
 */
/**
 * 从 CSS content 属性值中提取纯文本（去掉引号）
 */
function extractPseudoContent(raw: string): string {
  if (!raw || raw === 'none') return ''
  // content 可能是 "text", 'text', 或混合值
  // 去掉外层引号
  const match = raw.match(/^["'](.+?)["']$/)
  return match ? match[1] : raw.replace(/["']/g, '')
}

/**
 * 判断伪元素是否有视觉效果
 * 支持：背景色/渐变、固定尺寸（装饰条）、文字内容+颜色/字号
 */
function pseudoHasVisual(cs: CSSStyleDeclaration, rawContent: string): boolean {
  // 1. 有非透明背景色
  const bg = cs.getPropertyValue('background-color').trim()
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return true

  // 2. 有背景图片（渐变等）
  const bgImage = cs.getPropertyValue('background-image').trim()
  if (bgImage && bgImage !== 'none') return true

  // 3. 有非零尺寸的装饰元素（装饰条/圆点等）
  const w = cs.getPropertyValue('width').trim()
  const h = cs.getPropertyValue('height').trim()
  if ((w && w !== 'auto' && w !== '0px') || (h && h !== 'auto' && h !== '0px')) return true

  // 4. 有文字内容 + 可见样式（颜色/字号/阴影）
  const text = extractPseudoContent(rawContent)
  if (text) {
    const color = cs.getPropertyValue('color').trim()
    const fontSize = cs.getPropertyValue('font-size').trim()
    const textShadow = cs.getPropertyValue('text-shadow').trim()
    // 有文字且有颜色或字号说明是装饰文字
    if (color || fontSize || textShadow !== 'none') return true
  }

  return false
}

function convertPseudoElements(
  previewEl: HTMLElement,
  doc: Document
): void {
  const headingSelectors = ['h1', 'h2']
  headingSelectors.forEach(selector => {
    const previewHeadings = previewEl.querySelectorAll(selector)
    const docHeadings = doc.querySelectorAll(selector)

    previewHeadings.forEach((pHeading, index) => {
      const dHeading = docHeadings[index] as HTMLElement | undefined
      if (!dHeading) return

      // ═══ ::before — 转 inline 文字 ═══
      // ☀/◇ 等伪元素在预览中用 position:absolute 定位（公众号不支持 absolute），
      // 降级方案：转成 inline 文字前缀，保留图标但去掉绝对定位。
      // 对于默认样式的 ::before（content:'' 的装饰条/圆点），保持原有 block 级处理。
      const beforeComputed = window.getComputedStyle(pHeading, '::before')
      const beforeRawContent = beforeComputed.getPropertyValue('content')

      if (beforeRawContent !== 'none' && pseudoHasVisual(beforeComputed, beforeRawContent)) {
        const beforeText = extractPseudoContent(beforeRawContent)

        if (beforeText) {
          // 有文字内容的伪元素（☀/◇ 等）→ inline 文字前缀
          const span = doc.createElement('span')
          span.textContent = beforeText
          const color = beforeComputed.getPropertyValue('color').trim()
          const fontSize = beforeComputed.getPropertyValue('font-size').trim()
          const opacity = beforeComputed.getPropertyValue('opacity').trim()
          const styles: string[] = []
          if (color) styles.push(`color: ${normalizeCssValue(color)}`)
          if (fontSize) styles.push(`font-size: ${fontSize}`)
          if (opacity && opacity !== '1') styles.push(`opacity: ${opacity}`)
          if (styles.length > 0) span.setAttribute('style', styles.join('; '))
          dHeading.insertBefore(span, dHeading.firstChild)
        } else {
          // 无文字的装饰（装饰条/圆点）→ block 级元素
          const span = doc.createElement('span')
          const styles: string[] = ['display: block']

          const bgImage = beforeComputed.getPropertyValue('background-image').trim()
          const bgColor = beforeComputed.getPropertyValue('background-color').trim()

          if (bgImage && bgImage !== 'none' && bgImage.includes('linear-gradient')) {
            const downgraded = downgradeGradient(bgImage)
            if (downgraded) {
              styles.push(`${downgraded.cssProp}: ${downgraded.cssValue}`)
            }
          } else if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            styles.push(`background-color: ${normalizeCssValue(bgColor)}`)
          }

          const w = beforeComputed.getPropertyValue('width').trim()
          const h = beforeComputed.getPropertyValue('height').trim()
          if (w && w !== 'auto' && w !== '0px') styles.push(`width: ${w}`)
          if (h && h !== 'auto' && h !== '0px') styles.push(`height: ${h}`)

          const borderRadius = beforeComputed.getPropertyValue('border-radius').trim()
          if (borderRadius && borderRadius !== '0px') styles.push(`border-radius: ${borderRadius}`)

          span.setAttribute('style', styles.join('; '))
          dHeading.insertBefore(span, dHeading.firstChild)
        }
      }

      // 处理 ::after
      const afterComputed = window.getComputedStyle(pHeading, '::after')
      const afterRawContent = afterComputed.getPropertyValue('content')

      if (afterRawContent !== 'none' && pseudoHasVisual(afterComputed, afterRawContent)) {
        const span = doc.createElement('span')
        const textContent = extractPseudoContent(afterRawContent)

        if (textContent) {
          span.textContent = textContent
        }

        // ═══ 底部装饰条 → block 级，不用 absolute 定位 ═══
        const styles: string[] = ['display: block']

        // 处理 background-image (linear-gradient → 降级纯色)
        const bgImage = afterComputed.getPropertyValue('background-image').trim()
        const bgColor = afterComputed.getPropertyValue('background-color').trim()

        if (bgImage && bgImage !== 'none' && bgImage.includes('linear-gradient')) {
          const downgraded = downgradeGradient(bgImage)
          if (downgraded) {
            styles.push(`${downgraded.cssProp}: ${downgraded.cssValue}`)
          }
        } else if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          styles.push(`background-color: ${normalizeCssValue(bgColor)}`)
        }

        // 高度（装饰条的关键属性）
        const height = afterComputed.getPropertyValue('height').trim()
        if (height && height !== 'auto' && height !== '0px') {
          styles.push(`height: ${height}`)
        }

        // 宽度 — 使用 100% 自适应，不硬编码像素值
        // （computed style 返回的是渲染后的像素值如 504px，公众号中容器宽度不同会错位）
        styles.push('width: 100%')

        // 透明度
        const opacity = afterComputed.getPropertyValue('opacity').trim()
        if (opacity && opacity !== '1') styles.push(`opacity: ${opacity}`)

        // 圆角
        const borderRadius = afterComputed.getPropertyValue('border-radius').trim()
        if (borderRadius && borderRadius !== '0px') styles.push(`border-radius: ${borderRadius}`)

        // 上下间距
        const marginTop = afterComputed.getPropertyValue('margin-top').trim()
        if (marginTop && marginTop !== '0px') styles.push(`margin-top: ${marginTop}`)

        span.setAttribute('style', styles.join('; '))
        dHeading.appendChild(span)
      }
    })
  })
}

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
  // 常规元素处理：从预览 DOM 读取真实渲染样式（保证预览=复制效果）
  // ═══════════════════════════════════════════════════════════════
  const computedStyleSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'li', 'blockquote', 'code', 'a', 'th', 'td', 'table', 'tr', 'strong', 'em'
  ]

  computedStyleSelectors.forEach((selector) => {
    const previewEls = previewEl.querySelectorAll(selector)
    const docEls = doc.querySelectorAll(selector)

    previewEls.forEach((pEl, index) => {
      const dEl = docEls[index] as HTMLElement | undefined
      if (!dEl) return

      // 跳过代码块内的 code（代码块已单独处理）
      if (selector === 'code' && dEl.closest('pre.hljs')) return

      const computed = window.getComputedStyle(pEl)

      // tr 特殊处理：只需提取 background-color 用于交替行背景
      if (selector === 'tr') {
        const bg = computed.getPropertyValue('background-color').trim()
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          dEl.setAttribute('style', `background-color: ${normalizeCssValue(bg)}`)
        }
        return
      }

      const inlineStyle = extractInlineStyles(computed)

      if (inlineStyle) {
        dEl.setAttribute('style', inlineStyle)
      }
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // KaTeX 数学公式处理：内联布局样式（公众号不支持 KaTeX CSS 类）
  // 策略：为 .katex-html 内每个元素内联 display/position/font-size/margin
  // 等布局属性，确保公众号中排版结构正确。
  // 字体降级为 serif（公众号无法加载 KaTeX 专用字体）
  // ═══════════════════════════════════════════════════════════════

  // 隐藏 .katex-mathml（辅助阅读，公众号不需要）
  doc.querySelectorAll('.katex-mathml').forEach((el) => {
    el.setAttribute('style', 'display: none;')
  })

  // 为 .katex-html 内每个元素内联关键布局样式
  const katexHtmlBlocks = doc.querySelectorAll('.katex-html')
  katexHtmlBlocks.forEach((katexHtmlBlock) => {
    const previewKatexHtmlBlocks = previewEl.querySelectorAll('.katex-html')
    // 找到对应的预览区 .katex-html（通过索引匹配）
    const blockIndex = Array.from(doc.querySelectorAll('.katex-html')).indexOf(katexHtmlBlock)
    const previewKatexHtml = previewKatexHtmlBlocks[blockIndex]
    if (!previewKatexHtml) return

    // 遍历 doc 中 .katex-html 内的所有 span
    const docSpans = katexHtmlBlock.querySelectorAll('span')
    const previewSpans = previewKatexHtml.querySelectorAll('span')

    docSpans.forEach((docSpan, spanIndex) => {
      const previewSpan = previewSpans[spanIndex] as HTMLElement | undefined
      if (!previewSpan) return

      const computed = window.getComputedStyle(previewSpan)

      // 保留已有的 inline style（如 strut 的 height, mspace 的 margin-right）
      // 先解析已有 inline style 中的属性名，避免 computedStyle 重复覆盖
      const existingStyle = docSpan.getAttribute('style')?.trim() || ''
      const existingProps = new Set<string>()
      if (existingStyle) {
        existingStyle.split(';').forEach((part) => {
          const colonIdx = part.indexOf(':')
          if (colonIdx > 0) {
            existingProps.add(part.substring(0, colonIdx).trim())
          }
        })
      }

      // 收集关键布局属性（包括 KaTeX 布局所需的 table/overflow 属性）
      // 注意：不读取 bottom/left/right，因为 KaTeX 只用 top 做定位，
      // computedStyle 会自动算出 bottom 值（= -top），这在公众号中会造成额外偏移
      const layoutProps = [
        'display', 'position', 'top',
        'vertical-align', 'text-align',
        'font-size', 'font-style', 'font-weight',
        'line-height', 'letter-spacing',
        'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border-top-width', 'border-bottom-width',
        'border-collapse', 'border-spacing',
        'overflow',
        'width', 'height',
      ]

      const skipDefaults: Record<string, string[]> = {
        'position': ['static'],
        'top': ['auto'],
        'vertical-align': ['baseline'],
        'text-align': ['start', 'left'],
        'font-style': ['normal'],
        'letter-spacing': ['normal'],
        'border-top-width': ['0px'],
        'border-bottom-width': ['0px'],
        'border-collapse': ['separate'],
        'border-spacing': ['0px 0px', 'normal'],
        'overflow': ['visible'],
        'width': ['auto'],
        'height': ['auto'],
      }

      const parts: string[] = []

      for (const prop of layoutProps) {
        // 如果已有 inline style 中包含此属性，跳过（保留原始值，如 top:-3.063em）
        if (existingProps.has(prop)) continue
        const val = computed.getPropertyValue(prop).trim()
        if (!val) continue
        const defaults = skipDefaults[prop] || []
        if (defaults.some(d => val === d)) continue
        parts.push(`${prop}: ${val}`)
      }

      // 字体降级：KaTeX_Math / KaTeX_Main → serif
      if (!existingProps.has('font-family')) {
        const fontFamily = computed.getPropertyValue('font-family').trim()
        const downgradedFont = fontFamily
          .replace(/KaTeX_Math[^,]*,?\s*/g, '')
          .replace(/KaTeX_Main[^,]*,?\s*/g, '')
          .replace(/KaTeX_Size[^,]*,?\s*/g, '')
          .replace(/KaTeX_AMS[^,]*,?\s*/g, '')
          .replace(/,\s*$/, '')
          .trim()
        if (downgradedFont && downgradedFont !== 'serif') {
          parts.push(`font-family: ${downgradedFont}`)
        } else {
          parts.push('font-family: serif')
        }
      }

      // 颜色
      if (!existingProps.has('color')) {
        const color = computed.getPropertyValue('color').trim()
        if (color && color !== 'rgb(0, 0, 0)') {
          parts.push(`color: ${color}`)
        }
      }

      const newStyle = parts.join('; ')

      // 合并：computedStyle 的新属性在前，原始 inline style 在后
      if (existingStyle) {
        docSpan.setAttribute('style', `${newStyle}; ${existingStyle}`)
      } else {
        docSpan.setAttribute('style', newStyle)
      }
    })

    // .katex-html 自身也需要样式
    const previewKatexHtmlComputed = window.getComputedStyle(previewKatexHtml)
    const katexHtmlDisplay = previewKatexHtmlComputed.getPropertyValue('display').trim()
    const katexHtmlStyle = doc.querySelector(`.katex-html:nth-of-type(${blockIndex + 1})`)
    if (katexHtmlBlock) {
      const currentStyle = (katexHtmlBlock as HTMLElement).getAttribute('style') || ''
      ;(katexHtmlBlock as HTMLElement).setAttribute('style', `${currentStyle}; display: ${katexHtmlDisplay};`.replace(/^;\s*/, ''))
    }
  })

  // HR 单独处理（预览区没有直接对应的渲染元素）
  doc.querySelectorAll('hr').forEach((el) => {
    el.setAttribute('style', style.hr)
  })

  // ═══════════════════════════════════════════════════════════════
  // 伪元素转换：将 h1/h2 的 ::before/::after 装饰转为真实 <span>
  // ═══════════════════════════════════════════════════════════════
  convertPseudoElements(previewEl, doc)

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
