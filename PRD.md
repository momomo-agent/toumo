# Toumo - Interactive Motion Design Tool

## 产品定位

**State Machine Motion Design Tool**
最直观的现代交互动画设计工具

---

## 1. Summary

- Web-based motion/interaction design tool with explicit **state machines** instead of timelines
- Single layer tree shared across all keyframes + keyframe-driven display states + independent functional logic
- Components support multi-state reuse; motion curves follow global → element → attribute overrides
- Keyframes explicitly mark key elements/attributes; non-key parts stay untouched
- **Patch 连线交互逻辑**：Origami 风格的可视化 Patch 编辑器，触发器→动作用连线连接

### 核心理念

将复杂的交互动画设计简化为「状态」与「过渡」的组合，让设计师像搭积木一样构建流畅的交互体验。

### 核心区分

- **功能状态 = 变量 flag**（如 isOpen=true），纯逻辑，不直接对应视觉
- **显示状态 = 关键帧**（Keyframe），具体的画面快照
- **交互逻辑 = Patch 连线**：触发器 Patch（Tap/Drag/Hover...）通过连线连接到动作 Patch（切换显示状态/设置变量），数据从左到右流动

---

## 2. Goals & Non-Goals

### Goals
- 让设计师 5 分钟内完成第一个交互动效
- 能复现 Dribbble 上 80% 的 UI 动效
- 60fps 流畅预览，所见即所得
- 一键生成可交互原型链接 *(removed — not in scope)*

### Non-Goals (v1.0)
- 不做完整的 UI 设计工具（专注动效）
- 不做代码导出（后续版本）
- 不做实时协作（后续版本）
- **不做时间轴编辑器**（状态机驱动，非时间线驱动）
- **不做组件库/模板库**（组件由用户自己创建）
- **画布上不显示连线**（连线在 Patch 编辑器中，画布保持干净）
- **不做分享链接**

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
**本质上是一个变量 flag**（例如 `isOpen: boolean`、`tabIndex: number`、`status: "idle" | "loading" | "success"`）。用于逻辑判断，驱动状态机、触发条件判定，可与组件状态联动。功能状态不直接对应视觉，而是通过交互规则间接控制显示状态的切换。

### 显示状态 (Display State / Keyframe)
具体的画面快照（关键帧），代表某个时刻的视觉外观。**所有关键帧共享同一套图层树**，每个关键帧记录各图层的属性覆盖（位置、大小、颜色、透明度等）。未被标记为关键属性的部分保持原状。

### Patch 连线 (Patch Wiring) — Origami 风格
核心交互模型采用 **Origami 风格的 Patch 连线**（参考 Folme/MouseAction 的设计哲学）：
- **Patch** = 可视化节点，有输入端口和输出端口
- **触发器 Patch**（左侧）：Tap、Drag、Hover、Scroll、Timer、Variable Change 等，参考 MouseAction 的手势识别
- **动作 Patch**（右侧）：Switch Display State、Set Variable、Animate Property（folme.to 式）
- **连线** = 数据流，从触发器输出端口连到动作输入端口
- **示例**：[Tap Patch (target:按钮A)] → 输出 onTap → 连线 → [Switch State Patch (target:卡片B, state:展开)]
- 一个触发器可以连线到多个动作 Patch

### 过渡 (Transition)
显示状态之间切换时的动画效果，包含动画曲线、持续时间、延迟。

### 触发器 (Trigger)
启动交互规则的条件：tap、drag、hover、scroll、timer、变量变化等，可组合条件。

### 组件 (Component)
支持多状态组件（功能状态 + 显示状态组合），组件拥有自己的状态机和交互规则。组件实例可继承或覆盖状态逻辑/显示状态。**画布上第一行是画布级别的多个关键帧，下面每一行是每个组件的多个关键帧。**

---

## 5. Patch 连线模型

```
Patch 编辑器（Origami 风格）：

┌──────────────┐     ┌─────────────────────┐
│  Tap Patch   │     │ Switch State Patch  │
│  target:按钮  ├────►│ target:面板          │
│              │     │ state:展开           │
└──────────────┘     └─────────────────────┘
        │
        │            ┌─────────────────────┐
        └───────────►│ Set Variable Patch  │
                     │ var:isOpen = true    │
                     └─────────────────────┘

┌──────────────┐     ┌─────────────────────┐
│ Var Change   │     │ Switch State Patch  │
│ isOpen→true  ├────►│ target:遮罩          │
│              │     │ state:可见           │
└──────────────┘     └─────────────────────┘
```

- 触发器 Patch 在左，动作 Patch 在右，连线表示数据流
- 一个触发器可连线到多个动作 Patch
- 支持变量变化作为触发器（响应式）
- 参考 Folme 的 Sugar 模式：预设常用交互模板（mouseDown→缩小, mouseUp→恢复）

---

## 6. Editing Experience / Layout

### 整体布局

```
┌──────────────────┬────────────────────────────────────────────────┐
│                  │  ┌─────────┬─────────────────────┬──────────┐  │
│                  │  │ Layers  │       Canvas        │ Inspector│  │
│    Live         │  │         │                     │          │  │
│    Preview      │  │ 共享    │  ┌─────┐  ┌─────┐   │ 属性     │  │
│                  │  │ 图层树  │  │ KF1 │  │ KF2 │   │ 曲线     │  │
│   (始终可交互)   │  │         │  └─────┘  └─────┘   │ 过渡     │  │
│                  │  │ 所有KF  │  ┌─────┐  ┌─────┐   │          │  │
│                  │  │ 共用    │  │CmpA1│  │CmpA2│   │          │  │
│                  │  │         ├─────────────────────┤          │  │
│                  │  │         │ Patch Editor        │          │  │
│                  │  │         │ (Origami风格连线)   │          │  │
└──────────────────┴──┴─────────┴─────────────────────┴──────────┴──┘
```

### 1. Live Preview (左侧)
- 始终显示当前原型的可交互预览
- 实时响应编辑器中的修改
- 支持设备框架（iPhone/Android）

### 2. Layer Manager (编辑区左)
- Figma 风格的图层树
- **所有关键帧共享同一套图层树**（不是每个 keyframe 独立的图层）
- 支持：重命名、隐藏、重排序、嵌套 Frame
- 每个图层可标记为当前显示状态的「关键元素」

### 3. Canvas (编辑区中上)
- **画布第一行**：画布级别的多个关键帧（显示状态），从左到右排列
- **画布下面每一行**：每个组件的多个关键帧，从左到右排列
- 每个关键帧是一个固定尺寸的 Frame（可设置画布尺寸）
- **所有关键帧必须完整渲染，选中/未选中/Preview 显示一致**（不允许用灰色占位或简化渲染）
- **画布上不显示连线**，保持干净
- 支持 Figma 风格的完整操作：选择/矩形/椭圆/文本/手型工具，拖拽、智能吸附、快捷键
- 元素操作：拖拽移动、缩放、Delete、Cmd+C/V、方向键微调

### 4. Interaction Manager — Patch 编辑器 (编辑区中下)
- 紧贴画布下方
- **Origami 风格的 Patch 连线编辑器**
- 左侧放置触发器 Patch，右侧放置动作 Patch，用连线连接
- **触发器 Patch 类型**（参考 MouseAction）：
  - Tap — 点击（自动判断 click vs longClick vs drag）
  - Drag — 拖拽（输出 startMove/move/endMove + speed/direction）
  - Hover — 鼠标悬停（输出 mouseOver/mouseOut）
  - Scroll — 滚动
  - Timer — 定时器
  - Variable Change — 变量变化触发
- **动作 Patch 类型**（参考 Folme.to）：
  - Switch Display State — 切换元素的显示状态（带过渡动画）
  - Set Variable — 设置变量值
  - Animate Property — 直接动画某个属性（folme.to 式，弹簧/贝塞尔）
- 每个 Patch 有输入/输出端口，连线表示数据流
- 选中 Patch 可在 Inspector 中编辑参数（曲线、时长、延迟）
- 支持拖拽添加新 Patch、Delete 删除、框选多个

### 画布尺寸预设
- iPhone 14 Pro: 393×852
- iPhone 14: 390×844
- iPhone SE: 375×667
- Android: 360×800
- iPad: 820×1180
- 自定义尺寸

### 5. Inspector (编辑区右)
- 属性设置：位置、大小、颜色、透明度、圆角等
- 曲线覆盖：全局 → 元素 → 属性 三级覆盖
- 过渡设置：触发条件、持续时间、延迟
- 关键属性开关：标记哪些属性参与动画
- 组件面板：查看/编辑组件的多状态配置

---

## 7. 组件与状态映射

- 组件可以拥有自己的功能状态（变量 flag）和多个显示状态（关键帧）
- **画布上第一行是画布的多个关键帧，下面每一行是每一个组件的多个关键帧**
- 组件内部有自己的 Patch 连线（交互逻辑）
- 组件实例可以覆写显示状态或继承父组件定义
- 工程中可以引用组件并保留其交互逻辑

---

## 8. Data Model

```typescript
interface Project {
  id: string;
  name: string;
  layers: Layer[];              // 单一图层树（所有关键帧共享）
  displayStates: DisplayState[]; // 画布级显示状态（关键帧）
  variables: Variable[];         // 功能状态 = 变量 flag
  patches: Patch[];               // Patch 节点
  connections: PatchConnection[]; // Patch 连线
  components: Component[];
  globalCurve: Curve;
}

// 功能状态 = 变量
interface Variable {
  id: string;
  name: string;
  type: 'boolean' | 'number' | 'string' | 'color';
  defaultValue: any;
  currentValue: any;
}

// 显示状态 = 关键帧
interface DisplayState {
  id: string;
  name: string;
  layerOverrides: LayerOverride[]; // 每个图层在此关键帧中的属性覆盖
}

interface LayerOverride {
  layerId: string;
  properties: Partial<LayerProperties>; // 位置、大小、颜色、透明度等
  isKey: boolean;                        // 是否为关键属性（参与动画）
}

// Patch 连线模型
interface Patch {
  id: string;
  type: PatchType;               // trigger / action / logic
  name: string;
  position: { x: number; y: number }; // 在 Patch 编辑器中的位置
  config: Record<string, any>;   // Patch 特有配置
  inputs: PatchPort[];
  outputs: PatchPort[];
}

interface PatchPort {
  id: string;
  name: string;
  dataType: 'pulse' | 'boolean' | 'number' | 'string' | 'displayState';
}

interface PatchConnection {
  id: string;
  fromPatchId: string;
  fromPortId: string;
  toPatchId: string;
  toPortId: string;
}

// Patch 类型
type PatchType =
  // 触发器（参考 MouseAction）
  | 'tap' | 'drag' | 'hover' | 'scroll' | 'timer' | 'variableChange'
  // 动作（参考 Folme.to）
  | 'switchDisplayState' | 'setVariable' | 'animateProperty'
  // 逻辑
  | 'condition' | 'delay' | 'toggle';

interface TransitionConfig {
  duration: number;
  delay: number;
  curve: Curve;                  // 支持三级覆盖
}

interface Component {
  id: string;
  name: string;
  layers: Layer[];               // 组件自己的图层树
  displayStates: DisplayState[]; // 组件的多个关键帧
  variables: Variable[];         // 组件的功能状态（变量）
  patches: Patch[];               // 组件的 Patch 节点
  connections: PatchConnection[]; // 组件的 Patch 连线
}
```

---

## 9. 技术架构

### 前端
- React 18 + TypeScript
- Zustand 状态管理
- 自研 Canvas 2D（可升级 WebGL）
- requestAnimationFrame 动画引擎

### 设计原则
- 深色主题、高对比度、线性品牌感
- 直接操作 + 所见即所得
- **状态机驱动，无时间轴**
- **Origami 风格 Patch 连线交互**
- **画布干净无连线**
- **共享图层树**
- 组件化与可复用状态逻辑

---

## 10. 里程碑

| 版本 | 目标 | 核心功能 |
|------|------|----------|
| **v0.1** | MVP 基础可用 | 画布编辑、共享图层管理、两个显示状态、Tap 触发、基础缓动 |
| **v0.2** | Patch 编辑器 | Origami 风格 Patch 连线编辑器、变量系统（功能状态）、Tap/Hover 触发器 |
| **v0.3** | 触发器体系 | Drag/Scroll/Hover/Timer、条件组合、变量变化触发 |
| **v0.4** | 组件系统 | 多状态组件、组件关键帧行、状态继承/覆写 |
| **v0.5** | 曲线系统 | 全局→元素→属性三级覆盖、弹簧物理、贝塞尔编辑 |
| **v1.0** | 公开发布 | 性能优化、稳定性、完整文档 |

---

## 11. 成功指标

1. 易用性：新用户 5 分钟内完成第一个动效
2. 表现力：复现 Dribbble 80% UI 动效
3. 性能：60fps 流畅预览
4. 分享：~~一键生成可交互原型链接~~（不做）

---

## 12. Files Panel（文件管理）

### 位置
最左侧面板（在 Layer Panel 左边）

### 功能
1. **预设案例** — 内置多个示例项目（按钮交互、卡片展开、Tab 切换等），点击即可加载
2. **新建文件** — 创建空白项目，可选设备预设
3. **删除文件** — 删除已保存的项目
4. **重命名文件** — 双击文件名 inline 编辑
5. **文件列表** — 显示所有已保存的项目，支持排序（最近修改/名称）

### 数据存储
- localStorage 存储项目列表和数据
- 每个项目独立序列化（keyframes + elements + patches + connections + variables + components）
