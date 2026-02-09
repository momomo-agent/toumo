export { useEditorStore, DEVICE_PRESETS } from './useEditorStore';
export type { EditorStore } from './useEditorStore';

// Debug: expose store for testing
if (typeof window !== 'undefined') {
  import('./useEditorStore').then(m => {
    (window as any).__STORE = m.useEditorStore;
  });
}
