import { useState, useRef, useCallback } from 'react';
import { getEasing } from '../utils/easing';
import { interpolate } from '../utils/animation';

interface AnimationState {
  isAnimating: boolean;
  progress: number;
}

export function useAnimation() {
  const [state, setState] = useState<AnimationState>({
    isAnimating: false,
    progress: 0,
  });
  const animationRef = useRef<number>();

  const animate = useCallback((
    duration: number,
    easing: string,
    onUpdate: (progress: number) => void,
    onComplete?: () => void
  ) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const easingFn = getEasing(easing);
    const startTime = performance.now();
    setState({ isAnimating: true, progress: 0 });

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(rawProgress);

      setState({ isAnimating: rawProgress < 1, progress: easedProgress });
      onUpdate(easedProgress);

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      setState({ isAnimating: false, progress: 0 });
    }
  }, []);

  return { ...state, animate, stop };
}
