# Canvas Dev Memory

## 2025-02-05
- Resuming Canvas component implementation after interruption. Need to rebuild Canvas.tsx and associated components (CanvasElement, SelectionBox, AlignmentGuides) with drag/resize/selection/alignment features.
- Rebuilt Canvas component suite with drag, resize, marquee selection, snapping guides, and pan/draw interactions. Refactored App shell to use layout components + toolbar and wired keyboard shortcuts for delete/copy/paste/undo/tools.
- Added keyboard nudging for selections (arrow keys with shift for 10px) plus spacebar hand-tool override handled inside Canvas along with new store action `nudgeSelectedElements`.
- Restored Canvas components after accidental removal and reworked `App.tsx` so tools/shortcuts drive the shared store, embedding the interactive canvas next to layers/keyframes with copy/paste/undo controls.
- Added zoom stack: toolbar zoom percentage + reset, plus ctrl/⌘+wheel zoom in Canvas that preserves pointer focus by adjusting offsets.

## 2026-02-05
- Added snapping calculations in Canvas so alignment guides now magnetically snap dragged elements. Multi-selection drags apply the snapping delta to all members for consistent offsets.
- CanvasElement drag handler now batches target positions then applies any snap delta from the primary element back to the rest of the selection. Resize flow still only shows guides (no snapping) for now.
- Build currently fails in src/App.tsx (existing syntax errors around lines 133 and 648) so I could not get a clean `npm run build`.
