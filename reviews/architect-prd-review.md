# 架构师 PRD 深度审查

> 审查日期：2025-07-17
> 审查范围：PRD.md 全文 vs 代码实现
> 代码版本：当前 main 分支最新

---

## PRD 第 1 节：Summary

### PRD 原文要求
> - Web-based motion/interaction design tool with explicit **state machines** instead of timelines
> - Single layer tree shared across all keyframes + keyframe-driven display states + independent functional logic
> - Components support multi-state reuse; motion curves follow global → element → attribute overrides
> - Keyframes explicitly mark key elements/attributes; non-key parts stay untouched
> - **Patch 连线交互逻辑**：Origami 风格的可视化 Patch 编辑器，触发器→动作用连线连接

### 代码实现
- 对应文件：`src/store/useEditorStore.ts`, `src/types/index.ts`, `src/components/InteractionManager/`
- 实现状态：⚠️ 部分匹配

### 偏差说明
1. **状态机 vs 时间轴**：✅ 代码中没有时间轴编辑器，使用 keyframe（显示状态）+ transition 模型，符合状态机理念。
2. **共享图层树**：✅ `sharedElements` 是单一图层树，所有 keyframe 共享。`syncToAllKeyframes()` 函数确保同步。
3. **三级曲线覆盖**：✅ `globalCurve` (全局) → `LayerOverride.curveOverride` (元素级) → `LayerOverride.propertyCurveOverrides` (属性级) 已实现。
4. **关键属性标记**：✅ `LayerOverride.isKey` 和 `keyProperties` 字段存在。
5. **Patch 连线**：✅ `Patch`, `PatchConnection` 类型已定义，`PatchCanvas`, `PatchNode`, `PatchConnection` 组件已实现。

### 核心区分审查

> - **功能状态 = 变量 flag**（如 isOpen=true），纯逻辑，不直接对应视觉
> - **显示状态 = 关键帧**（Keyframe），具体的画面快照
> - **交互逻辑 = Patch 连线**

- 对应文件：`src/types/index.ts` (`Variable`, `DisplayState`, `Patch`)
- 实现状态：⚠️ 部分匹配

**偏差：**
- 功能状态在代码中有两套实现：旧版 `FunctionalState` 类型（独立的状态对象）和新版 `Variable` 类型。PRD 明确说功能状态 = 变量 flag，但代码中 `FunctionalState` 仍然存在且被使用（`functionalStates` 在 store 中），这造成了概念混淆。
- 交互逻辑同时存在三套系统：旧版 `Transition`（from/to/trigger）、中间版 `Interaction`（手势+动作）、新版 `Patch` 连线。PRD 只描述了 Patch 连线模型，但旧系统未清理。

---

## PRD 第 2 节：Goals & Non-Goals

### PRD 原文要求 — Goals
> - 让设计师 5 分钟内完成第一个交互动效
> - 能复现 Dribbble 上 80% 的 UI 动效
> - 60fps 流畅预览，所见即所得
> - 一键生成可交互原型链接 *(removed — not in scope)*

### 代码实现
- 实现状态：⚠️ 部分匹配

**偏差：**
- "一键生成可交互原型链接" 已标注 removed，但代码中仍存在 `ShareModal.tsx`、`src/utils/shareUtils.ts`、`src/utils/exportPrototype.ts`，提供了分享链接和导出 HTML 功能。虽然 PRD 说 removed，但这些功能实际存在。

### PRD 原文要求 — Non-Goals
> - 不做完整的 UI 设计工具（专注动效）
> - 不做代码导出（后续版本）
> - 不做实时协作（后续版本）
> - **不做时间轴编辑器**（状态机驱动，非时间线驱动）
> - **不做组件库/模板库**（组件由用户自己创建）
> - **画布上不显示连线**（连线在 Patch 编辑器中，画布保持干净）
> - **不做分享链接**

### 代码实现
- 实现状态：❌ 不匹配（多项 Non-Goal 被违反）

### 偏差说明
1. **不做代码导出** ❌ 违反：`src/utils/exportGenerators.ts` 实现了 CSS Animation、React/Framer Motion、SVG、HTML/CSS 代码导出。`src/utils/lottieGenerator.ts` 实现了 Lottie JSON 导出。`src/components/ExportPanel/index.tsx` 和 `src/components/ExportModal.tsx` 提供了导出 UI。
2. **不做时间轴编辑器** ✅ 符合：代码中没有时间轴编辑器。
3. **不做组件库/模板库** ✅ 符合：没有预置组件库，组件由用户创建。
4. **画布上不显示连线** ✅ 符合：画布上没有连线渲染，连线仅在 Patch 编辑器中。
5. **不做分享链接** ❌ 违反：`ShareModal.tsx` 实现了完整的分享链接功能（URL hash 压缩分享 + Data URI 复制 + HTML 导出下载）。

---

## PRD 第 3 节：Personas & Use Cases

### PRD 原文要求
> ### 目标用户
> 1. **UI/UX 设计师** - 需要快速验证交互想法
> 2. **产品经理** - 需要向开发清晰传达交互意图
> 3. **前端开发** - 需要精确的动效参数参考
>
> ### 典型场景
> - 设计 App 页面切换动效
> - 制作按钮/卡片的微交互
> - 原型演示给客户/团队
> - 交付动效规格给开发

### 代码实现
- 对应文件：整体产品功能
- 实现状态：✅ 完全匹配

### 偏差说明
此节为产品定位描述，不涉及具体代码实现。从功能角度看：
- 画布编辑 + 多关键帧 + 过渡动画 → 支持设计 App 页面切换动效 ✅
- 元素属性编辑 + 触发器 → 支持按钮/卡片微交互 ✅
- LivePreview + 设备框架 → 支持原型演示 ✅
- Inspector 中的动效参数 → 支持交付规格 ✅

---

## PRD 第 4 节：Key Concepts

### 4.1 功能状态 (Functional State)

#### PRD 原文要求
> **本质上是一个变量 flag**（例如 `isOpen: boolean`、`tabIndex: number`、`status: "idle" | "loading" | "success"`）。用于逻辑判断，驱动状态机、触发条件判定，可与组件状态联动。功能状态不直接对应视觉，而是通过交互规则间接控制显示状态的切换。

#### 代码实现
- 对应文件：`src/types/index.ts` → `Variable` 类型, `FunctionalState` 类型
- 实现状态：⚠️ 部分匹配

#### 偏差说明
- PRD 说功能状态 = 变量 flag。代码中 `Variable` 类型完全匹配此定义（`id`, `name`, `type: 'string' | 'number' | 'boolean' | 'color'`, `defaultValue`, `currentValue`）。
- **但同时存在旧版 `FunctionalState` 类型**（`id`, `name`, `isInitial`, `componentId?`），这不是变量 flag，而是一个独立的状态对象。Store 中 `functionalStates` 数组仍在使用，`StateInspector.tsx` 仍在渲染它。
- **术语不一致**：PRD 用 "功能状态 = 变量 flag"，但代码中 `FunctionalState` 和 `Variable` 是两个不同的概念。应该统一为 `Variable`。

### 4.2 显示状态 (Display State / Keyframe)

#### PRD 原文要求
> 具体的画面快照（关键帧），代表某个时刻的视觉外观。**所有关键帧共享同一套图层树**，每个关键帧记录各图层的属性覆盖（位置、大小、颜色、透明度等）。未被标记为关键属性的部分保持原状。

#### 代码实现
- 对应文件：`src/types/index.ts` → `DisplayState`, `LayerOverride`, `Keyframe`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
- `DisplayState` 类型完全匹配 PRD：`id`, `name`, `layerOverrides: LayerOverride[]`。✅
- `LayerOverride` 包含 `layerId`, `properties: Partial<LayerProperties>`, `isKey: boolean`。✅
- **但同时存在旧版 `Keyframe` 类型**（`id`, `name`, `summary`, `functionalState?`, `keyElements?`），且 store 中 `keyframes` 数组仍是主要数据结构。`displayStates` 虽然存在但只有两个默认值（`ds-default`, `ds-active`），实际编辑操作主要走 `keyframes` 路径。
- **双轨并行问题**：`keyframes`（旧）和 `displayStates`（新 PRD v2）同时存在，LivePreview 中两套都在用，但主画布编辑主要用 `keyframes`。

### 4.3 Patch 连线 (Patch Wiring)

#### PRD 原文要求
> - **Patch** = 可视化节点，有输入端口和输出端口
> - **触发器 Patch**（左侧）：Tap、Drag、Hover、Scroll、Timer、Variable Change 等
> - **动作 Patch**（右侧）：Switch Display State、Set Variable、Animate Property
> - **连线** = 数据流，从触发器输出端口连到动作输入端口
> - 一个触发器可以连线到多个动作 Patch

#### 代码实现
- 对应文件：`src/types/index.ts` → `Patch`, `PatchPort`, `PatchConnection`, `PatchType`
- 对应文件：`src/components/InteractionManager/PatchCanvas.tsx`, `PatchNode.tsx`, `PatchConnection.tsx`
- 对应文件：`src/engine/PatchRuntime.ts`
- 实现状态：✅ 完全匹配

#### 偏差说明
- `PatchType` 包含所有 PRD 要求的类型：触发器（`tap`, `drag`, `hover`, `scroll`, `timer`, `variableChange`）、动作（`switchDisplayState`, `setVariable`, `animateProperty`）、逻辑（`condition`, `delay`, `toggle`）。✅
- `PatchPort` 有 `id`, `name`, `dataType`，dataType 包含 `pulse | boolean | number | string | displayState`。✅ （代码额外加了 `any` 类型）
- `PatchConnection` 有 `id`, `fromPatchId`, `fromPortId`, `toPatchId`, `toPortId`。✅
- `PatchCanvas` 实现了可视化连线编辑器，支持拖拽创建连线。✅
- `PatchRuntime.ts` 实现了 tap/hover/drag/timer/variableChange 的执行逻辑。✅
- **额外增加了 `counter` 逻辑 Patch**，PRD 中未提及但属于合理扩展。

### 4.4 过渡 (Transition)

#### PRD 原文要求
> 显示状态之间切换时的动画效果，包含动画曲线、持续时间、延迟。

#### 代码实现
- 对应文件：`src/types/index.ts` → `TransitionConfig`, `Transition`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
- `TransitionConfig`（新版）有 `duration`, `delay`, `curve` + 弹簧/贝塞尔参数。✅
- **但旧版 `Transition` 类型仍然是主要使用的过渡模型**，它包含 `from`, `to`, `trigger`, `duration`, `delay`, `curve` 等。这是基于 keyframe-to-keyframe 的过渡，而非 PRD 描述的 DisplayState 之间的过渡。
- 在 PRD 的 Patch 模型中，过渡应该由 `switchDisplayState` 动作 Patch 的 config 中的 `TransitionConfig` 控制，但实际代码中 `switchDisplayState` 的 Patch 只读取 `config.targetDisplayStateId`，没有读取过渡动画参数。

### 4.5 触发器 (Trigger)

#### PRD 原文要求
> 启动交互规则的条件：tap、drag、hover、scroll、timer、变量变化等，可组合条件。

#### 代码实现
- 对应文件：`src/types/index.ts` → `TriggerType`, `TriggerPatchType`
- 实现状态：✅ 完全匹配

#### 偏差说明
- `TriggerType` = `'tap' | 'drag' | 'scroll' | 'hover' | 'timer' | 'variable'`。✅
- `TriggerPatchType` = `'tap' | 'drag' | 'hover' | 'scroll' | 'timer' | 'variableChange'`。✅
- **条件组合**：PRD 说"可组合条件"，旧版 `Transition` 支持 `triggers?: TriggerConfig[]`（多触发器），但 Patch 模型中没有显式的条件组合机制。`condition` 逻辑 Patch 可以实现类似功能，但不是直接的"组合条件"。⚠️

### 4.6 组件 (Component)

#### PRD 原文要求
> 支持多状态组件（功能状态 + 显示状态组合），组件拥有自己的状态机和交互规则。组件实例可继承或覆盖状态逻辑/显示状态。**画布上第一行是画布级别的多个关键帧，下面每一行是每个组件的多个关键帧。**

#### 代码实现
- 对应文件：`src/types/index.ts` → `Component`, `ComponentV2`, `ComponentInstance`
- 对应文件：`src/components/InteractionManager/ComponentPanel.tsx`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
- **双版本组件**：存在旧版 `Component`（使用 `FunctionalState` + `DisplayStateMapping`）和新版 `ComponentV2`（使用 `layers`, `displayStates`, `variables`, `rules`）。Store 中两者并存（`components` 和 `componentsV2`）。
- `ComponentV2` 结构匹配 PRD：有自己的 `layers`, `displayStates`, `variables`。✅
- **但 `ComponentV2` 使用 `rules: InteractionRule[]` 而非 `patches: Patch[]` + `connections: PatchConnection[]`**。PRD 第 8 节数据模型明确要求组件有 `patches` 和 `connections`，但代码用了命令式的 `InteractionRule` 替代。❌
- **画布布局**：PRD 要求"画布第一行是画布级关键帧，下面每一行是组件的关键帧"。从 `KeyframeCanvas.tsx` 和 `Canvas.tsx` 来看，画布目前只显示一行关键帧，没有实现组件关键帧行。❌

---

## PRD 第 5 节：Patch 连线模型

### PRD 原文要求
> ```
> Patch 编辑器（Origami 风格）：
> ┌──────────────┐     ┌─────────────────────┐
> │  Tap Patch   │     │ Switch State Patch  │
> │  target:按钮  ├────►│ target:面板          │
> │              │     │ state:展开           │
> └──────────────┘     └─────────────────────┘
> ```
> - 触发器 Patch 在左，动作 Patch 在右，连线表示数据流
> - 一个触发器可连线到多个动作 Patch
> - 支持变量变化作为触发器（响应式）
> - 参考 Folme 的 Sugar 模式：预设常用交互模板

### 代码实现
- 对应文件：`src/components/InteractionManager/PatchCanvas.tsx`, `PatchNode.tsx`, `PatchToolbar.tsx`
- 对应文件：`src/engine/PatchRuntime.ts`
- 实现状态：⚠️ 部分匹配

### 偏差说明
1. **触发器在左，动作在右** ✅：`PatchNode.tsx` 中 `getCategory()` 区分 trigger/action/logic，颜色编码正确（蓝=trigger，绿=action，紫=logic）。节点位置由用户自由拖拽，没有强制左右布局，但这是合理的。
2. **一个触发器连多个动作** ✅：`PatchRuntime.ts` 的 `executeTrigger()` 遍历所有 outgoing connections。
3. **变量变化触发器** ✅：`variableChange` Patch 类型存在，`handleVariableChange()` 函数已实现。
4. **Sugar 模式（预设交互模板）** ❌ 未实现：PRD 提到"参考 Folme 的 Sugar 模式：预设常用交互模板（mouseDown→缩小, mouseUp→恢复）"，代码中没有任何预设模板功能。

---

## PRD 第 6 节：Editing Experience / Layout

### 6.1 整体布局

#### PRD 原文要求
> ```
> ┌──────────────────┬────────────────────────────────────────────────┐
> │                  │  ┌─────────┬─────────────────────┬──────────┐  │
> │                  │  │ Layers  │       Canvas        │ Inspector│  │
> │    Live         │  │         │                     │          │  │
> │    Preview      │  │ 共享    │  ┌─────┐  ┌─────┐   │ 属性     │  │
> │                  │  │ 图层树  │  │ KF1 │  │ KF2 │   │ 曲线     │  │
> │   (始终可交互)   │  │         │  └─────┘  └─────┘   │ 过渡     │  │
> │                  │  │ 所有KF  │  ┌─────┐  ┌─────┐   │          │  │
> │                  │  │ 共用    │  │CmpA1│  │CmpA2│   │          │  │
> │                  │  │         ├─────────────────────┤          │  │
> │                  │  │         │ Patch Editor        │          │  │
> │                  │  │         │ (Origami风格连线)   │          │  │
> └──────────────────┴──┴─────────┴─────────────────────┴──────────┴──┘
> ```

#### 代码实现
- 对应文件：`src/components/layout/EditorLayout.tsx`, `EditorLayout.css`, `src/App.tsx`
- 实现状态：✅ 完全匹配

#### 偏差说明
- `EditorLayout.tsx` 定义了四区布局：`preview`（左）、`layers`（编辑区左）、`canvas`（编辑区中）、`inspector`（编辑区右）。✅
- `EditorLayout.css` 中 `.editor-preview` 宽 320px，`.editor-layers` 宽 240px，`.editor-inspector` 宽 280px，`.editor-canvas-area` flex:1。✅
- `App.tsx` 中使用了 `useResizablePanel` 支持面板宽度调整和折叠。✅

### 6.2 Live Preview (左侧)

#### PRD 原文要求
> - 始终显示当前原型的可交互预览
> - 实时响应编辑器中的修改
> - 支持设备框架（iPhone/Android）

#### 代码实现
- 对应文件：`src/components/LivePreview/index.tsx`
- 实现状态：✅ 完全匹配

#### 偏差说明
- 始终可交互：LivePreview 支持 tap/hover/drag/scroll 触发器，Patch 驱动的交互在预览中实时执行。✅
- 实时响应编辑：通过 `useEditorStore` 订阅 `sharedElements`、`displayStates` 等状态，编辑即时反映。✅
- 设备框架：`DEVICE_FRAMES` 数组包含 iPhone 15 Pro、iPhone 14 Pro、iPhone 14、iPhone SE、Pixel 7、Galaxy S23、iPad Mini、iPad Pro 11"。✅ 超出 PRD 要求。

### 6.3 Layer Manager (编辑区左)

#### PRD 原文要求
> - Figma 风格的图层树
> - **所有关键帧共享同一套图层树**
> - 支持：重命名、隐藏、重排序、嵌套 Frame
> - 每个图层可标记为当前显示状态的「关键元素」

#### 代码实现
- 对应文件：`src/components/LayerPanel/index.tsx`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
- Figma 风格图层树 ✅：LayerPanel 渲染 `sharedElements`，支持嵌套显示。
- 共享图层树 ✅：所有操作都在 `sharedElements` 上进行。
- 重命名 ✅、隐藏 ✅、重排序 ⚠️（通过 zIndex 而非拖拽排序）。
- 嵌套 Frame ✅：`parentId` 字段支持嵌套。
- **关键元素标记** ⚠️：`isKeyElement` 字段存在于 `KeyElement` 类型中，但在 LayerPanel UI 中没有看到明确的"标记为关键元素"的交互控件。`DisplayState` 的 `LayerOverride.isKey` 存在但未在图层面板中暴露。

### 6.4 Canvas (编辑区中上)

#### PRD 原文要求
> - **画布第一行**：画布级别的多个关键帧（显示状态），从左到右排列
> - **画布下面每一行**：每个组件的多个关键帧，从左到右排列
> - 每个关键帧是一个固定尺寸的 Frame
> - **所有关键帧必须完整渲染，选中/未选中/Preview 显示一致**
> - **画布上不显示连线**，保持干净
> - 支持 Figma 风格的完整操作：选择/矩形/椭圆/文本/手型工具，拖拽、智能吸附、快捷键
> - 元素操作：拖拽移动、缩放、Delete、Cmd+C/V、方向键微调

#### 代码实现
- 对应文件：`src/components/Canvas/Canvas.tsx`, `DisplayStateBar.tsx`, `src/components/layout/KeyframeCanvas.tsx`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
1. **多关键帧从左到右排列** ⚠️：`DisplayStateBar.tsx` 在画布顶部显示显示状态标签页（tab 形式），但不是 PRD 描述的"多个关键帧 Frame 从左到右排列在画布上"。当前实现是 tab 切换，而非同时显示多个关键帧。
2. **组件关键帧行** ❌：画布上没有组件关键帧行的实现。
3. **所有关键帧完整渲染** ❌：当前只渲染选中的关键帧/显示状态，未选中的不渲染。PRD 明确要求"所有关键帧必须完整渲染"。
4. **画布不显示连线** ✅：画布上没有连线。
5. **Figma 风格操作** ✅：工具栏包含 select/rectangle/ellipse/text/hand/line/frame/pen/eyedropper/image。快捷键完整（V/R/O/T/H/L/F/P/E/I）。
6. **元素操作** ✅：拖拽移动、缩放、Delete、Cmd+C/V/D、方向键微调全部实现。智能吸附（`AlignmentGuides.tsx`、`GuideLines.tsx`）已实现。

### 6.5 Interaction Manager — Patch 编辑器 (编辑区中下)

#### PRD 原文要求
> - 紧贴画布下方
> - **Origami 风格的 Patch 连线编辑器**
> - 左侧放置触发器 Patch，右侧放置动作 Patch，用连线连接
> - 触发器 Patch 类型：Tap、Drag、Hover、Scroll、Timer、Variable Change
> - 动作 Patch 类型：Switch Display State、Set Variable、Animate Property
> - 每个 Patch 有输入/输出端口，连线表示数据流
> - 选中 Patch 可在 Inspector 中编辑参数
> - 支持拖拽添加新 Patch、Delete 删除、框选多个

#### 代码实现
- 对应文件：`src/components/InteractionManager/index.tsx`, `PatchCanvas.tsx`, `PatchNode.tsx`, `PatchToolbar.tsx`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
1. **紧贴画布下方** ✅：`InteractionManager.css` 中 `.interaction-manager` 在画布区域下方。
2. **Origami 风格连线编辑器** ✅：`PatchCanvas` 实现了节点+连线的可视化编辑。
3. **触发器/动作 Patch 类型** ✅：全部 PRD 要求的类型都已实现。
4. **输入/输出端口** ✅：`PatchNode` 渲染端口，`PatchCanvas` 支持端口间拖拽连线。
5. **Inspector 编辑参数** ⚠️：选中 Patch 后，Inspector 中没有看到专门的 Patch 参数编辑面板。`TransitionCurvePanel.tsx` 处理曲线覆盖，但不是 Patch 的 config 编辑。
6. **框选多个** ❌：`PatchCanvas` 只支持单选（`selectedPatchId`），不支持框选多个 Patch。

### 6.6 画布尺寸预设

#### PRD 原文要求
> - iPhone 14 Pro: 393×852
> - iPhone 14: 390×844
> - iPhone SE: 375×667
> - Android: 360×800
> - iPad: 820×1180
> - 自定义尺寸

#### 代码实现
- 对应文件：`src/App.tsx` → `FRAME_PRESETS`
- 实现状态：✅ 完全匹配

#### 偏差说明
`FRAME_PRESETS` 包含：iPhone 14 (390×844)、iPhone 14 Pro (393×852)、iPhone SE (375×667)、Android (360×800)、iPad (820×1180)。✅ 自定义尺寸通过宽高输入框支持。✅

### 6.7 Inspector (编辑区右)

#### PRD 原文要求
> - 属性设置：位置、大小、颜色、透明度、圆角等
> - 曲线覆盖：全局 → 元素 → 属性 三级覆盖
> - 过渡设置：触发条件、持续时间、延迟
> - 关键属性开关：标记哪些属性参与动画
> - 组件面板：查看/编辑组件的多状态配置

#### 代码实现
- 对应文件：`src/App.tsx`（renderElementInspector）, `src/components/Inspector/TransitionCurvePanel.tsx`, `TransitionInspector.tsx`, `StateInspector.tsx`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
1. **属性设置** ✅：位置、大小、颜色、透明度、圆角、描边、阴影、滤镜、渐变等全部实现，非常完整。
2. **三级曲线覆盖** ✅：`TransitionCurvePanel.tsx` 实现了全局/元素/属性三级曲线编辑器。
3. **过渡设置** ✅：`TransitionInspector.tsx` 支持触发条件、持续时间、延迟、曲线类型编辑。
4. **关键属性开关** ⚠️：`toggleKeyProperty` action 存在于 store 中，但 Inspector UI 中没有明确的"关键属性开关"控件暴露给用户。
5. **组件面板** ⚠️：组件编辑在 InteractionManager 的 Components tab 中，而非 Inspector 中。PRD 说"组件面板"在 Inspector 中。

---

## PRD 第 7 节：组件与状态映射

### PRD 原文要求
> - 组件可以拥有自己的功能状态（变量 flag）和多个显示状态（关键帧）
> - **画布上第一行是画布的多个关键帧，下面每一行是每一个组件的多个关键帧**
> - 组件内部有自己的 Patch 连线（交互逻辑）
> - 组件实例可以覆写显示状态或继承父组件定义
> - 工程中可以引用组件并保留其交互逻辑

### 代码实现
- 对应文件：`src/types/index.ts` → `ComponentV2`, `Component`, `ComponentInstance`
- 对应文件：`src/components/InteractionManager/ComponentPanel.tsx`
- 对应文件：`src/store/useEditorStore.ts` → `componentsV2`, `createComponentV2`, etc.
- 实现状态：⚠️ 部分匹配

### 偏差说明
1. **组件拥有自己的变量和显示状态** ✅：`ComponentV2` 有 `variables: Variable[]` 和 `displayStates: DisplayState[]`。
2. **画布多行关键帧布局** ❌：画布只有一行（画布级），没有组件关键帧行。这是 PRD 中反复强调的核心布局要求，目前完全未实现。
3. **组件内部 Patch 连线** ❌：`ComponentV2` 使用 `rules: InteractionRule[]`（命令式规则），而非 PRD 要求的 `patches: Patch[]` + `connections: PatchConnection[]`。
4. **组件实例覆写** ⚠️：旧版 `Component` 系统支持 `styleOverrides`，`ComponentV2` 的 `ComponentPanel` 可以编辑显示状态，但没有实例级覆写 UI。
5. **引用组件保留交互逻辑** ⚠️：`instantiateComponent` 创建实例元素，但实例的交互逻辑执行机制不完整。

---

## PRD 第 8 节：Data Model

### 8.1 Project 接口

#### PRD 原文要求
> ```typescript
> interface Project {
>   id: string;
>   name: string;
>   layers: Layer[];              // 单一图层树（所有关键帧共享）
>   displayStates: DisplayState[]; // 画布级显示状态（关键帧）
>   variables: Variable[];         // 功能状态 = 变量 flag
>   patches: Patch[];               // Patch 节点
>   connections: PatchConnection[]; // Patch 连线
>   components: Component[];
>   globalCurve: Curve;
> }
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `ProjectV2`
- 对应文件：`src/store/useEditorStore.ts` → `EditorState`
- 实现状态：⚠️ 部分匹配

#### 偏差说明（逐字段对照）

| PRD 字段 | 代码实现 | 状态 |
|----------|----------|------|
| `id: string` | `ProjectV2.id` ✅ | ✅ |
| `name: string` | `ProjectV2.name` ✅ | ✅ |
| `layers: Layer[]` | `ProjectV2.layers` (类型为 `KeyElement[]`) | ⚠️ PRD 用 `Layer`，代码用 `KeyElement` |
| `displayStates: DisplayState[]` | `ProjectV2.displayStates` ✅ | ✅ |
| `variables: Variable[]` | `ProjectV2.variables` ✅ | ✅ |
| `patches: Patch[]` | ❌ `ProjectV2` 中没有 `patches` 字段 | ❌ |
| `connections: PatchConnection[]` | ❌ `ProjectV2` 中没有 `connections` 字段 | ❌ |
| `components: Component[]` | `ProjectV2.components` (类型为 `ComponentV2[]`) | ✅ |
| `globalCurve: Curve` | `ProjectV2.globalCurve` (类型为 `string`) | ⚠️ PRD 用 `Curve` 对象，代码用 `string` |

**关键偏差：**
- `ProjectV2` 使用 `rules: InteractionRule[]` 替代了 PRD 要求的 `patches` + `connections`。
- Store 中 `patches` 和 `patchConnections` 存在于 `EditorState` 中，但不在 `ProjectV2` 类型定义中。
- `globalCurve` 在 `ProjectV2` 中是 `string` 类型，但在 `EditorState` 中是 `CurveConfig` 对象。不一致。

### 8.2 Variable 接口

#### PRD 原文要求
> ```typescript
> interface Variable {
>   id: string;
>   name: string;
>   type: 'boolean' | 'number' | 'string' | 'color';
>   defaultValue: any;
>   currentValue: any;
> }
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `Variable`
- 实现状态：✅ 完全匹配

#### 偏差说明
代码中 `Variable` 类型：
- `id: string` ✅
- `name: string` ✅
- `type: VariableType` = `'string' | 'number' | 'boolean' | 'color'` ✅
- `defaultValue: string | number | boolean` ⚠️ PRD 用 `any`，代码用联合类型（更严格，合理）
- `currentValue?: string | number | boolean` ✅
- 额外字段：`description?: string` — PRD 未要求但合理扩展

### 8.3 DisplayState 接口

#### PRD 原文要求
> ```typescript
> interface DisplayState {
>   id: string;
>   name: string;
>   layerOverrides: LayerOverride[];
> }
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `DisplayState`
- 实现状态：✅ 完全匹配

#### 偏差说明
代码中 `DisplayState` 完全匹配 PRD 定义，无偏差。

### 8.4 LayerOverride 接口

#### PRD 原文要求
> ```typescript
> interface LayerOverride {
>   layerId: string;
>   properties: Partial<LayerProperties>;
>   isKey: boolean;
> }
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `LayerOverride`
- 实现状态：✅ 完全匹配（有合理扩展）

#### 偏差说明
代码中 `LayerOverride`：
- `layerId: string` ✅
- `properties: Partial<LayerProperties>` ✅
- `isKey: boolean` ✅
- 额外字段：`keyProperties?: string[]`（标记哪些属性是关键的）— 合理扩展
- 额外字段：`curveOverride?: CurveConfig`（元素级曲线覆盖）— 支持三级覆盖
- 额外字段：`propertyCurveOverrides?: Record<string, CurveConfig>`（属性级曲线覆盖）— 支持三级覆盖

### 8.5 Patch 接口

#### PRD 原文要求
> ```typescript
> interface Patch {
>   id: string;
>   type: PatchType;
>   name: string;
>   position: { x: number; y: number };
>   config: Record<string, any>;
>   inputs: PatchPort[];
>   outputs: PatchPort[];
> }
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `Patch`
- 实现状态：✅ 完全匹配

#### 偏差说明
代码中 `Patch` 接口与 PRD 完全一致，所有字段类型匹配。

### 8.6 PatchPort 接口

#### PRD 原文要求
> ```typescript
> interface PatchPort {
>   id: string;
>   name: string;
>   dataType: 'pulse' | 'boolean' | 'number' | 'string' | 'displayState';
> }
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `PatchPort`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
- `id`, `name` ✅
- `dataType` 类型为 `PatchPortDataType` = `'pulse' | 'boolean' | 'number' | 'string' | 'displayState' | 'any'`
- **额外增加了 `'any'` 类型**，PRD 中没有。用于通用端口，属于合理扩展。

### 8.7 PatchConnection 接口

#### PRD 原文要求
> ```typescript
> interface PatchConnection {
>   id: string;
>   fromPatchId: string;
>   fromPortId: string;
>   toPatchId: string;
>   toPortId: string;
> }
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `PatchConnection`
- 实现状态：✅ 完全匹配

#### 偏差说明
代码中 `PatchConnection` 与 PRD 完全一致，无偏差。

### 8.8 PatchType 类型

#### PRD 原文要求
> ```typescript
> type PatchType =
>   | 'tap' | 'drag' | 'hover' | 'scroll' | 'timer' | 'variableChange'
>   | 'switchDisplayState' | 'setVariable' | 'animateProperty'
>   | 'condition' | 'delay' | 'toggle';
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `PatchType`
- 实现状态：⚠️ 部分匹配

#### 偏差说明
代码中 `PatchType` = `TriggerPatchType | ActionPatchType | LogicPatchType`，其中：
- `TriggerPatchType` = `'tap' | 'drag' | 'hover' | 'scroll' | 'timer' | 'variableChange'` ✅
- `ActionPatchType` = `'switchDisplayState' | 'setVariable' | 'animateProperty'` ✅
- `LogicPatchType` = `'condition' | 'delay' | 'toggle' | 'counter'` ⚠️ 额外增加了 `'counter'`

### 8.9 Component 接口

#### PRD 原文要求
> ```typescript
> interface Component {
>   id: string;
>   name: string;
>   layers: Layer[];
>   displayStates: DisplayState[];
>   variables: Variable[];
>   patches: Patch[];
>   connections: PatchConnection[];
> }
> ```

#### 代码实现
- 对应文件：`src/types/index.ts` → `ComponentV2`
- 实现状态：⚠️ 部分匹配

#### 偏差说明（逐字段对照）

| PRD 字段 | 代码实现 | 状态 |
|----------|----------|------|
| `id: string` | `ComponentV2.id` | ✅ |
| `name: string` | `ComponentV2.name` | ✅ |
| `layers: Layer[]` | `ComponentV2.layers: KeyElement[]` | ⚠️ 类型名不同 |
| `displayStates: DisplayState[]` | `ComponentV2.displayStates` | ✅ |
| `variables: Variable[]` | `ComponentV2.variables` | ✅ |
| `patches: Patch[]` | ❌ 不存在 | ❌ |
| `connections: PatchConnection[]` | ❌ 不存在 | ❌ |

**关键偏差：**
- `ComponentV2` 使用 `rules: InteractionRule[]` 替代 PRD 要求的 `patches` + `connections`。这是命令式规则而非 Patch 连线模型，与 PRD 的 Origami 风格设计理念不一致。

---

## PRD 第 9 节：技术架构

### PRD 原文要求
> ### 前端
> - React 18 + TypeScript
> - Zustand 状态管理
> - 自研 Canvas 2D（可升级 WebGL）
> - requestAnimationFrame 动画引擎

### 代码实现
- 对应文件：`package.json`, `src/store/useEditorStore.ts`, `src/engine/`
- 实现状态：⚠️ 部分匹配

### 偏差说明
1. **React 18 + TypeScript** ⚠️：`package.json` 中 React 版本为 `^19.2.0`（React 19），不是 PRD 要求的 React 18。TypeScript `~5.9.3` ✅。
2. **Zustand 状态管理** ✅：`zustand ^5.0.11`，`useEditorStore` 使用 `create<EditorStore>()`。
3. **自研 Canvas 2D** ⚠️：画布使用 DOM 渲染（div + CSS），不是 Canvas 2D API。`Canvas.tsx` 和 `CanvasElement.tsx` 都是 React DOM 组件。
4. **requestAnimationFrame 动画引擎** ✅：`LivePreview/index.tsx` 中 `springRafRef` 使用 `requestAnimationFrame` 进行弹簧物理动画。`src/engine/SpringAnimation.ts` 实现了弹簧动画。

### 设计原则审查

#### PRD 原文要求
> - 深色主题、高对比度、线性品牌感
> - 直接操作 + 所见即所得
> - **状态机驱动，无时间轴**
> - **Origami 风格 Patch 连线交互**
> - **画布干净无连线**
> - **共享图层树**
> - 组件化与可复用状态逻辑

#### 代码实现
- 实现状态：✅ 完全匹配

#### 偏差说明
1. **深色主题** ✅：全局背景 `#0a0a0a`/`#0d0d0e`，面板 `#111`/`#1a1a1a`。
2. **直接操作 + WYSIWYG** ✅：画布支持拖拽、缩放、直接编辑。
3. **状态机驱动，无时间轴** ✅。
4. **Origami 风格 Patch 连线** ✅。
5. **画布干净无连线** ✅。
6. **共享图层树** ✅。
7. **组件化** ✅：`ComponentV2` 支持多状态。

---

## PRD 第 10 节：里程碑

### PRD 原文要求
> | 版本 | 目标 | 核心功能 |
> |------|------|----------|
> | **v0.1** | MVP 基础可用 | 画布编辑、共享图层管理、两个显示状态、Tap 触发、基础缓动 |
> | **v0.2** | Patch 编辑器 | Origami 风格 Patch 连线编辑器、变量系统（功能状态）、Tap/Hover 触发器 |
> | **v0.3** | 触发器体系 | Drag/Scroll/Hover/Timer、条件组合、变量变化触发 |
> | **v0.4** | 组件系统 | 多状态组件、组件关键帧行、状态继承/覆写 |
> | **v0.5** | 曲线系统 | 全局→元素→属性三级覆盖、弹簧物理、贝塞尔编辑 |
> | **v1.0** | 公开发布 | 性能优化、稳定性、完整文档 |

### 代码实现
- 实现状态：⚠️ 部分匹配

### 偏差说明（按里程碑逐项评估）

**v0.1 MVP** ✅ 已完成：
- 画布编辑 ✅
- 共享图层管理 ✅
- 两个显示状态 ✅（`ds-default`, `ds-active`）
- Tap 触发 ✅
- 基础缓动 ✅

**v0.2 Patch 编辑器** ✅ 已完成：
- Origami 风格 Patch 连线编辑器 ✅
- 变量系统 ✅
- Tap/Hover 触发器 ✅

**v0.3 触发器体系** ✅ 已完成：
- Drag/Scroll/Hover/Timer ✅
- 变量变化触发 ✅
- 条件组合 ⚠️（通过 condition Patch 间接实现）

**v0.4 组件系统** ⚠️ 部分完成：
- 多状态组件 ✅（`ComponentV2`）
- 组件关键帧行 ❌ 未实现
- 状态继承/覆写 ⚠️ 基础框架存在但 UI 不完整

**v0.5 曲线系统** ✅ 已完成：
- 三级覆盖 ✅
- 弹簧物理 ✅（`SpringAnimation.ts`）
- 贝塞尔编辑 ✅（`DraggableBezierEditor.tsx`）

**v1.0 公开发布** ⚠️ 未达到：
- 性能优化 ⚠️（DOM 渲染而非 Canvas 2D，大量元素时可能有性能问题）
- 稳定性 ⚠️（新旧系统并存增加了不稳定性）
- 完整文档 ❌ 未见文档

---

## PRD 第 11 节：成功指标

### PRD 原文要求
> 1. 易用性：新用户 5 分钟内完成第一个动效
> 2. 表现力：复现 Dribbble 80% UI 动效
> 3. 性能：60fps 流畅预览
> 4. 分享：~~一键生成可交互原型链接~~（不做）

### 代码实现
- 实现状态：⚠️ 部分匹配

### 偏差说明
1. **易用性** ⚠️：WelcomeModal 提供了引导，但 Patch 编辑器的学习曲线较陡。没有内置教程或引导流程帮助新用户 5 分钟上手。`TutorialPage.tsx` 存在但内容未知。
2. **表现力** ⚠️：支持丰富的属性动画（位置、大小、颜色、透明度、圆角、阴影、滤镜等），弹簧物理和贝塞尔曲线。但 `animateProperty` Patch 的运行时执行尚未完整实现（`PatchRuntime.ts` 中 `animateProperty` case 未处理）。
3. **性能** ⚠️：使用 DOM 渲染而非 Canvas 2D，大量元素时可能无法保持 60fps。`requestAnimationFrame` 弹簧动画本身是 60fps 的。
4. **分享** ❌ 违反 Non-Goal：PRD 明确标注"不做"，但代码实现了完整的分享功能。

---

## 总结：关键偏差清单

### 🔴 严重偏差（与 PRD 核心设计理念冲突）

1. **新旧系统并存，架构混乱**
   - 三套交互系统并存：`Transition`（旧）、`Interaction`（中）、`Patch`（新 PRD）
   - 两套显示状态并存：`Keyframe`（旧）、`DisplayState`（新 PRD）
   - 两套功能状态并存：`FunctionalState`（旧）、`Variable`（新 PRD）
   - 两套组件并存：`Component`（旧）、`ComponentV2`（新 PRD）
   - **建议**：清理旧系统，统一到 PRD v2 模型

2. **画布多关键帧布局未实现**
   - PRD 反复强调"画布第一行是画布级关键帧，下面每行是组件关键帧"
   - 当前实现是 tab 切换，只显示一个关键帧
   - **建议**：重构画布为多 Frame 并排显示

3. **ComponentV2 缺少 Patch 连线**
   - PRD 要求组件有 `patches` + `connections`
   - 代码用 `rules: InteractionRule[]` 替代
   - **建议**：将 `rules` 替换为 `patches` + `connections`

4. **Non-Goal 被违反**
   - 代码导出功能（exportGenerators, lottieGenerator）违反"不做代码导出"
   - 分享链接功能（ShareModal）违反"不做分享链接"
   - **建议**：要么更新 PRD 承认这些功能，要么移除代码

### 🟡 中等偏差（功能存在但实现不完整）

5. **所有关键帧必须完整渲染** — 当前只渲染选中的关键帧
6. **关键属性开关 UI 缺失** — store 有 `toggleKeyProperty`，但 Inspector 中无对应控件
7. **Patch Inspector 参数编辑缺失** — 选中 Patch 后无法在 Inspector 中编辑其 config
8. **Patch 框选多个未实现** — 只支持单选
9. **Sugar 模式（预设交互模板）未实现**
10. **animateProperty Patch 运行时未实现** — `PatchRuntime.ts` 中无 `animateProperty` 处理
11. **switchDisplayState Patch 缺少过渡动画参数** — 只读 `targetDisplayStateId`，不读 transition config

### 🟢 匹配良好的部分

- 共享图层树架构 ✅
- Patch 连线编辑器（画布级）✅
- 三级曲线覆盖系统 ✅
- 变量系统 ✅
- 触发器体系（6 种全部实现）✅
- 深色主题 + Figma 风格 UI ✅
- LivePreview 实时交互 ✅
- 设备框架预览 ✅
- 画布尺寸预设 ✅
- 弹簧物理 + 贝塞尔曲线 ✅
- 状态机驱动，无时间轴 ✅
- 画布干净无连线 ✅

### 📊 术语一致性审查

| PRD 术语 | 代码术语 | 一致性 |
|----------|----------|--------|
| 功能状态 | `Variable` + `FunctionalState` | ❌ 两套并存 |
| 显示状态 / 关键帧 | `DisplayState` + `Keyframe` | ❌ 两套并存 |
| Patch | `Patch` | ✅ |
| 连线 | `PatchConnection` | ✅ |
| 图层 | `KeyElement` (非 `Layer`) | ⚠️ 名称不同 |
| 组件 | `Component` + `ComponentV2` | ❌ 两套并存 |
| 过渡 | `Transition` + `TransitionConfig` | ⚠️ 两套 |
| 触发器 | `TriggerType` + `TriggerPatchType` | ⚠️ 两套 |

### 🏗️ 架构建议优先级

1. **P0 — 清理旧系统**：移除 `FunctionalState`、旧 `Keyframe`、旧 `Transition`、旧 `Component`、`Interaction`，统一到 PRD v2 模型
2. **P0 — 画布多帧布局**：实现 PRD 要求的多关键帧并排显示
3. **P1 — ComponentV2 补齐 Patch**：将 `rules` 替换为 `patches` + `connections`
4. **P1 — Patch Inspector**：选中 Patch 时在 Inspector 中显示参数编辑面板
5. **P2 — animateProperty 运行时**：实现 Patch 驱动的属性动画
6. **P2 — 关键属性 UI**：在 Inspector 中暴露关键属性开关
7. **P3 — Sugar 模式**：预设常用交互模板
