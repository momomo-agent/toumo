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
const PRESETS: { name: string; description: string }[] = [
  { name: 'Button Interaction', description: 'Tap → scale + color change' },
  { name: 'Card Expand', description: 'Tap card → expand with spring' },
  { name: 'Tab Switch', description: 'Tab bar with slide indicator' },
  { name: 'Toggle Switch', description: 'Boolean toggle with spring' },
  { name: 'Drag to Dismiss', description: 'Drag card down to dismiss' },
];

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

          {/* File list */}
          {projects.length === 0 && (
            <p style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: 16 }}>
              No saved projects yet
            </p>
          )}
          {projects.map(p => (
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
            <PresetItem key={i} name={preset.name} desc={preset.description} />
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

function PresetItem({ name, desc }: { name: string; desc: string }) {
  return (
    <div
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
