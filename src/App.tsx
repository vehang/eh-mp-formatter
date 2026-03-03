import { useState, useMemo, useEffect } from 'react'
import { CodeMirrorEditor } from './components/CodeMirrorEditor'
import { parseMarkdown } from './utils/markdown'
import { themes, applyTheme, defaultTheme } from './themes'
import type { Theme } from './themes/types'
import 'highlight.js/styles/github-dark.css'
import './styles/preview.css'
import './App.css'

const defaultMarkdown = `# 一级标题示例

这是一段普通文字，用于测试**加粗**、*斜体*、~~删除线~~和\`行内代码\`的效果。

## 二级标题：文本样式

### 强调与修饰

- **这是加粗文字**
- *这是斜体文字*
- ***加粗且斜体***
- ~~这是删除线~~
- \`这是行内代码\`

### 列表示例

无序列表：
- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

有序列表：
1. 第一步
2. 第二步
3. 第三步

## 代码块示例

\`\`\`javascript
// JavaScript 代码示例
function greet(name) {
  console.log(\`Hello, \${name}!\`)
  return {
    message: 'Welcome',
    timestamp: Date.now()
  }
}

greet('World')
\`\`\`

## 引用块

> 这是一段引用文字。
>
> 引用块可以包含多行内容，用于展示重要信息或引述他人观点。

## 表格示例

| 功能 | 状态 | 说明 |
|------|:----:|------|
| Markdown 解析 | ✅ | 支持完整语法 |
| 主题切换 | ✅ | 5 套专业主题 |
| 代码高亮 | ✅ | 多语言支持 |
| 实时预览 | ✅ | 即时渲染 |

## 链接与分隔

这是一段包含[链接](https://github.com)的文字。

---

这是分隔线下方的文字。

---

*感谢使用公众号排版工具！*
`

function App() {
  const [markdown, setMarkdown] = useState(defaultMarkdown)
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const params = new URLSearchParams(window.location.search)
    const themeId = params.get('theme')
    return themes.find(t => t.id === themeId) || defaultTheme
  })
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [darkMode, setDarkMode] = useState(false)
  
  const html = useMemo(() => parseMarkdown(markdown), [markdown])
  
  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  const handleThemeChange = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
      applyTheme(theme)
    }
  }

  const handleClear = () => {
    if (markdown.length > 0) {
      setMarkdown('')
    }
  }

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`} style={{ background: darkMode ? 'var(--bg-secondary)' : 'var(--gray-50)' }}>
      {/* 顶部工具栏 */}
      <header 
        className="h-14 flex items-center justify-between border-b"
        style={{ 
          background: 'var(--bg-primary)', 
          borderColor: 'var(--border-primary)',
          padding: '0 var(--space-5)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white'
            }}
          >
            M
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            公众号排版工具
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 主题选择 */}
          <div className="flex items-center gap-2">
            <select 
              value={currentTheme.id}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="select"
              style={{ minWidth: '110px' }}
            >
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>
          
          {/* 代码风格 */}
          <select className="select" style={{ minWidth: '100px' }}>
            <option>GitHub</option>
            <option>OneDark</option>
            <option>Monokai</option>
          </select>
          
          {/* 预览模式切换 */}
          <div className="toggle-group">
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`toggle-btn ${previewMode === 'desktop' ? 'active' : ''}`}
            >
              电脑
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`}
            >
              手机
            </button>
          </div>
          
          {/* 夜间模式 */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="btn btn-icon btn-ghost"
            title={darkMode ? '切换到日间模式' : '切换到夜间模式'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {/* 清空 */}
          <button 
            onClick={handleClear}
            className="btn btn-ghost"
            style={{ color: 'var(--red-500)' }}
          >
            清空
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧编辑器 */}
        <div 
          className="w-1/2 flex flex-col border-r"
          style={{ 
            background: 'var(--bg-primary)', 
            borderColor: 'var(--border-primary)' 
          }}
        >
          <div 
            className="flex items-center border-b"
            style={{ 
              height: '40px',
              padding: '0 var(--space-4)',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)' }}>
              Markdown
            </span>
            <div className="flex-1" />
            <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
              {markdown.length} 字符
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeMirrorEditor
              value={markdown}
              onChange={setMarkdown}
              placeholder="在这里输入 Markdown 内容..."
            />
          </div>
        </div>

        {/* 右侧预览 */}
        <div 
          className="w-1/2 flex flex-col"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div 
            className="flex items-center justify-between border-b"
            style={{ 
              height: '40px',
              padding: '0 var(--space-4)',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                预览
              </span>
              <span 
                style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--gray-200)',
                  color: 'var(--text-tertiary)'
                }}
              >
                {currentTheme.name}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
              {previewMode === 'mobile' ? '375px' : '100%'}
            </span>
          </div>
          <div 
            className="flex-1 overflow-auto flex justify-center"
            style={{ padding: 'var(--space-5)' }}
          >
            <div 
              className="card"
              style={{ 
                width: previewMode === 'mobile' ? '375px' : '100%',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            >
              <div 
                className="overflow-auto theme-transition"
                style={{ 
                  padding: 'var(--space-5)',
                  maxHeight: 'calc(100vh - 180px)'
                }}
              >
                <div 
                  className="mp-preview"
                  style={{ maxWidth: 'none' }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部操作栏 */}
      <footer 
        className="flex items-center justify-between border-t"
        style={{ 
          height: '52px',
          padding: '0 var(--space-5)',
          background: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">
            粘贴富文本
          </button>
          <button className="btn btn-secondary">
            提取 URL
          </button>
          <button className="btn btn-secondary">
            导出 MD
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="btn btn-primary">
            复制 HTML
          </button>
          <button className="btn btn-success">
            复制纯文本
          </button>
        </div>
        
        <div className="flex items-center gap-3" style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>
          <span>{currentTheme.name}</span>
          <span>·</span>
          <span>{previewMode === 'mobile' ? '手机' : '电脑'}</span>
        </div>
      </footer>
    </div>
  )
}

export default App
