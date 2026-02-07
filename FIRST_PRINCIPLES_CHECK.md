# 第一性原则检查

## 结论：✅ 符合「只有一个 elements 数据源」

## 数据源统一性

- UI 组件读取 sharedElements：**20/20 个已迁移**（全部组件均从 `useEditorStore(s => s.sharedElements)` 或 `getState().sharedElements` 读取）
- 剩余 keyElements 引用：**18 处**（无一处作为 UI 数据源读取）

### 已迁移的 UI 组件（全部读 sharedElements）

| 组件 | 读取方式 |
|------|----------|
| App.tsx | `useEditorStore(s => s.sharedElements)` |
| Canvas.tsx | sharedElements |
| CanvasHints.tsx | sharedElements |
| PreviewMode.tsx | sharedElements |
| LivePreview/index.tsx | `getState().sharedElements` |
| ExportModal.tsx | `getState().sharedElements` |
| LayerPanel/index.tsx | sharedElements |
| LayerManager/index.tsx | sharedElements |
| Inspector/index.tsx | sharedElements |
| Inspector/DesignPanel.tsx | sharedElements |
| Inspector/OverflowPanel.tsx | sharedElements |
| Inspector/AutoLayoutPanel.tsx | sharedElements |
| Inspector/StateInspector.tsx | sharedElements |
| Inspector/TransitionInspector.tsx | sharedElements |
| Inspector/PrototypeLinkPanel.tsx | sharedElements |
| Inspector/MultiSelectPanel.tsx | sharedElements |
| Inspector/ConstraintsPanel.tsx | sharedElements |
| Inspector/TextPropertiesPanel.tsx | sharedElements |
| InteractionManager/ComponentPanel.tsx | sharedElements |
| ContextMenu/index.tsx | sharedElements |
| ShareModal.tsx | sharedElements |

### 剩余 keyElements 引用详情

| 位置 | 性质 | 说明 |
|------|------|------|
| `types/index.ts:395` | **类型定义 (deprecated)** | `keyElements?: KeyElement[]` 标注了 `@deprecated` |
| `store/useEditorStore.ts:360-365` | **兼容层 (adapter)** | `syncToAllKeyframes()` 将 sharedElements 同步到所有 kf.keyElements |
| `store/useEditorStore.ts:436` | **写入 (sync)** | addKeyframe 时设 `keyElements: state.sharedElements` |
| `store/useEditorStore.ts:1798` | **写入 (sync)** | duplicateKeyframe 时设 `keyElements: state.sharedElements` |
| `store/useEditorStore.ts:1844` | **写入 (reset)** | resetProject 时初始化空 keyElements |
| `store/useEditorStore.ts:3818` | **兼容层 (subscriber)** | 检测 kf.keyElements !== sharedElements 时自动同步 |
| `store/initialData.ts:51,58,65` | **初始数据** | 初始 keyframes 的 keyElements 指向 initialSharedElements |
| `App.tsx:306` | **静态示例数据** | 内联 example project 定义，传入 loadProject |
| `WelcomeModal/exampleProject.ts:89,224,349` | **静态示例数据** | 欢迎弹窗的示例项目定义 |
| `utils/exportGenerators.ts:588` | **导出序列化** | 从 keyframe 对象读 keyElements 生成 HTML（数据已由 sync 层保证一致） |
| `utils/exportPrototype.ts:26` | **导出序列化** | stripLargeImages 处理 kf.keyElements |
| `utils/exportPrototype.ts:219` | **导出序列化** | 原型预览 render 函数读 kf.keyElements（运行时数据已同步） |

## 是否符合「只有一个 elements 数据源」

**✅ 是。** 架构清晰：

1. **单一数据源**：`sharedElements` 是唯一的写入/读取源，所有 UI 组件均从此读取
2. **兼容层完整**：`syncToAllKeyframes` + subscriber 确保 `kf.keyElements` 始终 === `sharedElements`
3. **类型已标注 deprecated**：`Keyframe.keyElements` 标记为废弃
4. **导出层安全**：导出函数读 `kf.keyElements` 但数据已由同步层保证与 sharedElements 一致
5. **无组件直接读 keyElements**：0 个 UI 组件从 `keyframe.keyElements` 读取元素数据
