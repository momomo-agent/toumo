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
- **命令式交互逻辑**：「xx元素 在xx交互/时机下 让xx元素 变成xx显示状态 / xx元素变成xx功能状态」

### 核心理念

将复杂的交互动画设计简化为「状态」与「过渡」的组合，让设计师像搭积木一样构建流畅的交互体验。

### 核心区分

- **功能状态 = 变量 flag**（如 isOpen=true），纯逻辑，不直接对应视觉
- **显示状态 = 关键帧**（Keyframe），具体的画面快照
- **交互规则 = 命令式指令**：当[元素A]被[tap/drag/hover...]时，让[元素B]切换到[显示状态X]，让[变量C]变为[值Y]

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
- **不做时间轴编辑器**（状态机驱动，非时间线驱动）
- **不做组件库/模板库**（组件由用户自己创建）
- **不做画布连线**（交互逻辑在 Interaction Manager 中配置，画布保持干净）

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

### 交互规则 (Interaction Rule) — 命令式
核心交互模型采用**命令式**而非声明式（区别于 Origami 的声明式 Patch）：
- **格式**：当 [触发元素] 被 [交互类型] 时 → 让 [目标元素] 变成 [显示状态X] / 让 [变量] 变为 [值]
- **示例**：当 [按钮A] 被 [tap] 时 → 让 [卡片B] 变成 [展开状态] + 让 [isOpen] 变为 [true]
- 一条规则可以同时触发多个动作（改变多个元素的显示状态 + 修改多个变量）

### 过渡 (Transition)
显示状态之间切换时的动画效果，包含动画曲线、持续时间、延迟。

### 触发器 (Trigger)
启动交互规则的条件：tap、drag、hover、scroll、timer、变量变化等，可组合条件。

### 组件 (Component)
支持多状态组件（功能状态 + 显示状态组合），组件拥有自己的状态机和交互规则。组件实例可继承或覆盖状态逻辑/显示状态。**画布上第一行是画布级别的多个关键帧，下面每一行是每个组件的多个关键帧。**

---

## 5. State Machine Model

```
交互规则（命令式）：

当 [按钮] 被 tap 时：
  → 让 [面板] 切换到 [展开] 显示状态
  → 让 isOpen = true

当 [关闭按钮] 被 tap 时：
  → 让 [面板] 切换到 [收起] 显示状态  
  → 让 isOpen = false

当 isOpen 变为 true 时：
  → 让 [遮罩] 切换到 [可见] 显示状态
```

- 功能状态是变量 flag，不是节点
- 交互规则是命令式指令，不是有向边
- 支持一个触发同时执行多个动作
- 支持变量变化作为触发条件（响应式）

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
│                  │  │         │ Interaction Manager │          │  │
│                  │  │         │ (交互规则列表)      │          │  │
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
- **画布上不显示连线**，保持干净
- 支持 Figma 风格的完整操作：选择/矩形/椭圆/文本/手型工具，拖拽、智能吸附、快捷键
- 元素操作：拖拽移动、缩放、Delete、Cmd+C/V、方向键微调

### 4. Interaction Manager (编辑区中下)
- 紧贴画布下方
- **命令式交互规则列表**（不是状态图/连线图）
- 每条规则格式：当 [元素] 被 [交互] 时 → [动作1] + [动作2] + ...
- 动作类型：
  - 让 [元素] 切换到 [显示状态]（带过渡动画）
  - 让 [变量] 变为 [值]
- 支持添加/编辑/删除规则
- 点击规则可在 Inspector 中编辑详细参数（曲线、时长、延迟）

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
- 组件内部有自己的交互规则（命令式）
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
  rules: InteractionRule[];      // 命令式交互规则
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

// 命令式交互规则
interface InteractionRule {
  id: string;
  name: string;
  trigger: {
    elementId: string;           // 触发元素
    type: TriggerType;           // tap/drag/hover/scroll/timer/variableChange
    condition?: string;          // 可选条件表达式
  };
  actions: Action[];             // 一个触发可执行多个动作
}

interface Action {
  type: 'switchDisplayState' | 'setVariable';
  // switchDisplayState
  targetElementId?: string;
  targetDisplayStateId?: string;
  transition?: TransitionConfig;
  // setVariable  
  variableId?: string;
  value?: any;
}

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
  rules: InteractionRule[];      // 组件的交互规则
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
- **命令式交互规则，非声明式**
- **画布干净无连线**
- **共享图层树**
- 组件化与可复用状态逻辑

---

## 10. 里程碑

| 版本 | 目标 | 核心功能 |
|------|------|----------|
| **v0.1** | MVP 基础可用 | 画布编辑、共享图层管理、两个显示状态、Tap 触发、基础缓动 |
| **v0.2** | 交互规则 | 命令式交互规则编辑器、变量系统（功能状态）、多动作支持 |
| **v0.3** | 触发器体系 | Drag/Scroll/Hover/Timer、条件组合、变量变化触发 |
| **v0.4** | 组件系统 | 多状态组件、组件关键帧行、状态继承/覆写 |
| **v0.5** | 曲线系统 | 全局→元素→属性三级覆盖、弹簧物理、贝塞尔编辑 |
| **v1.0** | 公开发布 | 分享链接、设备预览、性能优化 |

---

## 11. 成功指标

1. 易用性：新用户 5 分钟内完成第一个动效
2. 表现力：复现 Dribbble 80% UI 动效
3. 性能：60fps 流畅预览
4. 分享：一键生成可交互原型链接
