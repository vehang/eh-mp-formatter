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

    // 跳过 MathJax 数学公式元素（SVG 有自己的样式系统）
    if (htmlEl.closest('mjx-container, mjx-assistive-mml, [class*="math"]')) return

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
 * 将颜色与白色背景混合，模拟 opacity 在白色背景上的视觉效果
 * 公众号不支持 opacity，用混合后的不透明颜色替代
 * @param color CSS 颜色值，如 "rgb(146, 64, 14)" 或 "#92400E"
 * @param opacity 透明度 0-1
 * @returns 混合后的 rgb() 颜色字符串，解析失败返回 null
 */
function blendWithWhite(color: string, opacity: number): string | null {
  const rgb = parseRgbColor(color)
  if (!rgb) return null
  // 混合公式：result = color * opacity + 255 * (1 - opacity)
  const r = Math.round(rgb.r * opacity + 255 * (1 - opacity))
  const g = Math.round(rgb.g * opacity + 255 * (1 - opacity))
  const b = Math.round(rgb.b * opacity + 255 * (1 - opacity))
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * 解析 CSS 颜色值为 {r, g, b}
 */
function parseRgbColor(color: string): { r: number; g: number; b: number } | null {
  // rgb(r, g, b)
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) }
  }
  // #RRGGBB
  const hexMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (hexMatch) {
    return { r: parseInt(hexMatch[1], 16), g: parseInt(hexMatch[2], 16), b: parseInt(hexMatch[3], 16) }
  }
  return null
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

  return parts.length > 0 ? parts.join('; ') + ';' : ''
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
  const headingSelectors = ['h1', 'h2', 'h3']
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
          // 有文字内容的伪元素（☀/◇ 等）→ 保留为 inline 前缀
          // 公众号不支持 opacity，用颜色混合模拟透明效果
          const opacity = parseFloat(beforeComputed.getPropertyValue('opacity').trim() || '1')
          const fontSize = beforeComputed.getPropertyValue('font-size').trim()
          const color = beforeComputed.getPropertyValue('color').trim()
          const textShadow = beforeComputed.getPropertyValue('text-shadow').trim()

          const span = doc.createElement('span')
          span.textContent = beforeText + ' '
          const styles: string[] = []

          if (color) {
            const normalizedColor = normalizeCssValue(color)
            if (opacity < 1) {
              const blended = blendWithWhite(normalizedColor, opacity)
              styles.push(`color: ${blended || normalizedColor}`)
            } else {
              styles.push(`color: ${normalizedColor}`)
            }
          }
          if (fontSize) styles.push(`font-size: ${fontSize}`)
          if (textShadow && textShadow !== 'none') {
            styles.push(`text-shadow: ${textShadow}`)
          }
          styles.push('margin-right: 4px')

          span.setAttribute('style', styles.join('; '))
          dHeading.insertBefore(span, dHeading.firstChild)
        } else {
          // 无文字的装饰（content:'' 的装饰条/圆点）
          const beforeTag = dHeading.tagName.toLowerCase()
          const pointerEvents = beforeComputed.getPropertyValue('pointer-events').trim()

          if (beforeTag === 'h1' && pointerEvents !== 'none') {
            // H1 ::before 有视觉属性但无文字（如默认主题的左侧竖条装饰）
            // pointer-events:none 的是 mask 边框效果，无法在公众号复制，跳过
            const span = doc.createElement('span')
            const bStyles: string[] = ['display: inline-block', 'vertical-align: middle']

            const bw = beforeComputed.getPropertyValue('width').trim()
            const bh = beforeComputed.getPropertyValue('height').trim()
            if (bw && bw !== 'auto' && bw !== '0px') bStyles.push(`width: ${bw}`)
            if (bh && bh !== 'auto' && bh !== '0px') bStyles.push(`height: ${bh}`)

            // Background: gradient → solid color，混合 opacity
            const bBgImage = beforeComputed.getPropertyValue('background-image').trim()
            const bBgColor = beforeComputed.getPropertyValue('background-color').trim()
            const bOpacity = parseFloat(beforeComputed.getPropertyValue('opacity').trim() || '1')

            if (bBgImage && bBgImage !== 'none' && bBgImage.includes('linear-gradient')) {
              const downgraded = downgradeGradient(bBgImage)
              if (downgraded) {
                if (bOpacity < 1 && downgraded.cssValue) {
                  const blended = blendWithWhite(downgraded.cssValue, bOpacity)
                  bStyles.push(`background-color: ${blended || downgraded.cssValue}`)
                } else {
                  bStyles.push(`${downgraded.cssProp}: ${downgraded.cssValue}`)
                }
              }
            } else if (bBgColor && bBgColor !== 'rgba(0, 0, 0, 0)' && bBgColor !== 'transparent') {
              const colorValue = normalizeCssValue(bBgColor)
              if (bOpacity < 1) {
                const blended = blendWithWhite(colorValue, bOpacity)
                bStyles.push(`background-color: ${blended || colorValue}`)
              } else {
                bStyles.push(`background-color: ${colorValue}`)
              }
            }

            const bBr = beforeComputed.getPropertyValue('border-radius').trim()
            if (bBr && bBr !== '0px') bStyles.push(`border-radius: ${bBr}`)

            bStyles.push('margin-right: 8px')
            span.setAttribute('style', bStyles.join('; '))
            dHeading.insertBefore(span, dHeading.firstChild)
          } else {
            // 非 H1 或 pointer-events:none → 隐藏
            const span = doc.createElement('span')
            span.setAttribute('style', 'display: none;')
            dHeading.insertBefore(span, dHeading.firstChild)
          }
        }
      }

      // 处理 ::after
      const afterComputed = window.getComputedStyle(pHeading, '::after')
      const afterRawContent = afterComputed.getPropertyValue('content')

      if (afterRawContent !== 'none' && pseudoHasVisual(afterComputed, afterRawContent)) {
        const span = doc.createElement('span')
        const textContent = extractPseudoContent(afterRawContent)

        if (textContent) {
          // 有文字内容的 ::after（✿/☽/❀/◆ 等装饰图标）
          // 跟 ::before 图标一样处理：转成 inline span + blendWithWhite 模拟 opacity
          const afterOpacity = parseFloat(afterComputed.getPropertyValue('opacity').trim() || '1')
          const afterFontSize = afterComputed.getPropertyValue('font-size').trim()
          const afterColor = afterComputed.getPropertyValue('color').trim()
          const afterStyles: string[] = []

          if (afterColor) {
            const normalizedColor = normalizeCssValue(afterColor)
            if (afterOpacity < 1) {
              const blended = blendWithWhite(normalizedColor, afterOpacity)
              afterStyles.push(`color: ${blended || normalizedColor}`)
            } else {
              afterStyles.push(`color: ${normalizedColor}`)
            }
          }
          if (afterFontSize) afterStyles.push(`font-size: ${afterFontSize}`)
          afterStyles.push('margin-left: 4px')

          span.textContent = ' ' + textContent
          span.setAttribute('style', afterStyles.join('; '))
          dHeading.appendChild(span)
        } else {
          // ═══ 底部装饰条 → block 级，不用 absolute 定位 ═══
          const styles: string[] = ['display: block']

        // 处理 background-image (linear-gradient → 降级纯色)
        const bgImage = afterComputed.getPropertyValue('background-image').trim()
        const bgColor = afterComputed.getPropertyValue('background-color').trim()

        // 公众号不支持 opacity，需要把 opacity 混合到颜色中
        const afterOpacity = parseFloat(afterComputed.getPropertyValue('opacity').trim() || '1')

        if (bgImage && bgImage !== 'none' && bgImage.includes('linear-gradient')) {
          const downgraded = downgradeGradient(bgImage)
          if (downgraded) {
            // 如果有 opacity，把颜色混合到不透明
            if (afterOpacity < 1 && downgraded.cssValue) {
              const blended = blendWithWhite(downgraded.cssValue, afterOpacity)
              if (blended) {
                styles.push(`${downgraded.cssProp}: ${blended}`)
              } else {
                styles.push(`${downgraded.cssProp}: ${downgraded.cssValue}`)
              }
            } else {
              styles.push(`${downgraded.cssProp}: ${downgraded.cssValue}`)
            }
          }
        } else if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          // 把 opacity 混合进 background-color
          const colorValue = normalizeCssValue(bgColor)
          if (afterOpacity < 1) {
            const blended = blendWithWhite(colorValue, afterOpacity)
            styles.push(`background-color: ${blended || colorValue}`)
          } else {
            styles.push(`background-color: ${colorValue}`)
          }
        }

        // 高度（装饰条的关键属性）
        const height = afterComputed.getPropertyValue('height').trim()
        if (height && height !== 'auto' && height !== '0px') {
          styles.push(`height: ${height}`)
        }

        // 宽度 — H1/H2 装饰条特殊处理
        const tagName = dHeading.tagName.toLowerCase()
        const afterWidth = afterComputed.getPropertyValue('width').trim()
        if (tagName === 'h2') {
          // H2 装饰条应该跟标题文字对齐，用固定宽度或 auto
          // 预览中 position:absolute 的 width 就是实际宽度
          styles.push(`width: ${afterWidth !== 'auto' && afterWidth !== '0px' ? afterWidth : '80px'}`)
        } else {
          // H1 装饰条撑满宽度
          styles.push('width: calc(100% - 20px)')
        }

        // 不输出 opacity（公众号不支持），已在颜色中混合

        // 圆角处理（仅 H2，H1 改用 border-bottom 方案不需要圆角处理）
        if (tagName !== 'h1') {
          let borderRadius = afterComputed.getPropertyValue('border-radius').trim()
          if (borderRadius && borderRadius !== '0px') {
            const radii = borderRadius.split(/\s+/).map(v => parseFloat(v) || 0)
            if (radii.length === 4) {
              const decoHeight = height && height !== 'auto' && height !== '0px' ? parseFloat(height) : 3
              const clamped = radii.map(r => Math.min(r, decoHeight))
              borderRadius = clamped.join('px ') + 'px'
            }
            styles.push(`border-radius: ${borderRadius}`)
          }
        }

        // 上下间距 — 装饰条要紧贴标题底部
        // H1 装饰条用负 margin-top 紧贴标题；H2 装饰条覆盖在 border-bottom 上
        if (tagName === 'h1') {
          styles.push('margin: 0 auto')
        } else if (tagName === 'h2') {
          // H2 装饰条在外部，需要负 margin-top 抵消 H2 的 padding-bottom + margin-bottom
          // 把装饰条拉到 border-bottom 位置重叠
          const h2Computed = window.getComputedStyle(pHeading)
          const h2PaddingBottom = parseFloat(h2Computed.getPropertyValue('padding-bottom')) || 0
          const h2MarginBottom = parseFloat(h2Computed.getPropertyValue('margin-bottom')) || 0
          const decoH = height && height !== 'auto' && height !== '0px' ? parseFloat(height) : 3
          // 居中重叠：抵消 padding + margin + 装饰条高度/2
          const offset = h2PaddingBottom + h2MarginBottom + decoH / 2
          styles.push(`margin-top: -${offset}px`)
        } else {
          const marginTop = afterComputed.getPropertyValue('margin-top').trim()
          if (marginTop && marginTop !== '0px') styles.push(`margin-top: ${marginTop}`)
        }

        span.setAttribute('style', styles.join('; '))
        
        const decoSection = doc.createElement('section')
        decoSection.setAttribute('style', styles.join('; ') + '; font-size: 0; line-height: 0; overflow: hidden;')
        decoSection.innerHTML = '&nbsp;'
        
        if (dHeading.parentElement) {
          if (tagName === 'h2') {
            // H2 特殊处理：把虚线和装饰条放进同一个容器内重叠，避免被 H2 遮挡
            const h2Computed = window.getComputedStyle(pHeading)
            const borderW = parseFloat(h2Computed.getPropertyValue('border-bottom-width')) || 0
            const borderStyle = h2Computed.getPropertyValue('border-bottom-style').trim()
            const borderColor = normalizeCssValue(h2Computed.getPropertyValue('border-bottom-color').trim())

            // 去掉 H2 自身的 border-bottom 和 padding-bottom（在容器内重建虚线）
            const h2Style = dHeading.getAttribute('style') || ''
            const h2NewStyle = h2Style
              .replace(/border-bottom:\s*[^;]+;?/gi, '')
              .replace(/padding-bottom:\s*[^;]+;?/gi, '')
              .trim()
            dHeading.setAttribute('style', h2NewStyle)

            const decoH = parseFloat(height) || 3
            const bgColorMatch = styles.find(s => s.startsWith('background-color'))
            const bgColor = bgColorMatch ? bgColorMatch.split(':')[1].trim() : 'rgb(245, 158, 11)'

            // 测量 H2 文本的实际渲染宽度（用 Range API 精确测量文字宽度）
            const range = document.createRange()
            range.selectNodeContents(pHeading)
            const textWidth = Math.round(range.getBoundingClientRect().width)
            // 加上 ::before 伪元素（如◇图标）的宽度，Range API 无法测量伪元素
            const h2Before = window.getComputedStyle(pHeading, '::before')
            const h2BeforeContent = h2Before.getPropertyValue('content')
            let beforeExtra = 0
            if (h2BeforeContent && h2BeforeContent !== 'none') {
              const bText = h2BeforeContent.replace(/^["']|["']$/g, '')
              if (bText) {
                beforeExtra = (parseFloat(h2Before.getPropertyValue('width')) || 0)
                  + (parseFloat(h2Before.getPropertyValue('margin-right')) || 0)
                  + (parseFloat(h2Before.getPropertyValue('padding-left')) || 0)
                  + (parseFloat(h2Before.getPropertyValue('padding-right')) || 0)
              }
            }
            // 当 ::before 是 position:absolute 时，它不占文本流空间
            // 但 padding-left 为图标预留了位置，装饰条需要覆盖整个 padding+文本 区域
            // 预览区 fit-content 宽度 = paddingLeft + textWidth（::before absolute 不影响 fit-content）
            // 所以装饰条宽度应该用 paddingLeft + textWidth 而不是 textWidth + beforeWidth
            const h2CS = window.getComputedStyle(pHeading)
            const h2PaddingLeft = parseFloat(h2CS.paddingLeft) || 0
            let decoWidth: number
            if (beforeExtra > 0 && h2Before.getPropertyValue('position') === 'absolute') {
              // ::before 是 absolute（如 warm-sun 的 ◇ 图标），padding-left 为图标预留空间
              // 装饰条宽度 = padding-left + textWidth（匹配预览区 fit-content 宽度）
              decoWidth = Math.max(h2PaddingLeft + textWidth, 40)
            } else if (beforeExtra > 0) {
              // ::before 是 inline/非 absolute，直接加宽度
              decoWidth = Math.max(textWidth + beforeExtra, 40)
            } else {
              // 无 ::before 图标，纯文本宽度
              decoWidth = Math.max(textWidth, 40)
            }

            if (borderW > 0 && borderStyle && borderStyle !== 'none') {
              // 容器：虚线 + 装饰条在同一层内重叠
              const container = doc.createElement('section')
              container.setAttribute('style', 'margin: 0 0 14px 0; padding: 0; line-height: 0; font-size: 0;')

              // 虚线（100% 宽度）
              const dashLine = doc.createElement('section')
              dashLine.setAttribute('style', `border-bottom: ${borderW}px ${borderStyle} ${borderColor}; height: 0; width: 100%; font-size: 0; line-height: 0; overflow: hidden;`)
              dashLine.innerHTML = '&nbsp;'
              container.appendChild(dashLine)

              // 装饰条（宽度跟随文本，margin-top: 0 与虚线重叠）
              const decoLine = doc.createElement('section')
              decoLine.setAttribute('style', `height: ${decoH}px; background-color: ${bgColor}; width: ${decoWidth}px; border-radius: 2px; margin-top: 0; padding: 0; font-size: 0; line-height: 0;`)
              decoLine.innerHTML = '&nbsp;'
              container.appendChild(decoLine)

              dHeading.parentElement.insertBefore(container, dHeading.nextSibling)
            } else {
              // 无虚线：只输出装饰条（宽度跟随文本）
              const decoLine = doc.createElement('section')
              decoLine.setAttribute('style', `height: ${decoH}px; background-color: ${bgColor}; width: ${decoWidth}px; border-radius: 2px; margin: 0 0 14px 0; padding: 0; font-size: 0; line-height: 0;`)
              decoLine.innerHTML = '&nbsp;'
              dHeading.parentElement.insertBefore(decoLine, dHeading.nextSibling)
            }
          } else {
            // H1：不用 section 做装饰条，改用 border-bottom 方案
            // H1 本身有 border-radius（卡片圆角），底边自然带圆角，3px 高度也能完美弧度
            const decoH = height && height !== 'auto' && height !== '0px' ? parseFloat(height) : 3
            // 找到装饰条的背景色
            const bgColorMatch = styles.find(s => s.startsWith('background-color:'))
            const decoBgColor = bgColorMatch ? bgColorMatch.split(':').slice(1).join(':').trim() : ''
            if (decoBgColor && decoH > 0) {
              // 给 H1 添加 border-bottom，圆角由 H1 自身的 border-radius 决定
              const h1Style = dHeading.getAttribute('style') || ''
              dHeading.setAttribute('style', h1Style + `; border-bottom: ${decoH}px solid ${decoBgColor}`)
            }
          }
        }
        }
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

  // ⭐ 代码块标题栏：给 wrapper/header/圆点/语言名加内联样式（复制到公众号需要）
  const previewWrappers = previewEl.querySelectorAll('.code-block-wrapper')
  const docWrappers = doc.querySelectorAll('.code-block-wrapper')

  previewWrappers.forEach((previewWrapper, index) => {
    const docWrapper = docWrappers[index]
    if (!docWrapper) return

    // wrapper 样式
    const wrapperComputed = window.getComputedStyle(previewWrapper)
    const wrapperBg = wrapperComputed.getPropertyValue('background-color')
    docWrapper.setAttribute('style', [
      'margin: 20px 0',
      'border-radius: 12px',
      'overflow: hidden',
      `background: ${wrapperBg}`,
    ].join('; '))

    // header 样式
    const previewHeader = previewWrapper.querySelector('.code-block-header')
    const docHeader = docWrapper.querySelector('.code-block-header')
    if (previewHeader && docHeader) {
      const headerComputed = window.getComputedStyle(previewHeader)
      const headerBg = headerComputed.getPropertyValue('background-color')
      const headerColor = headerComputed.getPropertyValue('color')
      docHeader.setAttribute('style', [
        'padding: 8px 12px',
        `background: ${headerBg}`,
        `color: ${headerColor}`,
        'border-bottom: 1px solid rgba(128, 128, 128, 0.15)',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'font-size: 12px',
        'overflow: hidden',
      ].join('; '))

      // 三圆点：公众号不支持 span background-color，用 unicode 实心圆 ● + color
      const dotColors = ['#FF5F57', '#FEBC2E', '#28C840']
      docHeader.querySelectorAll('.code-dot').forEach((dot, i) => {
        const dotEl = dot as HTMLElement
        dotEl.innerHTML = '●'
        dotEl.setAttribute('style', [
          'font-size: 10px',
          `color: ${dotColors[i]}`,
          'margin-right: 6px',
          'line-height: 1',
        ].join('; '))
      })

      // 语言名内联样式（颜色跟随主题，模拟 opacity: 0.6 效果）
      const langEl = docHeader.querySelector('.code-block-lang')
      const previewLangEl = previewHeader.querySelector('.code-block-lang')
      if (langEl && previewLangEl) {
        // 从预览区读取语言名的计算颜色（已经包含 header color + opacity 的最终值）
        const langComputed = window.getComputedStyle(previewLangEl)
        const langColor = langComputed.getPropertyValue('color')
        langEl.setAttribute('style', [
          'font-size: 11px',
          `color: ${langColor}`,
          'letter-spacing: 0.5px',
          'float: right',
          'line-height: 20px',
          'padding-right: 4px',
        ].join('; '))
      }

      // 去掉复制按钮（公众号不需要）
      const copyBtn = docHeader.querySelector('.code-block-copy-btn')
      if (copyBtn) copyBtn.remove()
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

      // h1/h2 移除 padding-left：预览中 padding-left 是给 ::before 装饰条留的空间，
      // 公众号不支持 absolute 定位，装饰条已被转为 display:none 或 inline 文字，
      // 保留 padding-left 会导致左侧出现空白间隔
      // 同时显式设置 padding-left: 0 覆盖公众号默认样式
      if (selector === 'h1' || selector === 'h2') {
        const currentStyle = dEl.getAttribute('style') || ''
        // 移除 padding-left 属性值（可能从 extractInlineStyles 或 computed style 来）
        let cleaned = currentStyle
          .replace(/padding-left:\s*[^;]+;?/g, '')
          .replace(/padding:\s*([^;]+)/g, (match, val) => {
            // 如果有 padding shorthand，把 left 值改为 0
            const parts = val.trim().split(/\s+/)
            if (parts.length === 4) {
              return `padding: ${parts[0]} ${parts[1]} ${parts[2]} 0px`
            } else if (parts.length === 3) {
              return `padding: ${parts[0]} ${parts[1]} ${parts[2]}`
            } else if (parts.length === 2) {
              return `padding: ${parts[0]} ${parts[1]}`
            }
            return match
          })
        // 显式添加 padding-left: 0 和 margin-left: 0 覆盖公众号默认值
        cleaned += ' padding-left: 0; margin-left: 0;'
        // H1: 移除 border-radius（公众号不支持渐变背景，圆角无意义且可能导致间距问题）
        if (selector === 'h1') {
          cleaned = cleaned.replace(/border-radius:\s*[^;]+;?/g, '')
        }
        dEl.setAttribute('style', cleaned)
      }
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // MathJax 数学公式处理：SVG 内联样式适配公众号
  // MathJax 输出 SVG，公众号支持 SVG，但需要：
  // 1. 移除 mjx-container 的辅助属性（jax/tabindex 等）
  // 2. 把 SVG 的 width/height 属性转为内联 style（公众号不识别属性只识别 style）
  // 参考：Markdown2Html (mdnice) 的 solveWeChatMath 方案
  // ═══════════════════════════════════════════════════════════════

  const mjxContainers = doc.querySelectorAll('mjx-container')
  mjxContainers.forEach((mjx) => {
    const el = mjx as HTMLElement
    // 移除 MathJax 辅助属性
    el.removeAttribute('jax')
    el.removeAttribute('tabindex')
    el.removeAttribute('ctxtmenu_counter')

    // 处理 SVG：把 width/height 属性转为内联 style
    const svg = el.querySelector('svg')
    if (svg) {
      const width = svg.getAttribute('width')
      const height = svg.getAttribute('height')
      if (width) {
        svg.style.width = width
        svg.removeAttribute('width')
      }
      if (height) {
        svg.style.height = height
        svg.removeAttribute('height')
      }
      // 确保内联显示
      svg.style.display = 'inline'
      svg.style.verticalAlign = 'middle'
    }

    // 隐藏 MathML fallback 文本（公众号会把它显示出来，导致出现两份公式）
    const mathEl = el.querySelector('math')
    if (mathEl) {
      mathEl.setAttribute('style', 'display: none;')
    }

    // 块级公式居中
    if (el.hasAttribute('display') || el.classList.contains('math-display')) {
      el.setAttribute('style', 'display: block; text-align: center; margin: 0.5em 0;')
      el.removeAttribute('display')
    } else {
      el.setAttribute('style', 'display: inline;')
    }
  })

  // 兼容：如果还有残留的 KaTeX 元素（旧版），也做处理
  doc.querySelectorAll('.katex-mathml').forEach((el) => {
    el.setAttribute('style', 'display: none;')
  })

  // HR 单独处理（预览区没有直接对应的渲染元素）
  doc.querySelectorAll('hr').forEach((el) => {
    el.setAttribute('style', style.hr)
  })

  // ═══════════════════════════════════════════════════════════════
  // 伪元素转换：将 h1/h2 的 ::before/::after 装饰转为真实 <span>
  // ═══════════════════════════════════════════════════════════════
  convertPseudoElements(previewEl, doc)

  // ═══════════════════════════════════════════════════════════════
  // 列表处理：微信公众号对 list-style 支持极差，需要完全模拟
  // 策略：关闭原生 list-style，用字符前缀（• ◦ ▪ / 数字.）+ padding-left 模拟
  // ═══════════════════════════════════════════════════════════════

  // 收集所有 li 及其对应的预览 li（一次性建立索引，避免重复查询）
  const allDocLis = Array.from(doc.querySelectorAll('li'))
  const allPreviewLis = Array.from(previewEl.querySelectorAll('li'))

  // 为每个 li 计算嵌套深度
  function getListDepth(li: Element): number {
    let depth = 0
    let parent = li.parentElement
    while (parent) {
      if (parent.tagName === 'UL' || parent.tagName === 'OL') depth++
      parent = parent.parentElement
    }
    return depth
  }

  // 获取 li 的有序序号（在同级 li 中的位置）
  function getOlIndex(li: Element): number {
    const parent = li.parentElement
    if (!parent) return 1
    let index = 0
    for (const child of Array.from(parent.children)) {
      if (child.tagName === 'LI') {
        index++
        if (child === li) return index
      }
    }
    return 1
  }

  // 每个嵌套层级的 bullet 字符
  const ulBullets = ['•', '◦', '▪', '▫']

  allDocLis.forEach((li, liIndex) => {
    const previewLi = allPreviewLis[liIndex]
    const parentList = li.parentElement
    if (!parentList) return

    const isOl = parentList.tagName === 'OL'
    const depth = getListDepth(li)
    const olIndex = getOlIndex(li)

    // 读取 marker 颜色（从预览区的 ::marker）
    const markerColor = previewLi
      ? normalizeCssValue(window.getComputedStyle(previewLi, '::marker').getPropertyValue('color').trim())
      : ''

    // 关闭原生 list-style（公众号不支持）
    const currentStyle = li.getAttribute('style') || ''
    let newStyle = currentStyle
      .replace(/list-style[^;]*;?/gi, '')
      .replace(/display:\s*list-item;?/gi, '')
      .replace(/padding-left:\s*[^;]+;?/gi, '') // 先移除旧的 padding-left（来自 extractInlineStyles）
      .replace(/margin-top:\s*[^;]+;?/gi, '') // 移除 li 默认 margin，避免列表项间空白行
      .replace(/margin-bottom:\s*[^;]+;?/gi, '')
      .trim()

    // 第一级贴边，之后每级递增 16px（1个字宽）
    // 悬挂缩进：padding-left 包含 bullet 宽度，text-indent 负值让 bullet 突出
    const baseIndent = (depth - 1) * 16
    const bulletWidth = isOl ? 22 : 16
    newStyle += `; padding-left: ${baseIndent + bulletWidth}px; margin-left: 0; list-style: none; text-indent: -${bulletWidth}px;`

    // 移除 li 上可能被之前的 color 设置（marker 颜色模拟用 span 的 color）
    newStyle = newStyle.replace(/color:\s*[^;]+;?/gi, '').trim()

    li.setAttribute('style', newStyle)

    // 创建 bullet 前缀 span
    const bulletSpan = doc.createElement('span')
    const bulletChar = isOl ? `${olIndex}.` : (ulBullets[(depth - 1) % ulBullets.length] || '•')
    bulletSpan.textContent = bulletChar + ' '
    bulletSpan.setAttribute('style', `color: ${markerColor || '#F59E0B'}; font-weight: bold;`)

    // 把 li 的非子列表内容包裹起来
    const childNodes = Array.from(li.childNodes)
    const contentWrapper = doc.createElement('span')
    const textColor = previewLi
      ? normalizeCssValue(window.getComputedStyle(previewLi).getPropertyValue('color').trim())
      : '#1E293B'
    contentWrapper.setAttribute('style', `color: ${textColor};`)

    childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element
        if (el.tagName !== 'UL' && el.tagName !== 'OL') {
          contentWrapper.appendChild(el.cloneNode(true))
          li.removeChild(el)
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        contentWrapper.appendChild(node.cloneNode(true))
        li.removeChild(node)
      }
    })

    // 插入：bullet + 内容
    li.insertBefore(contentWrapper, li.firstChild)
    li.insertBefore(bulletSpan, li.firstChild)
  })

  // 处理 ul/ol 本身：区分顶层和嵌套
  doc.querySelectorAll('ul, ol').forEach(list => {
    // 判断是否是嵌套列表（父元素是 li）
    const isNested = list.parentElement?.tagName === 'LI'
    const currentStyle = list.getAttribute('style') || ''
    const cleaned = currentStyle
      .replace(/list-style[^;]*;?/gi, '')
      .replace(/padding-left:\s*[^;]+;?/gi, '')
      .replace(/margin-left:\s*[^;]+;?/gi, '')
      .trim()
    if (isNested) {
      // 嵌套子列表：保留缩进空间，不设 padding-left（缩进由 li 控制）
      list.setAttribute('style', `${cleaned}; list-style: none; margin-left: 0; padding-left: 0; margin-top: 0; margin-bottom: 0;`)
    } else {
      // 顶层列表：完全清零
      list.setAttribute('style', `${cleaned}; list-style: none; margin-left: 0; padding-left: 0;`)
    }
  })

  // ═══════════════════════════════════════════════════════════════
  // 将 ul/ol/li 替换为 section，并打平嵌套结构
  // 公众号会给嵌套 block 元素加默认间距，每多一层就多缩进
  // 解决方案：li 直接挂到其顶层 ul/ol 的父级，中间的嵌套 section 移除
  // ═══════════════════════════════════════════════════════════════
  
  // 第一步：替换所有 ul/ol/li 为 section（保留属性和子节点）
  const listElements = doc.querySelectorAll('ul, ol, li')
  listElements.forEach(el => {
    const section = doc.createElement('section')
    for (const attr of Array.from(el.attributes)) {
      section.setAttribute(attr.name, attr.value)
    }
    while (el.firstChild) {
      section.appendChild(el.firstChild)
    }
    el.parentNode?.replaceChild(section, el)
  })

  // 第二步：打平嵌套
  // 策略：找到每个"顶层列表容器"（有 list-style 的 section 且父元素不是 section），
  // 把它下面的所有 text-indent section（原 li）提升到该容器的父级，
  // 然后移除空的中间容器
  const allSections = Array.from(doc.querySelectorAll('section'))
  
  // 找所有容器 section（有 list-style 无 text-indent）
  const containers = allSections.filter(s => {
    const style = s.getAttribute('style') || ''
    return /list-style/.test(style) && !/text-indent/.test(style)
  })
  
  // 找顶层容器：父元素不是 section 的那些（即紧挨 H2/p 等的 ul/ol）
  const topContainers = containers.filter(c => {
    const parent = c.parentElement
    return !parent || parent.tagName !== 'SECTION'
  })
  
  // 对每个顶层容器：把里面所有 text-indent section 提升到它的父级
  topContainers.forEach(topContainer => {
    const listItemSections = topContainer.querySelectorAll('section')
    const items = Array.from(listItemSections).filter(s => {
      const style = s.getAttribute('style') || ''
      return /text-indent/.test(style)
    })
    
    const parent = topContainer.parentElement
    if (!parent) return
    
    // 在顶层容器后面依次插入所有列表项（保持顺序）
    let insertRef = topContainer.nextSibling
    items.forEach(item => {
      parent.insertBefore(item, insertRef)
    })
    
    // 移除所有空的中间容器 section（列表项已移走，容器无意义）
    // 条件：没有 text-indent（不是列表项）且内容为空
    const middleContainers = topContainer.querySelectorAll('section')
    Array.from(middleContainers).forEach(c => {
      const style = c.getAttribute('style') || ''
      if (!/text-indent/.test(style)) {
        c.parentNode?.removeChild(c)
      }
    })
    
    // 移除顶层容器本身（如果已空）
    if (!topContainer.textContent?.trim()) {
      topContainer.parentNode?.removeChild(topContainer)
    }
  })

  // 最终清理：移除所有内容为空且不含 text-indent 的 section（可能残留）
  // 但保留装饰条：装饰条 section 有 font-size: 0 或 line-height: 0
  const allSectionsFinal = Array.from(doc.querySelectorAll('section'))
  allSectionsFinal.forEach(s => {
    const style = s.getAttribute('style') || ''
    const isDeco = /font-size:\s*0/.test(style) || /line-height:\s*0/.test(style)
    if (!/text-indent/.test(style) && !s.textContent?.trim() && !isDeco) {
      s.parentNode?.removeChild(s)
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

  // H2 修复：移除 border-bottom/padding-bottom/margin-bottom（虚线已移到容器内）
  // 显式设为 0 覆盖公众号默认样式
  outputHtml = outputHtml.replace(
    /(<h2\b[^>]*style=")([^"]*)(")/gi,
    (_match, prefix, style, suffix) => {
      let cleaned = style
        .replace(/border-bottom:\s*[^;]+;?/gi, '')
        .replace(/padding-bottom:\s*[^;]+;?/gi, '')
        .replace(/margin-bottom:\s*[^;]+;?/gi, '')
        .trim()
      if (cleaned && !cleaned.endsWith(';')) cleaned += ';'
      cleaned += ' padding-bottom: 0; margin-bottom: 0;'
      return prefix + cleaned + suffix
    }
  )

  // H1 修复：减小 padding-top/padding-bottom，移除 margin-bottom
  outputHtml = outputHtml.replace(
    /(<h1\b[^>]*style=")([^"]*)(")/gi,
    (_match, prefix, style, suffix) => {
      let cleaned = style
        .replace(/margin-bottom:\s*[^;]+;?/gi, '')
        .replace(/padding-top:\s*[^;]+;?/gi, '')
        .replace(/padding-bottom:\s*[^;]+;?/gi, '')
        .trim()
      if (cleaned && !cleaned.endsWith(';')) cleaned += ';'
      cleaned += ' padding-top: 4px; padding-bottom: 4px; margin-bottom: 0;'
      return prefix + cleaned + suffix
    }
  )

  // 代码块处理：区分"有标题栏"和"无标题栏"两种模式
  // 1. no-title 模式：去掉 wrapper，只保留 pre（恢复圆角）
  outputHtml = outputHtml.replace(
    /<div class="code-block-wrapper no-title"[^>]*>([\s\S]*?)<pre([^>]*)>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/gi,
    (_match, _gap, preAttrs, codeContent) => {
      // 恢复圆角
      if (preAttrs.includes('border-radius')) {
        return `<pre${preAttrs.replace(/border-radius:\s*0px;?/gi, 'border-radius: 12px;')}>${codeContent}</pre>`
      }
      return `<pre${preAttrs} style="border-radius: 12px;">${codeContent}</pre>`
    }
  )

  // 2. 有标题栏模式：保留 wrapper+header，转为公众号友好的结构
  outputHtml = outputHtml.replace(
    /<div class="code-block-wrapper"([^>]*)>([\s\S]*?)<div class="code-block-header"([^>]*)>([\s\S]*?)<div class="code-block-dots"[^>]*>([\s\S]*?)<\/div>([\s\S]*?)<\/div>([\s\S]*?)<pre([^>]*)>([\s\S]*?)<\/pre>[\s\S]*?<\/div>/gi,
    (_match, wrapperAttrs, _gap1, headerAttrs, _gap2, dotsContent, gap3, _gap4, preAttrs, codeContent) => {
      // dotsContent: 三个 code-dot span（已用 unicode ● + color）
      // gap3: 语言名 span（复制按钮已被 applyInlineStyles 删除）
      const headerContent = dotsContent.trim() + gap3.trim()
      return [
        `<section${wrapperAttrs}>`,
        `<section${headerAttrs}>`,
        headerContent,
        '</section>',
        `<pre${preAttrs}>`,
        codeContent,
        '</pre>',
        '</section>'
      ].join('')
    }
  )

  return outputHtml
}
