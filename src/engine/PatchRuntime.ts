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
  animateProperty?: (elementId: string, property: string, toValue: any) => void;
  getVariableValue?: (variableId: string) => any;
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

    executeActionPatch(actionPatch, handlers, { _patches: patches, _connections: connections });
  }
}

/**
 * Execute a single action patch with the given handlers.
 * Shared helper used by both executeTrigger and port-specific execution.
 */
// Helper: evaluate a condition
function evaluateCondition(current: any, operator: string, expected: any): boolean {
  switch (operator) {
    case '==': return current == expected;
    case '!=': return current != expected;
    case '>': return current > expected;
    case '<': return current < expected;
    case '>=': return current >= expected;
    case '<=': return current <= expected;
    default: return false;
  }
}

export function executeActionPatch(
  actionPatch: Patch,
  handlers: PatchActionHandler,
  _context?: { delta?: { dx: number; dy: number }; _patches?: Patch[]; _connections?: PatchConnection[] },
  sourcePortId?: string,
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
    case 'animateProperty': {
      const elementId = actionPatch.config?.targetElementId;
      const property = actionPatch.config?.property;
      const toValue = actionPatch.config?.toValue;
      if (elementId && property && toValue !== undefined && handlers.animateProperty) {
        handlers.animateProperty(elementId, property, toValue);
      }
      break;
    }
    case 'delay': {
      const delayMs = actionPatch.config?.delay ?? 300;
      setTimeout(() => {
        // Fire all outgoing connections from this delay patch
        executeTrigger(actionPatch.id, _context?._patches || [], _context?._connections || [], handlers);
      }, delayMs);
      break;
    }
    case 'condition': {
      const varId = actionPatch.config?.variableId;
      const operator = actionPatch.config?.operator || '==';
      const expected = actionPatch.config?.value;
      if (varId !== undefined && expected !== undefined && _context?._patches && _context?._connections) {
        // Get current variable value from store via handler
        const currentVal = handlers.getVariableValue?.(varId);
        const result = evaluateCondition(currentVal, operator, expected);
        actionPatch.config = { ...actionPatch.config, _lastResult: result };
        // Only fire downstream if condition is true
        if (result) {
          executeTrigger(actionPatch.id, _context._patches, _context._connections, handlers);
        }
      }
      break;
    }
    case 'toggle': {
      const currentState = actionPatch.config?._toggleState ?? false;
      const newState = !currentState;
      actionPatch.config = { ...actionPatch.config, _toggleState: newState };
      // Fire downstream connections after toggle
      if (_context?._patches && _context?._connections) {
        executeTrigger(actionPatch.id, _context._patches, _context._connections, handlers);
      }
      break;
    }
    case 'counter': {
      const current = actionPatch.config?._count ?? 0;
      const step = actionPatch.config?.step ?? 1;
      const max = actionPatch.config?.max;
      const min = actionPatch.config?.min ?? 0;
      let next = current + step;
      if (max !== undefined && next > max) next = min; // wrap around
      actionPatch.config = { ...actionPatch.config, _count: next };
      // Fire downstream connections after count update
      if (_context?._patches && _context?._connections) {
        executeTrigger(actionPatch.id, _context._patches, _context._connections, handlers);
      }
      break;
    }
    case 'optionSwitch': {
      // Option Switch: N inputs → 1 selected output (mutual exclusion)
      // config.optionCount: number of options
      // Triggered port name tells us which option was selected (option0, option1, ...)
      const optionCount = actionPatch.config?.optionCount ?? 2;
      const triggerPortId = sourcePortId || '';
      // Find which option index triggered this
      let selectedIndex = -1;
      for (let i = 0; i < optionCount; i++) {
        const inputPort = actionPatch.inputs?.find((p: any) => p.name === `option${i}`);
        if (inputPort && triggerPortId === inputPort.id) {
          selectedIndex = i;
          break;
        }
      }
      if (selectedIndex === -1) {
        // Fallback: cycle through options
        const prev = actionPatch.config?._selectedIndex ?? -1;
        selectedIndex = (prev + 1) % optionCount;
      }
      actionPatch.config = { ...actionPatch.config, _selectedIndex: selectedIndex };
      // Fire only the selected output port
      if (_context?._patches && _context?._connections) {
        const selectedPortName = `selected${selectedIndex}`;
        const selectedPort = actionPatch.outputs?.find((p: any) => p.name === selectedPortName);
        if (selectedPort) {
          const downstreamConns = _context._connections.filter(
            (c: any) => c.fromPatchId === actionPatch.id && c.fromPortId === selectedPort.id
          );
          for (const conn of downstreamConns) {
            const targetPatch = _context._patches.find((p: any) => p.id === conn.toPatchId);
            if (targetPatch) {
              executeActionPatch(targetPatch, handlers, _context, conn.toPortId);
            }
          }
        }
      }
      break;
    }
    case 'dragBinding': {
      // Drag Binding: maps drag delta to element property in real-time
      // config: { targetElementId, property, axis, multiplier, min, max }
      const cfg = actionPatch.config || {};
      const dx = _context?.delta?.dx ?? 0;
      const dy = _context?.delta?.dy ?? 0;
      const axis = cfg.axis || 'y';
      const raw = axis === 'x' ? dx : dy;
      const multiplier = cfg.multiplier ?? 1;
      let value = raw * multiplier;
      if (cfg.min !== undefined) value = Math.max(cfg.min, value);
      if (cfg.max !== undefined) value = Math.min(cfg.max, value);
      const prop = cfg.property || 'y';
      const targetId = cfg.targetElementId;
      if (targetId && handlers.animateProperty) {
        handlers.animateProperty(targetId, prop, value);
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

  const portName = phase === 'in' ? 'onOver' : 'onOut';

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
      executeActionPatch(actionPatch, handlers, { _patches: patches, _connections: connections });
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
      executeActionPatch(actionPatch, handlers, { delta, _patches: patches, _connections: connections });
    }
  }
  return true;
}

// ─── Timer Trigger ────────────────────────────────────────────────────

/**
 * Find all timer-trigger patches.
 */
export function findTimerTriggers(patches: Patch[]): Patch[] {
  return patches.filter(p => p.type === 'timer');
}

/**
 * Handle a timer trigger firing.
 * Reads config.delay (ms) and schedules execution after that delay.
 * Returns a cleanup function to cancel pending timers.
 */
export function handleTimerTrigger(
  patchId: string,
  patches: Patch[],
  connections: PatchConnection[],
  handlers: PatchActionHandler,
): (() => void) | null {
  const timerPatch = patches.find(p => p.id === patchId && p.type === 'timer');
  if (!timerPatch) return null;

  const delay = timerPatch.config?.delay ?? 1000;

  const timerId = setTimeout(() => {
    executeTrigger(timerPatch.id, patches, connections, handlers);
  }, delay);

  return () => clearTimeout(timerId);
}

// ─── Variable Change Trigger ──────────────────────────────────────────

/**
 * Find all variableChange-trigger patches that watch a specific variable.
 */
export function findVariableChangeTriggers(
  variableId: string,
  patches: Patch[],
): Patch[] {
  return patches.filter(
    p => p.type === 'variableChange' && p.config?.variableId === variableId,
  );
}

/**
 * Handle a variable value change.
 * Finds matching variableChange-trigger patches and executes them.
 */
export function handleVariableChange(
  variableId: string,
  newValue: any,
  patches: Patch[],
  connections: PatchConnection[],
  handlers: PatchActionHandler,
): boolean {
  const triggers = findVariableChangeTriggers(variableId, patches);
  if (triggers.length === 0) return false;

  for (const trigger of triggers) {
    // Optional: check condition in config (e.g. config.expectedValue)
    const expected = trigger.config?.expectedValue;
    if (expected !== undefined && expected !== newValue) {
      continue; // condition not met, skip
    }
    executeTrigger(trigger.id, patches, connections, handlers);
  }
  return true;
}

// ─── Batch: start all timer triggers ──────────────────────────────────

/**
 * Start all timer-trigger patches. Returns a cleanup function
 * that cancels every pending timer.
 */
export function startAllTimerTriggers(
  patches: Patch[],
  connections: PatchConnection[],
  handlers: PatchActionHandler,
): () => void {
  const cleanups: (() => void)[] = [];
  const timerPatches = findTimerTriggers(patches);

  for (const tp of timerPatches) {
    const cleanup = handleTimerTrigger(tp.id, patches, connections, handlers);
    if (cleanup) cleanups.push(cleanup);
  }

  return () => cleanups.forEach(fn => fn());
}

// ─── Scroll Trigger ───────────────────────────────────────────────────

/**
 * Find all scroll-trigger patches (optionally targeting a specific element).
 */
export function findScrollTriggers(
  patches: Patch[],
  elementId?: string,
): Patch[] {
  return patches.filter(p => {
    if (p.type !== 'scroll') return false;
    if (elementId && p.config?.targetElementId) {
      return p.config.targetElementId === elementId;
    }
    return true; // global scroll trigger
  });
}

/**
 * Handle a scroll event. Fires matching scroll-trigger patches.
 */
export function handleScroll(
  patches: Patch[],
  connections: PatchConnection[],
  handlers: PatchActionHandler,
  elementId?: string,
): boolean {
  const triggers = findScrollTriggers(patches, elementId);
  if (triggers.length === 0) return false;

  for (const trigger of triggers) {
    executeTrigger(trigger.id, patches, connections, handlers);
  }
  return true;
}
