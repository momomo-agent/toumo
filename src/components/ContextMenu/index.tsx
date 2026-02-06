import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store';
import { canPerformBooleanOperation } from '../../utils/booleanOperations';

interface ContextMenuProps {
  x: number;
  y: number;
  elementId: string;
  onClose: () => void;
}

export function ContextMenu({ x, y, elementId, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  
  const {
    selectedElementIds,
    copySelectedElements,
    pasteElements,
    deleteElement,
    duplicateSelectedElements,
    groupSelectedElements,
    ungroupSelectedElements,
    bringToFront,
    sendToBack,
    alignElements,
    keyframes,
    selectedKeyframeId,
    booleanUnion,
    booleanSubtract,
    booleanIntersect,
    booleanExclude,
  } = useEditorStore();

  // Get current element info
  const currentKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const element = currentKeyframe?.keyElements.find(el => el.id === elementId);
  const isGroup = element?.id.startsWith('group-');
  const hasMultipleSelected = selectedElementIds.length > 1;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = { x, y };
  if (typeof window !== 'undefined') {
    const menuWidth = 160;
    const menuHeight = 280;
    if (x + menuWidth > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - menuWidth - 8;
    }
    if (y + menuHeight > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - menuHeight - 8;
    }
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        background: '#1e1e1e',
        border: '1px solid #3a3a3a',
        borderRadius: 8,
        padding: 4,
        zIndex: 10000,
        minWidth: 160,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      {/* Edit Actions */}
      <MenuItem
        label="Copy"
        shortcut="⌘C"
        onClick={() => { copySelectedElements(); onClose(); }}
      />
      <MenuItem
        label="Paste"
        shortcut="⌘V"
        onClick={() => { pasteElements(); onClose(); }}
      />
      <MenuItem
        label="Duplicate"
        shortcut="⌘D"
        onClick={() => { duplicateSelectedElements(); onClose(); }}
      />
      
      <Divider />
      
      {/* Group Actions */}
      {hasMultipleSelected && (
        <MenuItem
          label="Group"
          shortcut="⌘G"
          onClick={() => { groupSelectedElements(); onClose(); }}
        />
      )}
      {isGroup && (
        <MenuItem
          label="Ungroup"
          shortcut="⇧⌘G"
          onClick={() => { ungroupSelectedElements(); onClose(); }}
        />
      )}
      {(hasMultipleSelected || isGroup) && <Divider />}
      
      {/* Alignment Actions - only show when multiple elements selected */}
      {hasMultipleSelected && (
        <>
          <SubMenu label="Align">
            <MenuItem
              label="Align Left"
              onClick={() => { alignElements('left'); onClose(); }}
            />
            <MenuItem
              label="Align Center"
              onClick={() => { alignElements('center'); onClose(); }}
            />
            <MenuItem
              label="Align Right"
              onClick={() => { alignElements('right'); onClose(); }}
            />
            <Divider />
            <MenuItem
              label="Align Top"
              onClick={() => { alignElements('top'); onClose(); }}
            />
            <MenuItem
              label="Align Middle"
              onClick={() => { alignElements('middle'); onClose(); }}
            />
            <MenuItem
              label="Align Bottom"
              onClick={() => { alignElements('bottom'); onClose(); }}
            />
          </SubMenu>
          <Divider />
        </>
      )}
      
      {/* Boolean Operations - only show when multiple shapes selected */}
      {hasMultipleSelected && (() => {
        const selectedElements = selectedElementIds
          .map(id => currentKeyframe?.keyElements.find(el => el.id === id))
          .filter((el): el is NonNullable<typeof el> => el !== undefined);
        const canBoolean = canPerformBooleanOperation(selectedElements);
        
        return canBoolean ? (
          <>
            <SubMenu label="Boolean">
              <MenuItem
                label="Union"
                onClick={() => { booleanUnion(); onClose(); }}
              />
              <MenuItem
                label="Subtract"
                onClick={() => { booleanSubtract(); onClose(); }}
              />
              <MenuItem
                label="Intersect"
                onClick={() => { booleanIntersect(); onClose(); }}
              />
              <MenuItem
                label="Exclude"
                onClick={() => { booleanExclude(); onClose(); }}
              />
            </SubMenu>
            <Divider />
          </>
        ) : null;
      })()}
      
      {/* Layer Order */}
      <MenuItem
        label="Bring to Front"
        shortcut="⌘]"
        onClick={() => { bringToFront(); onClose(); }}
      />
      <MenuItem
        label="Send to Back"
        shortcut="⌘["
        onClick={() => { sendToBack(); onClose(); }}
      />
      
      <Divider />
      
      {/* Delete */}
      <MenuItem
        label="Delete"
        shortcut="⌫"
        onClick={() => { deleteElement(elementId); onClose(); }}
        danger
      />
    </div>
  );
}

interface MenuItemProps {
  label: string;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

function MenuItem({ label, shortcut, onClick, danger, disabled }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 12px',
        background: 'transparent',
        border: 'none',
        color: danger ? '#f43f5e' : disabled ? '#666' : '#e0e0e0',
        fontSize: 13,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = danger ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <span style={{ color: '#666', fontSize: 11, marginLeft: 16 }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ height: 1, background: '#3a3a3a', margin: '4px 0' }} />
  );
}

interface SubMenuProps {
  label: string;
  children: React.ReactNode;
}

function SubMenu({ label, children }: SubMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          background: isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none',
          color: '#e0e0e0',
          fontSize: 13,
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: 4,
          transition: 'background 0.15s',
        }}
      >
        <span>{label}</span>
        <span style={{ color: '#666', fontSize: 11 }}>▶</span>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            marginLeft: 4,
            background: '#1e1e1e',
            border: '1px solid #3a3a3a',
            borderRadius: 8,
            padding: 4,
            minWidth: 140,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 10001,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default ContextMenu;
