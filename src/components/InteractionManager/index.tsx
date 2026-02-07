import { useState } from 'react';
import { PatchCanvas } from './PatchCanvas';
import { PatchToolbar } from './PatchToolbar';
import { ComponentPanel } from './ComponentPanel';
import { VariablePanel } from './VariablePanel';

type Tab = 'patches' | 'components' | 'variables';

export function InteractionManager() {
  const [activeTab, setActiveTab] = useState<Tab>('patches');

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
            <PatchToolbar />
            <PatchCanvas />
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
