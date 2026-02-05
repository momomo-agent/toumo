# Components 组件规范

## 按钮 (Button)

### 变体

| 变体 | 用途 | 背景 | 边框 |
|------|------|------|------|
| Primary | 主要操作 | `accent` | 无 |
| Secondary | 次要操作 | `bg-hover` | `border-default` |
| Ghost | 工具栏 | 透明 | `border-subtle` |
| Danger | 删除操作 | 透明 | `error` 边框 |

### 尺寸

| 尺寸 | 高度 | 内边距 | 字号 |
|------|------|--------|------|
| sm | 24px | 8px 10px | 11px |
| md | 32px | 8px 12px | 13px |
| lg | 40px | 10px 16px | 14px |

### 状态

```css
/* 默认 */
background: var(--bg-hover);
border: 1px solid var(--border-default);

/* 悬停 */
background: var(--bg-active);
border-color: var(--border-strong);

/* 按下 */
transform: scale(0.98);

/* 禁用 */
opacity: 0.5;
cursor: not-allowed;
```

---

## 输入框 (Input)

### 样式

```css
height: 32px;
padding: 0 10px;
background: var(--bg-base);
border: 1px solid var(--border-default);
border-radius: var(--radius-sm);
color: var(--text-primary);
font-size: 13px;
```

### 状态

- **聚焦**: `border-color: var(--accent)`
- **错误**: `border-color: var(--error)`

---

## 下拉选择 (Select)

与 Input 样式一致，右侧带箭头图标。

```css
appearance: none;
background-image: url("data:image/svg+xml,..."); /* 下箭头 */
background-position: right 8px center;
padding-right: 28px;
```

---

## 药丸标签 (Pill)

用于状态指示、标签。

```css
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 10px;
border-radius: 9999px;
background: var(--bg-hover);
font-size: 11px;
font-weight: 500;
```

### 变体

| 变体 | 背景 | 文字 |
|------|------|------|
| default | `bg-hover` | `text-secondary` |
| active | `accent` | `#fff` |
| success | `success/15%` | `success` |

---

## 面板标题 (Panel Heading)

```css
display: flex;
align-items: center;
justify-content: space-between;
padding: 8px 0;
font-size: 11px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
color: var(--text-tertiary);
```

---

## 图层项 (Layer Item)

```css
display: flex;
align-items: center;
gap: 8px;
height: 28px;
padding: 0 8px;
border-radius: 4px;
cursor: pointer;
```

### 状态

- **悬停**: `background: var(--bg-hover)`
- **选中**: `background: var(--bg-active)` + 左侧 2px accent 边框

---

## 工具栏按钮 (Toolbar Button)

```css
width: 32px;
height: 32px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 6px;
background: transparent;
border: none;
color: var(--text-secondary);
```

### 状态

- **悬停**: `background: var(--bg-hover)`
- **选中**: `background: var(--accent-subtle)`, `color: var(--accent)`

---

## 关键帧卡片 (Keyframe Card)

```css
background: var(--bg-surface);
border: 1px solid var(--border-default);
border-radius: 8px;
overflow: hidden;
```

### 头部

```css
padding: 8px 12px;
background: var(--bg-elevated);
border-bottom: 1px solid var(--border-subtle);
font-size: 13px;
font-weight: 500;
```

### 选中态

```css
border-color: var(--accent);
box-shadow: 0 0 0 1px var(--accent);
```
