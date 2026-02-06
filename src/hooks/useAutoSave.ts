import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store';

const STORAGE_KEY = 'toumo-autosave';
const SAVE_INTERVAL = 30_000; // 30s

export function useAutoSave() {
  const savedRef = useRef(false);

  // Auto-save every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const state = useEditorStore.getState();
        const data = {
          keyframes: state.keyframes,
          transitions: state.transitions,
          frameSize: state.frameSize,
          canvasBackground: state.canvasBackground,
          variables: state.variables,
          savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        savedRef.current = true;
      } catch { /* quota exceeded, ignore */ }
    }, SAVE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // Warn before unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}

export function loadAutoSave(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.keyframes?.length) return false;
    const store = useEditorStore.getState();
    store.loadProject?.(data);
    return true;
  } catch {
    return false;
  }
}

export function clearAutoSave() {
  localStorage.removeItem(STORAGE_KEY);
}
