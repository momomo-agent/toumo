import './App.css';
import { useEditorStore } from './store';
import { LivePreview } from './components/LivePreview';
import { LayerManager } from './components/LayerManager';
import { Inspector } from './components/Inspector';
import { CanvasFrame } from './components/Canvas/CanvasFrame';

export default function App() {
  const { 
    keyframes, 
    selectedKeyframeId, 
    setSelectedKeyframeId,
    addKeyframe 
  } = useEditorStore();

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="top-bar">
        <span className="logo">Toumo</span>
        <strong>Motion Editor</strong>
      </header>

      {/* Main Layout */}
      <div className="editor-layout">
        {/* Left: Live Preview */}
        <aside className="preview-pane">
          <LivePreview />
        </aside>

        {/* Right: Editor Workspace */}
        <div className="editor-workspace">
          {/* Layers */}
          <aside className="layers-pane">
            <LayerManager />
          </aside>

          {/* Canvas: Multi-frame horizontal */}
          <main className="canvas-pane">
            <div className="canvas-header">
              <span>Keyframes</span>
              <button onClick={addKeyframe}>+ Add</button>
            </div>
            <div className="canvas-scroll">
              {keyframes.map((kf) => (
                <CanvasFrame
                  key={kf.id}
                  keyframeId={kf.id}
                  keyframeName={kf.name}
                  isActive={kf.id === selectedKeyframeId}
                  onActivate={() => setSelectedKeyframeId(kf.id)}
                />
              ))}
            </div>
          </main>

          {/* Inspector */}
          <aside className="inspector-pane">
            <Inspector />
          </aside>
        </div>
      </div>
    </div>
  );
}
