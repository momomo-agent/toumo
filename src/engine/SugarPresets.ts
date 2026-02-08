/**
 * Sugar Presets — 一键生成常见交互模板
 * 实用交互模板：Tab切换、卡片展开、按钮反馈、页面导航、下拉菜单、Hover高亮
 */

import type { Patch, PatchConnection, DisplayState, KeyElement } from '../types';

let _uid = 0;
const uid = (prefix: string) => `${prefix}-sugar-${Date.now()}-${++_uid}`;

export interface SugarResult {
  patches: Patch[];
  connections: PatchConnection[];
  displayStates?: DisplayState[];
  /** layerOverrides to apply keyed by displayStateId → elementId → props */
  overrides?: Record<string, Record<string, Record<string, any>>>;
  /** 要创建的视觉元素 */
  elements?: KeyElement[];
}

// ─── Tab 切换 ────────────────────────────────────────────────────────
// 底部 Tab Bar：点击不同 Tab 切换页面内容
export function createTabSwitch(elementId: string, elementName: string): SugarResult {
  const tap1Id = uid('tap-tab1');
  const tap2Id = uid('tap-tab2');
  const tap3Id = uid('tap-tab3');
  const switch1Id = uid('switch-tab1');
  const switch2Id = uid('switch-tab2');
  const switch3Id = uid('switch-tab3');
  const dsTab1Id = uid('ds-tab1');
  const dsTab2Id = uid('ds-tab2');
  const dsTab3Id = uid('ds-tab3');

  const patches: Patch[] = [
    {
      id: tap1Id,
      type: 'tap',
      name: `Tab 1: ${elementName}`,
      config: { targetElementId: elementId },
      position: { x: 100, y: 60 },
      inputs: [],
      outputs: [{ id: `${tap1Id}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: tap2Id,
      type: 'tap',
      name: 'Tab 2',
      config: { targetElementId: '' },
      position: { x: 100, y: 180 },
      inputs: [],
      outputs: [{ id: `${tap2Id}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: tap3Id,
      type: 'tap',
      name: 'Tab 3',
      config: { targetElementId: '' },
      position: { x: 100, y: 300 },
      inputs: [],
      outputs: [{ id: `${tap3Id}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: switch1Id,
      type: 'switchDisplayState',
      name: 'Switch → Tab 1',
      config: { targetStateId: dsTab1Id },
      position: { x: 400, y: 60 },
      inputs: [{ id: `${switch1Id}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switch1Id}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switch2Id,
      type: 'switchDisplayState',
      name: 'Switch → Tab 2',
      config: { targetStateId: dsTab2Id },
      position: { x: 400, y: 180 },
      inputs: [{ id: `${switch2Id}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switch2Id}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switch3Id,
      type: 'switchDisplayState',
      name: 'Switch → Tab 3',
      config: { targetStateId: dsTab3Id },
      position: { x: 400, y: 300 },
      inputs: [{ id: `${switch3Id}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switch3Id}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'), fromPatchId: tap1Id, fromPortId: `${tap1Id}-onTap`,
      toPatchId: switch1Id, toPortId: `${switch1Id}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: tap2Id, fromPortId: `${tap2Id}-onTap`,
      toPatchId: switch2Id, toPortId: `${switch2Id}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: tap3Id, fromPortId: `${tap3Id}-onTap`,
      toPatchId: switch3Id, toPortId: `${switch3Id}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    displayStates: [
      { id: dsTab1Id, name: 'Tab 1', layerOverrides: [] },
      { id: dsTab2Id, name: 'Tab 2', layerOverrides: [] },
      { id: dsTab3Id, name: 'Tab 3', layerOverrides: [] },
    ],
  };
}

// ─── 卡片展开/收起 ──────────────────────────────────────────────────
// 点击卡片展开详情，再点收起（含完整视觉元素）
export function createCardExpand(_elementId: string, _elementName: string): SugarResult {
  const cardId = uid('el-card');
  const tapId = uid('tap');
  const toggleId = uid('toggle');
  const switchExpandId = uid('switch-expand');
  const switchCollapseId = uid('switch-collapse');
  const dsExpandedId = uid('ds-expanded');

  // 创建卡片元素
  const cardElement: KeyElement = {
    id: cardId,
    name: 'Card',
    category: 'component',
    isKeyElement: true,
    attributes: [],
    position: { x: 96, y: 200 },
    size: { width: 120, height: 80 },
    shapeType: 'rectangle',
    text: 'Tap to expand',
    style: {
      fill: '#1e293b',
      fillOpacity: 1,
      stroke: '',
      strokeWidth: 0,
      strokeOpacity: 1,
      borderRadius: 12,
    },
  };

  const patches: Patch[] = [
    {
      id: tapId,
      type: 'tap',
      name: `点击 ${cardElement.name}`,
      config: { targetElementId: cardId },
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [{ id: `${tapId}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: toggleId,
      type: 'toggle',
      name: '展开/收起',
      config: {},
      position: { x: 350, y: 100 },
      inputs: [{ id: `${toggleId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [
        { id: `${toggleId}-on`, name: 'on', dataType: 'pulse' },
        { id: `${toggleId}-off`, name: 'off', dataType: 'pulse' },
      ],
    },
    {
      id: switchExpandId,
      type: 'switchDisplayState',
      name: 'Switch → 展开',
      config: { targetStateId: dsExpandedId },
      position: { x: 600, y: 60 },
      inputs: [{ id: `${switchExpandId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchExpandId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchCollapseId,
      type: 'switchDisplayState',
      name: 'Switch → 收起',
      config: { targetStateId: '__default__' },
      position: { x: 600, y: 180 },
      inputs: [{ id: `${switchCollapseId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchCollapseId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'), fromPatchId: tapId, fromPortId: `${tapId}-onTap`,
      toPatchId: toggleId, toPortId: `${toggleId}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: toggleId, fromPortId: `${toggleId}-on`,
      toPatchId: switchExpandId, toPortId: `${switchExpandId}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: toggleId, fromPortId: `${toggleId}-off`,
      toPatchId: switchCollapseId, toPortId: `${switchCollapseId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    elements: [cardElement],
    displayStates: [{ id: dsExpandedId, name: '展开', layerOverrides: [] }],
    overrides: {
      [dsExpandedId]: {
        [cardId]: { height: 200, fill: '#334155', fillOpacity: 1 },
      },
    },
  };
}

// ─── 按钮点击反馈 ───────────────────────────────────────────────────
// 按下缩小+透明、自动恢复（含完整视觉元素）
export function createButtonFeedback(_elementId: string, _elementName: string): SugarResult {
  const btnId = uid('el-feedback-btn');
  const tapId = uid('tap');
  const switchToPressedId = uid('switch-pressed');
  const delayId = uid('delay');
  const switchToDefaultId = uid('switch-default');
  const dsPressedId = uid('ds-pressed');

  // 创建按钮元素
  const btnElement: KeyElement = {
    id: btnId,
    name: 'Button',
    category: 'component',
    isKeyElement: true,
    attributes: [],
    position: { x: 96, y: 200 },
    size: { width: 200, height: 48 },
    shapeType: 'rectangle',
    text: 'Press Me',
    style: {
      fill: '#3b82f6',
      fillOpacity: 1,
      stroke: '',
      strokeWidth: 0,
      strokeOpacity: 1,
      borderRadius: 12,
    },
  };

  const patches: Patch[] = [
    {
      id: tapId,
      type: 'tap',
      name: `点击 ${btnElement.name}`,
      config: { targetElementId: btnId },
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [{ id: `${tapId}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: switchToPressedId,
      type: 'switchDisplayState',
      name: 'Switch → 按下',
      config: { targetStateId: dsPressedId },
      position: { x: 400, y: 80 },
      inputs: [{ id: `${switchToPressedId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToPressedId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: delayId,
      type: 'delay',
      name: '自动恢复',
      config: { duration: 150 },
      position: { x: 650, y: 80 },
      inputs: [{ id: `${delayId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${delayId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchToDefaultId,
      type: 'switchDisplayState',
      name: 'Switch → 默认',
      config: { targetStateId: '__default__' },
      position: { x: 900, y: 80 },
      inputs: [{ id: `${switchToDefaultId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToDefaultId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'), fromPatchId: tapId, fromPortId: `${tapId}-onTap`,
      toPatchId: switchToPressedId, toPortId: `${switchToPressedId}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: switchToPressedId, fromPortId: `${switchToPressedId}-done`,
      toPatchId: delayId, toPortId: `${delayId}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: delayId, fromPortId: `${delayId}-done`,
      toPatchId: switchToDefaultId, toPortId: `${switchToDefaultId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    elements: [btnElement],
    displayStates: [{ id: dsPressedId, name: '按下', layerOverrides: [] }],
    overrides: {
      [dsPressedId]: {
        [btnId]: { scale: 0.95, fillOpacity: 0.8 },
      },
    },
  };
}

// ─── 页面导航 ────────────────────────────────────────────────────────
// 点击按钮切换到另一个页面（含完整视觉元素）
export function createPageNavigation(_elementId: string, _elementName: string): SugarResult {
  const btnId = uid('el-nav-btn');
  const tapId = uid('tap');
  const switchId = uid('switch-page');
  const dsPageId = uid('ds-page2');

  // 创建按钮元素
  const btnElement: KeyElement = {
    id: btnId,
    name: 'Go to Page 2',
    category: 'component',
    isKeyElement: true,
    attributes: [],
    position: { x: 96, y: 200 },
    size: { width: 200, height: 48 },
    shapeType: 'rectangle',
    text: 'Go to Page 2',
    style: {
      fill: '#3b82f6',
      fillOpacity: 1,
      stroke: '',
      strokeWidth: 0,
      strokeOpacity: 1,
      borderRadius: 12,
    },
  };

  const patches: Patch[] = [
    {
      id: tapId,
      type: 'tap',
      name: `点击 ${btnElement.name}`,
      config: { targetElementId: btnId },
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [{ id: `${tapId}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: switchId,
      type: 'switchDisplayState',
      name: 'Switch → 页面 2',
      config: { targetStateId: dsPageId },
      position: { x: 400, y: 100 },
      inputs: [{ id: `${switchId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'), fromPatchId: tapId, fromPortId: `${tapId}-onTap`,
      toPatchId: switchId, toPortId: `${switchId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    elements: [btnElement],
    displayStates: [{ id: dsPageId, name: '页面 2', layerOverrides: [] }],
    overrides: {
      [dsPageId]: {
        [btnId]: { fill: '#22c55e', text: 'Page 2 Active' },
      },
    },
  };
}

// ─── 下拉菜单 ────────────────────────────────────────────────────────
// 点击按钮展开/收起菜单
export function createDropdownMenu(elementId: string, elementName: string): SugarResult {
  const tapId = uid('tap');
  const toggleId = uid('toggle');
  const switchOpenId = uid('switch-open');
  const switchCloseId = uid('switch-close');
  const dsOpenId = uid('ds-menu-open');

  const patches: Patch[] = [
    {
      id: tapId,
      type: 'tap',
      name: `点击 ${elementName}`,
      config: { targetElementId: elementId },
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [{ id: `${tapId}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: toggleId,
      type: 'toggle',
      name: '展开/收起',
      config: {},
      position: { x: 350, y: 100 },
      inputs: [{ id: `${toggleId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [
        { id: `${toggleId}-on`, name: 'on', dataType: 'pulse' },
        { id: `${toggleId}-off`, name: 'off', dataType: 'pulse' },
      ],
    },
    {
      id: switchOpenId,
      type: 'switchDisplayState',
      name: 'Switch → 菜单展开',
      config: { targetStateId: dsOpenId },
      position: { x: 600, y: 60 },
      inputs: [{ id: `${switchOpenId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchOpenId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchCloseId,
      type: 'switchDisplayState',
      name: 'Switch → 菜单收起',
      config: { targetStateId: '__default__' },
      position: { x: 600, y: 180 },
      inputs: [{ id: `${switchCloseId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchCloseId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'), fromPatchId: tapId, fromPortId: `${tapId}-onTap`,
      toPatchId: toggleId, toPortId: `${toggleId}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: toggleId, fromPortId: `${toggleId}-on`,
      toPatchId: switchOpenId, toPortId: `${switchOpenId}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: toggleId, fromPortId: `${toggleId}-off`,
      toPatchId: switchCloseId, toPortId: `${switchCloseId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    displayStates: [{ id: dsOpenId, name: '菜单展开', layerOverrides: [] }],
    overrides: {
      [dsOpenId]: {
        [elementId]: { fillOpacity: 1 },
      },
    },
  };
}

// ─── Hover 高亮 ──────────────────────────────────────────────────────
// 鼠标悬停时元素高亮
export function createHoverHighlight(elementId: string, elementName: string): SugarResult {
  const hoverId = uid('hover');
  const switchToHoverId = uid('switch-hover');
  const switchToDefaultId = uid('switch-default');
  const dsHoverId = uid('ds-highlight');

  const patches: Patch[] = [
    {
      id: hoverId,
      type: 'hover',
      name: `悬停 ${elementName}`,
      config: { targetElementId: elementId },
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [
        { id: `${hoverId}-onOver`, name: 'onOver', dataType: 'pulse' },
        { id: `${hoverId}-onOut`, name: 'onOut', dataType: 'pulse' },
      ],
    },
    {
      id: switchToHoverId,
      type: 'switchDisplayState',
      name: 'Switch → 高亮',
      config: { targetStateId: dsHoverId },
      position: { x: 400, y: 80 },
      inputs: [{ id: `${switchToHoverId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToHoverId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchToDefaultId,
      type: 'switchDisplayState',
      name: 'Switch → 默认',
      config: { targetStateId: '__default__' },
      position: { x: 400, y: 200 },
      inputs: [{ id: `${switchToDefaultId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToDefaultId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'), fromPatchId: hoverId, fromPortId: `${hoverId}-onOver`,
      toPatchId: switchToHoverId, toPortId: `${switchToHoverId}-trigger`,
    },
    {
      id: uid('conn'), fromPatchId: hoverId, fromPortId: `${hoverId}-onOut`,
      toPatchId: switchToDefaultId, toPortId: `${switchToDefaultId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    displayStates: [{ id: dsHoverId, name: '高亮', layerOverrides: [] }],
    overrides: {
      [dsHoverId]: {
        [elementId]: { fill: '#3b82f6', fillOpacity: 1, scale: 1.02 },
      },
    },
  };
}

/** All available sugar presets */
export const SUGAR_PRESETS = [
  { id: 'tab-switch', name: 'Tab 切换', icon: '📑', description: '底部 Tab Bar，点击切换页面内容', create: createTabSwitch },
  { id: 'card-expand', name: '卡片展开/收起', icon: '🃏', description: '点击卡片展开详情，再点收起', create: createCardExpand },
  { id: 'button-feedback', name: '按钮点击反馈', icon: '👆', description: '按下缩小 → 自动恢复', create: createButtonFeedback },
  { id: 'page-navigation', name: '页面导航', icon: '➡️', description: '点击按钮切换到另一个页面', create: createPageNavigation },
  { id: 'dropdown-menu', name: '下拉菜单', icon: '📋', description: '点击展开/收起菜单', create: createDropdownMenu },
  { id: 'hover-highlight', name: 'Hover 高亮', icon: '🖱️', description: '鼠标悬停时元素高亮', create: createHoverHighlight },
] as const;
