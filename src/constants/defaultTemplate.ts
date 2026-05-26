/**
 * 默认文章模板内容
 * 从 App.tsx 提取，供 useArticles hook 创建默认文章使用
 */
export const defaultMarkdown = `![Unsplash 示例图片](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80)

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
