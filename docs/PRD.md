# Interactive Motion Design Tool (State Machine PRD)

## 1. Summary
- Web-based motion/interaction design tool with explicit state machines instead of timelines.
- Single layer tree + keyframe-driven display states + independent functional logic.
- Components support multi-state reuse; motion curves follow global → element → attribute overrides.
- Keyframes explicitly mark key elements/attributes; non-key parts stay untouched.

## 2. Goals & Non-Goals
(unchanged)

## 3. Personas & Use Cases
(unchanged)

## 4. Key Concepts
(unchanged)

## 5. State Machine Model
(unchanged)

## 6. Editing Experience / Layout
- **Overall layout**: Left = live preview (always interactive); Right = editing workspace split into three columns.
  1. **Layer Manager (left of edit area)**: Figma-style layer tree. Every layer operation (rename, hide, re-order, nested frames) mirrors Figma behavior. Per-layer toggle for "key element" in current keyframe.
  2. **Canvas + Interaction Manager (center)**:
     - Canvas hosts keyframes arranged linearly from left to right (no free placement). Each keyframe panel shows the Figma-like editing surface for that state.
     - Within each keyframe panel, editing interactions match Figma (select, move, constraints, etc.).
     - Interaction Manager sits below canvas with tabs for functional state graph + keyframe graph.
  3. **Inspector (right)**: property settings, curve overrides, transition setup; includes key attribute toggles and per-transition parameters.

## 7. Data Model & Storage Notes
(unchanged)

## 8-10 (unchanged)
