CREATE TABLE IF NOT EXISTS posts (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  content     TEXT NOT NULL,
  draft       INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Seed with the hello-world post
INSERT OR IGNORE INTO posts (slug, title, description, content, draft, created_at, updated_at)
VALUES (
  'hello-world',
  '你好，世界',
  '这是 Bookie 的第一篇文章，一个简洁、优雅的写作空间。',
  '欢迎来到 **Bookie**，一个追求极简的个人博客。

## 为什么是 Bookie？

在这个信息过载的时代，我们希望回归写作的本质——**干净的排版、专注的阅读**。Bookie 没有多余的装饰，只有黑白灰三种色调，让文字自己说话。

## 写作体验

Bookie 使用 Markdown 写作。打开管理后台，使用分屏编辑器，左侧写 Markdown，右侧实时预览。

## 设计哲学

- **黑白极简**：无色相干扰，纯靠灰度传达层次
- **Inter 字体**：现代几何无衬线体，阅读体验极佳
- **深色模式**：自动跟随系统，也支持手动切换
- **毛玻璃导航**：`backdrop-filter` 模糊效果，轻盈通透
- **680px 宽度**：经典的阅读栏宽度，舒适不疲劳

---

感谢你的阅读。开始写作吧。',
  0,
  '2026-05-23T00:00:00.000Z',
  '2026-05-23T00:00:00.000Z'
);
