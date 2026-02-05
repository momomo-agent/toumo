// Figma/Linear 风格的 SVG 图标
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const EyeIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M8 3C4.5 3 1.73 5.11 1 8c.73 2.89 3.5 5 7 5s6.27-2.11 7-5c-.73-2.89-3.5-5-7-5z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.5"/>
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M6.59 6.59a2 2 0 0 0 2.82 2.82M9.88 9.88A3.5 3.5 0 0 1 8 10.5c-2.5 0-4.5-2-5-3.5.28-.84.8-1.6 1.47-2.22M14 8c-.5 1.5-2.5 3.5-5 3.5M2 2l12 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke={color} strokeWidth="1.5"/>
    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const UnlockIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke={color} strokeWidth="1.5"/>
    <path d="M5 7V5a3 3 0 0 1 5.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const LayersIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M8 2L2 5l6 3 6-3-6-3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M2 8l6 3 6-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 11l6 3 6-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RectangleIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <rect x="2" y="3" width="12" height="10" rx="2" stroke={color} strokeWidth="1.5"/>
  </svg>
);

export const CircleIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="5.5" stroke={color} strokeWidth="1.5"/>
  </svg>
);

export const TextIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M3 4h10M8 4v9M5.5 13h5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M8 3v10M3 8h10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M12 4v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M4 6l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M6 4l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DragHandleIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="5" cy="4" r="1" fill={color}/>
    <circle cx="11" cy="4" r="1" fill={color}/>
    <circle cx="5" cy="8" r="1" fill={color}/>
    <circle cx="11" cy="8" r="1" fill={color}/>
    <circle cx="5" cy="12" r="1" fill={color}/>
    <circle cx="11" cy="12" r="1" fill={color}/>
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M4 3v10l9-5-9-5z" fill={color}/>
  </svg>
);

export const KeyframeIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.5"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const CursorIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M3 2l10 7.5-4.5.5-.5 4.5L3 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

export const HandIcon: React.FC<IconProps> = ({ size = 16, className, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M8 2v7M5 4v5M11 4v5M3 7v4a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
