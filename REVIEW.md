# Toumo vs 竞品对比评测

> 作者视角：资深动效设计师，日常用 Figma / Principle / Origami Studio / ProtoPie / Framer

---

## 评分总览

| 维度 | Toumo | Figma | Principle | Origami | ProtoPie | Framer |
|------|-------|-------|-----------|---------|----------|--------|
| 1. 上手速度 | **8** | 9 | 8 | 4 | 6 | 7 |
| 2. 表现力 | **7** | 5 | 7 | 10 | 8 | 6 |
| 3. 工作流效率 | **7** | 8 | 7 | 5 | 6 | 7 |
| 4. 曲线控制 | **8** | 4 | 6 | 8 | 7 | 5 |
| 5. 状态管理 | **9** | 5 | 6 | 7 | 7 | 6 |
| 6. 变量/逻辑 | **7** | 3 | 2 | 9 | 8 | 4 |
| 7. 协作/导出 | **2** | 10 | 4 | 3 | 6 | 9 |
| **总分** | **48** | **44** | **40** | **46** | **48** | **44** |

---

## 逐项分析

### 1. 上手速度 — Toumo 8 分

**Toumo** 的 Sugar 预设系统是杀手锏。右键元素 → 选 "Hover Scale" 或 "Tap Toggle"，一键生成完整的 Patch 连线 + 显示状态 + 属性覆盖，字面意义上 30 秒出第一个动效。不需要理解 Patch 模型就能用。

**Figma (9)** 依然是上手最快的——设计师本来就在 Figma 里，拖个 Prototype 连线就有 Smart Animate，零学习成本。**Principle (8)** 导入 Sketch/Figma 文件后拖时间轴也很直觉。**Origami (4)** 是反面教材，Patch 编辑器对新手像在读电路图。**ProtoPie (6)** 的触发器-响应模型需要理解概念但不算难。**Framer (7)** 代码和可视化混合，上手中等。

### 2. 表现力 — Toumo 7 分

Toumo 当前支持 15 种 Patch 类型（Tap/Drag/Hover/Scroll/Timer/VariableChange + SwitchState/SetVariable/AnimateProperty/Condition/Delay/Toggle/Counter/OptionSwitch/DragBinding），SmartAnimate 能自动 diff 两个状态的 17 种数值属性 + 4 种颜色属性并生成过渡动画，包括模糊、亮度、饱和度等滤镜属性。DragBinding 支持实时拖拽映射。能覆盖大部分 UI 微交互场景。

**Origami (10)** 表现力无上限，Facebook 内部用它做过最复杂的交互原型。**ProtoPie (8)** 传感器+变量+公式能做很复杂的东西。**Principle (7)** 时间轴精确控制加 Auto 动画表现力不错。**Figma (5)** Smart Animate 只能做状态间的简单过渡，复杂编排无能为力。**Framer (6)** 代码层面理论上无限，但可视化层面受限。

Toumo 目前缺的：没有时间轴做精确的多属性错开编排，没有粒子/3D/Lottie，复杂序列动画（如 staggered list animation）还不够方便。

### 3. 工作流效率 — Toumo 7 分

状态机模型天然适合 UI 交互设计——大部分 UI 动效本质就是「状态 A → 状态 B」。共享图层树 + 关键帧覆盖的设计避免了 Principle 那种「每个 Artboard 复制一遍图层」的痛苦。画布上多关键帧并排显示，一眼看到所有状态。Patch 编辑器和画布分离，画布保持干净。

**Figma (8)** 赢在「设计和原型在同一个工具里」，不用导出导入。**Principle (7)** 时间轴编辑很高效但 Artboard 管理是噩梦。**Origami (5)** 连线一多就是意大利面。**ProtoPie (6)** 触发器列表长了找起来费劲。**Framer (7)** 设计+代码一体化效率不错。

Toumo 的短板：Web-based 但没有实时协作，没有 Figma 插件导入设计稿，目前只能从零画起。

### 4. 曲线控制 — Toumo 8 分

这是 Toumo 的强项。弹簧物理引擎基于 Folme 的阻尼振荡模型（damping + response 双参数），5 个弹簧预设（default/bouncy/stiff/gentle/snappy）覆盖常见场景。25+ 种缓动函数（Quad 到 Elastic 全家桶）。三级曲线覆盖（全局 → 元素 → 属性）是独特设计，意味着你可以设一个全局弹簧，然后单独给某个元素的 opacity 用 easeOut。

**Origami (8)** 的 Pop Animation 弹簧模型业界标杆。**ProtoPie (7)** 弹簧参数可调但不如 Toumo 灵活。**Principle (6)** 有弹簧但参数调节不够直观。**Framer (5)** Motion 库的弹簧不错但在设计工具层面暴露不够。**Figma (4)** 只有 ease-in/out/in-out 和 spring，几乎没有精细控制。

### 5. 状态管理 — Toumo 9 分

这是 Toumo 的核心设计哲学，也是它最大的差异化。显示状态（关键帧）+ 功能状态（变量 flag）双轨模型非常清晰。Toggle Patch 处理二态切换，OptionSwitch 处理多选一（Tab 栏），Counter 处理计数递增，Condition Patch 做条件分支——这套组合拳让多状态管理既可视化又有逻辑表达力。组件可以拥有独立的状态机和 Patch 连线。

**ProtoPie (7)** 变量+条件能做多状态但没有可视化状态机。**Origami (7)** Switch/Option 节点类似但学习曲线陡。**Principle (6)** 多 Artboard 切换可以但状态一多就乱。**Figma (5)** Component Variants 勉强算状态管理但交互逻辑弱。**Framer (6)** 代码层面灵活但可视化不足。

### 6. 变量/逻辑 — Toumo 7 分

支持 boolean/number/string/color 四种变量类型，VariableChange 触发器可以监听变量变化并自动触发下游逻辑，Condition Patch 支持 6 种比较运算符（==, !=, >, <, >=, <=）。Patch 连线的数据流模型让逻辑可视化。

**Origami (9)** 逻辑能力最强，几乎是可视化编程。**ProtoPie (8)** 变量+公式+条件很完整。**Framer (4)** 要写代码。**Figma (3)** Variables 刚起步，逻辑能力极弱。**Principle (2)** 几乎没有逻辑能力。

Toumo 目前缺：没有数学运算 Patch（加减乘除），没有字符串处理，没有数组/列表概念，复杂数据流还做不了。

### 7. 协作/导出 — Toumo 2 分

这是 Toumo 当前最大的短板。数据存 localStorage，没有云端存储，没有实时协作，没有分享链接，没有代码导出，没有 Figma/Sketch 导入。作为一个本地 Web 工具，团队协作能力约等于零。

**Figma (10)** 协作之王，实时多人编辑 + Dev Mode + 链接分享。**Framer (9)** 在线协作+直接发布网站。**ProtoPie (6)** Cloud 分享+Handoff 还行。**Principle (4)** 只能导出视频/GIF。**Origami (3)** 基本只能录屏分享。

---

## 核心问题：作为动效设计师，我会选 Toumo 吗？

### ✅ 会选 Toumo 的场景

1. **快速验证交互状态逻辑** — 比如一个有 5 个状态的复杂组件（idle → hover → pressed → loading → success），Toumo 的状态机模型比任何竞品都清晰
2. **需要精确弹簧参数的微交互** — 三级曲线覆盖 + 弹簧预设，调参效率高，参数可以直接给开发
3. **个人快速原型** — Sugar 预设 30 秒出效果，比打开 Origami 连半天线快 10 倍
4. **探索 Patch 连线但不想被 Origami 劝退** — Toumo 的 Patch 模型比 Origami 简化很多，15 种 vs Origami 的 100+ 种，够用且不吓人

### ❌ 不会选 Toumo 的场景

1. **团队协作项目** — 没有云端、没有分享链接、没有多人编辑，团队项目直接 pass
2. **需要交付给开发的正式项目** — 没有代码导出、没有 Inspect 模式、没有动效规格文档生成
3. **复杂序列动画** — 没有时间轴，做不了精确的多元素错开动画（staggered animation）
4. **需要从 Figma 导入设计稿** — 目前只能从零画起，对已有设计资产不友好
5. **高保真全流程原型** — 没有页面导航、没有滚动容器、没有真实数据绑定

### 一句话总结

> **Toumo 是一个「状态机思维」的动效探索工具。** 它在状态管理和曲线控制上已经超越大部分竞品，Sugar 预设让上手体验极好。但协作和导出的缺失让它目前只适合个人探索，还不能进入正式工作流。如果补上 Figma 导入 + 代码导出 + 分享链接，它有潜力成为 Origami 的「平民版替代品」——同样的 Patch 连线哲学，但学习曲线平缓 10 倍。
