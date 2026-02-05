# Designer Memory - Toumo 设计负责人

> 最后更新: 2025-02-05

## 当前进度

### ✅ 已完成

1. **阅读 PRD.md** - 理解产品定位：State Machine Motion Design Tool
2. **创建设计文档目录** `design/`
3. **输出设计规范文档**:
   - `README.md` - 设计理念、品味参考
   - `tokens.md` - 颜色、字体、间距、圆角、阴影
   - `layout.md` - 整体布局、各面板规范
   - `components.md` - 按钮、输入框、药丸等组件
   - `motion.md` - 动效时长、缓动曲线
   - `review.md` - 代码审核与改进建议

4. **修正布局规范** - Canvas 区域改为多帧横向滚动（非固定三帧）
5. **Interaction Manager 设计** - 状态图 + 时间轴视图详细规范

### 🔄 进行中

- 等待开发团队根据设计规范实施改进

### 📋 待办事项

1. 审核代码实现是否符合设计规范
2. ~~设计 Interaction Manager 的详细 UI~~ ✅
3. ~~设计状态图可视化的节点样式~~ ✅
4. ~~设计时间轴视图的样式~~ ✅
5. 与开发协作实施设计规范

---

## 重要决策

### 颜色系统
- 主背景: `#0a0a0b` (近乎纯黑)
- 强调色: `#6366f1` (Indigo)
- 选择理由: 专业感、现代感、护眼

### 布局决策
- Canvas: 多帧横向滚动，非固定数量
- Interaction Manager: 在 Canvas 下方，可拖拽调整高度

### 品味参考
- Linear: 简洁克制
- Figma: 专业高效
- Apple: 细节打磨

---

## 发现的问题

### 代码审核发现 (高优先级)
1. 颜色系统不一致 - 混用硬编码值
2. Top Bar 背景色 `#2c2c2c` 过亮
3. 字体大小不统一

### 建议的修复
- 统一使用 CSS 变量
- 详见 `design/review.md`

---

## 文件索引

| 文件 | 用途 |
|------|------|
| `design/README.md` | 设计理念总览 |
| `design/tokens.md` | 设计令牌 |
| `design/layout.md` | 布局规范 |
| `design/components.md` | 组件规范 |
| `design/motion.md` | 动效规范 |
| `design/review.md` | 代码审核 |
| `design/interaction-manager.md` | 交互管理器设计 |
