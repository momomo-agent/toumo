# Design Tokens

## 颜色系统

### 背景色 (Backgrounds)

| Token | Hex | 用途 |
|-------|-----|------|
| `bg-base` | `#0a0a0b` | 应用主背景 |
| `bg-surface` | `#111113` | 面板背景 |
| `bg-elevated` | `#18181b` | 悬浮/弹窗背景 |
| `bg-hover` | `#1f1f23` | 悬停状态 |
| `bg-active` | `#27272b` | 按下/选中状态 |

### 边框色 (Borders)

| Token | Hex | 用途 |
|-------|-----|------|
| `border-subtle` | `#1f1f23` | 微弱分隔 |
| `border-default` | `#27272b` | 默认边框 |
| `border-strong` | `#3f3f46` | 强调边框 |

### 文字色 (Text)

| Token | Hex | 用途 |
|-------|-----|------|
| `text-primary` | `#fafafa` | 主要文字 |
| `text-secondary` | `#a1a1aa` | 次要文字 |
| `text-tertiary` | `#71717a` | 辅助文字 |
| `text-muted` | `#52525b` | 禁用/占位 |

### 强调色 (Accent)

| Token | Hex | 用途 |
|-------|-----|------|
| `accent` | `#6366f1` | 主强调色 (Indigo) |
| `accent-hover` | `#818cf8` | 悬停状态 |
| `accent-muted` | `#4f46e5` | 按下状态 |
| `accent-subtle` | `rgba(99,102,241,0.15)` | 背景高亮 |

### 语义色 (Semantic)

| Token | Hex | 用途 |
|-------|-----|------|
| `success` | `#22c55e` | 成功状态 |
| `warning` | `#f59e0b` | 警告状态 |
| `error` | `#ef4444` | 错误状态 |
| `info` | `#3b82f6` | 信息提示 |

### 关键帧状态色

| Token | Hex | 用途 |
|-------|-----|------|
| `state-idle` | `#6366f1` | Idle 状态 |
| `state-loading` | `#f59e0b` | Loading 状态 |
| `state-success` | `#22c55e` | Success 状态 |
| `state-error` | `#ef4444` | Error 状态 |

---

## 字体系统

### 字体族

```css
--font-sans: "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Menlo, monospace;
```

### 字号

| Token | Size | Line Height | 用途 |
|-------|------|-------------|------|
| `text-xs` | 11px | 1.4 | 标签、徽章 |
| `text-sm` | 12px | 1.5 | 辅助文字 |
| `text-base` | 13px | 1.5 | 正文 |
| `text-md` | 14px | 1.5 | 面板标题 |
| `text-lg` | 16px | 1.4 | 区块标题 |
| `text-xl` | 18px | 1.3 | 页面标题 |

### 字重

| Token | Weight | 用途 |
|-------|--------|------|
| `font-normal` | 400 | 正文 |
| `font-medium` | 500 | 强调 |
| `font-semibold` | 600 | 标题 |

---

## 间距系统

基于 4px 网格。

| Token | Value | 用途 |
|-------|-------|------|
| `space-0` | 0 | 无间距 |
| `space-1` | 4px | 紧凑间距 |
| `space-2` | 8px | 元素内间距 |
| `space-3` | 12px | 组件间距 |
| `space-4` | 16px | 区块间距 |
| `space-5` | 20px | 面板内边距 |
| `space-6` | 24px | 大区块间距 |
| `space-8` | 32px | 页面边距 |

---

## 圆角系统

| Token | Value | 用途 |
|-------|-------|------|
| `radius-sm` | 4px | 小按钮、输入框 |
| `radius-md` | 6px | 按钮、卡片 |
| `radius-lg` | 8px | 面板、弹窗 |
| `radius-xl` | 12px | 大卡片 |
| `radius-full` | 9999px | 圆形、药丸 |

---

## 阴影系统

深色主题下阴影要非常克制。

| Token | Value | 用途 |
|-------|-------|------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | 微弱提升 |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | 弹窗、下拉 |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | 模态框 |
