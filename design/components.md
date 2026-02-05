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
