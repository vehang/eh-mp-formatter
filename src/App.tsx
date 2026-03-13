import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import html2pdf from 'html2pdf.js'
import { CodeMirrorEditor, type EditorHandle } from './components/CodeMirrorEditor'
import { Toolbar } from './components/Toolbar'
import { Preview } from './components/Preview'
import { useToast } from './components/Toast'
import { useHistory } from './hooks/useHistory'
import { useKeyboard } from './hooks/useKeyboard'
import { useAutoSave } from './hooks/useAutoSave'
import { useUITheme } from './hooks/useUITheme'
import { useSyncScroll } from './hooks/useSyncScroll'
import { useSettings } from './hooks/useSettings'
import { useImageHost } from './hooks/useImageHost'
import { useDebounce } from './hooks/useDebounce'
import { parseMarkdown } from './utils/markdown'
import { makeWeChatCompatible, applyInlineStyles } from './lib/wechatCompat'
import { fetchUrlContent } from './utils/urlFetcher'
import { themes, applyTheme, getThemeById } from './themes'
import type { Theme } from './themes/types'
import './App.css'

// 代码风格配置 - 预导入 highlight.js 样式
import githubDark from 'highlight.js/styles/github-dark.css?inline'
import atomOneDark from 'highlight.js/styles/atom-one-dark.css?inline'
import monokai from 'highlight.js/styles/monokai.css?inline'
import github from 'highlight.js/styles/github.css?inline'
import atomOneLight from 'highlight.js/styles/atom-one-light.css?inline'
import tokyoNightDark from 'highlight.js/styles/tokyo-night-dark.css?inline'

const codeStyles = [
  { id: 'github-dark', name: 'GitHub Dark', css: githubDark },
  { id: 'atom-one-dark', name: 'OneDark', css: atomOneDark },
  { id: 'monokai', name: 'Monokai', css: monokai },
  { id: 'tokyo-night', name: 'Tokyo Night', css: tokyoNightDark },
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
    // 增加 .mp-preview 前缀提高选择器优先级，确保覆盖其他样式
    // 并根据主题类型追加配置文件增强样式
    const isDark = styleId.includes('dark') || styleId === 'monokai' || styleId === 'tokyo-night'
    styleEl.textContent = prefixSelectors(style.css, '.mp-preview') + getConfigEnhanceStyles(isDark)
    document.head.appendChild(styleEl)
    loadedStyleId = styleId
  }
}

/**
 * 配置文件增强样式
 * 让 key 和 value 有更明显的颜色区分
 */
function getConfigEnhanceStyles(isDark: boolean): string {
  if (isDark) {
    // 暗色主题增强
    return `
/* 配置文件增强样式 - 让 key/value 颜色更明显 */
.mp-preview .hljs-attr {
  color: #7dd3fc !important; /* 天蓝色 - key */
}
.mp-preview .hljs-number {
  color: #fbbf24 !important; /* 金黄色 - number value */
}
.mp-preview .hljs-punctuation {
  color: #9ca3af !important; /* 灰色 - 标点 */
}
`
  } else {
    // 亮色主题增强
    return `
/* 配置文件增强样式 - 让 key/value 颜色更明显 */
.mp-preview .hljs-attr {
  color: #0369a1 !important; /* 深蓝色 - key */
}
.mp-preview .hljs-number {
  color: #d97706 !important; /* 橙黄色 - number value */
}
.mp-preview .hljs-punctuation {
  color: #6b7280 !important; /* 灰色 - 标点 */
}
`
  }
}

/**
 * 为 CSS 选择器添加前缀，提高优先级
 * 例如：.hljs { color: red } => .mp-preview .hljs { color: red }
 */
function prefixSelectors(css: string, prefix: string): string {
  // 处理 @media 查询
  return css.replace(/@media\s*\([^)]+\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g, (_match: string, content: string) => {
    return '@media (min-width: 0) {' + prefixSelectors(content, prefix) + '}'
  }).replace(/([^{]+)\{([^}]*)\}/g, (_match: string, selectors: string, declarations: string) => {
    // 跳过 @ 规则
    if (selectors.trim().startsWith('@')) return _match
    // 为每个选择器添加前缀
    const prefixedSelectors = selectors.split(',').map((s: string) => {
      s = s.trim()
      if (!s) return s
      // 跳过已经有 .mp-preview 前缀的
      if (s.includes('.mp-preview')) return s
      return `${prefix} ${s}`
    }).join(', ')
    return `${prefixedSelectors} { ${declarations} }`
  })
}

// React.lazy 加载弹窗组件
const UrlFetchModal = lazy(() => import('./components/UrlFetchModal').then(m => ({ default: m.UrlFetchModal })))
const ThemePickerModal = lazy(() => import('./components/ThemePickerModal').then(m => ({ default: m.ThemePickerModal })))
const CodeStylePickerModal = lazy(() => import('./components/CodeStylePickerModal').then(m => ({ default: m.CodeStylePickerModal })))
const ImageHostConfigModal = lazy(() => import('./components/ImageHostConfigModal').then(m => ({ default: m.ImageHostConfigModal })))
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })))

// Suspense 加载占位
const ModalLoadingFallback = () => null

const defaultMarkdown = `![Unsplash 示例图片](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80)

*图片来源：Unsplash - 代码与编程*

> 💡 **提示**：支持直接粘贴富文本（Word、Notion、网页等），会自动转换为 Markdown 格式

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
  const settings = useSettings()

  // 从缓存中加载主题
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const params = new URLSearchParams(window.location.search)
    const themeId = params.get('theme') || settings.themeId
    return getThemeById(themeId) || themes[0]
  })
  const [previewMode, setPreviewMode] = useState<'mobile' | 'pad' | 'desktop'>(settings.previewMode)
  const [codeStyle, setCodeStyle] = useState(settings.codeStyle)
  const [syncScroll, setSyncScroll] = useState(settings.syncScroll)
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)
  const [isFetchingUrl, setIsFetchingUrl] = useState(false)
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false)
  const [isCodeStylePickerOpen, setIsCodeStylePickerOpen] = useState(false)
  const [isImageHostModalOpen, setIsImageHostModalOpen] = useState(false)
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorHandle>(null)

  // 手机端适配状态
  const [isMobile, setIsMobile] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false) // 窄屏幕（需要隐藏按钮文字）
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit')

  // 检测屏幕模式
  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsNarrow(width < 900)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  // 图床管理
  const {
    settings: imageHostSettings,
    uploadProgress,
    updateHostConfig,
    setDefaultHost,
    handleUpload,
    clearHostConfig,
    hasConfiguredHost,
  } = useImageHost()

  // 同步滚动
  useSyncScroll({
    enabled: syncScroll,
    editorSelector: '.codemirror-editor',
    previewSelector: '.preview-scroll-container',
  })

  const toast = useToast()
  const { isSaving } = useAutoSave('markdown-content', markdown, 2000)

  // 防抖 Markdown 内容（300ms）
  const debouncedMarkdown = useDebounce(markdown, 300)

  // 使用防抖后的内容进行解析
  const html = useMemo(() => parseMarkdown(debouncedMarkdown), [debouncedMarkdown])

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  useEffect(() => {
    loadCodeStyle(codeStyle)
  }, [codeStyle])

  // 通过 useSettings 保存配置（统一管理）
  useEffect(() => {
    settings.updateSettings({
      themeId: currentTheme.id,
      codeStyle,
      previewMode,
      syncScroll
    })
  }, [previewMode, syncScroll, codeStyle, currentTheme.id])

  const handleSelectTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    applyTheme(theme)
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
      const previewEl = document.querySelector('.mp-preview') as HTMLElement
      if (!previewEl) {
        toast.showToast('复制失败，请重试', 'error')
        return
      }

      // 步骤 1: 内联样式（关键！公众号不保留 CSS 类）
      const htmlWithInlineStyles = applyInlineStyles(previewEl, currentTheme)

      // 步骤 2: 公众号兼容性处理
      const processedHtml = await makeWeChatCompatible(htmlWithInlineStyles, currentTheme)

      // 步骤 3: 使用 ClipboardItem API 复制
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([processedHtml], { type: 'text/html' }),
        'text/plain': new Blob([previewEl.innerText], { type: 'text/plain' }),
      })

      await navigator.clipboard.write([clipboardItem])
      toast.showToast('排版已复制，直接粘贴到公众号', 'success')
    } catch {
      toast.showToast('复制失败，请重试', 'error')
    }
  }

  const handleDownloadPDF = async () => {
    if (!previewRef.current || isDownloading) return

    setIsDownloading(true)
    toast.showToast('正在生成 PDF...', 'success')

    try {
      const previewEl = previewRef.current.querySelector('.mp-preview') as HTMLElement
      if (!previewEl) {
        console.error('[PDF Debug] 未找到 .mp-preview 元素')
        toast.showToast('生成失败，请重试', 'error')
        return
      }

      // 克隆预览元素
      const clone = previewEl.cloneNode(true) as HTMLElement

      // 创建临时容器
      const container = document.createElement('div')
      container.id = 'pdf-temp-container'
      container.style.cssText = `
        position: fixed;
        left: 50px;
        top: 0;
        width: 210mm;
        padding: 20mm 25mm;
        background: #ffffff;
        color: #1F2937;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', sans-serif;
        font-size: 14px;
        line-height: 1.8;
        z-index: -1;
      `
      container.appendChild(clone)
      document.body.appendChild(container)

      // 内联样式到克隆的元素
      const innerDiv = container.querySelector('.mp-preview') as HTMLElement
      if (innerDiv) {
        innerDiv.className = 'mp-preview-pdf'
        innerDiv.style.cssText = `
          max-width: none;
          color: #1F2937;
        `

        // 处理各种元素样式
        innerDiv.querySelectorAll('h1').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `font-size: 24px; font-weight: 700; margin: 28px 0 16px; line-height: 1.35; color: #1F2937;`
        })
        innerDiv.querySelectorAll('h2').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `font-size: 20px; font-weight: 600; margin: 24px 0 12px; line-height: 1.4; padding-bottom: 10px; border-bottom: 2px solid #E5E7EB; color: #1F2937;`
        })
        innerDiv.querySelectorAll('h3').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `font-size: 18px; font-weight: 600; margin: 20px 0 10px; line-height: 1.45; color: #1F2937;`
        })
        innerDiv.querySelectorAll('p').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `margin: 16px 0; color: #1F2937; line-height: 1.8;`
        })
        innerDiv.querySelectorAll('ul').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `margin: 16px 0; padding-left: 28px; list-style-type: disc;`
        })
        innerDiv.querySelectorAll('ol').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `margin: 16px 0; padding-left: 28px; list-style-type: decimal;`
        })
        innerDiv.querySelectorAll('li').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `margin: 6px 0; line-height: 1.75; color: #1F2937;`
        })
        innerDiv.querySelectorAll('blockquote').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `margin: 20px 0; padding: 16px 20px; background: #F5F3FF; border-left: 4px solid #6366F1; border-radius: 0 12px 12px 0; color: #4B5563;`
        })
        innerDiv.querySelectorAll('pre').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `margin: 20px 0; padding: 16px 20px; background: #1E1E1E; border-radius: 8px; overflow-x: auto; font-family: 'SF Mono', Consolas, monospace; font-size: 13px; line-height: 1.6;`
        })
        innerDiv.querySelectorAll('pre code').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `background: transparent; color: #D4D4D4; font-family: inherit;`
        })
        innerDiv.querySelectorAll('code:not(pre code)').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `background: #EEF2FF; color: #4338CA; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', Consolas, monospace; font-size: 0.9em;`
        })
        innerDiv.querySelectorAll('a').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `color: #4F46E5; text-decoration: none;`
        })
        innerDiv.querySelectorAll('table').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;`
        })
        innerDiv.querySelectorAll('th, td').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `padding: 10px 14px; border: 1px solid #E5E7EB; text-align: left;`
        })
        innerDiv.querySelectorAll('th').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.background = '#F5F3FF'
          htmlEl.style.fontWeight = '600'
        })
        innerDiv.querySelectorAll('img').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `max-width: 100%; height: auto; border-radius: 8px; margin: 16px auto; display: block;`
        })
        innerDiv.querySelectorAll('hr').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;`
        })
        innerDiv.querySelectorAll('strong').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.fontWeight = '600'
        })
        innerDiv.querySelectorAll('em').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.fontStyle = 'italic'
          htmlEl.style.color = '#64748B'
        })
      }

      // 等待 DOM 更新
      await new Promise(resolve => setTimeout(resolve, 200))

      // 等待图片加载
      const images = container.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise(resolve => {
            const timeout = setTimeout(() => resolve(void 0), 3000)
            img.onload = () => { clearTimeout(timeout); resolve(void 0) }
            img.onerror = () => { clearTimeout(timeout); resolve(void 0) }
          })
        })
      )

      // 使用 html2canvas + jsPDF 方案
      const opt = {
        margin: [15, 15, 15, 20] as [number, number, number, number],
        filename: `markdown-formatter-${Date.now()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          letterRendering: true,
          width: container.offsetWidth,
          height: container.scrollHeight,
          windowWidth: container.offsetWidth + 100,
          windowHeight: container.scrollHeight + 100,
          backgroundColor: '#ffffff',
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc: Document) => {
            const clonedContainer = clonedDoc.getElementById('pdf-temp-container')
            if (clonedContainer) {
              clonedContainer.style.left = '50px'
              clonedContainer.style.paddingLeft = '25mm'
              clonedContainer.style.paddingRight = '25mm'
            }
          }
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        }
      }

      const pdf = html2pdf().set(opt).from(container)
      await pdf.toPdf().get('pdf')
      await pdf.save()

      // 清理临时容器
      document.body.removeChild(container)
      toast.showToast('PDF 下载成功', 'success')
    } catch (error) {
      console.error('[PDF Debug] PDF 生成失败:', error)
      toast.showToast('PDF 生成失败，请重试', 'error')
      const tempContainer = document.getElementById('pdf-temp-container')
      if (tempContainer) {
        document.body.removeChild(tempContainer)
      }
    } finally {
      setIsDownloading(false)
    }
  }

  // 处理图片粘贴
  const handleImagePaste = async (file: File) => {
    if (!hasConfiguredHost) {
      toast.showToast('请先配置图床', 'error')
      setIsImageHostModalOpen(true)
      return
    }

    const result = await handleUpload(file)

    if (result.success && result.url) {
      const imageMarkdown = `![image](${result.url})`
      setMarkdown(markdown + '\n' + imageMarkdown)
      toast.showToast('图片上传成功', 'success')
    } else {
      toast.showToast(result.error || '上传失败', 'error')
    }
  }

  // 图片文件上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    if (!file.type.startsWith('image/')) {
      toast.showToast('请选择图片文件', 'error')
      return
    }

    if (hasConfiguredHost) {
      const result = await handleUpload(file)
      if (result.success && result.url) {
        const imageMarkdown = `![${file.name}](${result.url})`
        setMarkdown(markdown + '\n' + imageMarkdown)
        toast.showToast('图片上传成功', 'success')
      } else {
        toast.showToast(result.error || '上传失败', 'error')
      }
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        if (base64) {
          const imageMarkdown = `![${file.name}](${base64})`
          setMarkdown(markdown + '\n' + imageMarkdown)
          toast.showToast('图片已插入（Base64）', 'success')
        }
      }
      reader.onerror = () => {
        toast.showToast('图片读取失败', 'error')
      }
      reader.readAsDataURL(file)
    }
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
          顶部工具栏 - 品牌 Logo + 主题切换
          ═══════════════════════════════════════════════ */}
      <header
        className="flex items-center justify-between"
        style={{
          height: isMobile ? '48px' : '52px',
          padding: '0 var(--space-4)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {/* 左侧 Logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center"
            style={{
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--orange-500)',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
            }}
          >
            <span
              className="iconify"
              data-icon="lucide:pen-tool"
              style={{ fontSize: isMobile ? '18px' : '20px', color: 'white' }}
            ></span>
          </div>
          {isMobile ? (
            <div className="flex flex-col">
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                排版助手
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                公众号 Markdown 排版
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                排版助手
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                公众号 Markdown 排版
              </span>
            </div>
          )}
        </div>

        {/* 右侧主题切换 */}
        <button
          onClick={uiTheme.toggleTheme}
          className="theme-toggle-btn"
          title={uiTheme.isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          <div className="theme-icon-wrapper">
            <span className="theme-icon-sun">
              <span className="iconify" data-icon="lucide:sun" style={{ fontSize: isMobile ? '20px' : '18px' }}></span>
            </span>
            <span className="theme-icon-moon">
              <span className="iconify" data-icon="lucide:moon" style={{ fontSize: isMobile ? '20px' : '18px' }}></span>
            </span>
          </div>
        </button>
      </header>

      {/* ═══════════════════════════════════════════════
          主内容区
          ═══════════════════════════════════════════════ */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧编辑器 */}
        <div
          style={{
            flex: 1,
            display: isMobile && mobileTab !== 'edit' ? 'none' : 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
          }}
        >
          <Toolbar
            editorRef={editorRef}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onClear={handleClear}
            currentTheme={currentTheme}
            codeStyle={codeStyle}
            codeStyles={codeStyles}
            onOpenThemePicker={() => setIsThemePickerOpen(true)}
            onOpenCodeStylePicker={() => setIsCodeStylePickerOpen(true)}
            hasConfiguredHost={hasConfiguredHost}
            onOpenImageHostModal={() => setIsImageHostModalOpen(true)}
            onImageUpload={handleImageUpload}
            syncScroll={syncScroll}
            onToggleSyncScroll={() => setSyncScroll(!syncScroll)}
            onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
            onOpenUrlModal={() => setIsUrlModalOpen(true)}
            markdownLength={markdown.length}
            isMobile={isMobile}
            isNarrow={isNarrow}
          />

          <div className="flex-1 min-h-0">
            <CodeMirrorEditor
              ref={editorRef}
              value={markdown}
              onChange={setMarkdown}
              placeholder="在这里写 Markdown..."
              onImagePaste={handleImagePaste}
              compactMode={isMobile}
            />
          </div>

          {/* 底部状态栏 */}
          {!isMobile && (
            <div
              className="flex items-center justify-between"
              style={{
                height: '32px',
                padding: '0 var(--space-4)',
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <span className="iconify icon-sm" data-icon="lucide:clipboard-paste" style={{ color: 'var(--text-muted)' }}></span>
                <span>支持直接粘贴</span>
                <span style={{ color: '#07C160', fontWeight: 500 }}>公众号</span>
                <span>、</span>
                <span style={{ color: '#3370FF', fontWeight: 500 }}>飞书</span>
                <span>、</span>
                <span style={{ color: '#2B579A', fontWeight: 500 }}>Word</span>
                <span>等富文本，自动转为Markdown</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {uploadProgress.isUploading && (
                  <div className="upload-progress-bar">
                    <div className="upload-progress-fill" style={{ width: `${uploadProgress.progress}%` }} />
                    <span className="upload-progress-text">{uploadProgress.statusText}</span>
                  </div>
                )}
                {isSaving ? (
                  <span style={{ color: 'var(--text-muted)' }}>保存中...</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green-500)' }}>
                    <span className="iconify icon-sm" data-icon="lucide:check-circle"></span>
                    已保存
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧预览 */}
        <div
          style={{
            display: isMobile && mobileTab !== 'preview' ? 'none' : 'flex',
            flexDirection: 'column',
            width: isMobile ? '100%' : previewMode === 'desktop' ? '50%' : previewMode === 'pad' ? '820px' : '415px',
            transition: 'width 0.3s ease-in-out',
          }}
        >
          <Preview
            previewRef={previewRef}
            html={html}
            previewMode={previewMode}
            currentTheme={currentTheme}
            isMobile={isMobile}
            isDownloading={isDownloading}
            onDownloadPDF={handleDownloadPDF}
            onCopyHTML={handleCopyHTML}
            onPreviewModeChange={setPreviewMode}
          />
        </div>
      </main>

      {/* 手机端底部 Tab 切换 */}
      {isMobile && (
        <div
          className="mobile-bottom-tabs"
          style={{
            display: 'flex',
            height: '56px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '0 var(--space-4)'
          }}
        >
          <button
            onClick={() => setMobileTab('edit')}
            className="mobile-tab-btn"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: mobileTab === 'edit' ? 'var(--orange-500)' : 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            <span className="iconify" data-icon="lucide:file-edit" style={{ fontSize: '20px' }}></span>
            <span>编辑</span>
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className="mobile-tab-btn"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: mobileTab === 'preview' ? 'var(--orange-500)' : 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
          >
            <span className="iconify" data-icon="lucide:eye" style={{ fontSize: '20px' }}></span>
            <span>预览</span>
          </button>
        </div>
      )}

      {/* 弹窗组件 - 使用 React.lazy 懒加载 */}
      <Suspense fallback={<ModalLoadingFallback />}>
        <UrlFetchModal
          isOpen={isUrlModalOpen}
          onClose={() => setIsUrlModalOpen(false)}
          onFetch={handleFetchUrl}
          isLoading={isFetchingUrl}
        />
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        <ThemePickerModal
          isOpen={isThemePickerOpen}
          onClose={() => setIsThemePickerOpen(false)}
          themes={themes}
          currentTheme={currentTheme}
          onSelectTheme={handleSelectTheme}
        />
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        <CodeStylePickerModal
          isOpen={isCodeStylePickerOpen}
          onClose={() => setIsCodeStylePickerOpen(false)}
          codeStyles={codeStyles}
          currentStyle={codeStyle}
          onSelectStyle={setCodeStyle}
        />
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        <ImageHostConfigModal
          isOpen={isImageHostModalOpen}
          onClose={() => setIsImageHostModalOpen(false)}
          settings={imageHostSettings}
          onUpdateConfig={updateHostConfig}
          onSetDefault={setDefaultHost}
          onClearConfig={clearHostConfig}
        />
      </Suspense>

      <Suspense fallback={<ModalLoadingFallback />}>
        <KeyboardShortcutsModal
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
        />
      </Suspense>
    </div>
  )
}

export default App
