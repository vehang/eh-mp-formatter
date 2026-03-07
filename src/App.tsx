import { useState, useMemo, useEffect, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import { CodeMirrorEditor } from './components/CodeMirrorEditor'
import { BrandLogo } from './components/BrandLogo'
import { UrlFetchModal } from './components/UrlFetchModal'
import { ThemePickerModal } from './components/ThemePickerModal'
import { CodeStylePickerModal } from './components/CodeStylePickerModal'
import { ImageHostConfigModal } from './components/ImageHostConfigModal'
import { useToast } from './components/Toast'
import { useHistory } from './hooks/useHistory'
import { useKeyboard } from './hooks/useKeyboard'
import { useAutoSave } from './hooks/useAutoSave'
import { useUITheme } from './hooks/useUITheme'
import { useSyncScroll } from './hooks/useSyncScroll'
import { useSettings } from './hooks/useSettings'
import { useImageHost } from './hooks/useImageHost'
import { parseMarkdown } from './utils/markdown'
import { makeWeChatCompatible, applyInlineStyles } from './lib/wechatCompat'
import { fetchUrlContent } from './utils/urlFetcher'
import { themes, applyTheme, getThemeById } from './themes'
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
  const [isDownloading, setIsDownloading] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

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
  const { savedAt, isSaving } = useAutoSave('markdown-content', markdown, 2000)

  const html = useMemo(() => parseMarkdown(markdown), [markdown])

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  useEffect(() => {
    loadCodeStyle(codeStyle)
  }, [codeStyle])

  // 保存预览模式到缓存
  useEffect(() => {
    localStorage.setItem('mp-formatter-settings', JSON.stringify({
      themeId: currentTheme.id,
      codeStyle,
      previewMode,
      syncScroll
    }))
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

      // ═══════════════════════════════════════════════════════════════
      // 关键步骤（参考 raphael-publish）：
      // 1. applyInlineStyles: 将样式内联到每个元素的 style 属性
      //    - 传入 previewEl 以读取代码块的计算后样式
      // 2. makeWeChatCompatible: 处理公众号兼容性问题
      // ═══════════════════════════════════════════════════════════════

      // 步骤 1: 内联样式（关键！公众号不保留 CSS 类）
      // 传入 previewEl 以读取代码块的实际样式（支持 GitHub Dark, Monokai 等）
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

      console.log('[PDF Debug] Step 1: 找到预览元素', {
        previewEl,
        innerHTML: previewEl.innerHTML.substring(0, 500) + '...',
        textContent: previewEl.textContent?.substring(0, 200)
      })

      // ═══════════════════════════════════════════════════════════════
      // 方案 A: 使用 jsPDF 的 html() 方法（更可靠）
      // ═══════════════════════════════════════════════════════════════

      // 克隆预览元素
      const clone = previewEl.cloneNode(true) as HTMLElement

      // 创建临时容器 - 必须可见才能正确渲染
      // 使用 z-index: -1 让容器在页面内容下方，用户看不到但 html2canvas 仍能渲染
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

      console.log('[PDF Debug] Step 2: 创建临时容器', {
        containerWidth: container.offsetWidth,
        containerHeight: container.offsetHeight
      })

      // 内联样式到克隆的元素
      const innerDiv = container.querySelector('.mp-preview') as HTMLElement
      if (innerDiv) {
        // 移除可能影响布局的类
        innerDiv.className = 'mp-preview-pdf'
        innerDiv.style.cssText = `
          max-width: none;
          color: #1F2937;
        `

        // 处理标题
        innerDiv.querySelectorAll('h1').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            font-size: 24px;
            font-weight: 700;
            margin: 28px 0 16px;
            line-height: 1.35;
            color: #1F2937;
          `
        })
        innerDiv.querySelectorAll('h2').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            font-size: 20px;
            font-weight: 600;
            margin: 24px 0 12px;
            line-height: 1.4;
            padding-bottom: 10px;
            border-bottom: 2px solid #E5E7EB;
            color: #1F2937;
          `
        })
        innerDiv.querySelectorAll('h3').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0 10px;
            line-height: 1.45;
            color: #1F2937;
          `
        })

        // 处理段落
        innerDiv.querySelectorAll('p').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            margin: 16px 0;
            color: #1F2937;
            line-height: 1.8;
          `
        })

        // 处理列表
        innerDiv.querySelectorAll('ul').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            margin: 16px 0;
            padding-left: 28px;
            list-style-type: disc;
          `
        })
        innerDiv.querySelectorAll('ol').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            margin: 16px 0;
            padding-left: 28px;
            list-style-type: decimal;
          `
        })
        innerDiv.querySelectorAll('li').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            margin: 6px 0;
            line-height: 1.75;
            color: #1F2937;
          `
        })

        // 处理引用块
        innerDiv.querySelectorAll('blockquote').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            margin: 20px 0;
            padding: 16px 20px;
            background: #F5F3FF;
            border-left: 4px solid #6366F1;
            border-radius: 0 12px 12px 0;
            color: #4B5563;
          `
        })

        // 处理代码块
        innerDiv.querySelectorAll('pre').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            margin: 20px 0;
            padding: 16px 20px;
            background: #1E1E1E;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'SF Mono', Consolas, monospace;
            font-size: 13px;
            line-height: 1.6;
          `
        })
        innerDiv.querySelectorAll('pre code').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            background: transparent;
            color: #D4D4D4;
            font-family: inherit;
          `
        })

        // 处理行内代码
        innerDiv.querySelectorAll('code:not(pre code)').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            background: #EEF2FF;
            color: #4338CA;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Consolas, monospace;
            font-size: 0.9em;
          `
        })

        // 处理链接
        innerDiv.querySelectorAll('a').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            color: #4F46E5;
            text-decoration: none;
          `
        })

        // 处理表格
        innerDiv.querySelectorAll('table').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
          `
        })
        innerDiv.querySelectorAll('th, td').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            padding: 10px 14px;
            border: 1px solid #E5E7EB;
            text-align: left;
          `
        })
        innerDiv.querySelectorAll('th').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.background = '#F5F3FF'
          htmlEl.style.fontWeight = '600'
        })

        // 处理图片
        innerDiv.querySelectorAll('img').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px auto;
            display: block;
          `
        })

        // 处理分割线
        innerDiv.querySelectorAll('hr').forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.cssText = `
            border: none;
            border-top: 1px solid #E5E7EB;
            margin: 24px 0;
          `
        })

        // 处理强调
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

      console.log('[PDF Debug] Step 3: 内联样式完成', {
        containerInnerHTML: container.innerHTML.substring(0, 1000) + '...'
      })

      // 等待 DOM 更新
      await new Promise(resolve => setTimeout(resolve, 200))

      // 等待图片加载
      const images = container.querySelectorAll('img')
      console.log('[PDF Debug] Step 4: 等待图片加载', { imageCount: images.length })

      await Promise.all(
        Array.from(images).map((img, index) => {
          if (img.complete) {
            console.log(`[PDF Debug] 图片 ${index} 已加载`)
            return Promise.resolve()
          }
          return new Promise(resolve => {
            const timeout = setTimeout(() => {
              console.log(`[PDF Debug] 图片 ${index} 加载超时`)
              resolve(void 0)
            }, 3000)
            img.onload = () => {
              clearTimeout(timeout)
              console.log(`[PDF Debug] 图片 ${index} 加载完成`)
              resolve(void 0)
            }
            img.onerror = () => {
              clearTimeout(timeout)
              console.log(`[PDF Debug] 图片 ${index} 加载失败`)
              resolve(void 0)
            }
          })
        })
      )

      console.log('[PDF Debug] Step 5: 开始生成 PDF', {
        containerWidth: container.offsetWidth,
        containerHeight: container.offsetHeight,
        scrollHeight: container.scrollHeight
      })

      // 使用 html2canvas + jsPDF 方案
      const opt = {
        margin: [15, 15, 15, 20] as [number, number, number, number], // 上、右、下、左 - 增加左边距
        filename: `markdown-formatter-${Date.now()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false, // 关闭调试日志
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
              // 确保克隆的容器也有正确的左边距
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

      // 先测试 html2canvas 是否能正确生成
      console.log('[PDF Debug] Step 6: 调用 html2pdf')

      const pdf = html2pdf().set(opt).from(container)

      // 获取 canvas 进行调试
      const canvas = await pdf.toPdf().get('pdf').then((pdf: unknown) => {
        console.log('[PDF Debug] PDF 对象生成完成', pdf)
        return pdf
      })

      console.log('[PDF Debug] Step 7: 保存 PDF', { canvas })

      await pdf.save()

      console.log('[PDF Debug] Step 8: PDF 保存完成')

      // 清理临时容器
      document.body.removeChild(container)

      toast.showToast('PDF 下载成功', 'success')
    } catch (error) {
      console.error('[PDF Debug] PDF 生成失败:', error)
      toast.showToast('PDF 生成失败，请重试', 'error')
      // 确保清理临时容器
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
      // 插入 Markdown 图片链接
      const imageMarkdown = `![image](${result.url})`
      // 在当前内容末尾添加图片
      setMarkdown(markdown + '\n' + imageMarkdown)
      toast.showToast('图片上传成功', 'success')
    } else {
      toast.showToast(result.error || '上传失败', 'error')
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
          height: '52px',
          padding: '0 var(--space-5)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <BrandLogo />
        
        {/* UI 主题切换 - 右上角 */}
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
      </header>

      {/* ═══════════════════════════════════════════════
          主内容区
          ═══════════════════════════════════════════════ */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧编辑器 */}
        <div
          className="flex-1 flex flex-col"
          style={{
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)'
          }}
        >
          <div className="panel-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <span className="iconify icon-sm" data-icon="lucide:file-text" style={{ marginRight: '4px', color: 'var(--text-muted)' }}></span>
            <span className="panel-title">Markdown</span>
            
            <div className="toolbar-divider" style={{ margin: '0 4px' }} />
            
            {/* 撤销/重做/清空 */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className="btn btn-ghost btn-icon"
              title="撤销 (Ctrl+Z)"
            >
              <span className="iconify icon-sm" data-icon="lucide:undo-2"></span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="btn btn-ghost btn-icon"
              title="重做 (Ctrl+Shift+Z)"
            >
              <span className="iconify icon-sm" data-icon="lucide:redo-2"></span>
            </button>
            <button
              onClick={handleClear}
              className="btn btn-ghost btn-icon"
              title="清空内容"
              style={{ color: 'var(--red-500)' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:trash-2"></span>
            </button>

            <div className="toolbar-divider" style={{ margin: '0 4px' }} />

            {/* 主题选择 - 点击打开弹窗 */}
            <button
              onClick={() => setIsThemePickerOpen(true)}
              className="btn btn-ghost"
              title="选择配色主题"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)'
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:palette"></span>
              {currentTheme.name}
            </button>

            {/* 代码风格 - 点击打开弹窗 */}
            <button
              onClick={() => setIsCodeStylePickerOpen(true)}
              className="btn btn-ghost"
              title="选择代码样式"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)'
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:code-2"></span>
              {codeStyles.find(s => s.id === codeStyle)?.name || '代码样式'}
            </button>

            {/* 图床配置 - 点击打开弹窗 */}
            <button
              onClick={() => setIsImageHostModalOpen(true)}
              className="btn btn-ghost"
              title="配置图床"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                color: hasConfiguredHost ? 'var(--green-500)' : 'var(--text-secondary)',
                border: '1px solid var(--border-default)'
              }}
            >
              <span className="iconify icon-sm" data-icon="lucide:image-up"></span>
              图床
            </button>

            {/* 同步滚动开关 */}
            <button
              onClick={() => setSyncScroll(!syncScroll)}
              className="btn btn-ghost"
              title={syncScroll ? '关闭同步滚动' : '开启同步滚动'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                color: syncScroll ? 'var(--orange-500)' : 'var(--text-muted)',
                border: '1px solid var(--border-default)'
              }}
            >
              <span className="iconify icon-sm" data-icon={syncScroll ? 'lucide:plug-zap' : 'lucide:plug'}></span>
              {syncScroll ? '跟随开' : '跟随关'}
            </button>

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
            <span className="panel-meta" style={{ marginLeft: '8px', fontSize: '12px' }}>{markdown.length} 字</span>
          </div>
          <div className="flex-1 min-h-0">
            <CodeMirrorEditor
              value={markdown}
              onChange={setMarkdown}
              placeholder="在这里写 Markdown..."
              onImagePaste={handleImagePaste}
            />
          </div>
        </div>

        {/* 右侧预览 */}
        <div
          className="flex flex-col"
          style={{ 
            background: 'var(--bg-muted)',
            flexShrink: 0,
            width: previewMode === 'desktop' ? '50%' 
                 : previewMode === 'pad' ? '820px' 
                 : '415px',
            transition: 'width 0.3s ease-in-out'
          }}
        >
          <div className="panel-header">
            <span className="iconify icon-sm" data-icon="lucide:eye" style={{ marginRight: '8px', color: 'var(--text-muted)' }}></span>
            {previewMode !== 'mobile' && (
              <span className="panel-title">预览</span>
            )}
            <span className="panel-badge">{currentTheme.name}</span>
            
            {/* 预览模式切换 - 三个尺寸 */}
            <div className="toggle-group" style={{ 
              marginLeft: '12px',
              transition: 'all 0.2s ease-in-out'
            }}>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`toggle-btn ${previewMode === 'desktop' ? 'active' : ''}`}
                title="宽屏模式"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 8px', 
                  fontSize: '13px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span className="iconify icon-sm" data-icon="lucide:monitor"></span>
                {previewMode !== 'mobile' && '宽屏'}
              </button>
              <button
                onClick={() => setPreviewMode('pad')}
                className={`toggle-btn ${previewMode === 'pad' ? 'active' : ''}`}
                title="Pad 模式"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 8px', 
                  fontSize: '13px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span className="iconify icon-sm" data-icon="lucide:tablet"></span>
                {previewMode !== 'mobile' && 'Pad'}
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`}
                title="手机模式"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 8px', 
                  fontSize: '13px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span className="iconify icon-sm" data-icon="lucide:smartphone"></span>
                {previewMode !== 'mobile' && '手机'}
              </button>
            </div>

            <div className="flex-1" />

            {/* 下载 PDF 按钮 - 响应式：手机只显示图标，宽屏/PAD显示文字 */}
            <button
              className="btn btn-ghost"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              title="下载 PDF"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '13px', marginRight: '8px' }}
            >
              {isDownloading ? (
                <span className="iconify icon-sm" data-icon="lucide:loader-2" style={{ animation: 'spin 1s linear infinite' }}></span>
              ) : (
                <span className="iconify icon-sm" data-icon="lucide:download"></span>
              )}
              {previewMode !== 'mobile' && '下载 PDF'}
            </button>

            {/* 复制排版按钮 */}
            <button
              className="btn btn-primary"
              onClick={handleCopyHTML}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '13px' }}
            >
              <span className="iconify icon-sm" data-icon="lucide:copy"></span>
              复制排版
            </button>

            {/* 手机模式时隐藏尺寸显示 */}
            {previewMode !== 'mobile' && (
              <span className="panel-meta" style={{ marginLeft: '12px' }}>
                {previewMode === 'pad' ? '768px' : '自适应'}
              </span>
            )}
          </div>
          <div
            className="flex-1 overflow-auto flex justify-center"
            style={{
              padding: 'var(--space-6)',
              background: 'var(--bg-base)'
            }}
          >
            <div
              ref={previewRef}
              className="card"
              style={{
                width: previewMode === 'mobile' ? '375px' : previewMode === 'pad' ? '768px' : '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                transition: 'width 0.3s ease-in-out'
              }}
            >
              <div
                className="overflow-auto theme-transition preview-scroll-container"
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
          {/* 上传进度 */}
          {uploadProgress.isUploading && (
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${uploadProgress.progress}%` }}
              />
              <span className="upload-progress-text">{uploadProgress.statusText}</span>
            </div>
          )}
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

      {/* 主题选择弹窗 */}
      <ThemePickerModal
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
        themes={themes}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* 代码样式选择弹窗 */}
      <CodeStylePickerModal
        isOpen={isCodeStylePickerOpen}
        onClose={() => setIsCodeStylePickerOpen(false)}
        codeStyles={codeStyles}
        currentStyle={codeStyle}
        onSelectStyle={setCodeStyle}
      />

      {/* 图床配置弹窗 */}
      <ImageHostConfigModal
        isOpen={isImageHostModalOpen}
        onClose={() => setIsImageHostModalOpen(false)}
        settings={imageHostSettings}
        onUpdateConfig={updateHostConfig}
        onSetDefault={setDefaultHost}
        onClearConfig={clearHostConfig}
      />
    </div>
  )
}

export default App
