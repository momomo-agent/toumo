// Toumo Design System - 统一的颜色和样式

export const colors = {
  // 背景色
  bg: {
    primary: '#0d0d0d',
    secondary: '#111111',
    tertiary: '#151515',
    elevated: '#1a1a1a',
    hover: '#1f1f1f',
  },
  // 边框色
  border: {
    subtle: '#1f1f1f',
    default: '#2a2a2a',
    strong: '#333333',
    focus: '#3b82f6',
  },
  // 文字色
  text: {
    primary: '#ffffff',
    secondary: '#e5e5e5',
    tertiary: '#888888',
    muted: '#666666',
    disabled: '#444444',
  },
  // 主题色
  accent: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
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
  sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
  md: '0 4px 16px rgba(0, 0, 0, 0.3)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.4)',
  xl: '0 20px 60px rgba(0, 0, 0, 0.5)',
};

// 通用按钮样式
export const buttonStyles = {
  base: {
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  } as React.CSSProperties,
  
  primary: {
    background: `linear-gradient(135deg, ${colors.accent.primary} 0%, ${colors.accent.primaryHover} 100%)`,
    color: colors.text.primary,
    boxShadow: `0 4px 12px rgba(59, 130, 246, 0.3)`,
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
    background: `${colors.accent.danger}20`,
    border: `1px solid ${colors.accent.danger}`,
    color: colors.accent.danger,
  } as React.CSSProperties,
};

// 输入框样式
export const inputStyles = {
  base: {
    width: '100%',
    padding: `${spacing.sm}px ${spacing.md}px`,
    background: colors.bg.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: radius.md,
    color: colors.text.secondary,
    fontSize: 12,
    transition: 'border-color 0.15s ease',
    outline: 'none',
  } as React.CSSProperties,
};
