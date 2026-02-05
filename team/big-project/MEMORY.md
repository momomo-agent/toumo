# Toumo Development Breakdown

## Current Progress (Feb 6)

| Track | Scope | Status |
|-------|-------|--------|
| 1. Canvas & Editor Core | Multi-frame layout, drawing tools, alignment, selection, zoom/pan | ✅ Base editing done; zoom fix in place |
| 2. Interaction Manager | State graph, transition editing, component view | ✅ Drag-to-create transitions, inline edit, component tab |
| 3. Inspector & State Mapping | Element inspector, functional/display state panels | 🚧 Transition inspector next (trigger, curve, spring) |
| 4. Components & Reuse | Component state machine, mappings | 🚧 Component tab scaffolded; need linking to canvas/inspector |
| 5. Live Preview & Devices | Device presets, state pills, preview controls | 🕓 Basic preview; need multi-device + manual zoom control |
| 6. Export/Playground | Share/demo links, recording | Not started |

## Upcoming Milestones

1. **Transition Inspector 2.0**
   - Editable trigger combos (tap/drag/scroll/variable)
   - Spring curve parameters (damping/response)
   - Hook from state graph edge selection

2. **Component-State Linking**
   - Inspector: view and switch display states per functional state
   - Canvas: highlight component usage; show overrides
   - Interaction Manager: per-component mini graphs synced to inspector

3. **Live Preview Enhancements**
   - Device frame dropdown (iPhone/iPad/Android)
   - Manual zoom slider; intercept browser shortcuts
   - State pill interactions tied to canvas selection

4. **Trigger & Variable Panel**
   - Global triggers/variables list
   - Assign variables to transitions

5. **Playback/Export**
   - Quick demo mode (auto-run transitions)
   - PNG/MP4/GIF export (stretch goal)

Progress will be updated every concept completion (or every 5 min check-in while long tasks run).
