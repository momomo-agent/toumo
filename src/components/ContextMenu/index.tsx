import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../../store';
import type { Position } from '../../types';

interface MenuItemProps {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface MenuDividerProps {
  type: 'divider';
}

type MenuItem = MenuItemProps | MenuDividerProps;

function isMenuDivider(item: MenuItem): item is MenuDividerProps {
  return 'type' in item && item.type === 'divider';
}

function MenuItemComponent({ label, shortcut, onClick, disabled, danger }: MenuItemProps) {
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
        border: 'none',
        background: 'transparent',
        color: disabled ? '#666' : danger ? '#ef4444' : '#e5e5e5',
        fontSize: 13,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = danger ? '#ef444420' : '#ffffff15';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <span style={{ color: '#666', fontSize: 11, marginLeft: 24 }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

function MenuDivider() {
  return (
    <div
      style={{
        height: 1,
        background: '#333',
        margin: '4px 8px',
      }}
    />
  );
}

interface ContextMenuProps {
  position: Position;
  onClose: () => void;
  items: MenuItem[];
}

export function ContextMenu({ position, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    if (rect.right > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 8;
    }
    if (rect.bottom > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 8;
    }

    if (adjustedX !== position.x || adjustedY !== position.y) {
      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        minWidth: 180,
        background: '#1a1a1c',
        border: '1px solid #333',
        borderRadius: 8,
        padding: '4px 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 9999,
      }}
    >
      {items.map((item, index) =>
        isMenuDivider(item) ? (
          <MenuDivider key={`divider-${index}`} />
        ) : (
          <MenuItemComponent
            key={item.label}
            {...item}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          />
        )
      )}
    </div>
  );
}

// Hook to manage context menu state
export function useContextMenu() {
  const [menuState, setMenuState] = useState<{
    visible: boolean;
    position: Position;
    type: 'canvas' | 'element';
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    type: 'canvas',
  });

  const showMenu = useCallback((position: Position, type: 'canvas' | 'element') => {
    setMenuState({ visible: true, position, type });
  }, []);

  const hideMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, visible: false }));
  }, []);

  return { menuState, showMenu, hideMenu };
}

import { useState } from 'react';

// Canvas context menu items
export function useCanvasContextMenu(_onClose: () => void) {
  const {
    pasteElements,
    selectAllElements,
    canvasScale,
    setCanvasScale,
    zoomToFit,
    clipboard,
  } = useEditorStore();

  const items: MenuItem[] = [
    {
      label: 'Paste',
      shortcut: '⌘V',
      onClick: pasteElements,
      disabled: clipboard.length === 0,
    },
    {
      label: 'Select All',
      shortcut: '⌘A',
      onClick: selectAllElements,
    },
    { type: 'divider' },
    {
      label: 'Zoom In',
      shortcut: '⌘+',
      onClick: () => setCanvasScale(Math.min(4, canvasScale * 1.25)),
    },
    {
      label: 'Zoom Out',
      shortcut: '⌘-',
      onClick: () => setCanvasScale(Math.max(0.25, canvasScale / 1.25)),
    },
    {
      label: 'Zoom to Fit',
      shortcut: '⌘0',
      onClick: zoomToFit,
    },
  ];

  return items;
}

// Element context menu items
export function useElementContextMenu(_onClose: () => void) {
  const {
    selectedElementIds,
    selectedElementId,
    keyframes,
    selectedKeyframeId,
    copySelectedElements,
    pasteElements,
    duplicateSelectedElements,
    deleteSelectedElements,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupSelectedElements,
    ungroupSelectedElements,
    toggleLock,
    toggleVisibility,
    clipboard,
  } = useEditorStore();

  const currentKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const selectedElement = currentKeyframe?.keyElements.find(
    (el) => el.id === selectedElementId
  );

  // Check if selection is a group
  const isGroup = selectedElement && currentKeyframe?.keyElements.some(
    (el) => el.parentId === selectedElement.id
  );

  const hasMultipleSelected = selectedElementIds.length > 1;
  const isLocked = selectedElement?.locked ?? false;
  const isHidden = selectedElement?.visible === false;

  const items: MenuItem[] = [
    {
      label: 'Cut',
      shortcut: '⌘X',
      onClick: () => {
        copySelectedElements();
        deleteSelectedElements();
      },
    },
    {
      label: 'Copy',
      shortcut: '⌘C',
      onClick: copySelectedElements,
    },
    {
      label: 'Paste',
      shortcut: '⌘V',
      onClick: pasteElements,
      disabled: clipboard.length === 0,
    },
    {
      label: 'Duplicate',
      shortcut: '⌘D',
      onClick: duplicateSelectedElements,
    },
    {
      label: 'Delete',
      shortcut: '⌫',
      onClick: deleteSelectedElements,
      danger: true,
    },
    { type: 'divider' },
    {
      label: 'Bring to Front',
      shortcut: '⌘]',
      onClick: bringToFront,
    },
    {
      label: 'Send to Back',
      shortcut: '⌘[',
      onClick: sendToBack,
    },
    {
      label: 'Bring Forward',
      shortcut: '⌥⌘]',
      onClick: bringForward,
    },
    {
      label: 'Send Backward',
      shortcut: '⌥⌘[',
      onClick: sendBackward,
    },
    { type: 'divider' },
    {
      label: 'Group Selection',
      shortcut: '⌘G',
      onClick: groupSelectedElements,
      disabled: !hasMultipleSelected,
    },
    {
      label: 'Ungroup',
      shortcut: '⇧⌘G',
      onClick: ungroupSelectedElements,
      disabled: !isGroup,
    },
    { type: 'divider' },
    {
      label: isLocked ? 'Unlock' : 'Lock',
      shortcut: '⌘L',
      onClick: toggleLock,
    },
    {
      label: isHidden ? 'Show' : 'Hide',
      shortcut: '⌘H',
      onClick: toggleVisibility,
    },
  ];

  return items;
}
