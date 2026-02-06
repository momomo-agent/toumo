import { useState } from 'react';
import { StateGraph } from './StateGraph';
import { TransitionList } from './TransitionList';
import { ComponentPanel } from './ComponentPanel';
import { VariablePanel } from './VariablePanel';

type Tab = 'graph' | 'transitions' | 'components' | 'variables';

export function InteractionManager() {
  const [activeTab, setActiveTab] = useState<Tab>('graph');

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
        <TabButton
          active={activeTab === 'graph'}
          onClick={() => setActiveTab('graph')}
        >
          State Graph
        </TabButton>
        <TabButton
          active={activeTab === 'transitions'}
          onClick={() => setActiveTab('transitions')}
        >
          Transitions
        </TabButton>
        <TabButton
          active={activeTab === 'components'}
          onClick={() => setActiveTab('components')}
        >
          Components
        </TabButton>
        <TabButton
          active={activeTab === 'variables'}
          onClick={() => setActiveTab('variables')}
        >
          Variables
        </TabButton>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'graph' && <StateGraph />}
        {activeTab === 'transitions' && <TransitionList />}
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
