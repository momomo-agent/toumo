# Toumo — Interactive Motion Design Tool

**State Machine Motion Design Tool**
最直观的现代交互动画设计工具

🔗 **Live Demo**: [momomo-agent.github.io/toumo](https://momomo-agent.github.io/toumo/)

---

## ✨ Features

### Canvas Editor
- Figma-style drawing tools (Rectangle, Ellipse, Text)
- Smart alignment guides & snapping
- Multi-select with Shift+drag
- Copy/Paste/Cut shortcuts
- Image drag & drop import

### State Machine
- **Display States** — visual keyframes sharing one layer tree
- **Variables** — boolean/number/string logic flags
- **Transitions** — spring physics & bezier curves
- **3-level curve override** — Global → Element → Property

### Patch Editor (Origami-style)
- Visual node wiring: Triggers → Actions
- **Triggers**: Tap, Hover, Drag, Scroll, Timer, Variable Change
- **Actions**: Switch Display State, Set Variable, Animate Property
- **Logic**: Condition, Toggle, Counter, Delay, Option Switch, Drag Binding
- Node execution flash feedback
- Connection flow animation

### Sugar Presets
Right-click any element to instantly add:
- 🖱️ Hover Scale
- 👆 Tap Toggle
- ✋ Press & Release
- 👋 Drag to Dismiss
- 🎨 Hover Color
- ➡️ Tap Navigate
- 🔄 Auto Play

### Export
- JSON (full project)
- CSS Animation
- Framer Motion
- SVG / HTML
- Share URL (compressed)

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [localhost:5173/toumo/](http://localhost:5173/toumo/)

---

## 🏗️ Tech Stack

- React 18 + TypeScript
- Zustand state management
- Vite build
- Spring physics animation engine

---

## 📖 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select |
| R | Rectangle |
| O | Ellipse |
| T | Text |
| H | Hand/Pan |
| Space | Temporary hand |
| ⌘Z | Undo |
| ⌘⇧Z | Redo |
| ⌘D | Duplicate Patch |
| ⌘0 | Zoom to fit |
| Delete | Delete selected |

---

## License

MIT
