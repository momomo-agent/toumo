# 深度 UX 测试报告 - 对照 PRD 验证

**测试日期**: 2025-02-06
**测试角色**: 资深交互设计师
**测试方法**: 代码级走查 + 用户流程模拟（逐行追踪每个交互路径）
**代码版本**: 当前 main 分支

---

## 📋 PRD 成功指标对照

| # | PRD 指标 | 当前状态 | 评分 |
|---|----------|----------|------|
| 1 | 新用户 5 分钟内完成第一个动效 | ⚠️ 勉强可达，但有严重摩擦 | 4/10 |
| 2 | 复现 Dribbble 80% UI 动效 | ❌ 远未达标，约 15-20% | 2/10 |
| 3 | 60fps 流畅预览 | ✅ 基本达标（CSS transition + rAF 弹簧引擎） | 7/10 |
| 4 | 一键生成可交互原型链接 | ⚠️ 功能存在但体验粗糙 | 5/10 |

---

## 🧪 测试流程 1: 新用户 5 分钟完成第一个动效

### 步骤 1: 打开工具（0:00）

**体验**:
- ✅ WelcomeModal 弹出，有「加载示例项目」和「开始创建」两个选项
- ✅ 快捷键提示（R/T/O/V）清晰
- ⚠️ **问题**: 欢迎弹窗描述为「轻量级原型设计工具」，与 PRD 定位「State Machine Motion Design Tool」不符
- ⚠️ **问题**: 没有引导用户如何创建动效，只教了画图快捷键

**建议**: 欢迎弹窗应包含「创建你的第一个动效」引导流程

### 步骤 2: 创建按钮元素（0:30 - 1:30）

**操作路径**: 按 R → 在画布拖拽 → Inspector 修改样式

**体验**:
- ✅ 工具栏快捷键响应正常（R/O/T/V/H）
- ✅ 拖拽绘制矩形流畅
- ✅ Inspector 属性面板丰富（填充、描边、圆角、阴影、滤镜等）
- ⚠️ **问题**: 初始画布只有一个 keyframe（Idle），新用户不知道需要创建第二个 keyframe 才能做动效
- ❌ **严重问题**: 没有任何 UI 提示告诉用户「动效 = 两个状态之间的过渡」这个核心概念

### 步骤 3: 创建第二个状态（1:30 - 3:00）

**操作路径**: 需要找到「Add Keyframe」按钮

**体验**:
- ⚠️ **问题**: 「Add Keyframe」按钮位置不明显，需要在画布区域上方找到
- ❌ **严重问题**: 新建的 keyframe 是空的！用户需要手动在新 keyframe 中重新创建所有元素并调整属性
- ❌ **致命问题**: 没有「复制当前帧到新帧」的功能。PRD 描述的是「显示状态 = 同一元素的不同外观」，但实际实现中每个 keyframe 的 keyElements 是独立的数组，元素 ID 不同，无法做 Smart Animate 匹配

**代码证据** (`store/useEditorStore.ts` addKeyframe):
```typescript
addKeyframe: () => {
  // 创建新的空 keyframe，没有复制现有元素
  const newKf = { id: `kf-${Date.now()}`, name: `State ${keyframes.length + 1}`, ... keyElements: [] };
}
```

### 步骤 4: 创建过渡（3:00 - 4:30）

**操作路径**: Interaction Manager → State Graph 或 Transitions tab

**体验**:
- ✅ State Graph 可视化状态图存在
- ✅ 可以通过拖拽节点边缘创建连线
- ✅ TransitionList 提供 From/To/Trigger/Duration/Curve 编辑
- ⚠️ **问题**: 默认只有 `initialTransitions` 中的一条 Idle→Active 过渡，新用户需要手动添加
- ⚠️ **问题**: Trigger 选项（tap/hover/drag/scroll/timer/variable）没有解释说明
- ❌ **问题**: 没有「hover」和「pressed」的快捷创建方式。PRD 场景「按钮的 hover/pressed 动效」需要用户：
  1. 创建 3 个 keyframe（Normal/Hover/Pressed）
  2. 手动在每个 keyframe 中创建相同元素
  3. 分别调整样式
  4. 创建 3 条 transition（Normal→Hover, Hover→Normal, Normal→Pressed）
  这远超 5 分钟

### 步骤 5: 预览效果（4:30 - 5:00）

**体验**:
- ✅ LivePreview 组件始终在左侧显示
- ✅ 支持设备框架选择（iPhone/Android/iPad）
- ✅ Smart Animate 弹簧动画引擎存在
- ⚠️ **问题**: LivePreview 中的元素匹配依赖 keyframe 切换，但由于元素 ID 不同（见步骤 3），Smart Animate 无法正确匹配元素
- ⚠️ **问题**: 预览区域没有明确的交互提示（如「点击触发」）

### ⏱️ 5 分钟结论

**新用户在 5 分钟内无法完成一个完整的按钮 hover/pressed 动效。**

核心阻塞点：
1. 没有「复制帧」功能，每个状态需要从零创建
2. 元素 ID 跨帧不一致，Smart Animate 失效
3. 缺少引导流程
4. 概念门槛高（功能状态 vs 显示状态 vs 关键帧）

---

## 🧪 测试流程 2: 创建按钮 Hover/Pressed 动效（详细）

### 模拟操作记录

**第 1 步: 画按钮（正常状态）**
- 按 R 画矩形 → 设置圆角 12、填充 #2563eb、尺寸 200×48
- 按 T 加文字「Submit」→ 居中放置
- ✅ 这一步体验流畅，约 60 秒

**第 2 步: 创建 Hover 状态**
- 点击「+ Add Keyframe」
- ❌ **卡住**: 新帧是空白的，按钮消失了
- 用户必须重新画一个一模一样的按钮，然后微调颜色
- 即使手动重建，元素 ID 不同（`el-xxx-timestamp`），Smart Animate 无法匹配
- ⏱️ 这一步至少需要 3-5 分钟

**第 3 步: 创建 Pressed 状态**
- 重复第 2 步的痛苦过程
- 再次手动重建所有元素
- ⏱️ 又需要 3-5 分钟

**第 4 步: 连接过渡**
- 切换到 Interaction Manager → Transitions tab
- 点击「+ Add」创建过渡
- ✅ From/To 下拉选择正常
- ✅ Trigger 选择 hover/tap 正常
- ✅ Duration/Delay/Curve 编辑正常
- ⚠️ 需要创建至少 3 条过渡（Normal↔Hover, Normal→Pressed）
- ⏱️ 约 2 分钟

**第 5 步: 预览**
- LivePreview 左侧面板显示
- ❌ 由于元素 ID 不匹配，切换状态时元素直接替换而非平滑过渡
- 效果：闪烁切换，而非 Dribbble 级别的流畅动效

### 总耗时估算: 10-15 分钟（PRD 目标: 5 分钟）

---

## 🧪 测试流程 3: 预览效果

### LivePreview 组件分析

**架构**: `src/components/LivePreview/index.tsx`

- ✅ 设备框架选择丰富（9 种设备）
- ✅ 缩放控制存在
- ✅ Smart Animate 模式开关
- ✅ 弹簧动画引擎（SpringAnimation + rAF）
- ✅ 支持 tap/hover/drag/timer 触发器

**发现的问题**:

1. **元素匹配逻辑缺陷**: `useSmartAnimate` 的 `animateTo` 接收整个 `KeyElement[]`，但跨帧元素 ID 不同，导致无法做属性插值
2. **hover 触发粗糙**: 整个预览区域的 hover 触发状态切换，而非单个元素级别
3. **缺少手势反馈**: 拖拽、滑动等手势没有视觉反馈（如拖拽轨迹）

### 60fps 性能评估

**动画引擎**: `src/engine/SpringAnimation.ts`

- ✅ 使用 `requestAnimationFrame` 驱动，理论上可达 60fps
- ✅ `SpringInterpolator` 弹簧物理模拟正确
- ✅ CSS transition 作为后备方案
- ⚠️ **潜在问题**: `SmartAnimateController` 每帧调用 `setState` 更新 React 状态，元素多时可能掉帧
- ⚠️ **潜在问题**: 没有使用 `will-change` 或 `transform` 优化合成层

**结论**: 简单场景（2-5 个元素）可达 60fps，复杂场景（20+ 元素）未验证

---

## 🧪 测试流程 4: 分享链接

### ShareModal 分析

**架构**: `src/components/ShareModal.tsx` + `src/utils/shareUtils.ts`

**工作原理**:
1. 用户点击 Share 按钮 → 打开 ShareModal
2. 点击「Generate Share Link」→ 将整个项目 JSON 用 lz-string 压缩
3. 生成 URL: `{origin}/toumo/#preview={compressed_data}`
4. 接收方打开链接 → `isPreviewUrl()` 检测 → 渲染 `PreviewMode`

**优点**:
- ✅ 纯前端方案，无需后端
- ✅ lz-string 压缩有效减小 URL 长度
- ✅ 接收方可直接交互预览
- ✅ 支持「Edit」按钮进入编辑模式
