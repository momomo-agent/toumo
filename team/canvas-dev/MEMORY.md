# Canvas Dev Memory

## 2025-02-05
- Resuming Canvas component implementation after interruption. Need to rebuild Canvas.tsx and associated components (CanvasElement, SelectionBox, AlignmentGuides) with drag/resize/selection/alignment features.
- Rebuilt Canvas component suite with drag, resize, marquee selection, snapping guides, and pan/draw interactions. Refactored App shell to use layout components + toolbar and wired keyboard shortcuts for delete/copy/paste/undo/tools.
- Added keyboard nudging for selections (arrow keys with shift for 10px) plus spacebar hand-tool override handled inside Canvas along with new store action `nudgeSelectedElements`.
- Restored Canvas components after accidental removal and reworked `App.tsx` so tools/shortcuts drive the shared store, embedding the interactive canvas next to layers/keyframes with copy/paste/undo controls.
