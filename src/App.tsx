import { useState, useMemo, useEffect } from 'react'
import { CodeMirrorEditor } from './components/CodeMirrorEditor'
import { BrandLogo } from './components/BrandLogo'
import { UrlFetchModal } from './components/UrlFetchModal'
import { useToast } from './components/Toast'
import { useHistory } from './hooks/useHistory'
import { useKeyboard } from './hooks/useKeyboard'
import { useAutoSave } from './hooks/useAutoSave'
import { useUITheme } from './hooks/useUITheme'
import { parseMarkdown } from './utils/markdown'
import { fetchUrlContent } from './utils/urlFetcher'
import { themes, applyTheme, defaultTheme } from './themes'
import type { Theme } from './themes/types'
import './styles/preview.css'
import './App.css'

// 代码风格配置 - 预导入 highlight.js 样式
import githubDark from 'highlight.js/styles/github-dark.css?inline'
import atomOneDark from 'highlight.js/styles/atom-one-dark.css?inline'
import monokai from 'highlight.js/styles/monokai.css?inline'
import github from 'highlight.js/styles/github.css?inline'
import atomOneLight from 'highlight.js/styles/atom-one-light.css?inline'

const codeStyles = [
  { id: 'github-dark', name: 'GitHub Dark', css: githubDark },
  { id: 'atom-one-dark', name: 'OneDark', css: atomOneDark },
  { id: 'monokai', name: 'Monokai', css: monokai },
  { id: 'github', name: 'GitHub Light', css: github },
  { id: 'atom-one-light', name: 'OneLight', css: atomOneLight },
]

// 动态加载代码风格
let loadedStyleId: string | null = null
function loadCodeStyle(styleId: string) {
  if (loadedStyleId === styleId) return
  const style = codeStyles.find(s => s.id === styleId)
  if (style) {
    // 移除旧样式
    const oldStyle = document.getElementById('hljs-style')
    if (oldStyle) oldStyle.remove()
    // 添加新样式（使用 style 标签而非 link）
    const styleEl = document.createElement('style')
    styleEl.id = 'hljs-style'
    styleEl.textContent = style.css
    document.head.appendChild(styleEl)
    loadedStyleId = styleId
  }
}

const defaultMarkdown = `![Unsplash 示例图片](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80)

*图片来源：Unsplash - 代码与编程*

# 一级标题示例

这是一段普通文字，用于测试**加粗**、*斜体*、~~删除线~~和\`行内代码\`的效果。还可以包含[链接](https://github.com)和脚注[^1]。

## 二级标题：文本样式

### 强调与修饰

- **这是加粗文字**
- *这是斜体文字*
- ***加粗且斜体***
- ~~这是删除线~~
- \`这是行内代码\`
- ==这是高亮文字==

### 任务列表

- [x] 已完成的任务
- [x] 另一个已完成
- [ ] 待办事项
- [ ] 还没做的事

## 列表示例

### 无序列表

- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
    - 更深层级
- 第三项

### 有序列表

1. 第一步：准备工作
2. 第二步：执行操作
3. 第三步：验证结果

## 代码块示例

### Java

\`\`\`java
// 服务类示例
public class UserService {
    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public User findById(Long id) throws UserNotFoundException {
        return repository.findById(id)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
    }

    public List<User> findActiveUsers() {
        return repository.findAll().stream()
            .filter(User::isActive)
            .collect(Collectors.toList());
    }
}
\`\`\`

### JavaScript

\`\`\`javascript
// 异步函数示例
async function fetchUserData(userId) {
  const response = await fetch(\`/api/users/\${userId}\`)
  const data = await response.json()

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    createdAt: new Date(data.timestamp)
  }
}

// 使用示例
const user = await fetchUserData(123)
console.log(\`用户: \${user.name}\`)
\`\`\`

### Python

\`\`\`python
# 类定义示例
class DataProcessor:
    def __init__(self, config):
        self.config = config
        self.data = []

    def process(self, items):
        """处理数据列表"""
        return [self._transform(item) for item in items]

    def _transform(self, item):
        return item.strip().lower()

# 使用
processor = DataProcessor({"mode": "strict"})
result = processor.process(["Hello", "WORLD"])
\`\`\`

### CSS

\`\`\`css
/* 现代化卡片样式 */
.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
}
\`\`\`

### TypeScript

\`\`\`typescript
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

function validateUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'name' in user
  )
}
\`\`\`

## 引用块

> 💡 **提示**：这是一段引用文字，可以用于展示重要信息。
>
> 引用块可以包含多行内容，用于展示重要信息或引述他人观点。支持**加粗**和*斜体*。

## 表格示例

| 功能 | 状态 | 说明 |
|------|:----:|------|
| Markdown 解析 | ✅ | 支持完整语法 |
| 主题切换 | ✅ | 5 套专业主题 |
| 代码高亮 | ✅ | 多语言支持 |
| 实时预览 | ✅ | 即时渲染 |
| 导出功能 | 🚧 | 开发中 |

### 复杂表格

| 模块 | 技术 | 版本 | 描述 |
|------|------|:----:|------|
| 前端框架 | React | 18.2 | 用户界面构建 |
| 状态管理 | Zustand | 4.4 | 轻量状态方案 |
| 样式方案 | Tailwind | 3.4 | 原子化 CSS |
| 构建工具 | Vite | 5.0 | 极速开发体验 |

## 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\cdots + x_n
$$

## 分隔线

上面的内容与下面的内容之间有分隔。

---

这是分隔线下方的文字。

## 脚注

[^1]: 这是一个脚注示例，用于添加额外说明或引用来源。

---

*感谢使用排版助手！由 ❤️ 驱动开发*
`

function App() {
  const { value: markdown, setValue: setMarkdown, undo, redo, canUndo, canRedo } = useHistory(defaultMarkdown)
  const uiTheme = useUITheme()
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const params = new URLSearchParams(window.location.search)
    const themeId = params.get('theme')
    return themes.find(t => t.id === themeId) || defaultTheme
  })
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [codeStyle, setCodeStyle] = useState('github-dark')
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)
  const [isFetchingUrl, setIsFetchingUrl] = useState(false)

  const toast = useToast()
  const { savedAt, isSaving } = useAutoSave('markdown-content', markdown, 2000)

  const html = useMemo(() => parseMarkdown(markdown), [markdown])

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  useEffect(() => {
    loadCodeStyle(codeStyle)
  }, [codeStyle])

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

  const handleFetchUrl = async (url: string) => {
    setIsFetchingUrl(true)
    const result = await fetchUrlContent(url)
    setIsFetchingUrl(false)

    if (result.success && result.content) {
      setMarkdown(result.content)
      setIsUrlModalOpen(false)
      toast.showToast('网页内容已抓取', 'success')
    } else {
      toast.showToast(result.error || '抓取失败', 'error')
    }
  }

  const handleCopyHTML = async () => {
    try {
      // 获取预览区域的 HTML 内容
      const previewEl = document.querySelector('.mp-preview') as HTMLElement
      if (!previewEl) {
        toast.showToast('复制失败，请重试', 'error')
        return
      }

      // 公众号支持的 CSS 属性（白名单）
      const supportedProps = new Set([
        // 文字样式 - 公众号完全支持
        'color', 'font-size', 'font-weight', 'font-family', 'font-style',
        'line-height', 'text-align', 'text-decoration', 'letter-spacing',
        // 盒模型 - 公众号支持
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        // 边框 - 公众号支持
        'border', 'border-width', 'border-style', 'border-color',
        'border-top', 'border-top-width', 'border-top-style', 'border-top-color',
        'border-right', 'border-right-width', 'border-right-style', 'border-right-color',
        'border-bottom', 'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
        'border-left', 'border-left-width', 'border-left-style', 'border-left-color',
        'border-radius',
        // 背景 - 公众号支持
        'background-color',
        // 列表 - 公众号支持
        'list-style-type',
        // 表格 - 公众号支持
        'border-collapse', 'border-spacing',
        // 其他
        'vertical-align', 'white-space'
      ])

      // 需要特殊处理的属性（值需要转换）
      const needsValueConversion = (_prop: string, value: string): string => {
        // 处理 rem/em 单位转换为 px
        if (value.includes('rem') || value.includes('em')) {
          const num = parseFloat(value)
          if (!isNaN(num)) {
            if (value.includes('rem')) {
              return `${num * 16}px`
            } else if (value.includes('em') && !value.includes('rem')) {
              return `${num * 16}px`
            }
          }
        }
        return value
      }

      // 克隆预览元素
      const clone = previewEl.cloneNode(true) as HTMLElement

      // 递归内联所有元素的样式
      const inlineStyles = (element: Element) => {
        const el = element as HTMLElement
        if (el.nodeType !== Node.ELEMENT_NODE) return

        const computedStyle = window.getComputedStyle(el)
        const styles: string[] = []

        // 遍历所有支持的属性
        supportedProps.forEach(prop => {
          let value = computedStyle.getPropertyValue(prop)

          // 跳过无效值
          if (!value ||
              value === 'none' ||
              value === 'auto' ||
              value === 'initial' ||
              value === 'inherit' ||
              value === 'transparent' ||
              (value === '0px' && (prop.includes('margin') || prop.includes('padding')))) {
            return
          }

          // 转换值
          value = needsValueConversion(prop, value)

          styles.push(`${prop}: ${value}`)
        })

        // 特殊处理：代码块（pre 和 hljs）- 确保背景色和圆角
        if (el.tagName === 'PRE' || el.classList.contains('hljs')) {
          const bgColor = computedStyle.getPropertyValue('background-color')
          if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
            styles.push(`background-color: ${bgColor}`)
          }
          // 添加代码块特有的样式
          const borderRadius = computedStyle.getPropertyValue('border-radius')
          if (borderRadius && borderRadius !== '0px') {
            styles.push(`border-radius: ${borderRadius}`)
          }
          const padding = computedStyle.getPropertyValue('padding')
          if (padding && padding !== '0px') {
            styles.push(`padding: ${padding}`)
          }
        }

        // 特殊处理：代码块内的 code 元素
        if (el.tagName === 'CODE') {
          const parent = el.parentElement
          if (parent && (parent.tagName === 'PRE' || parent.classList.contains('hljs'))) {
            // code 元素本身通常不需要额外样式，让 hljs 的样式生效
          }
        }

        // 特殊处理：代码块内的所有子元素（语法高亮）- 确保颜色被内联
        const isInsideCodeBlock = el.closest && el.closest('pre, .hljs')
        if (isInsideCodeBlock && el.tagName !== 'PRE' && !el.classList.contains('hljs')) {
          const color = computedStyle.getPropertyValue('color')
          if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
            styles.push(`color: ${color}`)
          }
          const fontStyle = computedStyle.getPropertyValue('font-style')
          if (fontStyle && fontStyle !== 'normal') {
            styles.push(`font-style: ${fontStyle}`)
          }
          const fontWeight = computedStyle.getPropertyValue('font-weight')
          if (fontWeight && fontWeight !== '400' && fontWeight !== 'normal') {
            styles.push(`font-weight: ${fontWeight}`)
          }
        }

        // 特殊处理：引用块左边框
        if (el.tagName === 'BLOCKQUOTE') {
          const borderLeft = computedStyle.getPropertyValue('border-left-width')
          const borderStyle = computedStyle.getPropertyValue('border-left-style')
          const borderColor = computedStyle.getPropertyValue('border-left-color')
          if (borderLeft && borderStyle && borderColor) {
            styles.push(`border-left: ${borderLeft} ${borderStyle} ${borderColor}`)
          }
          const bg = computedStyle.getPropertyValue('background-color')
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            styles.push(`background-color: ${bg}`)
          }
          const padding = computedStyle.getPropertyValue('padding')
          if (padding && padding !== '0px') {
            styles.push(`padding: ${padding}`)
          }
          const borderRadius = computedStyle.getPropertyValue('border-radius')
          if (borderRadius && borderRadius !== '0px') {
            styles.push(`border-radius: ${borderRadius}`)
          }
        }

        // 特殊处理：表格
        if (el.tagName === 'TH' || el.tagName === 'TD') {
          const bg = computedStyle.getPropertyValue('background-color')
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            styles.push(`background-color: ${bg}`)
          }
        }

        // 设置内联样式
        if (styles.length > 0) {
          el.setAttribute('style', styles.join('; ') + ';')
        }

        // 移除 class 属性（公众号会过滤）
        el.removeAttribute('class')
        el.removeAttribute('data-theme')

        // 递归处理所有子元素
        Array.from(el.children).forEach(child => inlineStyles(child))
      }

      // 处理克隆元素本身
      const rootStyles: string[] = [
        'background-color: #ffffff',
        'color: #1F2937',
        'font-size: 16px',
        'line-height: 1.8',
        'padding: 20px'
      ]

      // 添加字体
      rootStyles.push("font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif")

      clone.setAttribute('style', rootStyles.join('; ') + ';')
      clone.removeAttribute('class')
      clone.removeAttribute('data-theme')

      // 内联所有子元素样式
      inlineStyles(clone)

      // 使用 section 标签包裹内容（公众号推荐格式）
      const wrapper = document.createElement('section')
      wrapper.setAttribute('style', rootStyles.join('; ') + ';')
      wrapper.innerHTML = clone.innerHTML

      // 创建隐藏的可编辑区域
      const editableDiv = document.createElement('div')
      editableDiv.contentEditable = 'true'
      editableDiv.style.cssText = 'position: fixed; left: -9999px; top: -9999px; opacity: 0;'
      editableDiv.innerHTML = wrapper.outerHTML
      document.body.appendChild(editableDiv)

      // 选中内容
      const range = document.createRange()
      range.selectNodeContents(editableDiv)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)

        // 执行复制命令
        const success = document.execCommand('copy')

        // 清理
        selection.removeAllRanges()
        document.body.removeChild(editableDiv)

        if (success) {
          toast.showToast('排版已复制，直接粘贴到公众号', 'success')
        } else {
          // 后备方案：使用 ClipboardItem API
          try {
            const clipboardItem = new ClipboardItem({
              'text/html': new Blob([wrapper.outerHTML], { type: 'text/html' }),
              'text/plain': new Blob([wrapper.outerHTML], { type: 'text/plain' })
            })
            await navigator.clipboard.write([clipboardItem])
            toast.showToast('排版已复制，直接粘贴到公众号', 'success')
          } catch {
            toast.showToast('复制失败，请重试', 'error')
          }
        }
      } else {
        document.body.removeChild(editableDiv)
        toast.showToast('复制失败，请重试', 'error')
      }
    } catch {
      toast.showToast('复制失败，请重试', 'error')
    }
  }

  const handleCopyText = () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ''
    navigator.clipboard.writeText(text).then(() => {
      toast.showToast('纯文本已复制', 'success')
    }).catch(() => {
      toast.showToast('复制失败，请重试', 'error')
    })
  }

  // 快捷键系统
  useKeyboard([
    { key: 'z', ctrlKey: true, handler: undo },
    { key: 'z', ctrlKey: true, shiftKey: true, handler: redo },
    { key: 'y', ctrlKey: true, handler: redo },
    { key: 's', ctrlKey: true, handler: () => toast.showToast('已自动保存', 'success') },
    { key: 'c', ctrlKey: true, shiftKey: true, handler: handleCopyHTML },
  ])

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ═══════════════════════════════════════════════
          顶部工具栏
          ═══════════════════════════════════════════════ */}
      <header
        className="flex items-center justify-between"
        style={{
          height: '52px',
          padding: '0 var(--space-5)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <BrandLogo />

        <div className="flex items-center gap-3">
          {/* 主题选择 */}
          <div className="flex items-center gap-2">
            <span className="iconify icon-md" data-icon="lucide:palette" style={{ color: 'var(--text-muted)' }}></span>
            <select
              value={currentTheme.id}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="select"
              style={{ minWidth: '90px' }}
            >
              {themes.map(theme => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </div>

          {/* 代码风格 */}
          <div className="flex items-center gap-2">
            <span className="iconify icon-md" data-icon="lucide:code-2" style={{ color: 'var(--text-muted)' }}></span>
            <select
              value={codeStyle}
              onChange={(e) => setCodeStyle(e.target.value)}
              className="select"
              style={{ minWidth: '100px' }}
            >
              {codeStyles.map(style => (
                <option key={style.id} value={style.id}>{style.name}</option>
              ))}
            </select>
          </div>

          <div className="toolbar-divider" />

          {/* 预览模式切换 */}
          <div className="toggle-group">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`toggle-btn ${previewMode === 'desktop' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:monitor"></span>
              宽屏
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:smartphone"></span>
              手机
            </button>
          </div>

          {/* UI 主题切换 */}
          <button
            onClick={uiTheme.toggleTheme}
            className="theme-toggle-btn"
            title={uiTheme.isDark ? '切换到浅色模式' : '切换到深色模式'}
          >
            <div className="theme-icon-wrapper">
              <span className="theme-icon-sun">
                <span className="iconify" data-icon="lucide:sun" style={{ fontSize: '18px' }}></span>
              </span>
              <span className="theme-icon-moon">
                <span className="iconify" data-icon="lucide:moon" style={{ fontSize: '18px' }}></span>
              </span>
            </div>
          </button>

          <div className="toolbar-divider" />

          {/* 撤销/重做 */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="btn btn-ghost btn-icon"
            title="撤销 (Ctrl+Z)"
          >
            <span className="iconify icon-md" data-icon="lucide:undo-2"></span>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="btn btn-ghost btn-icon"
            title="重做 (Ctrl+Shift+Z)"
          >
            <span className="iconify icon-md" data-icon="lucide:redo-2"></span>
          </button>

          {/* 清空 */}
          <button
            onClick={handleClear}
            className="btn btn-danger btn-icon"
            title="清空内容"
          >
            <span className="iconify icon-md" data-icon="lucide:trash-2"></span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          主内容区
          ═══════════════════════════════════════════════ */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧编辑器 */}
        <div
          className="w-1/2 flex flex-col"
          style={{
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)'
          }}
        >
          <div className="panel-header">
            <span className="iconify icon-sm" data-icon="lucide:file-text" style={{ marginRight: '8px', color: 'var(--text-muted)' }}></span>
            <span className="panel-title">Markdown</span>
            <div className="flex-1" />
            <button
              className="btn btn-ghost"
              onClick={() => setIsUrlModalOpen(true)}
              title="抓取网页内容"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:link"></span>
              抓取链接
            </button>
            <span className="panel-meta" style={{ marginLeft: '8px' }}>{markdown.length} 字</span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeMirrorEditor
              value={markdown}
              onChange={setMarkdown}
              placeholder="在这里写 Markdown..."
            />
          </div>
        </div>

        {/* 右侧预览 */}
        <div
          className="w-1/2 flex flex-col"
          style={{ background: 'var(--bg-muted)' }}
        >
          <div className="panel-header">
            <span className="iconify icon-sm" data-icon="lucide:eye" style={{ marginRight: '8px', color: 'var(--text-muted)' }}></span>
            <span className="panel-title">预览</span>
            <span className="panel-badge">{currentTheme.name}</span>
            <div className="flex-1" />
            <button
              className="btn btn-primary"
              onClick={handleCopyHTML}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '13px' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:copy"></span>
              复制排版
            </button>
            <button
              className="btn btn-success"
              onClick={handleCopyText}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', padding: '4px 10px', fontSize: '13px' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:file-text"></span>
              复制文字
            </button>
            <span className="panel-meta" style={{ marginLeft: '12px' }}>{previewMode === 'mobile' ? '375px' : '自适应'}</span>
          </div>
          <div
            className="flex-1 overflow-auto flex justify-center"
            style={{
              padding: 'var(--space-6)',
              background: 'var(--bg-base)'
            }}
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
                  padding: 'var(--space-6)',
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

      {/* ═══════════════════════════════════════════════
          底部状态栏
          ═══════════════════════════════════════════════ */}
      <footer
        className="flex items-center justify-end"
        style={{
          height: '36px',
          padding: '0 var(--space-5)',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-3" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {isSaving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="iconify icon-sm" data-icon="lucide:loader-2" style={{ animation: 'spin 1s linear infinite' }}></span>
              保存中
            </span>
          ) : savedAt ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="iconify icon-sm" data-icon="lucide:check" style={{ color: 'var(--green-500)' }}></span>
              已保存
            </span>
          ) : null}
        </div>
      </footer>

      {/* URL 抓取弹窗 */}
      <UrlFetchModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onFetch={handleFetchUrl}
        isLoading={isFetchingUrl}
      />
    </div>
  )
}

export default App
