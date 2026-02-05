# UI Polish Memory

## 2025-02-14
- Initialized UI polish log; focus on Toumo project improvements.
- Reviewed design tokens/components guidance plus PROGRESS backlog; prioritized unifying colors, typography, and layout chrome.
- Rebuilt global styles (`src/index.css`) with Toumo tokens + base reset; replaced ad-hoc colors.
- Reimplemented `App.tsx` UI shell with semantic class names and matching `App.css` polish (toolbar, layers, keyframe tabs, inspector, canvas grid).
- Added richer inspector controls (editable name/position/size/fill) and high-contrast selection states.
- Next: bring over design system for preview/interaction panels + address TODOs (text alignment controls, preset palettes, gradients).
- Implemented color preset grid + editable HEX/canvas picker plus text-specific inspector controls (content input, font size, alignment toggles) inside `src/App.tsx`; this completes "文本对齐" + "更多预设颜色" milestones from PROGRESS.
- Remaining UI polish: hook gradient fill designer, theme tokens for preview/timeline, replace inline styles with shared CSS, and reintroduce canvas interactions using modular components (`Canvas`, `LayerManager`, etc.).
