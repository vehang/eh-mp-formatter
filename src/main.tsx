import { createRoot } from 'react-dom/client'
import { ToastProvider } from './components/Toast'
import 'katex/dist/katex.min.css'
import './styles/preview.css'
import './styles/heading-variants.css'
import './index.css'
import App from './App.tsx'
import html2canvas from 'html2canvas'

// 将 html2canvas 暴露到 window，供 wechatCompat 复制处理时使用
;(window as any).html2canvas = html2canvas

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
)
