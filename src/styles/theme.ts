// Toumo Design System - 统一的颜色和样式

export const colors = {
  bg: {
    base: '#09090b',
    surface: '#111113',
    elevated: '#18181b',
    hover: '#1f1f23',
    active: '#27272b',
  },
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.10)',
    strong: 'rgba(255,255,255,0.16)',
  },
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    tertiary: '#71717a',
    muted: '#52525b',
  },
  accent: {
    primary: '#6366f1',
    hover: '#818cf8',
    pressed: '#4f46e5',
    subtle: 'rgba(99,102,241,0.12)',
    muted: 'rgba(99,102,241,0.20)',
  },
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
};

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  full: 9999,
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(99, 102, 241, 0.15)',
};

// 通用按钮样式
export const buttonStyles = {
  base: {
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 100ms ease-out',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  } as React.CSSProperties,
  
  primary: {
    background: colors.accent.primary,
    color: colors.text.primary,
  } as React.CSSProperties,
  
  secondary: {
    background: colors.bg.elevated,
    border: `1px solid ${colors.border.default}`,
    color: colors.text.secondary,
  } as React.CSSProperties,
  
  ghost: {
    background: 'transparent',
    border: `1px solid ${colors.border.default}`,
    color: colors.text.tertiary,
  } as React.CSSProperties,
  
  danger: {
    background: `${colors.semantic.error}20`,
    border: `1px solid ${colors.semantic.error}`,
    color: colors.semantic.error,
  } as React.CSSProperties,
};

// 输入框样式
export const inputStyles = {
  base: {
    width: '100%',
    padding: `${spacing.sm}px ${spacing.md}px`,
    background: colors.bg.base,
    border: `1px solid ${colors.border.default}`,
    borderRadius: radius.md,
    color: colors.text.primary,
    fontSize: 12,
    transition: 'border-color 100ms ease-out',
    outline: 'none',
  } as React.CSSProperties,
};
