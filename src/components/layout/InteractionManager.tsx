import { useState } from 'react';
import './InteractionManager.css';

type Tab = 'states' | 'timeline';

export function InteractionManager() {
  const [tab, setTab] = useState<Tab>('states');

  return (
    <div className="interaction-manager">
      <div className="im-tabs">
        <button className={tab === 'states' ? 'active' : ''} onClick={() => setTab('states')}>
          State Graph
        </button>
        <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>
          Timeline
        </button>
      </div>
      <div className="im-content">
        {tab === 'states' && <div>State Graph (TODO)</div>}
        {tab === 'timeline' && <div>Timeline (TODO)</div>}
      </div>
    </div>
  );
}
