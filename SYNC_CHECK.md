# 双向同步方案检查报告

**日期:** 2025-07-14  
**检查人:** 前端架构师 (Momo)  
**结论: ⚠️ 有条件通过 — 核心逻辑正确，但存在多个需要修复的问题**

---

## ✅ 通过项

### 1. initialData.ts — 共享引用正确
所有 keyframe 指向同一个 `initialSharedElements` 数组引用，符合共享图层树设计。

### 2. addKeyframe — 正确使用 sharedElements
```ts
keyElements: state.sharedElements  // ✅ 直接引用，不是拷贝
```

### 3. 大部分 action 已迁移到 sharedElements
`addElement`、`deleteElement`、`updateElement`、`duplicateElements` 等核心操作都已改为写 `sharedElements` + `syncToAllKeyframes`。

### 4. _syncing 防循环 — 基本有效
Zustand 的 `subscribe` 在 `setState` 时同步触发。`_syncing` flag 在同步调用链中能正确阻断递归。

---

## ❌ 发现的问题

### 问题 1: 大量 legacy action 仍直接修改 keyframes.keyElements（严重）

以下 action 绕过 sharedElements，直接写 `keyframes.map(kf => ({ ...kf, keyElements: ... }))`：

| Action | 行号 | 影响 |
|--------|------|------|
| `addComponentInstance` | ~1003 | 只往选中帧加元素 |
| `duplicateKeyframe` | ~1824 | 克隆帧时深拷贝 elements，脱离共享 |
| `clearCanvas` | ~1857 | 只清选中帧的 keyElements |
| `resetProject` | ~1865 | 重置 keyframes 但**不重置 sharedElements** |
| `addVariableBinding` | ~3082 | 只改选中帧 |
| `removeVariableBinding` | ~3097 | 只改选中帧 |
| `booleanUnion/Subtract/Intersect/Exclude` | ~3484-3595 | 只改选中帧 |
| `bringToFront/sendToBack` 等 z-order | ~3340-3460 | 只改选中帧 |

**subscribe 能兜底吗？** 部分能。subscribe 检测到 `selectedKf.keyElements !== state.sharedElements` 时会反向同步。但这引出问题 2。

### 问题 2: 反向同步的语义错误（严重）

subscribe 的反向同步逻辑：
```ts
if (selectedKf && selectedKf.keyElements !== state.sharedElements) {
  // 把选中帧的 keyElements 扩散到 sharedElements 和所有帧
  useEditorStore.setState({
    sharedElements: selectedKf.keyElements,
    keyframes: syncToAllKeyframes(selectedKf.keyElements, state.keyframes),
  });
}
```

**问题：** `clearCanvas` 把选中帧的 `keyElements` 设为 `[]`，subscribe 会把空数组扩散到**所有帧**。用户只想清空当前帧，结果所有帧都被清空了。

但如果这符合「共享图层树」的设计（所有帧共享同一套元素），那 `clearCanvas` 本身的语义就应该是清空所有帧。**需要确认 PRD 意图。**

### 问题 3: resetProject 不重置 sharedElements（Bug）

```ts
resetProject: () => {
  set({
    keyframes: [{ ..., keyElements: [] }],
    // ❌ 缺少 sharedElements: []
  });
}
```

重置后 `sharedElements` 仍保留旧数据，subscribe 会立刻把旧元素同步回新的空 keyframe。

### 问题 4: duplicateKeyframe 深拷贝导致脱离共享（设计问题）

```ts
keyElements: kf.keyElements.map(el => ({
  ...el,
  id: `el-${Date.now()}-...`,  // 新 ID
}))
```

克隆帧生成了全新 ID 的元素，这些元素与 sharedElements 完全脱离。subscribe 会把这些新元素反向写入 sharedElements，**覆盖原有元素**。

### 问题 5: subscribe 是异步的，存在 UI 闪烁风险（轻微）

Zustand subscribe 在 `setState` 后同步触发（微任务之前），所以 React 的批量更新通常能合并。但在 React 18 concurrent mode 下，第一次 setState（legacy action 改 keyframes）和第二次 setState（subscribe 同步回来）之间**可能**触发一次中间渲染，导致短暂的数据不一致。

实际影响较小，因为 Zustand v4 的 subscribe 是同步的。

### 问题 6: 性能 — 每次 state 变化都触发 subscribe（轻微）

```ts
useEditorStore.subscribe((state) => { ... })
```

任何 state 字段变化（包括 `selectedElementId`、`hoveredElementId` 等高频操作）都会触发 subscribe，执行 `state.keyframes.some(...)` 遍历。

建议用 `subscribeWithSelector` 只监听 `keyframes` 和 `sharedElements`。

---

## 🔧 建议修复

### 优先级 P0（必须修复）

1. **resetProject 加上 `sharedElements: []`**

2. **移除 duplicateKeyframe 的深拷贝**，改为共享同一个 sharedElements：
   ```ts
   keyElements: state.sharedElements  // 不要拷贝新 ID
   ```

### 优先级 P1（强烈建议）

3. **把剩余 legacy action 迁移到 sharedElements 模式**，消除对 subscribe 兜底的依赖：
   - `addComponentInstance` → 写 sharedElements
   - `booleanUnion/Subtract/...` → 写 sharedElements
   - `bringToFront/sendToBack` 等 → 写 sharedElements
   - `addVariableBinding/removeVariableBinding` → 写 sharedElements
   - `clearCanvas` → 清空 sharedElements（如果符合 PRD）

4. **确认 clearCanvas 的语义**：共享图层树下，清空 = 清空所有帧。如果 PRD 需要「只清空当前帧的视觉状态」，那应该用 display state override 而不是删除元素。

### 优先级 P2（优化）

5. **用 `subscribeWithSelector` 替代全量 subscribe**：
   ```ts
   useEditorStore.subscribe(
     (s) => ({ shared: s.sharedElements, kfs: s.keyframes }),
     (curr, prev) => { /* 只在相关字段变化时执行 */ },
     { equalityFn: shallow }
   );
   ```

6. **长期目标：移除 subscribe 双向同步**，所有 action 统一走 sharedElements，subscribe 只作为开发环境的 invariant 检查（dev-only assert）。

---

## 总结

双向同步的**核心思路正确**：用 subscribe 作为安全网兜底 legacy action。但目前有 2 个会导致数据丢失的 bug（resetProject、duplicateKeyframe），以及大量 legacy action 依赖 subscribe 兜底可能产生语义错误（clearCanvas 扩散）。建议先修 P0，再逐步迁移 legacy action。
