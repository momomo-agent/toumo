import { useState, useCallback } from 'react';
import { useEditorStore } from '../../store';

// ─── Types ────────────────────────────────────────────────────────────
interface ProjectFile {
  id: string;
  name: string;
  updatedAt: number;
}

const STORAGE_KEY = 'toumo_projects';
const ACTIVE_KEY = 'toumo_active_project';

// ─── Preset examples ─────────────────────────────────────────────────
const PRESETS: { name: string; description: string; create: () => any }[] = [
  {
    name: 'Button Interaction',
    description: 'Tap → scale + color change',
    create: () => createButtonPreset(),
  },
  {
    name: 'Card Expand',
    description: 'Tap card → expand with spring',
    create: () => createCardExpandPreset(),
  },
  {
    name: 'Tab Switch',
    description: 'Tab bar with slide indicator',
    create: () => createTabSwitchPreset(),
  },
  {
    name: 'Toggle Switch',
    description: 'Boolean toggle with spring',
    create: () => createTogglePreset(),
  },
  {
    name: 'Drag to Dismiss',
    description: 'Drag card down to dismiss',
    create: () => createDragDismissPreset(),
  },
];

// ─── Preset data generators ──────────────────────────────────────────
function createButtonPreset() {
  return {
    keyframes: [
      { id: 'kf-default', name: 'Default', displayStateId: 'ds-default', summary: 'Button idle', keyElements: [] },
      { id: 'kf-hover', name: 'Hover', displayStateId: 'ds-hover', summary: 'Button hovered', keyElements: [] },
    ],
    transitions: [],
    components: [],
    frameSize: { width: 390, height: 844 },
    sharedElements: [
      {
        id: 'el-btn', name: 'Button', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 120, y: 380 }, size: { width: 150, height: 50 },
        shapeType: 'rectangle', style: { backgroundColor: '#3b82f6', borderRadius: 12 },
      },
      {
        id: 'el-btn-text', name: 'Tap Me', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 145, y: 393 }, size: { width: 100, height: 24 },
        shapeType: 'rectangle', style: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
        textContent: 'Tap Me',
      },
    ],
    displayStates: [
      { id: 'ds-default', name: 'Default', layerOverrides: [] },
      { id: 'ds-hover', name: 'Hover', layerOverrides: [
        { layerId: 'el-btn', properties: { style: { backgroundColor: '#2563eb', transform: 'scale(1.05)' } }, isKey: true },
      ]},
    ],
    patches: [
      {
        id: 'p-tap', type: 'tap', name: 'Tap Button',
        position: { x: 50, y: 50 },
        config: { targetElementId: 'el-btn' },
        inputs: [], outputs: [{ id: 'p-tap-out', name: 'onTap', dataType: 'pulse' }],
      },
      {
        id: 'p-switch', type: 'switchDisplayState', name: 'Switch → Hover',
        position: { x: 300, y: 50 },
        config: { targetDisplayStateId: 'ds-hover', autoReverse: true, reverseDelay: 300 },
        inputs: [{ id: 'p-switch-in', name: 'trigger', dataType: 'pulse' }],
        outputs: [{ id: 'p-switch-out', name: 'done', dataType: 'pulse' }],
      },
    ],
    patchConnections: [
      { id: 'conn-1', fromPatchId: 'p-tap', fromPortId: 'p-tap-out', toPatchId: 'p-switch', toPortId: 'p-switch-in' },
    ],
  };
}

function createCardExpandPreset() {
  return {
    keyframes: [
      { id: 'kf-collapsed', name: 'Collapsed', displayStateId: 'ds-collapsed', summary: 'Card collapsed', keyElements: [] },
      { id: 'kf-expanded', name: 'Expanded', displayStateId: 'ds-expanded', summary: 'Card expanded', keyElements: [] },
    ],
    transitions: [],
    components: [],
    frameSize: { width: 390, height: 844 },
    sharedElements: [
      {
        id: 'el-card', name: 'Card', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 300 }, size: { width: 350, height: 120 },
        shapeType: 'rectangle', style: { backgroundColor: '#1e293b', borderRadius: 16 },
      },
      {
        id: 'el-title', name: 'Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 40, y: 320 }, size: { width: 200, height: 24 },
        shapeType: 'rectangle', style: { color: '#fff', fontSize: 16, fontWeight: '600' },
        textContent: 'Card Title',
      },
    ],
    displayStates: [
      { id: 'ds-collapsed', name: 'Collapsed', layerOverrides: [] },
      { id: 'ds-expanded', name: 'Expanded', layerOverrides: [
        { layerId: 'el-card', properties: { size: { width: 350, height: 400 } }, isKey: true },
      ]},
    ],
    patches: [
      {
        id: 'p-tap', type: 'tap', name: 'Tap Card',
        position: { x: 50, y: 50 },
        config: { targetElementId: 'el-card' },
        inputs: [], outputs: [{ id: 'p-tap-out', name: 'onTap', dataType: 'pulse' }],
      },
      {
        id: 'p-toggle', type: 'toggle', name: 'Toggle',
        position: { x: 200, y: 50 },
        config: {},
        inputs: [{ id: 'p-toggle-in', name: 'trigger', dataType: 'pulse' }],
        outputs: [
          { id: 'p-toggle-on', name: 'on', dataType: 'pulse' },
          { id: 'p-toggle-off', name: 'off', dataType: 'pulse' },
        ],
      },
    ],
    patchConnections: [
      { id: 'conn-1', fromPatchId: 'p-tap', fromPortId: 'p-tap-out', toPatchId: 'p-toggle', toPortId: 'p-toggle-in' },
    ],
  };
}

function createTabSwitchPreset() {
  return {
    keyframes: [
      { id: 'kf-tab1', name: 'Tab 1', displayStateId: 'ds-tab1', summary: 'First tab active', keyElements: [] },
      { id: 'kf-tab2', name: 'Tab 2', displayStateId: 'ds-tab2', summary: 'Second tab active', keyElements: [] },
      { id: 'kf-tab3', name: 'Tab 3', displayStateId: 'ds-tab3', summary: 'Third tab active', keyElements: [] },
    ],
    transitions: [],
    components: [],
    frameSize: { width: 390, height: 844 },
    variables: [{ id: 'var-tab', name: 'activeTab', type: 'number', defaultValue: 0, currentValue: 0 }],
    sharedElements: [
      {
        id: 'el-tab-bar', name: 'Tab Bar', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 780 }, size: { width: 390, height: 64 },
        shapeType: 'rectangle', style: { backgroundColor: '#111827' },
      },
      {
        id: 'el-tab1', name: 'Tab 1', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 30, y: 795 }, size: { width: 100, height: 24 },
        shapeType: 'rectangle', style: { color: '#3b82f6', fontSize: 13 },
        textContent: 'Home',
      },
      {
        id: 'el-tab2', name: 'Tab 2', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 145, y: 795 }, size: { width: 100, height: 24 },
        shapeType: 'rectangle', style: { color: '#6b7280', fontSize: 13 },
        textContent: 'Search',
      },
      {
        id: 'el-tab3', name: 'Tab 3', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 260, y: 795 }, size: { width: 100, height: 24 },
        shapeType: 'rectangle', style: { color: '#6b7280', fontSize: 13 },
        textContent: 'Profile',
      },
      {
        id: 'el-indicator', name: 'Indicator', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 30, y: 824 }, size: { width: 100, height: 3 },
        shapeType: 'rectangle', style: { backgroundColor: '#3b82f6', borderRadius: 2 },
      },
    ],
    displayStates: [
      { id: 'ds-tab1', name: 'Tab 1', layerOverrides: [] },
      { id: 'ds-tab2', name: 'Tab 2', layerOverrides: [
        { layerId: 'el-tab1', properties: { style: { color: '#6b7280' } }, isKey: true },
        { layerId: 'el-tab2', properties: { style: { color: '#3b82f6' } }, isKey: true },
        { layerId: 'el-indicator', properties: { position: { x: 145, y: 824 } }, isKey: true },
      ]},
      { id: 'ds-tab3', name: 'Tab 3', layerOverrides: [
        { layerId: 'el-tab1', properties: { style: { color: '#6b7280' } }, isKey: true },
        { layerId: 'el-tab3', properties: { style: { color: '#3b82f6' } }, isKey: true },
        { layerId: 'el-indicator', properties: { position: { x: 260, y: 824 } }, isKey: true },
      ]},
    ],
    patches: [],
    patchConnections: [],
  };
}

function createTogglePreset() {
  return {
    keyframes: [
      { id: 'kf-off', name: 'Off', displayStateId: 'ds-off', summary: 'Toggle off', keyElements: [] },
      { id: 'kf-on', name: 'On', displayStateId: 'ds-on', summary: 'Toggle on', keyElements: [] },
    ],
    transitions: [],
    components: [],
    frameSize: { width: 390, height: 844 },
    variables: [{ id: 'var-toggle', name: 'isOn', type: 'boolean', defaultValue: false, currentValue: false }],
    sharedElements: [
      {
        id: 'el-track', name: 'Track', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 155, y: 410 }, size: { width: 80, height: 40 },
        shapeType: 'rectangle', style: { backgroundColor: '#374151', borderRadius: 20 },
      },
      {
        id: 'el-thumb', name: 'Thumb', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 159, y: 414 }, size: { width: 32, height: 32 },
        shapeType: 'ellipse', style: { backgroundColor: '#ffffff' },
      },
    ],
    displayStates: [
      { id: 'ds-off', name: 'Off', layerOverrides: [] },
      { id: 'ds-on', name: 'On', layerOverrides: [
        { layerId: 'el-track', properties: { style: { backgroundColor: '#22c55e' } }, isKey: true },
        { layerId: 'el-thumb', properties: { position: { x: 199, y: 414 } }, isKey: true },
      ]},
    ],
    patches: [
      {
        id: 'p-tap', type: 'tap', name: 'Tap Track',
        position: { x: 50, y: 50 },
        config: { targetElementId: 'el-track' },
        inputs: [],
        outputs: [{ id: 'p-tap-out', name: 'onTap', dataType: 'pulse' }],
      },
      {
        id: 'p-toggle', type: 'toggle', name: 'Toggle',
        position: { x: 250, y: 50 },
        config: {},
        inputs: [{ id: 'p-toggle-in', name: 'trigger', dataType: 'pulse' }],
        outputs: [
          { id: 'p-toggle-on', name: 'on', dataType: 'pulse' },
          { id: 'p-toggle-off', name: 'off', dataType: 'pulse' },
        ],
      },
    ],
    patchConnections: [
      { id: 'conn-1', fromPatchId: 'p-tap', fromPortId: 'p-tap-out', toPatchId: 'p-toggle', toPortId: 'p-toggle-in' },
    ],
  };
}

function createDragDismissPreset() {
  return {
    keyframes: [
      { id: 'kf-visible', name: 'Visible', displayStateId: 'ds-visible', summary: 'Card visible', keyElements: [] },
      { id: 'kf-dismissed', name: 'Dismissed', displayStateId: 'ds-dismissed', summary: 'Card dismissed', keyElements: [] },
    ],
    transitions: [],
    components: [],
    frameSize: { width: 390, height: 844 },
    sharedElements: [
      {
        id: 'el-card', name: 'Card', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 200 }, size: { width: 350, height: 200 },
        shapeType: 'rectangle', style: { backgroundColor: '#1e293b', borderRadius: 16 },
      },
      {
        id: 'el-card-text', name: 'Swipe down', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 120, y: 280 }, size: { width: 150, height: 24 },
        shapeType: 'rectangle', style: { color: '#94a3b8', fontSize: 14 },
        textContent: 'Swipe down to dismiss',
      },
    ],
    displayStates: [
      { id: 'ds-visible', name: 'Visible', layerOverrides: [] },
      { id: 'ds-dismissed', name: 'Dismissed', layerOverrides: [
        { layerId: 'el-card', properties: { position: { x: 20, y: 900 }, style: { opacity: 0 } }, isKey: true },
        { layerId: 'el-card-text', properties: { style: { opacity: 0 } }, isKey: true },
      ]},
    ],
    patches: [
      {
        id: 'p-drag', type: 'drag', name: 'Drag Card',
        position: { x: 50, y: 50 },
        config: { targetElementId: 'el-card' },
        inputs: [],
        outputs: [{ id: 'p-drag-end', name: 'endMove', dataType: 'pulse' }],
      },
    ],
    patchConnections: [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────
function loadProjectList(): ProjectFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProjectList(list: ProjectFile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function genId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Component ────────────────────────────────────────────────────────
export function FilesPanel() {
  const [projects, setProjects] = useState<ProjectFile[]>(loadProjectList);
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY)
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [tab, setTab] = useState<'files' | 'presets'>('files');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');

  const loadProject = useEditorStore((s) => s.loadProject);

  // ── Save current project ──
  const handleSave = useCallback(() => {
    const state = useEditorStore.getState();
    const id = activeId || genId();
    const name = projects.find(p => p.id === id)?.name || 'Untitled';

    const data = {
      keyframes: state.keyframes,
      transitions: state.transitions,
      components: state.components,
      frameSize: state.frameSize,
      canvasBackground: state.canvasBackground,
      variables: state.variables,
      conditionRules: state.conditionRules,
    };
    localStorage.setItem(`toumo_proj_${id}`, JSON.stringify(data));

    const updated: ProjectFile = { id, name, updatedAt: Date.now() };
    const list = projects.filter(p => p.id !== id);
    list.unshift(updated);
    setProjects(list);
    saveProjectList(list);
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, [activeId, projects]);

  // ── New project ──
  const handleNew = useCallback(() => {
    const id = genId();
    const file: ProjectFile = { id, name: 'Untitled', updatedAt: Date.now() };
    const list = [file, ...projects];
    setProjects(list);
    saveProjectList(list);
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
    // Reset editor to blank
    window.location.reload();
  }, [projects]);

  // ── Open project ──
  const handleOpen = useCallback((id: string) => {
    try {
      const raw = localStorage.getItem(`toumo_proj_${id}`);
      if (raw) {
        const data = JSON.parse(raw);
        loadProject(data);
        setActiveId(id);
        localStorage.setItem(ACTIVE_KEY, id);
      }
    } catch (e) {
      console.error('Failed to load project', e);
    }
  }, [loadProject]);

  // ── Delete project ──
  const handleDelete = useCallback((id: string) => {
    const list = projects.filter(p => p.id !== id);
    setProjects(list);
    saveProjectList(list);
    localStorage.removeItem(`toumo_proj_${id}`);
    if (activeId === id) {
      setActiveId(null);
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [projects, activeId]);

  // ── Rename ──
  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };
  const commitRename = () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    const list = projects.map(p =>
      p.id === renamingId ? { ...p, name: renameValue.trim() } : p
    );
    setProjects(list);
    saveProjectList(list);
    setRenamingId(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a2a', display: 'flex', gap: 4 }}>
        <TabBtn active={tab === 'files'} onClick={() => setTab('files')}>Files</TabBtn>
        <TabBtn active={tab === 'presets'} onClick={() => setTab('presets')}>Presets</TabBtn>
      </div>

      {tab === 'files' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <ActionBtn onClick={handleNew}>+ New</ActionBtn>
            <ActionBtn onClick={handleSave}>💾 Save</ActionBtn>
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <button onClick={() => setSortBy('recent')} style={{
              flex: 1, padding: '3px 6px', fontSize: 10, border: 'none', borderRadius: 3, cursor: 'pointer',
              background: sortBy === 'recent' ? '#2a2a2a' : 'transparent',
              color: sortBy === 'recent' ? '#fff' : '#666',
            }}>Recent</button>
            <button onClick={() => setSortBy('name')} style={{
              flex: 1, padding: '3px 6px', fontSize: 10, border: 'none', borderRadius: 3, cursor: 'pointer',
              background: sortBy === 'name' ? '#2a2a2a' : 'transparent',
              color: sortBy === 'name' ? '#fff' : '#666',
            }}>Name</button>
          </div>

          {/* File list */}
          {projects.length === 0 && (
            <p style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: 16 }}>
              No saved projects yet
            </p>
          )}
          {[...projects].sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : b.updatedAt - a.updatedAt).map(p => (
            <FileItem
              key={p.id}
              file={p}
              isActive={p.id === activeId}
              isRenaming={p.id === renamingId}
              renameValue={renameValue}
              onRenameChange={setRenameValue}
              onRenameCommit={commitRename}
              onOpen={() => handleOpen(p.id)}
              onDelete={() => handleDelete(p.id)}
              onStartRename={() => startRename(p.id, p.name)}
            />
          ))}
        </div>
      )}

      {tab === 'presets' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {PRESETS.map((preset, i) => (
            <PresetItem key={i} name={preset.name} desc={preset.description} onLoad={() => {
              loadProject(preset.create());
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '4px 8px', fontSize: 11, fontWeight: 500,
        background: active ? '#2a2a2a' : 'transparent',
        color: active ? '#fff' : '#888',
        border: '1px solid ' + (active ? '#444' : 'transparent'),
        borderRadius: 4, cursor: 'pointer',
      }}
    >{children}</button>
  );
}

function ActionBtn({ onClick, children }: {
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '4px 8px', fontSize: 11,
        background: '#1e3a5f', color: '#60a5fa',
        border: '1px solid #2563eb40', borderRadius: 4,
        cursor: 'pointer',
      }}
    >{children}</button>
  );
}

function FileItem({ file, isActive, isRenaming, renameValue, onRenameChange, onRenameCommit, onOpen, onDelete, onStartRename }: {
  file: ProjectFile; isActive: boolean; isRenaming: boolean;
  renameValue: string; onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onOpen: () => void; onDelete: () => void; onStartRename: () => void;
}) {
  const timeStr = new Date(file.updatedAt).toLocaleDateString();
  return (
    <div
      onClick={onOpen}
      style={{
        padding: '6px 8px', marginBottom: 2, borderRadius: 4, cursor: 'pointer',
        background: isActive ? '#2563eb20' : 'transparent',
        border: '1px solid ' + (isActive ? '#2563eb40' : 'transparent'),
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>📄</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') onRenameCommit(); if (e.key === 'Escape') onRenameCommit(); }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', background: '#2a2a2a', color: '#fff',
              border: '1px solid #2563eb', borderRadius: 3,
              padding: '1px 4px', fontSize: 11, outline: 'none',
            }}
          />
        ) : (
          <div
            onDoubleClick={(e) => { e.stopPropagation(); onStartRename(); }}
            style={{ fontSize: 11, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >{file.name}</div>
        )}
        <div style={{ fontSize: 9, color: '#555' }}>{timeStr}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{
          background: 'none', border: 'none', color: '#555',
          cursor: 'pointer', fontSize: 12, padding: '0 2px',
        }}
        title="Delete"
      >×</button>
    </div>
  );
}

function PresetItem({ name, desc, onLoad }: { name: string; desc: string; onLoad: () => void }) {
  return (
    <div
      onClick={onLoad}
      style={{
        padding: '8px', marginBottom: 4, borderRadius: 4,
        background: '#1e1e1e', border: '1px solid #2a2a2a',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 11, color: '#ccc', fontWeight: 500 }}>{name}</div>
      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{desc}</div>
    </div>
  );
}
