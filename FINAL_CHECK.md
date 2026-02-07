# 最终架构检查

## 结论：✅ 通过（附带清理建议）

核心第一性原则——**共享图层树**——已从架构层面得到保证。数据一致性机制完备。存在旧模型残留，但不影响第一性原则的正确性，属于技术债而非架构缺陷。

---

## 第一性原则验证

### A. 共享图层树：✅ 通过

**`keyElements:` 写入点分析（共 4 处，全部正确）：**

| 行号 | 场景 | 写入值 | 判定 |
|------|------|--------|------|
| 365 | `syncToAllKeyframes` 适配层 | `sharedElements` | ✅ 正确 |
| 436 | `addKeyframe` | `state.sharedElements` | ✅ 正确 |
| 1817 | `cloneKeyframe` | `state.sharedElements` | ✅ 正确 |
| 1863 | `resetProject` | `emptyElements`（同时赋给 `sharedElements`） | ✅ 正确 |

**所有元素增删改操作（addElement、deleteElement、updateElement、duplicateElements、paste 等）均写入 `sharedElements`，再通过 `syncToAllKeyframes` 传播到所有 keyframe。**

**subscribe 双向同步（L3846）：** 目前作为安全网存在。由于所有写入已走 `sharedElements`，Direction 2（keyElements→sharedElements 回写）理论上不会触发。保留无害，可在稳定后移除以简化代码。

### B. 数据一致性：✅ 通过

**切换关键帧时图层一致性：**
- `LayerManager` 读取 `selectedKeyframe.keyElements`（L24）
- `Canvas` 通过 `useResolvedElements()` hook 读取，该 hook 以 `keyframe.keyElements` 为基础，叠加 `DisplayState.layerOverrides`
- 由于所有 keyframe 的 `keyElements` 指向同一个 `sharedElements` 引用，切换关键帧时图层列表**必然一致**

**添加/删除元素影响所有帧：**
- 所有增删操作写 `sharedElements` → `syncToAllKeyframes` 广播 → 所有帧同步更新 ✅
- `resetProject` 同时清空 `sharedElements` 和唯一 keyframe ✅

**DisplayState 叠加机制：**
- `useResolvedElements` 正确实现了 base elements + layerOverrides 的合并逻辑
- 只有 `isKey=true` 的 override 才会生效，符合 PRD「未被标记为关键属性的部分保持原状」

### C. 旧模型清理：⚠️ 有残留，不影响第一性原则

**残留的旧模型：**

| 旧模型 | 位置 | 状态 | 影响 |
|--------|------|------|------|
| `FunctionalState` | types、store、StateInspector、ExportModal | **活跃使用** | 与 PRD 的 `Variable` 系统功能重叠 |
| `Interaction` | types、store、ShareModal、ImportModal | **活跃使用** | 与 PRD 的 `Patch` 连线系统功能重叠 |
| `Component` (v1) | types、store | **活跃使用** | 与 `ComponentV2` 并存 |
| `InteractionRule` | types | **仅类型定义** | 被 `ComponentV2` 引用 |

**关键判断：这些旧模型不影响第一性原则。**
- 共享图层树的正确性不依赖于交互模型（Interaction vs Patch）
- `FunctionalState` 是关键帧的元数据标注，不影响图层共享
- 旧 `Component` 有自己的 `masterElements`，与画布级 `sharedElements` 独立

---

## 剩余问题

1. **`FunctionalState` vs `Variable` 双系统并存** — PRD 明确「功能状态 = 变量 flag」，应统一为 `Variable`。当前两套系统都在 store 中，增加认知负担。优先级：低（不影响正确性）。

2. **`Interaction` vs `Patch` 双系统并存** — PRD 要求 Origami 风格 Patch 连线，但旧的命令式 `Interaction` 系统仍在。两者独立运行不冲突，但长期应迁移到 Patch。优先级：低。

3. **subscribe 安全网可精简** — 所有写入已走 `sharedElements`，双向同步的 Direction 2 分支是死代码。可在 v0.2 后移除。优先级：极低。

4. **store 文件过大（3871 行）** — 建议后续拆分为 `elementActions`、`keyframeActions`、`patchActions` 等模块。优先级：低。

---

## 是否可交付

**✅ 可交付。**

第一性原则（共享图层树 + 数据一致性）从架构层面已得到保证：
- 单一写入源（`sharedElements`）
- 自动广播机制（`syncToAllKeyframes`）
- 安全网兜底（subscribe 双向同步）
- UI 读取路径一致（所有组件通过 keyframe.keyElements 或 useResolvedElements 读取）

旧模型残留属于技术债，不阻塞交付，可在后续版本逐步清理。
