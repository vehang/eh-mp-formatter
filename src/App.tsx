import { useState, useMemo, useEffect } from 'react'
import { CodeMirrorEditor } from './components/CodeMirrorEditor'
import { parseMarkdown } from './utils/markdown'
import { themes, applyTheme } from './themes'
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
    // 从 URL 参数读取主题
    const params = new URLSearchParams(window.location.search)
    const themeId = params.get('theme')
    return themes.find(t => t.id === themeId) || themes[0]
  })
  const html = useMemo(() => parseMarkdown(markdown), [markdown])
  
  // 初始化时应用主题
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

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部工具栏 */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">公众号排版工具</h1>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={currentTheme.id}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {themes.map(theme => (
              <option key={theme.id} value={theme.id}>{theme.name}</option>
            ))}
          </select>
          <select className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>OneDark</option>
            <option>GitHub Light</option>
            <option>Monokai</option>
          </select>
          <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
            📱 手机
          </button>
          <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
            🌙 夜间
          </button>
          <button className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">
            清空
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧编辑器 */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 shrink-0">
            Markdown 编辑器
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
        <div className="w-1/2 flex flex-col bg-white dark:bg-gray-800">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 shrink-0">
            预览区域 - {currentTheme.name}
          </div>
          <div className="flex-1 p-4 overflow-auto min-h-0">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert mp-preview"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </main>

      {/* 底部操作栏 */}
      <footer className="h-12 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 gap-2 shrink-0">
        <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
          粘贴富文本
        </button>
        <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
          提取URL
        </button>
        <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
          导出MD
        </button>
        <button className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
          复制HTML
        </button>
        <button className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">
          复制纯文本
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 dark:text-gray-500">当前主题: {currentTheme.name}</span>
      </footer>
    </div>
  )
}

export default App
