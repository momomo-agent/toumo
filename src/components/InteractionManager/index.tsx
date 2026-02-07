import { useState, useCallback } from 'react';
import { PatchCanvas, createPatch } from './PatchCanvas';
import { PatchToolbar } from './PatchToolbar';
import { ComponentPanel } from './ComponentPanel';
import { VariablePanel } from './VariablePanel';
import type { Patch, PatchConnection, PatchType } from '../../types';

type Tab = 'patches' | 'components' | 'variables';

export function InteractionManager() {
  const [activeTab, setActiveTab] = useState<Tab>('patches');
  const [patches, setPatches] = useState<Patch[]>([]);
  const [connections, setConnections] = useState<PatchConnection[]>([]);
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [nextPosition, setNextPosition] = useState({ x: 40, y: 40 });

  const handleAddPatch = useCallback((type: PatchType) => {
    const patch = createPatch(type, nextPosition);
    setPatches(prev => [...prev, patch]);
    setSelectedPatchId(patch.id);
    // Stagger next position
    setNextPosition(prev => ({
      x: prev.x + 30 > 400 ? 40 : prev.x + 30,
      y: prev.y + 30 > 300 ? 40 : prev.y + 30,
    }));
  }, [nextPosition]);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#111',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #2a2a2a',
          padding: '0 12px',
        }}
      >
        <TabButton active={activeTab === 'patches'} onClick={() => setActiveTab('patches')}>
          Patches
        </TabButton>
        <TabButton active={activeTab === 'components'} onClick={() => setActiveTab('components')}>
          Components
        </TabButton>
        <TabButton active={activeTab === 'variables'} onClick={() => setActiveTab('variables')}>
          Variables
        </TabButton>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'patches' && (
          <>
            <PatchToolbar onAddPatch={handleAddPatch} />
            <PatchCanvas
              patches={patches}
              connections={connections}
              onPatchesChange={setPatches}
              onConnectionsChange={setConnections}
              selectedPatchId={selectedPatchId}
              onSelectPatch={setSelectedPatchId}
              selectedConnectionId={selectedConnectionId}
              onSelectConnection={setSelectedConnectionId}
            />
          </>
        )}
        {activeTab === 'components' && <ComponentPanel />}
        {activeTab === 'variables' && <VariablePanel />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
        color: active ? '#fff' : '#666',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}
