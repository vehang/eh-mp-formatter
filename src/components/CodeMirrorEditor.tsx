import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { htmlToMarkdown } from '../utils/htmlToMarkdown'

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onImagePaste?: (file: File) => void
  compactMode?: boolean
}

// 暴露给父组件的方法
export interface EditorHandle {
  insertBold: () => void
  insertItalic: () => void
  insertLink: () => void
  insertImage: () => void
  insertCode: () => void
  insertCodeBlock: () => void
  insertHr: () => void
  insertQuote: () => void
  insertText: (text: string) => void
  focus: () => void
}

/**
 * 包裹选中文本或插入 Markdown 语法
 */
function wrapSelection(view: EditorView, prefix: string, suffix: string = prefix, placeholder?: string): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to).toString()

  if (from === to) {
    // 没有选中文本，插入占位符
    const defaultPlaceholder = placeholder || prefix.replace(/[!*`#\]]/g, '') || '文字'
    view.dispatch({
      changes: { from, to, insert: `${prefix}${defaultPlaceholder}${suffix}` },
      selection: { anchor: from + prefix.length, head: from + prefix.length + defaultPlaceholder.length },
    })
  } else {
    // 选中文本，包裹
    view.dispatch({
      changes: { from, to, insert: `${prefix}${selectedText}${suffix}` },
      selection: { anchor: from + prefix.length, head: to + prefix.length },
    })
  }
  return true
}

/**
 * 插入链接语法
 */
function insertLinkFn(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to).toString()

  if (from === to) {
    view.dispatch({
      changes: { from, to, insert: `[链接文字](url)` },
      selection: { anchor: from + 1, head: from + 5 },
    })
  } else {
    view.dispatch({
      changes: { from, to, insert: `[${selectedText}](url)` },
      selection: { anchor: from + selectedText.length + 3, head: to + selectedText.length + 6 },
    })
  }
  return true
}

/**
 * 插入图片语法
 */
function insertImageFn(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to).toString()

  if (from === to) {
    view.dispatch({
      changes: { from, to, insert: `![图片描述](url)` },
      selection: { anchor: from + 2, head: from + 6 },
    })
  } else {
    view.dispatch({
      changes: { from, to, insert: `![${selectedText}](url)` },
      selection: { anchor: from + selectedText.length + 4, head: to + selectedText.length + 7 },
    })
  }
  return true
}

/**
 * 插入代码块
 */
function insertCodeBlockFn(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to).toString()

  if (from === to) {
    view.dispatch({
      changes: { from, to, insert: '```\n代码\n```' },
      selection: { anchor: from + 4, head: from + 6 },
    })
  } else {
    view.dispatch({
      changes: { from, to, insert: '```\n' + selectedText + '\n```' },
      selection: { anchor: from + 4, head: from + 4 },
    })
  }
  return true
}

/**
 * 插入分割线
 */
function insertHrFn(view: EditorView): boolean {
  const { from } = view.state.selection.main
  view.dispatch({
    changes: { from, to: from, insert: '\n\n---\n' },
    selection: { anchor: from + 6 },
  })
  return true
}

/**
 * 插入引用
 */
function insertQuoteFn(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to).toString()

  if (from === to) {
    view.dispatch({
      changes: { from, to, insert: `> 引用文字` },
      selection: { anchor: from + 2, head: from + 6 },
    })
  } else {
    view.dispatch({
      changes: { from, to, insert: `> ${selectedText}` },
      selection: { anchor: from + 2 + selectedText.length },
    })
  }
  return true
}

/**
 * 插入注释
 */
function insertComment(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to).toString()

  if (from === to) {
    view.dispatch({
      changes: { from, to, insert: `<!-- 注释内容 -->` },
      selection: { anchor: from + 5, head: from + 9 },
    })
  } else {
    view.dispatch({
      changes: { from, to, insert: `<!-- ${selectedText} -->` },
      selection: { anchor: from + 5 + selectedText.length + 4 },
    })
  }
  return true
}

/**
 * 删除当前行
 */
function deleteLine(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const doc = view.state.doc

  const fromLine = doc.lineAt(from)
  const toLine = doc.lineAt(to)

  const deleteFrom = fromLine.from
  const deleteTo = toLine.to

  view.dispatch({
    changes: { from: deleteFrom, to: deleteTo, insert: '' },
    selection: { anchor: deleteFrom },
  })
  return true
}

/**
 * 删除到行尾
 */
function deleteToEndOfLine(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const doc = view.state.doc
  const line = doc.lineAt(Math.max(from, to))

  view.dispatch({
    changes: { from: Math.min(from, to), to: line.to, insert: '' },
    selection: { anchor: Math.min(from, to) },
  })
  return true
}

/**
 * 缩进
 */
function indent(view: EditorView): boolean {
  const { from, to } = view.state.selection.main

  if (from === to) {
    view.dispatch({
      changes: { from, to, insert: '  ' },
      selection: { anchor: from + 2 },
    })
  } else {
    const doc = view.state.doc
    const changes: { from: number; to: number; insert: string }[] = []
    let pos = from

    while (pos <= to) {
      const line = doc.lineAt(pos)
      changes.push({ from: line.from, to: line.from, insert: '  ' })
      pos = line.to + 1
    }

    view.dispatch({
      changes,
      selection: { anchor: from + 2, head: to + changes.length * 2 },
    })
  }
  return true
}

/**
 * 取消缩进
 */
function unindent(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const doc = view.state.doc
  const changes: { from: number; to: number; insert: string }[] = []
  let offset = 0

  const startLine = doc.lineAt(from)
  const endLine = doc.lineAt(to)

  for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
    const line = doc.line(lineNum)
    const lineText = line.text

    let removeCount = 0
    for (let i = 0; i < 2 && i < lineText.length; i++) {
      if (lineText[i] === ' ') {
        removeCount++
      } else {
        break
      }
    }

    if (removeCount > 0) {
      changes.push({ from: line.from, to: line.from + removeCount, insert: '' })
      offset += removeCount
    }
  }

  if (changes.length > 0) {
    view.dispatch({
      changes,
      selection: { anchor: Math.max(0, from - (startLine.text.startsWith('  ') ? 2 : startLine.text.startsWith(' ') ? 1 : 0)), head: Math.max(0, to - offset) },
    })
  }
  return true
}

/**
 * 创建 Markdown 快捷键映射
 */
function createMarkdownKeymap() {
  return keymap.of([
    { key: 'Mod-b', run: (view) => wrapSelection(view, '**') },
    { key: 'Mod-i', run: (view) => wrapSelection(view, '*') },
    { key: 'Mod-k', run: insertLinkFn },
    { key: 'Mod-Shift-i', run: insertImageFn },
    { key: 'Mod-`', run: (view) => wrapSelection(view, '`') },
    { key: 'Mod-Shift-c', run: insertCodeBlockFn },
    { key: 'Mod-/', run: insertComment },
    { key: 'Mod-d', run: deleteLine },
    { key: 'Mod-Shift-k', run: deleteToEndOfLine },
    { key: 'Tab', run: indent },
    { key: 'Shift-Tab', run: unindent },
  ])
}

export const CodeMirrorEditor = forwardRef<EditorHandle, CodeMirrorEditorProps>(
  function CodeMirrorEditor({ value, onChange, placeholder, onImagePaste, compactMode = false }, ref) {
    const editorRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      insertBold: () => {
        if (viewRef.current) wrapSelection(viewRef.current, '**', '**', '加粗文字')
      },
      insertItalic: () => {
        if (viewRef.current) wrapSelection(viewRef.current, '*', '*', '斜体文字')
      },
      insertLink: () => {
        if (viewRef.current) insertLinkFn(viewRef.current)
      },
      insertImage: () => {
        if (viewRef.current) insertImageFn(viewRef.current)
      },
      insertCode: () => {
        if (viewRef.current) wrapSelection(viewRef.current, '`', '`', '代码')
      },
      insertCodeBlock: () => {
        if (viewRef.current) insertCodeBlockFn(viewRef.current)
      },
      insertHr: () => {
        if (viewRef.current) insertHrFn(viewRef.current)
      },
      insertQuote: () => {
        if (viewRef.current) insertQuoteFn(viewRef.current)
      },
      insertText: (text: string) => {
        if (viewRef.current) {
          const { from, to } = viewRef.current.state.selection.main
          viewRef.current.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length },
          })
        }
      },
      focus: () => {
        viewRef.current?.focus()
      },
    }), [])

    useEffect(() => {
      if (!editorRef.current) return

      const state = EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          markdown(),
          createMarkdownKeymap(),
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
              padding: compactMode ? '8px 0' : '16px 0',
              caretColor: 'var(--orange-500)',
            },
            '.cm-line': {
              padding: compactMode ? '0 8px' : '0 16px',
              color: 'var(--text-secondary)',
            },
            '.cm-gutters': {
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
            },
            '.cm-lineNumbers .cm-gutterElement': {
              padding: compactMode ? '0 4px 0 8px' : '0 8px 0 16px',
              minWidth: compactMode ? '28px' : '40px',
              fontSize: compactMode ? '12px' : '13px',
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
          EditorView.domEventHandlers({
            paste: (event, view) => {
              const clipboardData = event.clipboardData
              if (!clipboardData) return

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

              const html = clipboardData.getData('text/html')
              if (html && html.trim()) {
                event.preventDefault()

                try {
                  const markdownText = htmlToMarkdown(html)
                  if (markdownText) {
                    const { from, to } = view.state.selection.main
                    view.dispatch({
                      changes: { from, to, insert: markdownText },
                      selection: { anchor: from + markdownText.length },
                    })
                    return
                  }
                } catch (error) {
                  console.error('Failed to convert HTML to Markdown:', error)
                }

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
)
