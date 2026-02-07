# Override & Render Check — 2025-07-14

## 检查 1：关键帧差异覆盖 — ✅ 通过

### `isDefaultDisplayState`
- 正确：`displayStates[0]` 视为默认帧，未选中时也回退到默认。

### `updatesToLayerProperties`
- 正确：从 `Partial<KeyElement>` 平铺到 `Partial<LayerProperties>`，覆盖 position/size/style 全部字段。

### `writeToLayerOverride`
- 正确：按 `displayStateId + layerId` 定位，merge 已有 properties，自动追踪 `keyProperties`。

### `updateElement` / `updateElementPosition` / `updateElementSize`
- 正确：全部走 `isDefaultDisplayState` 分支——默认帧写 `sharedElements`，非默认帧写 `layerOverride`。
- `updateElementName` 始终写 `sharedElements`（名称不分帧），合理。

---

## 检查 2：画布并排渲染 — ⚠️ 有问题

### `resolveElementsForState` 纯函数
- 正确：`sharedElements` + `displayState.layerOverrides` 合并，属性用 `??` 回退到基础值。

### 活动帧
- 正确：用 `useResolvedElements()` hook，基于 `selectedDisplayStateId` 解析。

### 非活动帧 — ❌ keyframe↔displayState 索引对齐问题

Canvas.tsx 第 1232 行：
```ts
const dsIndex = keyframes.findIndex(k => k.id === layout.id);
const matchingDs = displayStates[dsIndex] || null;
```

**问题：keyframes 和 displayStates 数量不一致，用 index 对齐不可靠。**

| 数据 | 初始数量 | IDs |
|------|---------|-----|
| keyframes | 3 | kf-idle, kf-active, kf-complete |
| displayStates | 2 | ds-default, ds-active |

- `kf-complete`（index=2）→ `displayStates[2]` = `undefined` → 回退 null → 永远只渲染 sharedElements 基础值，无法有自己的覆盖。
- `addKeyframe()` 不会同步创建 `displayState`，运行时会越来越不对齐。

### 建议修复

**方案 A（推荐）：keyframe 持有 displayStateId 引用**
```ts
// Keyframe 类型加字段
interface Keyframe {
  // ...
  displayStateId?: string;
}

// Canvas 渲染时
const matchingDs = displayStates.find(ds => ds.id === keyframe.displayStateId);
```

**方案 B：addKeyframe 同步创建 displayState，保持 1:1**

---

## 总结

| 功能 | 结果 |
|------|------|
| 关键帧差异覆盖（store 写入逻辑） | ✅ 通过 |
| 画布并排渲染（Canvas 读取逻辑） | ❌ 不通过 — keyframe↔displayState 索引映射不可靠 |
