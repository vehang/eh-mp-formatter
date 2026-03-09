import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
// @ts-ignore - katex 模块没有类型定义
import katex from '@traptitech/markdown-it-katex'

// 创建 markdown-it 实例
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        // ignore
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
// @ts-ignore - katex 插件类型不兼容
}).use(katex)

export function parseMarkdown(content: string): string {
  return md.render(content)
}

export { md }
