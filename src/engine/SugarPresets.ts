/**
 * Sugar Presets — 一键生成常见交互模板
 * 参考 Folme 的 Sugar 模式，自动创建 Patch + 连线 + DisplayState
 */

import type { Patch, PatchConnection, DisplayState } from '../types';

let _uid = 0;
const uid = (prefix: string) => `${prefix}-sugar-${Date.now()}-${++_uid}`;

export interface SugarResult {
  patches: Patch[];
  connections: PatchConnection[];
  displayStates?: DisplayState[];
  /** layerOverrides to apply keyed by displayStateId → elementId → props */
  overrides?: Record<string, Record<string, Record<string, any>>>;
}

// ─── Hover Scale ─────────────────────────────────────────────────────
export function createHoverScale(elementId: string, elementName: string): SugarResult {
  const hoverId = uid('hover');
  const switchToHoverId = uid('switch-hover');
  const switchToDefaultId = uid('switch-default');
  const dsHoverId = uid('ds-hover');

  const patches: Patch[] = [
    {
      id: hoverId,
      type: 'hover',
      name: `Hover ${elementName}`,
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
      name: 'Switch → Hover',
      config: { targetStateId: dsHoverId },
      position: { x: 400, y: 80 },
      inputs: [{ id: `${switchToHoverId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToHoverId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchToDefaultId,
      type: 'switchDisplayState',
      name: 'Switch → Default',
      config: { targetStateId: '__default__' },
      position: { x: 400, y: 200 },
      inputs: [{ id: `${switchToDefaultId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToDefaultId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'),
      fromPatchId: hoverId,
      fromPortId: `${hoverId}-onOver`,
      toPatchId: switchToHoverId,
      toPortId: `${switchToHoverId}-trigger`,
    },
    {
      id: uid('conn'),
      fromPatchId: hoverId,
      fromPortId: `${hoverId}-onOut`,
      toPatchId: switchToDefaultId,
      toPortId: `${switchToDefaultId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    displayStates: [{ id: dsHoverId, name: 'Hover', layerOverrides: [] }],
    overrides: {
      [dsHoverId]: {
        [elementId]: { scale: 1.08, fillOpacity: 0.9 },
      },
    },
  };
}

// ─── Tap Toggle ──────────────────────────────────────────────────────
export function createTapToggle(elementId: string, elementName: string): SugarResult {
  const tapId = uid('tap');
  const toggleId = uid('toggle');
  const switchToActiveId = uid('switch-active');
  const switchToDefaultId = uid('switch-default');
  const dsActiveId = uid('ds-active');

  const patches: Patch[] = [
    {
      id: tapId,
      type: 'tap',
      name: `Tap ${elementName}`,
      config: { targetElementId: elementId },
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [{ id: `${tapId}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: toggleId,
      type: 'toggle',
      name: 'Toggle',
      config: {},
      position: { x: 350, y: 100 },
      inputs: [{ id: `${toggleId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [
        { id: `${toggleId}-on`, name: 'on', dataType: 'pulse' },
        { id: `${toggleId}-off`, name: 'off', dataType: 'pulse' },
      ],
    },
    {
      id: switchToActiveId,
      type: 'switchDisplayState',
      name: 'Switch → Active',
      config: { targetStateId: dsActiveId },
      position: { x: 600, y: 60 },
      inputs: [{ id: `${switchToActiveId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToActiveId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchToDefaultId,
      type: 'switchDisplayState',
      name: 'Switch → Default',
      config: { targetStateId: '__default__' },
      position: { x: 600, y: 180 },
      inputs: [{ id: `${switchToDefaultId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToDefaultId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'),
      fromPatchId: tapId,
      fromPortId: `${tapId}-onTap`,
      toPatchId: toggleId,
      toPortId: `${toggleId}-trigger`,
    },
    {
      id: uid('conn'),
      fromPatchId: toggleId,
      fromPortId: `${toggleId}-on`,
      toPatchId: switchToActiveId,
      toPortId: `${switchToActiveId}-trigger`,
    },
    {
      id: uid('conn'),
      fromPatchId: toggleId,
      fromPortId: `${toggleId}-off`,
      toPatchId: switchToDefaultId,
      toPortId: `${switchToDefaultId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    displayStates: [{ id: dsActiveId, name: 'Active', layerOverrides: [] }],
    overrides: {
      [dsActiveId]: {
        [elementId]: { fill: '#4CAF50', scale: 0.95 },
      },
    },
  };
}

// ─── Press & Release ─────────────────────────────────────────────────
export function createPressRelease(elementId: string, elementName: string): SugarResult {
  const tapId = uid('tap');
  const switchToPressedId = uid('switch-pressed');
  const delayId = uid('delay');
  const switchToDefaultId = uid('switch-default');
  const dsPressedId = uid('ds-pressed');

  const patches: Patch[] = [
    {
      id: tapId,
      type: 'tap',
      name: `Tap ${elementName}`,
      config: { targetElementId: elementId },
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [{ id: `${tapId}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: switchToPressedId,
      type: 'switchDisplayState',
      name: 'Switch → Pressed',
      config: { targetStateId: dsPressedId },
      position: { x: 400, y: 80 },
      inputs: [{ id: `${switchToPressedId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToPressedId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: delayId,
      type: 'delay',
      name: 'Auto Release',
      config: { duration: 150 },
      position: { x: 650, y: 80 },
      inputs: [{ id: `${delayId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${delayId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchToDefaultId,
      type: 'switchDisplayState',
      name: 'Switch → Default',
      config: { targetStateId: '__default__' },
      position: { x: 900, y: 80 },
      inputs: [{ id: `${switchToDefaultId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToDefaultId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'),
      fromPatchId: tapId,
      fromPortId: `${tapId}-onTap`,
      toPatchId: switchToPressedId,
      toPortId: `${switchToPressedId}-trigger`,
    },
    {
      id: uid('conn'),
      fromPatchId: switchToPressedId,
      fromPortId: `${switchToPressedId}-done`,
      toPatchId: delayId,
      toPortId: `${delayId}-trigger`,
    },
    {
      id: uid('conn'),
      fromPatchId: delayId,
      fromPortId: `${delayId}-done`,
      toPatchId: switchToDefaultId,
      toPortId: `${switchToDefaultId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    displayStates: [{ id: dsPressedId, name: 'Pressed', layerOverrides: [] }],
    overrides: {
      [dsPressedId]: {
        [elementId]: { scale: 0.92, fillOpacity: 0.8 },
      },
    },
  };
}

// ─── Drag to Dismiss ─────────────────────────────────────────────────
export function createDragToDismiss(elementId: string, elementName: string): SugarResult {
  const dragId = uid('drag');
  const switchToDismissedId = uid('switch-dismissed');
  const dsDismissedId = uid('ds-dismissed');

  const patches: Patch[] = [
    {
      id: dragId,
      type: 'drag',
      name: `Drag ${elementName}`,
      config: { targetElementId: elementId },
      position: { x: 100, y: 100 },
      inputs: [],
      outputs: [
        { id: `${dragId}-onDragEnd`, name: 'onDragEnd', dataType: 'pulse' },
      ],
    },
    {
      id: switchToDismissedId,
      type: 'switchDisplayState',
      name: 'Switch → Dismissed',
      config: { targetStateId: dsDismissedId },
      position: { x: 400, y: 100 },
      inputs: [{ id: `${switchToDismissedId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToDismissedId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    {
      id: uid('conn'),
      fromPatchId: dragId,
      fromPortId: `${dragId}-onDragEnd`,
      toPatchId: switchToDismissedId,
      toPortId: `${switchToDismissedId}-trigger`,
    },
  ];

  return {
    patches,
    connections,
    displayStates: [{ id: dsDismissedId, name: 'Dismissed', layerOverrides: [] }],
    overrides: {
      [dsDismissedId]: {
        [elementId]: { y: 900, opacity: 0 },
      },
    },
  };
}

// ─── Hover Color ─────────────────────────────────────────────────────
export function createHoverColor(elementId: string, elementName: string): SugarResult {
  const hoverId = uid('hover');
  const switchToHoverId = uid('switch-hover');
  const switchToDefaultId = uid('switch-default');
  const dsHoverId = uid('ds-hovercolor');

  const patches: Patch[] = [
    {
      id: hoverId, type: 'hover', name: `Hover ${elementName}`,
      config: { targetElementId: elementId },
      position: { x: 100, y: 100 }, inputs: [],
      outputs: [
        { id: `${hoverId}-onOver`, name: 'onOver', dataType: 'pulse' },
        { id: `${hoverId}-onOut`, name: 'onOut', dataType: 'pulse' },
      ],
    },
    {
      id: switchToHoverId, type: 'switchDisplayState', name: 'Switch → Hover Color',
      config: { targetStateId: dsHoverId },
      position: { x: 400, y: 80 },
      inputs: [{ id: `${switchToHoverId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToHoverId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchToDefaultId, type: 'switchDisplayState', name: 'Switch → Default',
      config: { targetStateId: '__default__' },
      position: { x: 400, y: 200 },
      inputs: [{ id: `${switchToDefaultId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchToDefaultId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    { id: uid('conn'), fromPatchId: hoverId, fromPortId: `${hoverId}-onOver`, toPatchId: switchToHoverId, toPortId: `${switchToHoverId}-trigger` },
    { id: uid('conn'), fromPatchId: hoverId, fromPortId: `${hoverId}-onOut`, toPatchId: switchToDefaultId, toPortId: `${switchToDefaultId}-trigger` },
  ];

  return {
    patches, connections,
    displayStates: [{ id: dsHoverId, name: 'Hover Color', layerOverrides: [] }],
    overrides: { [dsHoverId]: { [elementId]: { fill: '#3b82f6', fillOpacity: 1 } } },
  };
}

// ─── Tap Navigate ────────────────────────────────────────────────────
export function createTapNavigate(elementId: string, elementName: string): SugarResult {
  const tapId = uid('tap');
  const switchId = uid('switch-nav');
  const dsNavId = uid('ds-nav');

  const patches: Patch[] = [
    {
      id: tapId, type: 'tap', name: `Tap ${elementName}`,
      config: { targetElementId: elementId },
      position: { x: 100, y: 100 }, inputs: [],
      outputs: [{ id: `${tapId}-onTap`, name: 'onTap', dataType: 'pulse' }],
    },
    {
      id: switchId, type: 'switchDisplayState', name: 'Navigate →',
      config: { targetStateId: dsNavId },
      position: { x: 400, y: 100 },
      inputs: [{ id: `${switchId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    { id: uid('conn'), fromPatchId: tapId, fromPortId: `${tapId}-onTap`, toPatchId: switchId, toPortId: `${switchId}-trigger` },
  ];

  return {
    patches, connections,
    displayStates: [{ id: dsNavId, name: 'Screen 2', layerOverrides: [] }],
  };
}

// ─── Auto Play (Timer Loop) ──────────────────────────────────────────
export function createAutoPlay(_elementId: string, _elementName: string): SugarResult {
  const timerId = uid('timer');
  const toggleId = uid('toggle');
  const switchActiveId = uid('switch-active');
  const switchDefaultId = uid('switch-default');
  const dsActiveId = uid('ds-active');

  const patches: Patch[] = [
    {
      id: timerId, type: 'timer', name: 'Auto Timer',
      config: { duration: 1500, repeat: true },
      position: { x: 100, y: 100 }, inputs: [],
      outputs: [{ id: `${timerId}-onFire`, name: 'onFire', dataType: 'pulse' }],
    },
    {
      id: toggleId, type: 'toggle', name: 'Toggle',
      config: {},
      position: { x: 350, y: 100 },
      inputs: [{ id: `${toggleId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [
        { id: `${toggleId}-onTrue`, name: 'onTrue', dataType: 'pulse' },
        { id: `${toggleId}-onFalse`, name: 'onFalse', dataType: 'pulse' },
      ],
    },
    {
      id: switchActiveId, type: 'switchDisplayState',
      name: 'Switch → Active',
      config: { targetDisplayStateId: dsActiveId },
      position: { x: 600, y: 60 },
      inputs: [{ id: `${switchActiveId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchActiveId}-done`, name: 'done', dataType: 'pulse' }],
    },
    {
      id: switchDefaultId, type: 'switchDisplayState',
      name: 'Switch → Default',
      config: { targetDisplayStateId: 'default' },
      position: { x: 600, y: 180 },
      inputs: [{ id: `${switchDefaultId}-trigger`, name: 'trigger', dataType: 'pulse' }],
      outputs: [{ id: `${switchDefaultId}-done`, name: 'done', dataType: 'pulse' }],
    },
  ];

  const connections: PatchConnection[] = [
    { id: uid('c'), fromPatchId: timerId, fromPortId: `${timerId}-onFire`,
      toPatchId: toggleId, toPortId: `${toggleId}-trigger` },
    { id: uid('c'), fromPatchId: toggleId, fromPortId: `${toggleId}-onTrue`,
      toPatchId: switchActiveId, toPortId: `${switchActiveId}-trigger` },
    { id: uid('c'), fromPatchId: toggleId, fromPortId: `${toggleId}-onFalse`,
      toPatchId: switchDefaultId, toPortId: `${switchDefaultId}-trigger` },
  ];

  return {
    patches, connections,
    displayStates: [{ id: dsActiveId, name: 'Active', layerOverrides: [] }],
  };
}

/** All available sugar presets */
export const SUGAR_PRESETS = [
  { id: 'hover-scale', name: 'Hover Scale', icon: '🖱️', description: 'Hover → 放大 + 透明度变化', create: createHoverScale },
  { id: 'tap-toggle', name: 'Tap Toggle', icon: '👆', description: 'Tap → 切换两个状态', create: createTapToggle },
  { id: 'press-release', name: 'Press & Release', icon: '✋', description: 'Tap → 按下缩小 → 自动恢复', create: createPressRelease },
  { id: 'drag-dismiss', name: 'Drag to Dismiss', icon: '👋', description: '拖拽 → 滑出屏幕', create: createDragToDismiss },
  { id: 'hover-color', name: 'Hover Color', icon: '🎨', description: 'Hover → 颜色变化', create: createHoverColor },
  { id: 'tap-navigate', name: 'Tap Navigate', icon: '➡️', description: 'Tap → 切换到指定状态', create: createTapNavigate },
  { id: 'auto-play', name: 'Auto Play', icon: '🔄', description: 'Timer → 自动循环切换状态', create: createAutoPlay },
] as const;
