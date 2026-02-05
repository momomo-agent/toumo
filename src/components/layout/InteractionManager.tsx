import { useState } from 'react';
import './InteractionManager.css';

type Tab = 'states' | 'timeline';

interface InteractionManagerProps {
  stateGraph?: React.ReactNode;
  timeline?: React.ReactNode;
}

export function InteractionManager({ stateGraph, timeline }: InteractionManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('states');

  return (
    <div className="interaction-manager">
      <div className="im-tabs">
        <button 
          className={activeTab === 'states' ? 'active' : ''}
          onClick={() => setActiveTab('states')}
        >
          State Graph
        </button>
        <button 
          className={activeTab === 'timeline' ? 'active' : ''}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
      </div>
      <div className="im-content">
        {activeTab === 'states' && stateGraph}
        {activeTab === 'timeline' && timeline}
      </div>
    </div>
  );
}
