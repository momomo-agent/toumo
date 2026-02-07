import React, { useCallback } from 'react';
import type { Patch, PatchPort, PatchType } from '../../types';

// Color scheme by patch category
const PATCH_COLORS: Record<string, { bg: string; border: string; header: string }> = {
  trigger: { bg: '#1a2332', border: '#2563eb', header: '#1e3a5f' },
  action: { bg: '#1a2a1a', border: '#22c55e', header: '#1e3f1e' },
  logic: { bg: '#2a1a2a', border: '#a855f7', header: '#3f1e3f' },
};

const TRIGGER_TYPES: PatchType[] = ['tap', 'drag', 'hover', 'scroll', 'timer', 'variableChange'];
const ACTION_TYPES: PatchType[] = ['switchDisplayState', 'setVariable', 'animateProperty'];

function getCategory(type: PatchType): 'trigger' | 'action' | 'logic' {
  if (TRIGGER_TYPES.includes(type)) return 'trigger';
  if (ACTION_TYPES.includes(type)) return 'action';
  return 'logic';
}

const PORT_TYPE_COLORS: Record<string, string> = {
  pulse: '#f59e0b',
  boolean: '#ef4444',
  number: '#3b82f6',
  string: '#22c55e',
  displayState: '#a855f7',
  any: '#888',
};

interface PatchNodeProps {
  patch: Patch;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onPortDragStart: (patchId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
  getPortPosition: (patchId: string, portId: string, isOutput: boolean) => { x: number; y: number } | null;
}

export const PatchNode = React.memo(function PatchNode({
  patch,
  selected,
  onSelect,
  onDragStart,
  onPortDragStart,
}: PatchNodeProps) {
  const category = getCategory(patch.type);
  const colors = PATCH_COLORS[category];
  const nodeWidth = 180;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(patch.id);
    onDragStart(patch.id, e);
  }, [patch.id, onSelect, onDragStart]);

  return (
    <div
      data-patch-id={patch.id}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: patch.position.x,
        top: patch.position.y,
        width: nodeWidth,
        background: colors.bg,
        border: `1px solid ${selected ? '#fff' : colors.border}`,
        borderRadius: 8,
        cursor: 'grab',
        userSelect: 'none',
        boxShadow: selected
          ? `0 0 0 1px #fff, 0 4px 12px rgba(0,0,0,0.4)`
          : '0 2px 8px rgba(0,0,0,0.3)',
        zIndex: selected ? 10 : 1,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '6px 10px',
          background: colors.header,
          borderRadius: '7px 7px 0 0',
          borderBottom: `1px solid ${colors.border}33`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>
          {category}
        </span>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, flex: 1 }}>
          {patch.name}
        </span>
      </div>

      {/* Ports */}
      <div style={{ padding: '8px 0' }}>
        {/* Input ports */}
        {patch.inputs.map((port) => (
          <PortRow
            key={port.id}
            port={port}
            isOutput={false}
            patchId={patch.id}
            onPortDragStart={onPortDragStart}
          />
        ))}
        {/* Output ports */}
        {patch.outputs.map((port) => (
          <PortRow
            key={port.id}
            port={port}
            isOutput={true}
            patchId={patch.id}
            onPortDragStart={onPortDragStart}
          />
        ))}
      </div>
    </div>
  );
});

function PortRow({
  port,
  isOutput,
  patchId,
  onPortDragStart,
}: {
  port: PatchPort;
  isOutput: boolean;
  patchId: string;
  onPortDragStart: (patchId: string, portId: string, isOutput: boolean, e: React.MouseEvent) => void;
}) {
  const color = PORT_TYPE_COLORS[port.dataType] || '#888';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPortDragStart(patchId, port.id, isOutput, e);
  }, [patchId, port.id, isOutput, onPortDragStart]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '3px 10px',
        flexDirection: isOutput ? 'row-reverse' : 'row',
        gap: 6,
      }}
    >
      <div
        data-port-id={port.id}
        data-port-output={isOutput ? 'true' : 'false'}
        data-patch-id={patchId}
        onMouseDown={handleMouseDown}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          border: '2px solid #111',
          cursor: 'crosshair',
          flexShrink: 0,
          marginLeft: isOutput ? 0 : -14,
          marginRight: isOutput ? -14 : 0,
        }}
      />
      <span style={{ fontSize: 10, color: '#aaa' }}>
        {port.name}
      </span>
    </div>
  );
}
