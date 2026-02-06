import { useEffect, useState } from 'react';

const SHORTCUT_SECTIONS = [
  {
    title: '工具',
    shortcuts: [
      { keys: ['V'], desc: '选择工具' },
      { keys: ['R'], desc: '矩形工具' },
      { keys: ['O'], desc: '椭圆工具' },
      { keys: ['T'], desc: '文字工具' },
      { keys: ['H'], desc: '手型工具' },
      { keys: ['E'], desc: '取色器' },
      { keys: ['P'], desc: '钢笔工具' },
      { keys: ['L'], desc: '线条工具' },
      { keys: ['F'], desc: '画板工具' },
      { keys: ['I'], desc: '插入图片' },
    ],
  },
  {
    title: '编辑',
    shortcuts: [
      { keys: ['⌘', 'C'], desc: '复制' },
      { keys: ['⌘', 'X'], desc: '剪切' },
      { keys: ['⌘', 'V'], desc: '粘贴' },
      { keys: ['⌘', 'D'], desc: '复制元素' },
      { keys: ['⌘', 'A'], desc: '全选' },
      { keys: ['⌘', 'Z'], desc: '撤销' },
      { keys: ['⌘', '⇧', 'Z'], desc: '重做' },
      { keys: ['Delete'], desc: '删除' },
      { keys: ['Esc'], desc: '取消选择' },
    ],
  },
  {
    title: '样式',
    shortcuts: [
      { keys: ['⌥', '⌘', 'C'], desc: '复制样式' },
      { keys: ['⌥', '⌘', 'V'], desc: '粘贴样式' },
      { keys: ['1-9'], desc: '设置不透明度 10%-90%' },
      { keys: ['0'], desc: '不透明度 100%' },
    ],
  },
  {
    title: '图层',
    shortcuts: [
      { keys: ['⌘', 'G'], desc: '编组' },
      { keys: ['⌘', '⇧', 'G'], desc: '取消编组' },
      { keys: ['⌘', ']'], desc: '上移一层' },
      { keys: ['⌘', '['], desc: '下移一层' },
      { keys: ['⇧', 'H'], desc: '显示/隐藏' },
      { keys: ['⇧', 'L'], desc: '锁定/解锁' },
    ],
  },
  {
    title: '视图',
    shortcuts: [
      { keys: ['⌘', 'E'], desc: '导出 PNG' },
      { keys: ['⌘', 'S'], desc: '保存项目' },
      { keys: ['Tab'], desc: '工具栏导航' },
      { keys: ['?'], desc: '快捷键面板' },
    ],
  },
];

export function ShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isTyping) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          background: '#1a1a1b',
          border: '1px solid #333',
          borderRadius: 16,
          padding: 24,
          maxWidth: 640,
          width: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, color: '#fff' }}>
            ⌨️ 快捷键
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#888',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Esc
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {SHORTCUT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 style={{
                fontSize: 11,
                textTransform: 'uppercase',
                color: '#666',
                letterSpacing: '0.5px',
                marginBottom: 8,
                marginTop: 0,
              }}>
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {section.shortcuts.map((s) => (
                  <div
                    key={s.desc}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#ccc' }}>{s.desc}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {s.keys.map((k, i) => (
                        <kbd
                          key={i}
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            background: '#0d0d0e',
                            border: '1px solid #333',
                            borderRadius: 4,
                            fontSize: 11,
                            color: '#aaa',
                            fontFamily: 'inherit',
                            minWidth: 20,
                            textAlign: 'center',
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid #2a2a2a',
          textAlign: 'center',
          fontSize: 11,
          color: '#555',
        }}>
          按 <kbd style={{
            padding: '1px 5px',
            background: '#0d0d0e',
            border: '1px solid #333',
            borderRadius: 3,
            fontSize: 11,
            color: '#888',
          }}>?</kbd> 关闭
        </div>
      </div>
    </div>
  );
}
