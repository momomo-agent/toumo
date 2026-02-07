import { useEditorStore } from '../store';

const S = {
  panel: {
    display: 'flex', flexDirection: 'column' as const, gap: 2,
    padding: '8px 0',
    maxHeight: 200, overflowY: 'auto' as const,
  },
  item: (active: boolean, future: boolean) => ({
    padding: '4px 12px', fontSize: 11, cursor: 'pointer',
    background: active ? '#2563eb22' : 'transparent',
    color: future ? '#555' : active ? '#60a5fa' : '#aaa',
    borderLeft: active ? '2px solid #2563eb' : '2px solid transparent',
    textDecoration: future ? 'line-through' : 'none',
    whiteSpace: 'nowrap' as const, overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  header: {
    padding: '6px 12px', fontSize: 11, color: '#666',
    borderBottom: '1px solid #1f1f1f',
    display: 'flex', justifyContent: 'space-between',
  },
};

export function HistoryPanel() {
  const history = useEditorStore(s => s.history);
  const historyIndex = useEditorStore(s => s.historyIndex);
  const undo = useEditorStore(s => s.undo);
  const redo = useEditorStore(s => s.redo);

  const jumpTo = (idx: number) => {
    const diff = idx - historyIndex;
    if (diff < 0) for (let i = 0; i < -diff; i++) undo();
    else if (diff > 0) for (let i = 0; i < diff; i++) redo();
  };

  return (
    <div>
      <div style={S.header}>
        <span>📜 操作历史</span>
        <span>{historyIndex + 1}/{history.length}</span>
      </div>
      <div style={S.panel}>
        {history.map((entry, i) => (
          <div
            key={i}
            style={S.item(i === historyIndex, i > historyIndex)}
            onClick={() => jumpTo(i)}
            title={entry.description}
          >
            {entry.description || `步骤 ${i + 1}`}
          </div>
        ))}
      </div>
    </div>
  );
}
