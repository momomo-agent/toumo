/**
 * DevicePicker — 设备选择下拉面板
 * 从 PreviewMode 提取出来复用
 */
import { useState } from 'react';
import { DEVICE_FRAMES, DEVICE_CATEGORIES } from './data';
import type { DeviceCategory } from './data';

export function DevicePicker({ current, onSelect }: { current: string; onSelect: (id: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<DeviceCategory>(() => {
    const dev = DEVICE_FRAMES.find(d => d.id === current);
    return dev?.category || 'iphone';
  });

  const filtered = activeCategory === 'none'
    ? DEVICE_FRAMES.filter(d => d.category === 'none')
    : DEVICE_FRAMES.filter(d => d.category === activeCategory);

  return (
    <div style={S.picker} onClick={e => e.stopPropagation()}>
      {/* Category tabs */}
      <div style={S.pickerTabs}>
        {DEVICE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              ...S.pickerTab,
              ...(activeCategory === cat.id ? S.pickerTabActive : {}),
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Device list */}
      <div style={S.pickerList}>
        {filtered.map(d => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            style={{
              ...S.pickerItem,
              ...(current === d.id ? S.pickerItemActive : {}),
            }}
          >
            <span style={S.pickerItemName}>{d.icon} {d.label}</span>
            {d.width > 0 && (
              <span style={S.pickerItemDim}>{d.width}×{d.height}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  picker: {
    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
    marginBottom: 8, width: 280,
    background: 'rgba(28,28,30,0.98)', backdropFilter: 'blur(16px)',
    borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    overflow: 'hidden', zIndex: 10001,
  },
  pickerTabs: {
    display: 'flex', gap: 0,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '4px 4px 0',
  },
  pickerTab: {
    flex: 1, padding: '8px 4px', fontSize: 11,
    background: 'transparent', color: 'rgba(255,255,255,0.45)',
    border: 'none', borderBottom: '2px solid transparent',
    cursor: 'pointer', textAlign: 'center' as const,
    borderRadius: '6px 6px 0 0',
  },
  pickerTabActive: {
    color: '#60a5fa',
    borderBottomColor: '#2563eb',
    background: 'rgba(37,99,235,0.08)',
  },
  pickerList: {
    display: 'flex', flexDirection: 'column' as const,
    padding: 4, maxHeight: 220, overflowY: 'auto' as const,
  },
  pickerItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px', fontSize: 12,
    background: 'transparent', color: '#ccc',
    border: 'none', borderRadius: 8,
    cursor: 'pointer', textAlign: 'left' as const,
  },
  pickerItemActive: {
    background: 'rgba(37,99,235,0.18)', color: '#93bbfc',
  },
  pickerItemName: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  pickerItemDim: {
    color: 'rgba(255,255,255,0.3)', fontSize: 10,
  },
};
