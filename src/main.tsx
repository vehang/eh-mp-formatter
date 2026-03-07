import { createRoot } from 'react-dom/client'
import { ToastProvider } from './components/Toast'
import 'katex/dist/katex.min.css'
import './styles/preview.css'
import './styles/heading-variants.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
)
