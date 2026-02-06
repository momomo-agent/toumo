import type { KeyElement, Size, Position } from '../types';
import { DEFAULT_CONSTRAINTS } from '../types';

/**
 * Apply constraints to a child element when its parent resizes.
 * This implements Figma-style constraints behavior.
 */
export function applyConstraints(
  child: KeyElement,
  oldParentSize: Size,
  newParentSize: Size
): { position: Position; size: Size } {
  const constraints = child.constraints || DEFAULT_CONSTRAINTS;
  const { horizontal, vertical } = constraints;

  // Original values
  let newX = child.position.x;
  let newY = child.position.y;
  let newWidth = child.size.width;
  let newHeight = child.size.height;

  // Original distances from edges
  const leftDist = child.position.x;
  const rightDist = oldParentSize.width - (child.position.x + child.size.width);
  const topDist = child.position.y;
  const bottomDist = oldParentSize.height - (child.position.y + child.size.height);

  // Apply horizontal constraint
  switch (horizontal) {
    case 'left':
      // Keep left distance fixed, position stays the same
      break;
    case 'right':
      // Keep right distance fixed
      newX = newParentSize.width - rightDist - child.size.width;
      break;
    case 'left-right':
      // Keep both distances fixed, stretch width
      newWidth = newParentSize.width - leftDist - rightDist;
      break;
    case 'center':
      // Keep centered horizontally
      const oldCenterX = child.position.x + child.size.width / 2;
      const oldCenterRatio = oldCenterX / oldParentSize.width;
      const newCenterX = oldCenterRatio * newParentSize.width;
      newX = newCenterX - child.size.width / 2;
      break;
    case 'scale':
      // Scale position and size proportionally
      const xRatio = child.position.x / oldParentSize.width;
      const widthRatio = child.size.width / oldParentSize.width;
      newX = xRatio * newParentSize.width;
      newWidth = widthRatio * newParentSize.width;
      break;
  }

  // Apply vertical constraint
  switch (vertical) {
    case 'top':
      // Keep top distance fixed, position stays the same
      break;
    case 'bottom':
      // Keep bottom distance fixed
      newY = newParentSize.height - bottomDist - child.size.height;
      break;
    case 'top-bottom':
      // Keep both distances fixed, stretch height
      newHeight = newParentSize.height - topDist - bottomDist;
      break;
    case 'center':
      // Keep centered vertically
      const oldCenterY = child.position.y + child.size.height / 2;
      const oldCenterRatioY = oldCenterY / oldParentSize.height;
      const newCenterY = oldCenterRatioY * newParentSize.height;
      newY = newCenterY - child.size.height / 2;
      break;
    case 'scale':
      // Scale position and size proportionally
      const yRatio = child.position.y / oldParentSize.height;
      const heightRatio = child.size.height / oldParentSize.height;
      newY = yRatio * newParentSize.height;
      newHeight = heightRatio * newParentSize.height;
      break;
  }

  // Ensure minimum size
  newWidth = Math.max(1, newWidth);
  newHeight = Math.max(1, newHeight);

  return {
    position: { x: newX, y: newY },
    size: { width: newWidth, height: newHeight },
  };
}

/**
 * Apply constraints to all children of a parent element.
 */
export function applyConstraintsToChildren(
  children: KeyElement[],
  oldParentSize: Size,
  newParentSize: Size
): KeyElement[] {
  return children.map(child => {
    const { position, size } = applyConstraints(child, oldParentSize, newParentSize);
    return {
      ...child,
      position,
      size,
    };
  });
}
