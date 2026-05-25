# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeChat public account (微信公众号) Markdown formatter. Users write Markdown in a CodeMirror editor and get a styled preview optimized for pasting into WeChat's rich text editor. The app runs as a static SPA built with Vite.

## Commands

```bash
npm run dev        # Vite dev server with HMR
npm run build      # tsc -b && vite build (type-check then bundle)
npm run lint       # eslint .
npm run test       # vitest run (single run)
npm run preview    # vite preview (serve production build locally)
```

Tests use Vitest with jsdom environment. Test files live next to source as `*.test.{ts,tsx}`.

## Architecture

**Single-page app, no routing.** `App.tsx` orchestrates everything via custom hooks:

- `useHistory` — undo/redo stack for editor content
- `useSettings` — theme, code style, preview mode, persisted to localStorage
- `useAutoSave` — debounced save of editor content to localStorage
- `useUITheme` — light/dark app shell theme
- `useImageHost` — image hosting provider config
- `useSyncScroll` — synchronized scrolling between editor and preview
- `useKeyboard` — global keyboard shortcuts (Ctrl+Z/Y undo/redo, Ctrl+Shift+C copy formatted)

**Data flow:** Markdown text → `parseMarkdown()` (markdown-it + highlight.js) → HTML string → `Preview` component renders it → copy/export actions apply `wechatCompat` transforms.

### Key modules

| Path | Purpose |
|------|---------|
| `src/themes/` | 18 content themes + 6 code highlight themes. Each theme defines colors, inline styles, and a `HeadingStyleVariant`. Themes generate CSS variables via `data-theme-style` attribute and inline styles for WeChat copy. |
| `src/lib/wechatCompat.ts` | Converts rendered HTML for WeChat compatibility: flex→table layout, inline CSS via `juice`, image base64 encoding, style flattening. Called only on copy/export, not during preview. |
| `src/utils/markdown.ts` | markdown-it config with highlight.js integration, math support (markdown-it-mathjax3), and custom plugins. |
| `src/utils/htmlToMarkdown.ts` | Reverse conversion: rich text paste (from WeChat/Feishu/Word) → Markdown via turndown. |
| `src/styles/heading-variants.css` | Per-theme heading decorations (gradients, icons, borders) applied via CSS class matching on `--theme-heading-style`. |

### WeChat compatibility constraints

WeChat's editor strips most CSS and doesn't support flex/grid. The copy pipeline:
1. Clone preview DOM
2. Apply theme inline styles to every element (for paste fidelity)
3. `juice` inlines remaining CSS
4. Convert flex layouts to tables
5. Encode images to base64 (WeChat blocks external images)
6. Sanitize with DOMPurify

Changes to preview rendering or copy logic must be tested by actually pasting into WeChat's editor — browser rendering alone is insufficient.

## Tech Stack

- React 19, TypeScript (strict), Vite 7
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin, not PostCSS)
- CodeMirror 6 for the editor
- markdown-it + highlight.js for parsing
- Vitest + Playwright for testing
