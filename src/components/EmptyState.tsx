import { useEditorStore } from '../store';

export function EmptyState() {
  const { setCurrentTool } = useEditorStore();

  const quickActions = [
    { icon: '▢', label: '矩形', tool: 'rectangle' as const, key: 'R' },
    { icon: '○', label: '圆形', tool: 'ellipse' as const, key: 'O' },
    { icon: 'T', label: '文字', tool: 'text' as const, key: 'T' },
    { icon: '—', label: '线条', tool: 'line' as const, key: 'L' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #1f1f1f 0%, #141414 100%)',
            borderRadius: 20,
            border: '2px dashed #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            color: '#444',
          }}
        >
          +
        </div>
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 600,
            color: '#666',
          }}
        >
          画布是空的
        </h3>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: 13,
            color: '#555',
          }}
        >
          选择一个工具开始创建
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {quickActions.map((action) => (
            <button
              key={action.tool}
              onClick={() => setCurrentTool(action.tool)}
              style={{
                width: 64,
                height: 64,
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = '#1f1f1f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a2a';
                e.currentTarget.style.background = '#1a1a1a';
              }}
            >
              <span style={{ fontSize: 20, color: '#888' }}>{action.icon}</span>
              <span style={{ fontSize: 10, color: '#666' }}>{action.label}</span>
              <span
                style={{
                  fontSize: 9,
                  color: '#444',
                  fontFamily: 'monospace',
                }}
              >
                {action.key}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
