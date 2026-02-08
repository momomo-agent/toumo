# Toumo 核心清理计划

## 目标
让产品只做 PRD 定义的三件事：Canvas（多关键帧编辑）+ Patch（行为逻辑）+ Preview（实时预览）

## Phase 1: 砍掉非核心功能
- [ ] 删除 ShareModal（PRD 明确不做分享）
- [ ] 删除 ExportModal + ExportPanel（PRD 不做代码导出 v1）
- [ ] 删除 ImportModal
- [ ] 删除 TutorialPage
- [ ] 删除 WelcomeModal
- [ ] 删除 HelpPanel
- [ ] 删除 ShortcutsPanel
- [ ] 删除 HistoryPanel
- [ ] 删除 FilesPanel
- [ ] 清理 App.tsx 中所有相关状态和引用
- [ ] 清理 Toolbar 中相关按钮

## Phase 2: UI 布局对齐 PRD
PRD 布局：
```
┌──────────┬─────────┬─────────────────────┬──────────┐
│          │ Layers  │       Canvas        │ Inspector│
│  Live    │         │  KF1  KF2  KF3     │          │
│  Preview │ 共享    │  CmpA1 CmpA2       │          │
│          │ 图层树  ├─────────────────────┤          │
│          │         │ Patch Editor        │          │
└──────────┴─────────┴─────────────────────┴──────────┘
```
- [ ] 确保布局干净：左 Preview | 中 Layers+Canvas+Patch | 右 Inspector
- [ ] 移除多余的 toolbar 按钮（只留核心工具）

## Phase 3: 恢复 UI 微交互
- [ ] 把被移除的 CSS transition 补回来（按钮 hover、面板展开等基础微交互）
- [ ] folme 只用在真正需要物理感的地方

## Phase 4: 核心体验打磨
- [ ] Canvas 操作手感
- [ ] Patch 连线体验
- [ ] Preview 流畅度
