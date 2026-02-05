# Toumo - Interactive Motion Design Tool

## 产品定位

**State Machine Motion Design Tool**
最直观的现代交互动画设计工具

---

## 1. Summary

- Web-based motion/interaction design tool with explicit **state machines** instead of timelines
- Single layer tree + keyframe-driven display states + independent functional logic
- Components support multi-state reuse; motion curves follow global → element → attribute overrides
- Keyframes explicitly mark key elements/attributes; non-key parts stay untouched

### 核心理念

将复杂的交互动画设计简化为「状态」与「过渡」的组合，让设计师像搭积木一样构建流畅的交互体验。

---

## 2. Goals & Non-Goals

### Goals
- 让设计师 5 分钟内完成第一个交互动效
- 能复现 Dribbble 上 80% 的 UI 动效
- 60fps 流畅预览，所见即所得
- 一键生成可交互原型链接

### Non-Goals (v1.0)
- 不做完整的 UI 设计工具（专注动效）
- 不做代码导出（后续版本）
- 不做实时协作（后续版本）

---

## 3. Personas & Use Cases

### 目标用户
1. **UI/UX 设计师** - 需要快速验证交互想法
2. **产品经理** - 需要向开发清晰传达交互意图
3. **前端开发** - 需要精确的动效参数参考

### 典型场景
- 设计 App 页面切换动效
- 制作按钮/卡片的微交互
- 原型演示给客户/团队
- 交付动效规格给开发

---

## 4. Key Concepts

### 功能状态 (Functional State)
用于逻辑判断的状态（例如 Idle / Loading / Success），驱动状态机、触发条件判定，可与组件状态、变量联动。

### 显示状态 (Display State / Keyframe)
具体的画面快照（关键帧），代表同一功能状态下的不同外观（例如按钮按下动画的多个显示状态）。一个功能状态可以映射到一个或多个显示状态，以满足微动画但不改变逻辑。

### 过渡 (Transition)
从一个功能状态到另一个功能状态的动画，包含触发条件和动画曲线，同时可以指定切换到哪一个显示状态。

### 关键帧 (Keyframe)
标记某个显示状态中哪些元素/属性需要动画；非关键元素保持原状。

### 触发器 (Trigger)
启动过渡的条件：tap、drag、hover、scroll、timer、变量变化等，可组合条件。

### 组件 (Component)
支持多状态组件（功能状态 + 显示状态组合），组件内的状态机可复用，组件实例可继承或覆盖状态逻辑/显示状态。

---

## 5. State Machine Model

```
     ┌─────────┐   tap    ┌─────────┐
     │  Idle   │ ───────→ │  Open   │
     └─────────┘ ←─────── └─────────┘
                   tap
                    │
                    │ swipe
                    ▼
              ┌─────────┐
              │ Dismiss │
              └─────────┘
```

- 每个功能状态是一个节点
- 过渡是带条件的有向边
- 支持多状态、多路径
- 可视化状态图编辑

---

## 6. Editing Experience / Layout

### 整体布局

```
┌──────────────────┬────────────────────────────────────────────────┐
│                  │  ┌─────────┬─────────────────────┬──────────┐  │
│                  │  │ Layers  │       Canvas        │ Inspector│  │
│    Live         │  │         │                     │          │  │
│    Preview      │  │ Figma   │  ┌─────┐  ┌─────┐   │ 属性     │  │
│                  │  │ 风格    │  │ KF1 │  │ KF2 │   │ 曲线     │  │
│   (始终可交互)   │  │ 图层树  │  └─────┘  └─────┘   │ 过渡     │  │
│                  │  │         │                     │          │  │
│                  │  │         ├─────────────────────┤          │  │
│                  │  │         │ Interaction Manager │          │  │
│                  │  │         │ (状态图 / 组件视图) │          │  │
└──────────────────┴──┴─────────┴─────────────────────┴──────────┴──┘
```

### 1. Live Preview (左侧)
- 始终显示当前原型的可交互预览
- 实时响应编辑器中的修改
- 支持设备框架（iPhone/Android）

### 2. Layer Manager (编辑区左)
- Figma 风格的图层树
- 支持：重命名、隐藏、重排序、嵌套 Frame
- 每个图层可标记为当前显示状态的「关键元素」

### 3. Canvas + Interaction Manager (编辑区中)
- **Canvas**: 功能状态对应的显示状态 Frame 从左到右线性排列，像 Figma 的 Frame 一样
  - 每个显示状态是一个固定尺寸的 Frame（可设置画布尺寸，如 390×844 iPhone 14）
  - 支持 Figma 风格的完整操作：选择/矩形/椭圆/文本/手型工具，拖拽、智能吸附、快捷键
  - 元素操作：拖拽移动、缩放、Delete、Cmd+C/V、方向键微调
- **Interaction Manager**: 紧贴画布下方，与多状态画布同屏
  - 仅保留「功能状态图」Tab（完全状态驱动，取消传统 timeline）
  - 功能状态节点按逻辑关系排布，连线展示 transitions，可点击节点/边查看/编辑触发器、时长、曲线，并映射到具体显示状态
  - 右侧 Transition 列表：列出所有 from → to 关系，支持选择某条连线进入 Inspector 设置触发器、延迟、曲线覆盖

### 画布尺寸预设
- iPhone 14 Pro: 393×852
- iPhone 14: 390×844
- iPhone SE: 375×667
- Android: 360×800
- iPad: 820×1180
- 自定义尺寸

### 4. Inspector (编辑区右)
- 属性设置：位置、大小、颜色、透明度、圆角等
- 曲线覆盖：全局 → 元素 → 属性 三级覆盖
- 过渡设置：触发条件、持续时间、延迟，区分功能状态之间的逻辑 vs 显示状态切换
- 关键属性开关：标记哪些属性参与动画
- 组件面板：查看/编辑组件的多状态（功能状态 + 显示状态）配置

---

## 7. 组件与状态映射

- 组件可以拥有自己的功能状态机（例如 Button 组件有 Idle / Pressed / Disabled 等功能状态），并为每个功能状态定义一个或多个显示状态 Frame。
- 组件实例可以覆写显示状态或继承父组件定义，让组合式状态机成为复用基础。
- 工程中可以引用组件并保留其功能状态逻辑，以更快搭建多状态交互。

---

## 8. Data Model

```typescript
interface Project {
  id: string;
  name: string;
  layers: Layer[];           // 单一图层树
  states: State[];           // 功能状态列表
  displayStates: DisplayState[]; // 显示状态（关键帧）列表
  transitions: Transition[];
  components: Component[];
  variables: Variable[];
  globalCurve: Curve;
}

interface State {
  id: string;
  name: string;
  isInitial: boolean;
  componentId?: string;      // 所属组件
}

interface DisplayState {
  id: string;
  stateId: string;           // 对应的功能状态
  layerOverrides: Keyframe[];
}

interface Transition {
  id: string;
  from: string;              // 功能状态 id
  to: string;                // 功能状态 id
  displayTarget?: string;    // 要切换到的显示状态 id
  trigger: Trigger;
  duration: number;
  delay: number;
  curve: Curve;
}

interface Component {
  id: string;
  name: string;
  states: State[];
  displayStates: DisplayState[];
  transitions: Transition[];
}
```

---

## 9. 技术架构

### 前端
- React 18 + TypeScript
- Zustand 状态管理
- 自研 Canvas 2D（可升级 WebGL）
- requestAnimationFrame 动画引擎
- Tailwind CSS 组件库

### 设计原则
- 深色主题、高对比度、线性品牌感
- 直接操作 + 所见即所得
- 状态机驱动，取消传统 timeline
- 组件化与可复用状态逻辑

---

## 10. 里程碑

| 版本 | 目标 | 核心功能 |
|------|------|----------|
| **v0.1** | MVP 基础可用 | 画布编辑、图层管理、两个功能状态、Tap 触发、基础缓动 |
| **v0.2** | 多显示状态 | 多帧并排、Frame 尺寸预设、组件显示状态映射 |
| **v0.3** | 触发器体系 | Drag/Scroll/Hover/Timer、条件组合、Transition Inspector |
| **v0.4** | 状态机可视化 | Interaction Manager 状态图、Transition 列表、组件状态图 |
| **v0.5** | 组件系统 | 多状态组件、状态继承/覆写、组件库 |
| **v1.0** | 公开发布 | 分享链接、设备预览、性能优化 |

---

## 11. 成功指标

1. 易用性：新用户 5 分钟内完成第一个动效
2. 表现力：复现 Dribbble 80% UI 动效
3. 性能：60fps 流畅预览
4. 分享：一键生成可交互原型链接
