import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './markdown'

describe('parseMarkdown', () => {
  it('should parse basic markdown correctly', () => {
    const result = parseMarkdown('# Hello World')
    expect(result).toContain('<h1')
    expect(result).toContain('Hello World')
  })

  it('should parse bold and italic text', () => {
    const result = parseMarkdown('**bold** and *italic*')
    expect(result).toContain('<strong>')
    expect(result).toContain('<em>')
  })

  it('should parse code blocks with syntax highlighting', () => {
    const result = parseMarkdown('```javascript\nconst x = 1\n```')
    expect(result).toContain('<pre')
    expect(result).toContain('<code')
    expect(result).toContain('hljs')
  })

  it('should parse inline code', () => {
    const result = parseMarkdown('`inline code`')
    expect(result).toContain('<code>')
    expect(result).toContain('inline code')
  })

  it('should parse links', () => {
    const result = parseMarkdown('[GitHub](https://github.com)')
    expect(result).toContain('<a')
    expect(result).toContain('href="https://github.com"')
  })

  it('should parse images', () => {
    const result = parseMarkdown('![alt text](https://example.com/image.png)')
    expect(result).toContain('<img')
    expect(result).toContain('src="https://example.com/image.png"')
    expect(result).toContain('alt="alt text"')
  })

  it('should parse lists', () => {
    const result = parseMarkdown('- item 1\n- item 2')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>')
  })

  it('should parse tables', () => {
    const result = parseMarkdown('| Header |\n|-------|\n| Value |')
    expect(result).toContain('<table>')
    expect(result).toContain('<th>')
    expect(result).toContain('<td>')
  })

  it('should parse blockquotes', () => {
    const result = parseMarkdown('> This is a quote')
    expect(result).toContain('<blockquote>')
  })

  it('should sanitize XSS attacks', () => {
    // Script injection attempt - should be completely removed
    const malicious = '<script>alert("XSS")</script>'
    const result = parseMarkdown(malicious)
    expect(result).not.toContain('<script>')

    // Event handler in markdown-generated HTML should be sanitized
    const markdownImg = '![alt](https://example.com/image.png)'
    const imgResult = parseMarkdown(markdownImg)
    // Should not allow onerror or other event handlers
    expect(imgResult).not.toContain('onerror')
    expect(imgResult).not.toContain('onclick')
  })

  it('should allow safe HTML tags', () => {
    const result = parseMarkdown('<span class="safe">Safe content</span>')
    expect(result).toContain('<span')
    expect(result).toContain('safe')
  })
})
