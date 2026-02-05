# Motion 动效规范

## 核心原则

作为动效设计工具，Toumo 的界面动效必须是品质标杆。

1. **有意义** - 每个动效都有目的
2. **快速** - 不让用户等待
3. **自然** - 符合物理直觉
4. **一致** - 全局统一的动效语言

---

## 时长 (Duration)

| Token | 时长 | 用途 |
|-------|------|------|
| `instant` | 100ms | 微交互（hover、active） |
| `fast` | 150ms | 小元素变化 |
| `normal` | 200ms | 标准过渡 |
| `slow` | 300ms | 大面积变化 |
| `slower` | 400ms | 复杂动画 |

---

## 缓动曲线 (Easing)

| Token | 曲线 | 用途 |
|-------|------|------|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | 默认，元素出现 |
| `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | 元素消失 |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | 位置移动 |
| `spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 弹性效果 |

---

## 常见动效

### 按钮悬停

```css
transition: all 150ms ease-out;

&:hover {
  background: var(--bg-hover);
}
```

### 按钮按下

```css
&:active {
  transform: scale(0.98);
  transition: transform 100ms ease-out;
}
```

### 面板展开/收起

```css
transition: height 200ms ease-out;
overflow: hidden;
```

### 元素选中

```css
transition: border-color 150ms ease-out, box-shadow 150ms ease-out;

&.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}
```

### 拖拽元素

```css
/* 拖拽开始 */
transform: scale(1.02);
box-shadow: var(--shadow-md);
transition: transform 150ms spring, box-shadow 150ms ease-out;

/* 拖拽结束 */
transition: transform 200ms ease-out, box-shadow 200ms ease-out;
```

---

## 禁止的动效

1. **过长的动画** - 超过 400ms 会让用户感到迟钝
2. **无意义的弹跳** - 不是所有东西都需要 spring
3. **阻塞交互的动画** - 用户应该能随时打断
4. **过度的视差** - 保持克制
