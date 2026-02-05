# Code Review 代码审核与改进建议

## 当前状态评估

基于对 `App.tsx` 和 `App.css` 的审核，以下是发现的问题和改进建议。

---

## 🔴 高优先级问题

### 1. 颜色系统不一致

**问题**: 代码中混用了多种颜色定义方式

```css
/* App.css 中 */
background: #05060a;
background: #2c2c2c;
background: rgba(255, 255, 255, 0.08);

/* tailwind.config.js 中 */
'bg-primary': '#0a0a0b',
'bg-secondary': '#141415',
```

**建议**: 统一使用 CSS 变量

```css
:root {
  --bg-base: #0a0a0b;
  --bg-surface: #111113;
  --bg-elevated: #18181b;
  /* ... */
}
```

### 2. Top Bar 背景色过亮

**问题**: `background: #2c2c2c` 与整体深色主题不协调

**建议**: 改为 `--bg-surface` (#111113)

### 3. 字体大小不统一

**问题**: 代码中字号随意使用 12px、13px、14px、18px

**建议**: 严格遵循设计令牌中的字号系统

---

## 🟡 中优先级问题

### 4. 边框颜色过于明显

**问题**: `rgba(255, 255, 255, 0.08)` 在某些地方太亮

**建议**: 使用 `--border-subtle` (#1f1f23)

### 5. 缺少过渡动效

**问题**: 很多交互没有动效反馈

**建议**: 为所有可交互元素添加 `transition: all 150ms ease-out`

### 6. Preview 面板背景色

**问题**: `background: #252526` 与主背景对比不够

**建议**: 改为 `--bg-surface` (#111113)
