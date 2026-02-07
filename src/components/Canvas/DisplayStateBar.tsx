import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';

export function DisplayStateBar() {
  const { displayStates, selectedDisplayStateId } = useEditorStore(
    useShallow((s) => ({
      displayStates: s.displayStates,
      selectedDisplayStateId: s.selectedDisplayStateId,
    }))
  );

  const addDisplayState = useEditorStore((s) => s.addDisplayState);
  const removeDisplayState = useEditorStore((s) => s.removeDisplayState);
  const renameDisplayState = useEditorStore((s) => s.renameDisplayState);
  const setSelectedDisplayStateId = useEditorStore((s) => s.setSelectedDisplayStateId);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    dsId: string;
  } | null>(null);

  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, dsId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, dsId });
    },
    []
  );

  const startRename = useCallback(
    (dsId: string) => {
      const ds = displayStates.find((d) => d.id === dsId);
      if (!ds) return;
      setRenamingId(dsId);
      setRenameValue(ds.name);
      setContextMenu(null);
    },
    [displayStates]
  );

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      renameDisplayState(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, renameDisplayState]);

  const handleDelete = useCallback(
    (dsId: string) => {
      removeDisplayState(dsId);
      setContextMenu(null);
    },
    [removeDisplayState]
  );

  const handleAdd = useCallback(() => {
    const idx = displayStates.length + 1;
    addDisplayState(`State ${idx}`);
  }, [displayStates.length, addDisplayState]);

  return (
    <div
      style={{
        height: 36,
        background: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        gap: 2,
        borderBottom: '1px solid #2a2a3e',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Scrollable tabs area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flex: 1,
          overflow: 'auto hidden',
        }}
      >
        {displayStates.map((ds) => {
          const isSelected = ds.id === selectedDisplayStateId;
          const isRenaming = ds.id === renamingId;

          return (
            <div
              key={ds.id}
              onClick={() => setSelectedDisplayStateId(ds.id)}
              onContextMenu={(e) => handleContextMenu(e, ds.id)}
              onDoubleClick={() => startRename(ds.id)}
              style={{
                position: 'relative',
                height: 32,
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                color: isSelected ? '#e2e8f0' : '#94a3b8',
                background: isSelected ? '#2a2a4a' : 'transparent',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = '#2a2a4a';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
              }}
            >
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'transparent',
                    border: '1px solid #6366f1',
                    borderRadius: 3,
                    color: '#e2e8f0',
                    fontSize: 12,
                    padding: '1px 4px',
                    outline: 'none',
                    width: 80,
                  }}
                />
              ) : (
                ds.name
              )}

              {/* Selected indicator line */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 4,
                    right: 4,
                    height: 2,
                    background: '#6366f1',
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <div
        onClick={handleAdd}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          cursor: 'pointer',
          color: '#94a3b8',
          fontSize: 16,
          flexShrink: 0,
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#2a2a4a';
          e.currentTarget.style.color = '#e2e8f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        +
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#1e1e2e',
            border: '1px solid #333',
            borderRadius: 6,
            padding: 4,
            zIndex: 1000,
            minWidth: 120,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <div
            onClick={() => startRename(contextMenu.dsId)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              color: '#e2e8f0',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a4a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Rename
          </div>
          {displayStates.length > 1 && (
            <div
              onClick={() => handleDelete(contextMenu.dsId)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                color: '#f87171',
                borderRadius: 4,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a4a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Delete
            </div>
          )}
        </div>
      )}
    </div>
  );
}
