import { useState, useMemo, useEffect } from 'react'
import { CodeMirrorEditor } from './components/CodeMirrorEditor'
import { parseMarkdown } from './utils/markdown'
import { themes, applyTheme, defaultTheme } from './themes'
import type { Theme } from './themes/types'
import 'highlight.js/styles/atom-one-dark.css'
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

\`\`\`python
# Python 代码示例
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print([fibonacci(i) for i in range(10)])
\`\`\`

## 引用块

> 这是一段引用文字。
>
> 引用块可以包含多行内容，用于展示重要信息或引述他人观点。
>
> — 作者名

## 表格示例

| 功能 | 状态 | 说明 |
|------|:----:|------|
| Markdown 解析 | ✅ | 支持完整语法 |
| 主题切换 | ✅ | 10+ 套主题 |
| 代码高亮 | ✅ | 多语言支持 |
| 实时预览 | ✅ | 即时渲染 |

## 链接与分隔

这是一段包含[链接](https://github.com)的文字。

---

这是分隔线下方的文字。

## 任务列表

- [x] 完成需求分析
- [x] 完成任务拆分
- [ ] 进行开发
- [ ] 测试验证

## 组合示例

> **温馨提示**：这是一条重要提示信息，请注意查看！

在开发过程中，我们遵循 \`SOLID\` 原则：
1. **S**ingle Responsibility
2. **O**pen/Closed
3. **L**iskov Substitution
4. **I**nterface Segregation
5. **D**ependency Inversion

---

*感谢使用公众号排版工具！* 🎉
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
    setMarkdown('')
  }

  const handleCopyHTML = async () => {
    // TODO: 实现复制 HTML 功能
    alert('复制 HTML 功能开发中')
  }

  const handleCopyText = async () => {
    // TODO: 实现复制纯文本功能
    alert('复制纯文本功能开发中')
  }

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部工具栏 */}
      <header className="h-16 px-6 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            公众号排版工具
          </h1>
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            v2.0
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 主题选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">主题</label>
            <select 
              value={currentTheme.id}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[120px]"
            >
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>
          
          {/* 代码风格 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">代码</label>
            <select className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option>OneDark</option>
              <option>GitHub</option>
              <option>Monokai</option>
            </select>
          </div>
          
          {/* 预览模式 */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                previewMode === 'desktop' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              💻 电脑
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                previewMode === 'mobile' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              📱 手机
            </button>
          </div>
          
          {/* 夜间模式 */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {/* 清空 */}
          <button 
            onClick={handleClear}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            清空
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧编辑器 */}
        <div className="w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="h-10 px-4 flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              📝 Markdown 编辑器
            </span>
            <div className="flex-1" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
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
        <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-gray-900">
          <div className="h-10 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                👁️ 预览区域
              </span>
              <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                {currentTheme.name}
              </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {previewMode === 'mobile' ? '375px' : '100%'}
            </span>
          </div>
          <div className="flex-1 overflow-auto p-6 flex justify-center">
            <div 
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
              }`}
            >
              <div className="p-6 overflow-auto max-h-[calc(100vh-180px)]">
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert mp-preview"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部操作栏 */}
      <footer className="h-14 px-6 flex items-center justify-between bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            📋 粘贴富文本
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            🔗 提取URL
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            📥 导出MD
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyHTML}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
          >
            📋 复制HTML
          </button>
          <button 
            onClick={handleCopyText}
            className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors shadow-sm"
          >
            📄 复制纯文本
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span>当前主题: {currentTheme.name}</span>
          <span>|</span>
          <span>预览模式: {previewMode === 'mobile' ? '手机' : '电脑'}</span>
        </div>
      </footer>
    </div>
  )
}

export default App
