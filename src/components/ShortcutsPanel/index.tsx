import { useState, useEffect } from 'react';

type ShortcutGroup = {
  title: string;
  shortcuts: { key: string; desc: string }[];
};

const shortcutGroups: ShortcutGroup[] = [
  {
    title: '工具',
    shortcuts: [
      { key: 'V', desc: '选择工具' },
      { key: 'R', desc: '矩形工具' },
      { key: 'O', desc: '圆形工具' },
      { key: 'T', desc: '文字工具' },
      { key: 'L', desc: '线条工具' },
      { key: 'I', desc: '图片工具' },
      { key: 'F', desc: '画框工具' },
      { key: 'H', desc: '抓手工具' },
      { key: 'E', desc: '取色器' },
    ],
  },
  {
    title: '编辑',
    shortcuts: [
      { key: '⌘C', desc: '复制' },
      { key: '⌘V', desc: '粘贴' },
      { key: '⌘D', desc: '复制元素' },
      { key: '⌘A', desc: '全选' },
      { key: '⌘Z', desc: '撤销' },
      { key: '⇧⌘Z', desc: '重做' },
      { key: 'Del', desc: '删除' },
    ],
  },
  {
    title: '排列',
    shortcuts: [
      { key: '⌘G', desc: '编组' },
      { key: '⇧⌘G', desc: '取消编组' },
      { key: '⌘]', desc: '上移一层' },
      { key: '⌘[', desc: '下移一层' },
      { key: '⌥H', desc: '水平居中' },
      { key: '⌥V', desc: '垂直居中' },
    ],
  },
  {
    title: '视图',
    shortcuts: [
      { key: '⌘0', desc: '重置缩放' },
      { key: '⌘+', desc: '放大' },
      { key: '⌘-', desc: '缩小' },
      { key: 'Space', desc: '临时抓手' },
    ],
  },
  {
    title: '移动',
    shortcuts: [
      { key: '↑↓←→', desc: '移动 1px' },
      { key: '⇧+方向', desc: '移动 10px' },
    ],
  },
  {
    title: '样式',
    shortcuts: [
      { key: '1-9', desc: '透明度 10-90%' },
      { key: '0', desc: '透明度 100%' },
      { key: '⌥⌘C', desc: '复制样式' },
      { key: '⌥⌘V', desc: '粘贴样式' },
    ],
  },
  {
    title: '文件',
    shortcuts: [
      { key: '⌘S', desc: '保存项目' },
      { key: '⌘E', desc: '导出 PNG' },
    ],
  },
];

export function ShortcutsPanel() {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);

  // ? key toggles shortcuts panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === '?') setOpen(prev => !prev);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 40,
          right: 16,
          padding: '8px 14px',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: 8,
          color: '#888',
          fontSize: 12,
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          // folme
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#444';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#333';
          e.currentTarget.style.color = '#888';
        }}
      >
        <span style={{ fontSize: 14 }}>⌨</span>
        快捷键
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 40,
        right: 16,
        width: 320,
        maxHeight: 480,
        background: '#141414',
        border: '1px solid #2a2a2a',
        borderRadius: 16,
        zIndex: 100,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          borderBottom: '1px solid #222',
        }}
      >
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
          ⌨ 快捷键
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{
            width: 24,
            height: 24,
            background: '#1f1f1f',
            border: '1px solid #333',
            borderRadius: 6,
            color: '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            // folme
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#444';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.color = '#666';
          }}
        >
          ×
        </button>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '8px 12px',
          overflowX: 'auto',
          borderBottom: '1px solid #1f1f1f',
        }}
      >
        {shortcutGroups.map((group, index) => (
          <button
            key={group.title}
            onClick={() => setActiveGroup(index)}
            style={{
              padding: '6px 10px',
              background: activeGroup === index ? '#2563eb20' : 'transparent',
              border: activeGroup === index ? '1px solid #2563eb40' : '1px solid transparent',
              borderRadius: 6,
              color: activeGroup === index ? '#3b82f6' : '#666',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              // folme
            }}
          >
            {group.title}
          </button>
        ))}
      </div>

      {/* Shortcuts list */}
      <div
        style={{
          padding: '12px 16px',
          maxHeight: 320,
          overflowY: 'auto',
        }}
      >
        {shortcutGroups[activeGroup].shortcuts.map((s) => (
          <div
            key={s.key + s.desc}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #1a1a1a',
            }}
          >
            <span style={{ color: '#999', fontSize: 12 }}>{s.desc}</span>
            <kbd
              style={{
                padding: '4px 8px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                color: '#fff',
                fontSize: 11,
                fontFamily: 'SF Mono, Monaco, monospace',
                minWidth: 28,
                textAlign: 'center',
              }}
            >
              {s.key}
            </kbd>
          </div>
        ))}
      </div>

      {/* Footer tip */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #1f1f1f',
          background: '#0d0d0d',
        }}
      >
        <p style={{ margin: 0, fontSize: 11, color: '#555', textAlign: 'center' }}>
          按住 Space 可临时切换到抓手工具
        </p>
      </div>
    </div>
  );
}
