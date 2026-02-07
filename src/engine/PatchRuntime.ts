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

    switch (actionPatch.type) {
      case 'switchDisplayState': {
        const targetId = actionPatch.config?.targetDisplayStateId;
        if (targetId) {
          handlers.switchDisplayState(targetId);
        }
        break;
      }
      // Future: setVariable, animateProperty, etc.
      default:
        break;
    }
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
