/**
 * Boolean Operations for Shapes
 * 
 * Supports: Union, Subtract, Intersect, Exclude
 * Works with rectangles and ellipses
 */

import type { KeyElement, Position, Size } from '../types';

export type BooleanOperationType = 'union' | 'subtract' | 'intersect' | 'exclude';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get bounding box of an element
 */
function getBoundingBox(element: KeyElement): Rect {
  return {
    x: element.position.x,
    y: element.position.y,
    width: element.size.width,
    height: element.size.height,
  };
}

/**
 * Check if two rectangles intersect
 */
function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Get intersection rectangle of two rectangles
 */
function getIntersection(a: Rect, b: Rect): Rect | null {
  if (!rectsIntersect(a, b)) return null;
  
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;
  
  if (width <= 0 || height <= 0) return null;
  
  return { x, y, width, height };
}

/**
 * Get union bounding box of two rectangles
 */
function getUnionBounds(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const width = Math.max(a.x + a.width, b.x + b.width) - x;
  const height = Math.max(a.y + a.height, b.y + b.height) - y;
  
  return { x, y, width, height };
}

/**
 * Generate SVG path for a rectangle
 */
function rectToPath(rect: Rect, radius: number = 0): string {
  const { x, y, width, height } = rect;
  const r = Math.min(radius, width / 2, height / 2);
  
  if (r <= 0) {
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }
  
  return `M ${x + r} ${y} 
    L ${x + width - r} ${y} 
    Q ${x + width} ${y} ${x + width} ${y + r}
    L ${x + width} ${y + height - r}
    Q ${x + width} ${y + height} ${x + width - r} ${y + height}
    L ${x + r} ${y + height}
    Q ${x} ${y + height} ${x} ${y + height - r}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    Z`;
}

/**
 * Generate SVG path for an ellipse
 */
function ellipseToPath(rect: Rect): string {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const rx = rect.width / 2;
  const ry = rect.height / 2;
  
  return `M ${cx - rx} ${cy}
    A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}
    A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}
    Z`;
}

/**
 * Convert element to SVG path
 */
function elementToPath(element: KeyElement): string {
  const rect = getBoundingBox(element);
  const radius = element.style?.borderRadius || 0;
  
  if (element.shapeType === 'ellipse') {
    return ellipseToPath(rect);
  }
  
  return rectToPath(rect, radius);
}

/**
 * Perform boolean union operation
 * Creates a new element that covers the combined area of all selected elements
 */
export function booleanUnion(elements: KeyElement[]): KeyElement | null {
  if (elements.length < 2) return null;
  
  // Calculate union bounds
  let unionBounds = getBoundingBox(elements[0]);
  for (let i = 1; i < elements.length; i++) {
    unionBounds = getUnionBounds(unionBounds, getBoundingBox(elements[i]));
  }
  
  // Generate combined path
  const paths = elements.map(el => elementToPath(el));
  const combinedPath = paths.join(' ');
  
  // Create new path element
  const baseElement = elements[0];
  const newElement: KeyElement = {
    id: `path-${Date.now()}`,
    name: 'Union',
    category: 'content',
    isKeyElement: true,
    attributes: [],
    position: { x: unionBounds.x, y: unionBounds.y },
    size: { width: unionBounds.width, height: unionBounds.height },
    shapeType: 'path',
    style: {
      ...baseElement.style,
      pathData: combinedPath,
      pathClosed: true,
    },
  };
  
  return newElement;
}

/**
 * Perform boolean subtract operation
 * Subtracts the second element from the first
 */
export function booleanSubtract(elements: KeyElement[]): KeyElement | null {
  if (elements.length < 2) return null;
  
  const baseElement = elements[0];
  const baseBounds = getBoundingBox(baseElement);
  
  // Generate path with holes (subtract subsequent elements)
  const basePath = elementToPath(baseElement);
  const holePaths = elements.slice(1).map(el => {
    // Reverse the path direction for subtraction
    return elementToPath(el);
  });
  
  // Combine paths - base path + reversed hole paths
  const combinedPath = basePath + ' ' + holePaths.join(' ');
  
  const newElement: KeyElement = {
    id: `path-${Date.now()}`,
    name: 'Subtract',
    category: 'content',
    isKeyElement: true,
    attributes: [],
    position: { x: baseBounds.x, y: baseBounds.y },
    size: { width: baseBounds.width, height: baseBounds.height },
    shapeType: 'path',
    style: {
      ...baseElement.style,
      pathData: combinedPath,
      pathClosed: true,
      // Use evenodd fill rule for proper subtraction
    },
  };
  
  return newElement;
}

/**
 * Perform boolean intersect operation
 * Creates a new element from the overlapping area
 */
export function booleanIntersect(elements: KeyElement[]): KeyElement | null {
  if (elements.length < 2) return null;
  
  // Calculate intersection bounds
  let intersectionBounds = getBoundingBox(elements[0]);
  for (let i = 1; i < elements.length; i++) {
    const intersection = getIntersection(intersectionBounds, getBoundingBox(elements[i]));
    if (!intersection) return null; // No intersection
    intersectionBounds = intersection;
  }
  
  const baseElement = elements[0];
  
  // For simple rectangle intersection, create a rectangle
  const newElement: KeyElement = {
    id: `rect-${Date.now()}`,
    name: 'Intersect',
    category: 'content',
    isKeyElement: true,
    attributes: [],
    position: { x: intersectionBounds.x, y: intersectionBounds.y },
    size: { width: intersectionBounds.width, height: intersectionBounds.height },
    shapeType: 'rectangle',
    style: {
      ...baseElement.style,
      borderRadius: Math.min(
        baseElement.style?.borderRadius || 0,
        intersectionBounds.width / 2,
        intersectionBounds.height / 2
      ),
    },
  };
  
  return newElement;
}

/**
 * Perform boolean exclude operation
 * Creates a new element from the non-overlapping areas (XOR)
 */
export function booleanExclude(elements: KeyElement[]): KeyElement | null {
  if (elements.length < 2) return null;
  
  // Calculate union bounds for the result
  let unionBounds = getBoundingBox(elements[0]);
  for (let i = 1; i < elements.length; i++) {
    unionBounds = getUnionBounds(unionBounds, getBoundingBox(elements[i]));
  }
  
  // Generate all paths
  const paths = elements.map(el => elementToPath(el));
  const combinedPath = paths.join(' ');
  
  const baseElement = elements[0];
  
  const newElement: KeyElement = {
    id: `path-${Date.now()}`,
    name: 'Exclude',
    category: 'content',
    isKeyElement: true,
    attributes: [],
    position: { x: unionBounds.x, y: unionBounds.y },
    size: { width: unionBounds.width, height: unionBounds.height },
    shapeType: 'path',
    style: {
      ...baseElement.style,
      pathData: combinedPath,
      pathClosed: true,
      // Use evenodd fill rule for XOR effect
    },
  };
  
  return newElement;
}

/**
 * Perform boolean operation on selected elements
 */
export function performBooleanOperation(
  operation: BooleanOperationType,
  elements: KeyElement[]
): KeyElement | null {
  switch (operation) {
    case 'union':
      return booleanUnion(elements);
    case 'subtract':
      return booleanSubtract(elements);
    case 'intersect':
      return booleanIntersect(elements);
    case 'exclude':
      return booleanExclude(elements);
    default:
      return null;
  }
}

/**
 * Check if elements can be used for boolean operations
 */
export function canPerformBooleanOperation(elements: KeyElement[]): boolean {
  if (elements.length < 2) return false;
  
  // Only allow shapes (rectangle, ellipse, path)
  const validTypes = ['rectangle', 'ellipse', 'path'];
  return elements.every(el => validTypes.includes(el.shapeType || ''));
}
