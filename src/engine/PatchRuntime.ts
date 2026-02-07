/**
 * PatchRuntime - Basic Patch execution engine
 *
 * Receives patches + connections, and when a trigger fires,
 * follows connections to find action patches and executes them.
 *
 * v1: Only supports tap trigger + switchDisplayState action.
 */
import type { Patch, PatchConnection } from '../types';

export type PatchActionHandler = {
  switchDisplayState: (targetDisplayStateId: string) => void;
  setVariable?: (variableId: string, value: any) => void;
};

/**
 * Given a trigger patch that just fired, walk all outgoing connections
 * to find action patches and execute them.
 */
export function executeTrigger(
  triggerPatchId: string,
  patches: Patch[],
  connections: PatchConnection[],
  handlers: PatchActionHandler,
): void {
  // Find all connections originating from this trigger patch
  const outgoing = connections.filter(c => c.fromPatchId === triggerPatchId);

  for (const conn of outgoing) {
    const actionPatch = patches.find(p => p.id === conn.toPatchId);
    if (!actionPatch) continue;

    executeActionPatch(actionPatch, handlers);
  }
}

/**
 * Execute a single action patch with the given handlers.
 * Shared helper used by both executeTrigger and port-specific execution.
 */
export function executeActionPatch(
  actionPatch: Patch,
  handlers: PatchActionHandler,
): void {
  switch (actionPatch.type) {
    case 'switchDisplayState': {
      const targetId = actionPatch.config?.targetDisplayStateId;
      if (targetId) {
        handlers.switchDisplayState(targetId);
      }
      break;
    }
    case 'setVariable': {
      const varId = actionPatch.config?.variableId;
      const value = actionPatch.config?.value;
      if (varId !== undefined && value !== undefined && handlers.setVariable) {
        handlers.setVariable(varId, value);
      }
      break;
    }
    default:
      break;
  }
}

/**
 * Find all tap-trigger patches that target a specific element.
 */
export function findTapTriggersForElement(
  elementId: string,
  patches: Patch[],
): Patch[] {
  return patches.filter(
    p => p.type === 'tap' && p.config?.targetElementId === elementId,
  );
}

/**
 * Convenience: handle a tap on an element.
 * Finds matching tap-trigger patches, then executes each one.
 */
export function handleElementTap(
  elementId: string,
  patches: Patch[],
  connections: PatchConnection[],
  handlers: PatchActionHandler,
): boolean {
  const triggers = findTapTriggersForElement(elementId, patches);
  if (triggers.length === 0) return false;

  for (const trigger of triggers) {
    executeTrigger(trigger.id, patches, connections, handlers);
  }
  return true; // at least one trigger was found
}

// ─── Hover Trigger ────────────────────────────────────────────────────

/**
 * Find all hover-trigger patches that target a specific element.
 */
export function findHoverTriggersForElement(
  elementId: string,
  patches: Patch[],
): Patch[] {
  return patches.filter(
    p => p.type === 'hover' && p.config?.targetElementId === elementId,
  );
}

/**
 * Handle hover on an element (hoverIn or hoverOut).
 * Finds matching hover-trigger patches, then executes via the
 * appropriate output port (onHoverIn / onHoverOut).
 */
export function handleElementHover(
  elementId: string,
  phase: 'in' | 'out',
  patches: Patch[],
  connections: PatchConnection[],
  handlers: PatchActionHandler,
): boolean {
  const triggers = findHoverTriggersForElement(elementId, patches);
  if (triggers.length === 0) return false;

  const portName = phase === 'in' ? 'onHoverIn' : 'onHoverOut';

  for (const trigger of triggers) {
    // Only follow connections from the matching output port
    const matchingPort = trigger.outputs.find(o => o.name === portName);
    if (!matchingPort) {
      // Fallback: if no specific port, execute all connections (simple mode)
      executeTrigger(trigger.id, patches, connections, handlers);
      continue;
    }
    const outgoing = connections.filter(
      c => c.fromPatchId === trigger.id && c.fromPortId === matchingPort.id,
    );
    for (const conn of outgoing) {
      const actionPatch = patches.find(p => p.id === conn.toPatchId);
      if (!actionPatch) continue;
      executeActionPatch(actionPatch, handlers);
    }
  }
  return true;
}

// ─── Drag Trigger ─────────────────────────────────────────────────────

export type DragPhase = 'start' | 'move' | 'end';
export type DragDelta = { dx: number; dy: number };

/**
 * Find all drag-trigger patches that target a specific element.
 */
export function findDragTriggersForElement(
  elementId: string,
  patches: Patch[],
): Patch[] {
  return patches.filter(
    p => p.type === 'drag' && p.config?.targetElementId === elementId,
  );
}

/**
 * Handle drag on an element (start / move / end).
 * Routes to the matching output port: onDragStart / onDragMove / onDragEnd.
 */
export function handleElementDrag(
  elementId: string,
  phase: DragPhase,
  delta: DragDelta,
  patches: Patch[],
  connections: PatchConnection[],
  handlers: PatchActionHandler,
): boolean {
  const triggers = findDragTriggersForElement(elementId, patches);
  if (triggers.length === 0) return false;

  const portNameMap: Record<DragPhase, string> = {
    start: 'onDragStart',
    move: 'onDragMove',
    end: 'onDragEnd',
  };
  const portName = portNameMap[phase];

  for (const trigger of triggers) {
    const matchingPort = trigger.outputs.find(o => o.name === portName);
    if (!matchingPort) {
      // Fallback: execute all connections on any phase
      if (phase === 'end') {
        executeTrigger(trigger.id, patches, connections, handlers);
      }
      continue;
    }
    const outgoing = connections.filter(
      c => c.fromPatchId === trigger.id && c.fromPortId === matchingPort.id,
    );
    for (const conn of outgoing) {
      const actionPatch = patches.find(p => p.id === conn.toPatchId);
      if (!actionPatch) continue;
      executeActionPatch(actionPatch, handlers, { delta });
    }
  }
  return true;
}
