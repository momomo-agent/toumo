import { useState, useCallback, useRef, useEffect } from 'react';

export interface ResizablePanelOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  /** localStorage key for persisting width */
  storageKey?: string;
  /** Side the resize handle is on */
  side: 'left' | 'right';
}

export function useResizablePanel(options: ResizablePanelOptions) {
  const { defaultWidth, minWidth, maxWidth, storageKey, side } = options;

  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (parsed >= minWidth && parsed <= maxWidth) return parsed;
      }
    }
    return defaultWidth;
  });

  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth =
        side === 'right'
          ? startWidthRef.current - delta
          : startWidthRef.current + delta;
      const clamped = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (storageKey) {
        localStorage.setItem(storageKey, String(width));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, minWidth, maxWidth, side, storageKey, width]);

  // Save width when it changes during drag
  useEffect(() => {
    if (isDragging && storageKey) {
      localStorage.setItem(storageKey, String(width));
    }
  }, [width, isDragging, storageKey]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return {
    width: collapsed ? 0 : width,
    collapsed,
    isDragging,
    toggleCollapse,
    handleMouseDown,
    setCollapsed,
  };
}
