# 排版助手

> 程序员宝盒旗下工具 · [md.baoboxs.com](https://md.baoboxs.com)

一款专为**微信公众号**打造的 Markdown 排版工具。左侧写 Markdown，右侧实时预览，写完一键复制，直接粘贴到公众号编辑器即可保留全部样式。内置 18 套精美主题、代码高亮、数学公式、多图床上传，让排版这件事不再耗时。

---

## ✨ 核心特性

### 📝 所见即所得的编辑体验
- **CodeMirror 6 编辑器**：语法高亮、行号、自动缩进，流畅响应大文档
- **实时预览**：边写边看，无需手动刷新
- **同步滚动**：编辑区与预览区滚动联动，长文定位不迷路
- **自动保存**：内容实时写入 localStorage，刷新 / 闪退不丢稿
- **撤销 / 重做**：完整的编辑历史栈，`Ctrl+Z` / `Ctrl+Y` 随时回退

### 🎨 18 套主题 + 6 套代码高亮
- **内容主题**：靛青、森林、玫瑰、琥珀、石板、深海蓝、森林之夜、玫瑰松、北欧、德古拉、太阳能、Gruvbox、东京之夜、One Dark、Material、樱花、Ayu、天青
- **代码主题**：覆盖主流编辑器配色（One Dark、Dracula、Solarized 等）
- 每套主题都包含标题装饰、引用块、表格、行内/块级代码的完整配色
- 支持浅色 / 深色应用外壳，长时间写作不累眼

### 📋 一键复制，公众号完美还原
针对微信公众号编辑器的限制做了完整的兼容处理：
- 自动把 flex / grid 布局转换为微信支持的 table 布局
- 通过 `juice` 把所有样式内联到元素 style 属性，避免被微信过滤
- 图片自动转 base64（微信会屏蔽外链图片）
- DOMPurify 清洗，确保粘贴内容安全合规
- 支持 `Ctrl+Shift+C` 快捷键一键复制排版结果

### 🔁 富文本反向转换
- 从公众号、飞书、Word、网页复制的内容，粘贴回编辑器会**自动转换为 Markdown**
- 基于 turndown 实现，保留标题、列表、链接、图片、表格等结构

### 🖼️ 多图床支持
写文章时直接拖入 / 粘贴图片，自动上传到图床并插入 Markdown 链接。支持失败自动切换备用图床：

| 类型 | 支持的图床 |
|------|-----------|
| 公共免费图床 | ImgBB、FreeImage、Kappa、DK 图床、闪电图床、L.S.E.E |
| 国内云存储 | 阿里云 OSS、腾讯云 COS、七牛云、又拍云、华为云 OBS、网易云 NOS、京东云 OSS |
| 海外云存储 | AWS S3 |

### 📚 文章管理
- 本地文章库：把当前内容保存为草稿，随时切换编辑
- 快速检索、删除、重命名

### 🔗 导入与导出
- **URL 导入**：粘贴网页链接，自动抓取正文转为 Markdown
- **PDF 导出**：一键导出当前排版结果为 PDF

### ⌨️ 键盘快捷键
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` / `Ctrl+Y` | 撤销 / 重做 |
| `Ctrl+Shift+C` | 一键复制排版结果 |

更多快捷键可在应用内的「快捷键」面板查看。

### 🔐 宝盒账号登录
- 接入 [程序员宝盒](https://www.baoboxs.com) OAuth 单点登录
- 一处登录，全站通行；支持退出登录与多端状态同步

---

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建
npm run build

# 本地预览生产构建
npm run preview

# 运行单元测试（Vitest，jsdom 环境）
npm run test

# 代码检查
npm run lint
```

> 开发环境下，`/api/*` 请求会被 Vite 代理到本地 `baoboxs-service`（默认 `http://localhost:8080`），生产环境由 nginx 承担。

---

## 🏗️ 技术架构

### 技术栈
- **React 19** + **TypeScript**（strict 模式）
- **Vite 7** 构建，Tailwind CSS v4（通过 `@tailwindcss/vite` 插件）
- **CodeMirror 6** 作为 Markdown 编辑器
- **markdown-it** + **highlight.js** 负责 Markdown 解析与代码高亮
- **markdown-it-mathjax3** 支持数学公式渲染
- **juice** + **DOMPurify** 负责公众号复制兼容
- **turndown** 实现富文本 → Markdown 反向转换
- **Vitest** + **Playwright** 单元与端到端测试

### 数据流
```
Markdown 文本
   │
   ▼
parseMarkdown()  ── markdown-it + highlight.js + mathjax
   │
   ▼
HTML 字符串
   │
   ▼
Preview 组件实时渲染 ──── 用户在预览区看到的效果
   │
   ▼ （复制 / 导出时）
wechatCompat 兼容处理 ── 样式内联 + flex→table + 图片 base64 + DOMPurify
   │
   ▼
剪贴板 / PDF
```

### 关键模块
| 路径 | 职责 |
|------|------|
| `src/themes/` | 18 套内容主题 + 6 套代码高亮主题，每套主题定义配色与标题样式变体 |
| `src/lib/wechatCompat.ts` | 公众号兼容层：flex→table、CSS 内联、图片 base64、DOMPurify 清洗（仅在复制/导出时调用） |
| `src/utils/markdown.ts` | markdown-it 配置，集成 highlight.js、mathjax 及自定义插件 |
| `src/utils/htmlToMarkdown.ts` | 富文本反向转换：公众号 / 飞书 / Word 粘贴 → Markdown |
| `src/styles/heading-variants.css` | 每套主题的标题装饰（渐变、图标、边框等） |

### 微信兼容性说明
微信编辑器会剥离大部分 CSS，且不支持 flex / grid。复制管线的处理顺序：
1. 克隆预览 DOM
2. 把主题内联样式应用到每个元素（保证粘贴保真）
3. `juice` 把剩余 CSS 内联
4. flex 布局转换为 table
5. 图片编码为 base64（微信会屏蔽外链图片）
6. DOMPurify 清洗

> ⚠️ 任何对预览渲染或复制逻辑的改动，都必须实际粘贴到微信编辑器中验证 —— 仅看浏览器渲染是不够的。

---

## 📁 项目结构

```
eh-mp-formatter/
├── index.html                  # 入口 HTML（含 SEO meta、结构化数据）
├── public/
│   ├── baoboxs-logo.png        # 宝盒品牌 logo
│   ├── robots.txt              # 爬虫引导
│   └── sitemap.xml             # 站点地图
├── src/
│   ├── App.tsx                 # 应用入口，编排所有 hook 与布局
│   ├── components/             # UI 组件（编辑器、预览、工具栏、各类 Modal）
│   ├── hooks/                  # 自定义 Hook（撤销栈、设置、自动保存、图床、同步滚动等）
│   ├── themes/                 # 主题系统
│   ├── lib/                    # 公众号兼容、OAuth 配置等核心逻辑
│   ├── utils/                  # Markdown 解析、HTML↔Markdown 转换、URL 抓取
│   ├── types/                  # 图床等类型定义
│   └── styles/                 # 标题装饰等样式
└── vite.config.ts              # Vite 配置（含 /api 开发代理）
```

---

## 📄 License

私有项目，版权归程序员宝盒所有。

---

## 🔗 相关链接

- **在线使用**：[md.baoboxs.com](https://md.baoboxs.com)
- **程序员宝盒**：[www.baoboxs.com](https://www.baoboxs.com)
- **问题反馈**：[GitHub Issues](https://github.com/vehang/eh-mp-formatter/issues)
