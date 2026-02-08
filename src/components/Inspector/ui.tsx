import React from 'react';

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #2a2a2a',
      }}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>
      {children}
    </label>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};

export const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  color: '#e5e5e5',
  fontSize: 12,
};

export const alignBtnStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: '#0d0d0e',
  border: '1px solid #2a2a2a',
  borderRadius: 4,
  color: '#888',
  fontSize: 11,
  cursor: 'pointer',
};
