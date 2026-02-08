/**
 * useFolmeSVG — 用 folme 驱动 SVG 元素属性动画
 * 直接操作 DOM，不触发 React re-render
 */
import { useRef, useCallback, useEffect } from 'react';
import { FolmeManager } from '../engine/folme/FolmeManager';
import { Spring } from '../engine/folme/forces/Spring';

export function useFolmeSVG() {
  const managersRef = useRef<Map<string, FolmeManager>>(new Map());

  const getManager = useCallback((id: string, el: SVGElement | null) => {
    if (!el) return null;
    let mgr = managersRef.current.get(id);
    if (!mgr) {
      mgr = new FolmeManager((values) => {
        // 直接写 DOM 属性
        for (const [key, val] of Object.entries(values)) {
          if (key === 'opacity' || key === 'strokeWidth') {
            el.style.setProperty(
              key === 'strokeWidth' ? 'stroke-width' : key,
              String(val),
            );
          } else if (key === 'scale') {
            const cx = el.getAttribute('data-cx') || '0';
            const cy = el.getAttribute('data-cy') || '0';
            el.style.transform = `translate(${cx}px, ${cy}px) scale(${val}) translate(-${cx}px, -${cy}px)`;
          } else if (key.startsWith('r_') || key.startsWith('g_') || key.startsWith('b_')) {
            // 颜色通道 — 由调用方组合
          } else {
            el.setAttribute(key, String(val));
          }
        }
      });
      managersRef.current.set(id, mgr);
    }
    return mgr;
  }, []);

  const animateTo = useCallback((
    id: string,
    el: SVGElement | null,
    props: Record<string, number>,
    spring?: { damping?: number; response?: number },
  ) => {
    const mgr = getManager(id, el);
    if (!mgr) return;
    const s = new Spring(spring?.damping ?? 0.85, spring?.response ?? 0.25);
    mgr.to(props, s);
  }, [getManager]);

  const setTo = useCallback((
    id: string,
    el: SVGElement | null,
    props: Record<string, number>,
  ) => {
    const mgr = getManager(id, el);
    if (!mgr) return;
    mgr.setTo(props);
  }, [getManager]);

  useEffect(() => {
    return () => {
      for (const mgr of managersRef.current.values()) {
        mgr.destroy();
      }
      managersRef.current.clear();
    };
  }, []);

  return { animateTo, setTo };
}
