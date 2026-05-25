import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
// @ts-ignore - mathjax 模块没有类型定义
import mathjax from 'markdown-it-mathjax3'

// 常用语言列表，用于自动检测时提高准确率
const COMMON_LANGUAGES = [
  // 配置文件
  'yaml', 'json', 'xml', 'properties', 'ini', 'toml',
  // 编程语言
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp',
  'php', 'ruby', 'swift', 'kotlin', 'scala', 'perl',
  // 脚本/Shell
  'bash', 'shell', 'powershell', 'dockerfile', 'makefile',
  // 前端
  'html', 'css', 'scss', 'less', 'vue', 'jsx', 'tsx',
  // 数据/查询
  'sql', 'graphql',
  // 其他
  'markdown', 'plaintext'
]

// 创建 markdown-it 实例
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string): string {
    // 如果指定了语言且支持，使用指定语言高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        const langLabel = lang.charAt(0).toUpperCase() + lang.slice(1)
        return `<pre class="hljs" data-language="${langLabel}"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        // ignore
      }
    }
    // 没有指定语言时，在常用语言中自动检测，提高准确率
    try {
      const result = hljs.highlightAuto(str, COMMON_LANGUAGES)
      const detectedLang = result.language || ''
      const langLabel = detectedLang ? detectedLang.charAt(0).toUpperCase() + detectedLang.slice(1) : ''
      return `<pre class="hljs" data-language="${langLabel}"><code>${result.value}</code></pre>`
    } catch {
      // 自动检测失败，返回纯文本
      return `<pre class="hljs" data-language=""><code>${md.utils.escapeHtml(str)}</code></pre>`
    }
  }
// @ts-ignore - mathjax 插件类型不兼容
}).use(mathjax)

/**
 * 解析 Markdown 并进行安全清理
 * @param content - Markdown 内容
 * @returns 清理后的 HTML 字符串
 */
export function parseMarkdown(content: string): string {
  const rawHtml = md.render(content)
  // 使用 DOMPurify 清理 XSS 攻击向量，但保留必要的 HTML 标签
  const sanitized = DOMPurify.sanitize(rawHtml, {
    // 允许的标签（保留 markdown 渲染所需的所有标签）
    ALLOWED_TAGS: [
      // 基础标签
      'p', 'br', 'span', 'div', 'a', 'img',
      // 标题
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // 列表
      'ul', 'ol', 'li',
      // 文本格式
      'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'mark', 'code', 'pre',
      // 引用和块
      'blockquote', 'hr',
      // 表格
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // 其他
      'sup', 'sub', 'abbr', 'cite', 'q', 'dfn', 'kbd', 'samp', 'var',
      // 数学公式（MathJax SVG 输出）
      'mjx-container', 'svg', 'path', 'g', 'rect', 'use', 'defs',
      'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'mfrac', 'msup', 'msub',
      'munder', 'mover', 'munderover', 'mtext', 'mspace', 'mstyle', 'merror',
      'mpadded', 'mphantom', 'mfenced', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd',
      // 脚注
      'section', 'article', 'aside', 'header', 'footer', 'nav',
      // 按钮（代码块复制按钮）
      'button',
    ],
    // 允许的属性
    ALLOWED_ATTR: [
      // 通用属性
      'class', 'id', 'style',
      // 链接属性
      'href', 'title', 'target', 'rel',
      // 图片属性
      'src', 'alt', 'width', 'height', 'loading',
      // 代码块属性
      'data-language',
      // 表格属性
      'colspan', 'rowspan', 'align', 'valign',
      // SVG 属性（MathJax 输出）
      'viewBox', 'preserveAspectRatio', 'd', 'transform', 'fill', 'stroke',
      'stroke-width', 'opacity', 'x', 'y', 'rx', 'ry', 'cx', 'cy', 'r',
      'xlink:href', 'xmlns:xlink', 'focusable', 'role',
      // MathJax 属性
      'jax', 'display', 'tabindex', 'ctxtmenu_counter',
      // 数学公式属性
      'xmlns', 'mathvariant', 'mathsize', 'mathcolor', 'mathbackground',
      'stretchy', 'symmetric', 'maxsize', 'minsize', 'largeop', 'movablelimits',
      'accent', 'accentunder', 'delimiterheight', 'linethickness', 'scriptlevel',
      'scriptminfontsize', 'scriptsizemultiplier', 'fence', 'separator', 'form',
      'notation', 'open', 'close', 'separators',
    ],
    // 允许 data-* 属性
    ALLOW_DATA_ATTR: true,
  })

  // 后处理：给 <pre> 包裹代码块标题栏（苹果风格）
  const wrapped = sanitized.replace(
    /<pre\s+class="hljs"\s+data-language="([^"]*)">([\s\S]*?)<\/pre>/g,
    (_match, lang, codeContent) => {
      const lower = lang.toLowerCase()
      const langMap: Record<string, string> = {
        js: 'JavaScript', ts: 'TypeScript', py: 'Python', rb: 'Ruby',
        sh: 'Shell', yml: 'YAML', yaml: 'YAML', md: 'Markdown',
        json: 'JSON', html: 'HTML', css: 'CSS', sql: 'SQL',
        java: 'Java', go: 'Go', rs: 'Rust', cpp: 'C++', c: 'C',
      }
      const display = langMap[lower] || (lang.charAt(0).toUpperCase() + lang.slice(1))
      return `<div class="code-block-wrapper"><div class="code-block-header"><div class="code-block-dots"><span class="code-dot code-dot-red">&#8203;</span><span class="code-dot code-dot-yellow">&#8203;</span><span class="code-dot code-dot-green">&#8203;</span></div><span class="code-block-lang">${display}</span><button class="code-block-copy-btn" title="复制代码">复制</button></div><pre class="hljs" data-language="${lang}">${codeContent}</pre></div>`
    }
  )
  return wrapped
}

export { md }
