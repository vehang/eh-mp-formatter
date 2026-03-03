import { useState } from 'react'
import { CodeMirrorEditor } from './components/CodeMirrorEditor'
import './App.css'

const defaultMarkdown = `# 欢迎使用公众号排版工具

这是一个 **Markdown** 排版工具，支持：

- 多种主题样式
- 代码高亮
- 手机/电脑预览

## 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, World!')
}
\`\`\`

## 表格示例

| 功能 | 状态 |
|------|------|
| Markdown 解析 | ✅ |
| 主题切换 | ✅ |
| 代码高亮 | ✅ |
`

function App() {
  const [markdown, setMarkdown] = useState(defaultMarkdown)

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部工具栏 */}
      <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">公众号排版工具</h1>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>紫色经典</option>
            <option>橙心暖色</option>
            <option>GitHub风格</option>
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
            预览区域
          </div>
          <div className="flex-1 p-4 overflow-auto min-h-0">
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{markdown}</pre>
            </div>
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
        <span className="text-xs text-gray-400 dark:text-gray-500">自动保存: 已开启</span>
      </footer>
    </div>
  )
}

export default App
