interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  side: 'left' | 'right';
  label?: string;
}

export function CollapseToggle({ collapsed, onToggle, side, label }: CollapseToggleProps) {
  const arrow = side === 'left'
    ? (collapsed ? '▶' : '◀')
    : (collapsed ? '◀' : '▶');

  return (
    <button
      onClick={onToggle}
      title={collapsed ? `展开${label || '面板'}` : `折叠${label || '面板'}`}
      style={{
        position: 'absolute',
        top: '50%',
        [side === 'left' ? 'right' : 'left']: -14,
        transform: 'translateY(-50%)',
        width: 14,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-elevated, #18181b)',
        border: '1px solid var(--border-default, rgba(255,255,255,0.1))',
        borderRadius: side === 'left' ? '0 4px 4px 0' : '4px 0 0 4px',
        color: 'var(--text-tertiary, #71717a)',
        fontSize: 8,
        cursor: 'pointer',
        zIndex: 20,
        padding: 0,
        transition: 'color 150ms ease, background 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-primary, #fafafa)';
        e.currentTarget.style.background = 'var(--bg-active, #27272b)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-tertiary, #71717a)';
        e.currentTarget.style.background = 'var(--bg-elevated, #18181b)';
      }}
    >
      {arrow}
    </button>
  );
}
