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

### 状态 (State)
一个 UI 的静态快照，包含所有图层的属性值

### 过渡 (Transition)
从一个状态到另一个状态的动画，包含触发条件和动画曲线

### 关键帧 (Keyframe)
标记哪些元素/属性在过渡中需要动画

### 触发器 (Trigger)
启动过渡的条件：tap、drag、hover、scroll、timer 等

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

- 每个状态是一个节点
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
│                  │  │         │ (状态图 / 关键帧图) │          │  │
└──────────────────┴──┴─────────┴─────────────────────┴──────────┴──┘
```

### 1. Live Preview (左侧)
- 始终显示当前原型的可交互预览
- 实时响应编辑器中的修改
- 支持设备框架（iPhone/Android）

### 2. Layer Manager (编辑区左)
- Figma 风格的图层树
- 支持：重命名、隐藏、重排序、嵌套 Frame
- 每个图层可标记为当前关键帧的「关键元素」

### 3. Canvas + Interaction Manager (编辑区中)
- **Canvas**: 关键帧从左到右线性排列，像 Figma 的 Frame 一样
  - 每个关键帧是一个固定尺寸的 Frame（可设置画布尺寸，如 390×844 iPhone 14）
  - 支持 Figma 风格的完整操作：
    - 选择工具 (V)：点击选中、拖拽移动、Shift 多选
    - 矩形工具 (R)：点击拖拽创建矩形
    - 椭圆工具 (O)：点击拖拽创建椭圆
    - 文本工具 (T)：点击创建文本
    - 手型工具 (H)：拖拽平移画布
    - 缩放：滚轮缩放、Cmd+0 适应屏幕、Cmd+1 100%
  - 元素操作：
    - 拖拽移动、8 个控制点调整大小
    - 对齐辅助线（智能吸附）
    - Delete 删除、Cmd+C/V 复制粘贴
    - 方向键微调位置
- **Interaction Manager**: 紧贴画布下方，与多状态画布同屏
  - Tab 1: 功能状态图（状态机可视化）：节点按照画布帧顺序自动排布，连线展示 transitions，可点击节点/边查看与编辑触发器、时长、曲线
  - Tab 2: 关键帧图（时间轴视图）：展示状态切换顺序、延迟与占位，可作为后续曲线/触发器的可视化入口
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
- 过渡设置：触发条件、持续时间、延迟
- 关键属性开关：标记哪些属性参与动画

---

## 7. 竞品分析

| 工具 | 优势 | 劣势 | Toumo 如何超越 |
|------|------|------|----------------|
| **Figma** | 协作强、UI 设计标准 | 动效能力弱、无状态机 | 专注动效，状态机驱动 |
| **Principle** | 三帧预览直观 | 交互逻辑有限、Mac only | Web 跨平台 + 更强逻辑 |
| **Origami** | 逻辑灵活强大 | 学习曲线陡峭、节点复杂 | 状态机比节点更直观 |
| **ProtoPie** | 交互丰富、跨平台 | 界面臃肿、状态管理弱 | 更轻量、状态机清晰 |
| **Framer** | 代码能力强 | 偏开发、设计师门槛高 | 零代码、设计师友好 |

### Toumo 的差异化
1. **状态机驱动** - 用状态图思维设计交互，清晰可控
2. **三帧预览** - 借鉴 Principle，同时看到多个关键帧
3. **灵活触发器** - 借鉴 Origami，支持复杂条件组合
4. **实时预览** - 左侧始终可交互，所见即所得
5. **Web 原生** - 跨平台、无需安装、易于分享

---

## 8. Data Model

```typescript
interface Project {
  id: string;
  name: string;
  layers: Layer[];           // 单一图层树
  states: State[];           // 状态列表
  transitions: Transition[]; // 过渡列表
  variables: Variable[];     // 变量
  globalCurve: Curve;        // 全局默认曲线
}

interface Layer {
  id: string;
  name: string;
  type: 'frame' | 'rect' | 'ellipse' | 'text' | 'image' | 'group';
  properties: Properties;    // 基础属性
  children?: Layer[];        // 嵌套子图层
}

interface State {
  id: string;
  name: string;
  isInitial: boolean;
  keyframes: Keyframe[];     // 该状态下的关键帧数据
}

interface Keyframe {
  layerId: string;
  isKey: boolean;            // 是否为关键元素
  properties: Partial<Properties>;  // 覆盖的属性值
  keyAttributes: string[];   // 标记为关键的属性名
}

interface Transition {
  id: string;
  from: string;              // state id
  to: string;                // state id
  trigger: Trigger;
  duration: number;
  delay: number;
  curve: Curve;              // 可覆盖全局曲线
  elementCurves?: Record<string, Curve>;  // 元素级覆盖
}

interface Trigger {
  type: 'tap' | 'longPress' | 'drag' | 'hover' | 'scroll' | 'timer' | 'variable';
  conditions?: Condition[];  // AND/OR 组合
  params?: Record<string, any>;  // 手势参数等
}
```

---

## 9. 技术架构

### 前端
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **画布渲染**: 自研 Canvas 2D（后期可升级 WebGL）
- **动画引擎**: 自研（基于 requestAnimationFrame）
- **样式**: Tailwind CSS

### 设计原则
- **深色主题** - 专业感、护眼
- **高对比度** - 清晰的层次
- **微妙动效** - 界面本身就是动效的展示
- **直接操作** - 拖拽优先，减少弹窗
- **即时反馈** - 修改立即生效
- **渐进披露** - 简单入门，深度可探索

### 品味参考
- Linear 的简洁克制
- Figma 的专业高效
- Apple 的细节打磨

---

## 10. 里程碑

| 版本 | 目标 | 核心功能 |
|------|------|----------|
| **v0.1** | MVP 基础可用 | 画布编辑、图层管理、两个状态、Tap 触发、基础缓动 |
| **v0.2** | 多关键帧 | 关键帧横向排列、时间轴视图、属性错开 |
| **v0.3** | 完整触发器 | Drag/Scroll/Hover/Timer、条件组合 |
| **v0.4** | 状态机可视化 | 可视化状态图编辑、多状态流程 |
| **v0.5** | 组件系统 | 组件复用、多状态组件 |
| **v1.0** | 公开发布 | 分享链接、设备预览、性能优化 |

---

## 11. 成功指标

1. **易用性** - 新用户 5 分钟内完成第一个动效
2. **表现力** - 能复现 Dribbble 上 80% 的 UI 动效
3. **性能** - 60fps 流畅预览
4. **分享** - 一键生成可交互原型链接
