import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { htmlToMarkdown } from '../utils/htmlToMarkdown'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onImagePaste?: (file: File) => void
  showLineNumbers?: boolean
}

export function CodeMirrorEditor({ value, onChange, placeholder, onImagePaste, showLineNumbers = true }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        showLineNumbers ? lineNumbers() : [],
        highlightActiveLine(),
        highlightActiveLineGutter(),
        markdown(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            background: 'var(--bg-surface)',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "var(--font-mono)",
          },
          '.cm-content': {
            padding: '16px 0',
            caretColor: 'var(--orange-500)',
          },
          '.cm-line': {
            padding: '0 16px',
            color: 'var(--text-secondary)',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            display: showLineNumbers ? 'block' : 'none',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 8px 0 16px',
            minWidth: '40px',
          },
          '.cm-activeLine': {
            background: 'rgba(255, 255, 255, 0.03)',
          },
          '.cm-activeLineGutter': {
            background: 'transparent',
            color: 'var(--text-tertiary)',
          },
          '.cm-selectionBackground': {
            background: 'rgba(249, 115, 22, 0.2) !important',
          },
          '&.cm-focused .cm-selectionBackground': {
            background: 'rgba(249, 115, 22, 0.25) !important',
          },
          '.cm-cursor': {
            borderLeftColor: 'var(--orange-500)',
          },
          // Markdown 语法高亮
          '.cm-header': {
            color: 'var(--orange-400)',
            fontWeight: '600',
          },
          '.cm-strong': {
            fontWeight: '700',
            color: 'var(--text-primary)',
          },
          '.cm-em': {
            fontStyle: 'italic',
          },
          '.cm-link': {
            color: 'var(--blue-500)',
          },
          '.cm-url': {
            color: 'var(--text-muted)',
          },
          '.cm-quote': {
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          },
          '.cm-list': {
            color: 'var(--orange-500)',
          },
          '.cm-meta': {
            color: 'var(--text-muted)',
          },
        }),
        EditorView.lineWrapping,
        placeholder ? EditorView.contentAttributes.of({ 'data-placeholder': placeholder }) : [],
        // 处理粘贴事件
        EditorView.domEventHandlers({
          paste: (event, view) => {
            const clipboardData = event.clipboardData
            if (!clipboardData) return

            // 检查是否有图片文件
            const items = clipboardData.items
            for (let i = 0; i < items.length; i++) {
              const item = items[i]
              if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file && onImagePaste) {
                  event.preventDefault()
                  onImagePaste(file)
                  return
                }
              }
            }

            // 优先检查是否有 HTML 内容
            const html = clipboardData.getData('text/html')
            if (html && html.trim()) {
              event.preventDefault()

              try {
                const markdown = htmlToMarkdown(html)
                if (markdown) {
                  // 插入转换后的 Markdown
                  const { from, to } = view.state.selection.main
                  view.dispatch({
                    changes: { from, to, insert: markdown },
                    selection: { anchor: from + markdown.length },
                  })
                  return
                }
              } catch (error) {
                console.error('Failed to convert HTML to Markdown:', error)
              }

              // 如果转换失败，回退到纯文本
              const text = clipboardData.getData('text/plain')
              if (text) {
                const { from, to } = view.state.selection.main
                view.dispatch({
                  changes: { from, to, insert: text },
                  selection: { anchor: from + text.length },
                })
              }
            }
          },
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 同步外部 value 变化
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      })
    }
  }, [value])

  return (
    <div
      ref={editorRef}
      className="h-full w-full codemirror-editor"
      style={{ height: '100%' }}
    />
  )
}
