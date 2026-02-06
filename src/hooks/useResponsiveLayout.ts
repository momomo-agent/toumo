import { useState, useEffect } from 'react';

const BREAKPOINT_SM = 768;
const BREAKPOINT_MD = 1024;

export function useResponsiveLayout() {
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isSmall: windowWidth < BREAKPOINT_SM,
    isMedium: windowWidth < BREAKPOINT_MD,
    windowWidth,
  };
}
