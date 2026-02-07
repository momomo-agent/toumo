import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store';

const STORAGE_KEY = 'toumo-autosave';
const SAVE_INTERVAL = 30_000; // 30s

/** Snapshot the full project state for persistence */
function getProjectSnapshot() {
  const s = useEditorStore.getState();
  return {
    keyframes: s.keyframes,
    transitions: s.transitions,
    functionalStates: s.functionalStates,
    components: s.components,
    frameSize: s.frameSize,
    canvasBackground: s.canvasBackground,
    variables: s.variables,
    interactions: s.interactions,
    conditionRules: s.conditionRules,
    savedAt: Date.now(),
  };
}

export function useAutoSave() {
  const lastSavedRef = useRef<string>('');
  const dirtyRef = useRef(false);

  // Mark dirty on any keyframe/transition change
  const keyframes = useEditorStore((s) => s.keyframes);
  const transitions = useEditorStore((s) => s.transitions);

  useEffect(() => {
    dirtyRef.current = true;
  }, [keyframes, transitions]);

  // Save helper
  const saveNow = useCallback(() => {
    try {
      const data = getProjectSnapshot();
      const json = JSON.stringify(data);
      // Skip if nothing changed
      if (json === lastSavedRef.current) return;
      localStorage.setItem(STORAGE_KEY, json);
      lastSavedRef.current = json;
      dirtyRef.current = false;
    } catch {
      /* quota exceeded — silently ignore */
    }
  }, []);

  // Auto-save every 30s
  useEffect(() => {
    const timer = setInterval(saveNow, SAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [saveNow]);

  // Also save immediately before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Persist latest state
      saveNow();
      // Warn user if there are unsaved changes
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveNow]);
}

/**
 * Try to restore a previously auto-saved project.
 * Returns true if data was loaded into the store.
 */
export function loadAutoSave(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.keyframes?.length) return false;
    const store = useEditorStore.getState();
    store.loadProject({
      keyframes: data.keyframes,
      transitions: data.transitions || [],
      functionalStates: data.functionalStates || [],
      components: data.components || [],
      frameSize: data.frameSize || { width: 390, height: 844 },
      canvasBackground: data.canvasBackground,
      interactions: data.interactions || [],
      variables: data.variables || [],
      conditionRules: data.conditionRules || [],
    });
    return true;
  } catch {
    return false;
  }
}

export function clearAutoSave() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export the current project as a downloadable JSON file.
 */
export function exportProjectJSON(filename?: string) {
  const data = {
    version: '1.0',
    name: 'Toumo Project',
    ...getProjectSnapshot(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `toumo-project-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import a project from a JSON file (via File input).
 * Returns a promise that resolves to true on success.
 */
export function importProjectJSON(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.keyframes || !Array.isArray(data.keyframes)) {
          resolve(false);
          return;
        }
        const store = useEditorStore.getState();
        store.loadProject({
          keyframes: data.keyframes,
          transitions: data.transitions || [],
          functionalStates: data.functionalStates || [],
          components: data.components || [],
          frameSize: data.frameSize || { width: 390, height: 844 },
          canvasBackground: data.canvasBackground,
          interactions: data.interactions || [],
          variables: data.variables || [],
          conditionRules: data.conditionRules || [],
        });
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}
