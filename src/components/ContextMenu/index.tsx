import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store';
import { canPerformBooleanOperation } from '../../utils/booleanOperations';
import type { KeyElement } from '../../types';
import { DEFAULT_STYLE } from '../../types';

// ── Types ──────────────────────────────────────────────────────────────

interface BaseMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

interface ElementContextMenuProps extends BaseMenuProps {
  mode: 'element';
  elementId: string;
}

interface CanvasContextMenuProps extends BaseMenuProps {
  mode: 'canvas';
  /** Canvas-space position for placing new elements */
  canvasPosition?: { x: number; y: number };
}

export type ContextMenuProps = ElementContextMenuProps | CanvasContextMenuProps;

// ── Main Component ─────────────────────────────────────────────────────

export function ContextMenu(props: ContextMenuProps) {
  const { x, y, onClose, mode } = props;
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    selectedElementIds,
    selectedElementId,
    clipboard,
    copySelectedElements,
    pasteElements,
    deleteElement,
    duplicateSelectedElements,
    groupSelectedElements,
    ungroupSelectedElements,
    bringToFront,
    sendToBack,
    alignElements,
    booleanUnion,
    booleanSubtract,
    booleanIntersect,
    booleanExclude,
    toggleLock,
    selectAllElements,
    addElement,
    setSelectedElementId,
  } = useEditorStore();

  const sharedElements = useEditorStore(s => s.sharedElements);
  const elementId = mode === 'element' ? props.elementId : null;
  const element = elementId
    ? sharedElements.find(el => el.id === elementId)
    : null;
  const isGroup = element?.id.startsWith('group-');
  const hasMultipleSelected = selectedElementIds.length > 1;
  const isLocked = element?.locked ?? false;

  // Close on outside click / Escape
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

  // Viewport-aware positioning
  const [adjustedPos, setAdjustedPos] = useState({ x, y });
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let ax = x, ay = y;
    if (x + rect.width > window.innerWidth - 8) ax = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8) ay = window.innerHeight - rect.height - 8;
    if (ax < 8) ax = 8;
    if (ay < 8) ay = 8;
    setAdjustedPos({ x: ax, y: ay });
  }, [x, y]);

  // ── Quick-add helper ──
  const quickAdd = (shapeType: KeyElement['shapeType'], name: string) => {
    const pos = mode === 'canvas' && props.canvasPosition
      ? props.canvasPosition
      : { x: 100, y: 100 };

    const isText = shapeType === 'text';
    const isLine = shapeType === 'line';
    const isEllipse = shapeType === 'ellipse';
    const isFrame = shapeType === 'frame';

    const baseStyle = { ...DEFAULT_STYLE };

    const newEl: KeyElement = {
      id: `el-${Date.now()}`,
      name,
      category: 'content',
      isKeyElement: true,
      attributes: [],
      position: pos,
      size: {
        width: isText ? 140 : isLine ? 200 : isFrame ? 300 : 100,
        height: isText ? 40 : isLine ? 2 : isFrame ? 200 : 100,
      },
      shapeType,
      style: {
        ...baseStyle,
        borderRadius: isEllipse ? 100 : isLine ? 0 : baseStyle.borderRadius,
        ...(isText ? {
          fill: 'transparent', fillOpacity: 1,
          stroke: 'transparent', strokeWidth: 0, strokeOpacity: 1,
          fontSize: 18, fontWeight: '500', textAlign: 'left' as const,
        } : {}),
        ...(isLine ? { fill: '#ffffff', stroke: '#ffffff', strokeWidth: 2 } : {}),
        ...(isFrame ? { fill: '#1a1a1a', fillOpacity: 1, stroke: '#333', strokeWidth: 1 } : {}),
      },
      text: isText ? 'Text' : undefined,
    };

    addElement(newEl);
    setSelectedElementId(newEl.id);
    onClose();
  };

  // ── Render ──

  if (mode === 'canvas') {
    return (
      <MenuContainer ref={menuRef} x={adjustedPos.x} y={adjustedPos.y}>
        <MenuItem
          label="Paste"
          shortcut="⌘V"
          onClick={() => { pasteElements(); onClose(); }}
          disabled={clipboard.length === 0}
        />
        <MenuItem
          label="Select All"
          shortcut="⌘A"
          onClick={() => { selectAllElements(); onClose(); }}
        />
        <Divider />
        <SubMenu label="Add Element" icon="＋">
          <MenuItem label="Rectangle" icon="▢" onClick={() => quickAdd('rectangle', 'Rectangle')} />
          <MenuItem label="Ellipse" icon="○" onClick={() => quickAdd('ellipse', 'Ellipse')} />
          <MenuItem label="Text" icon="T" onClick={() => quickAdd('text', 'Text')} />
          <MenuItem label="Line" icon="─" onClick={() => quickAdd('line', 'Line')} />
          <MenuItem label="Frame" icon="⊞" onClick={() => quickAdd('frame', 'Frame')} />
        </SubMenu>
      </MenuContainer>
    );
  }

  // ── Element context menu ──

  return (
    <MenuContainer ref={menuRef} x={adjustedPos.x} y={adjustedPos.y}>
      {/* Edit */}
      <MenuItem label="Copy" shortcut="⌘C" onClick={() => { copySelectedElements(); onClose(); }} />
      <MenuItem
        label="Paste"
        shortcut="⌘V"
        onClick={() => { pasteElements(); onClose(); }}
        disabled={clipboard.length === 0}
      />
      <MenuItem label="Duplicate" shortcut="⌘D" onClick={() => { duplicateSelectedElements(); onClose(); }} />

      <Divider />

      {/* Lock */}
      <MenuItem
        label={isLocked ? 'Unlock' : 'Lock'}
        icon={isLocked ? '🔓' : '🔒'}
        onClick={() => {
          // Make sure the element is selected before toggling
          if (elementId && selectedElementId !== elementId) {
            setSelectedElementId(elementId);
            // toggleLock reads selectedElementId, so we need a microtask
            setTimeout(() => { toggleLock(); onClose(); }, 0);
          } else {
            toggleLock();
            onClose();
          }
        }}
      />

      <Divider />

      {/* Layer order */}
      <MenuItem label="Bring to Front" shortcut="⌘]" icon="⬆" onClick={() => { bringToFront(); onClose(); }} />
      <MenuItem label="Send to Back" shortcut="⌘[" icon="⬇" onClick={() => { sendToBack(); onClose(); }} />

      <Divider />

      {/* Group */}
      {hasMultipleSelected && (
        <MenuItem label="Group" shortcut="⌘G" onClick={() => { groupSelectedElements(); onClose(); }} />
      )}
      {isGroup && (
        <MenuItem label="Ungroup" shortcut="⇧⌘G" onClick={() => { ungroupSelectedElements(); onClose(); }} />
      )}
      {(hasMultipleSelected || isGroup) && <Divider />}

      {/* Alignment */}
      {hasMultipleSelected && (
        <>
          <SubMenu label="Align">
            <MenuItem label="Align Left" onClick={() => { alignElements('left'); onClose(); }} />
            <MenuItem label="Align Center" onClick={() => { alignElements('center'); onClose(); }} />
            <MenuItem label="Align Right" onClick={() => { alignElements('right'); onClose(); }} />
            <Divider />
            <MenuItem label="Align Top" onClick={() => { alignElements('top'); onClose(); }} />
            <MenuItem label="Align Middle" onClick={() => { alignElements('middle'); onClose(); }} />
            <MenuItem label="Align Bottom" onClick={() => { alignElements('bottom'); onClose(); }} />
          </SubMenu>
          <Divider />
        </>
      )}

      {/* Boolean */}
      {hasMultipleSelected && (() => {
        const selectedElements = selectedElementIds
          .map(id => sharedElements.find(el => el.id === id))
          .filter((el): el is NonNullable<typeof el> => el !== undefined);
        const canBoolean = canPerformBooleanOperation(selectedElements);
        return canBoolean ? (
          <>
            <SubMenu label="Boolean">
              <MenuItem label="Union" onClick={() => { booleanUnion(); onClose(); }} />
              <MenuItem label="Subtract" onClick={() => { booleanSubtract(); onClose(); }} />
              <MenuItem label="Intersect" onClick={() => { booleanIntersect(); onClose(); }} />
              <MenuItem label="Exclude" onClick={() => { booleanExclude(); onClose(); }} />
            </SubMenu>
            <Divider />
          </>
        ) : null;
      })()}

      {/* Delete */}
      <MenuItem
        label="Delete"
        shortcut="⌫"
        danger
        onClick={() => { if (elementId) deleteElement(elementId); onClose(); }}
      />
    </MenuContainer>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────

import { forwardRef } from 'react';

const MenuContainer = forwardRef<HTMLDivElement, { x: number; y: number; children: React.ReactNode }>(
  ({ x, y, children }, ref) => (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10000,
        minWidth: 180,
        background: 'rgba(28, 28, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '4px 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)',
        animation: 'contextMenuIn 0.12s ease-out',
      }}
    >
      <style>{`
        @keyframes contextMenuIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {children}
    </div>
  ),
);
MenuContainer.displayName = 'MenuContainer';

// ── MenuItem ───────────────────────────────────────────────────────────

interface MenuItemProps {
  label: string;
  shortcut?: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

function MenuItem({ label, shortcut, icon, onClick, danger, disabled }: MenuItemProps) {
  const [hovered, setHovered] = useState(false);

  const bgHover = danger
    ? 'rgba(244, 63, 94, 0.15)'
    : 'rgba(255, 255, 255, 0.08)';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: 'calc(100% - 8px)',
        margin: '0 4px',
        padding: '6px 10px',
        background: hovered && !disabled ? bgHover : 'transparent',
        border: 'none',
        color: danger ? '#f43f5e' : disabled ? '#555' : '#e4e4e7',
        fontSize: 13,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        textAlign: 'left',
        cursor: disabled ? 'default' : 'pointer',
        borderRadius: 6,
        // folme
        lineHeight: '20px',
      }}
    >
      {icon && (
        <span style={{ width: 18, textAlign: 'center', fontSize: 12, flexShrink: 0, opacity: 0.7 }}>
          {icon}
        </span>
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && (
        <span style={{ color: '#666', fontSize: 11, marginLeft: 16, flexShrink: 0 }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

// ── Divider ────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div style={{
      height: 1,
      background: 'rgba(255,255,255,0.06)',
      margin: '4px 8px',
    }} />
  );
}

// ── SubMenu ────────────────────────────────────────────────────────────

interface SubMenuProps {
  label: string;
  icon?: string;
  children: React.ReactNode;
}

function SubMenu({ label, icon, children }: SubMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    timeoutRef.current = window.setTimeout(() => setIsOpen(false), 150);
  };

  // Determine if submenu should open to the left
  const [openLeft, setOpenLeft] = useState(false);
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.right + 180 > window.innerWidth) {
        setOpenLeft(true);
      }
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: 'calc(100% - 8px)',
          margin: '0 4px',
          padding: '6px 10px',
          background: hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none',
          color: '#e4e4e7',
          fontSize: 13,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: 6,
          // folme
          lineHeight: '20px',
        }}
      >
        {icon && (
          <span style={{ width: 18, textAlign: 'center', fontSize: 12, flexShrink: 0, opacity: 0.7 }}>
            {icon}
          </span>
        )}
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{ color: '#666', fontSize: 10 }}>▶</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            [openLeft ? 'right' : 'left']: '100%',
            top: -4,
            [openLeft ? 'marginRight' : 'marginLeft']: 4,
            minWidth: 160,
            background: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '4px 0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)',
            zIndex: 10001,
            animation: 'contextMenuIn 0.1s ease-out',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default ContextMenu;
