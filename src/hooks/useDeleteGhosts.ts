import { useEffect, useRef, useState } from 'react';
import type { KeyElement } from '../types';

interface GhostElement {
  element: KeyElement;
  timestamp: number;
}

const FADE_DURATION = 200;

/**
 * Tracks elements that were removed between renders and keeps
 * "ghost" copies so the Canvas can play a fade-out animation
 * before they disappear from the DOM.
 */
export function useDeleteGhosts(currentElements: KeyElement[]) {
  const prevRef = useRef<KeyElement[]>(currentElements);
  const [ghosts, setGhosts] = useState<GhostElement[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = currentElements;

    const currentIds = new Set(currentElements.map((e) => e.id));
    const removed = prev.filter((e) => !currentIds.has(e.id));

    if (removed.length === 0) return;

    const now = Date.now();
    const newGhosts = removed.map((element) => ({ element, timestamp: now }));

    setGhosts((g) => [...g, ...newGhosts]);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      setGhosts((g) => g.filter((ghost) => ghost.timestamp !== now));
    }, FADE_DURATION + 50);

    return () => clearTimeout(timer);
  }, [currentElements]);

  return { ghosts, fadeDuration: FADE_DURATION };
}
