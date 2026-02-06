import { useState, useRef, useEffect, type ReactNode } from 'react';
import './Tooltip.css';

interface TooltipProps {
  children: ReactNode;
  label: string;
  shortcut?: string;
}

export function Tooltip({ children, label, shortcut }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      setVisible(true);
    }, 400);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {visible && (
        <div className="tooltip">
          <span className="tooltip-label">{label}</span>
          {shortcut && (
            <span className="tooltip-shortcut">{shortcut}</span>
          )}
        </div>
      )}
    </div>
  );
}
