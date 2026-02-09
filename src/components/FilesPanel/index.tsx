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
      { id: 'kf-hover', name: 'Hover', displayStateId: 'ds-hover', summary: 'Button pressed', keyElements: [] },
    ],
    transitions: [],
    components: [],
    frameSize: { width: 390, height: 844 },
    sharedElements: [
      // Full-screen dark background
      {
        id: 'el-bg', name: 'Background', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 0 }, size: { width: 390, height: 844 },
        shapeType: 'rectangle', style: { fill: '#0f172a' },
      },
      // Status bar area
      {
        id: 'el-statusbar', name: 'Status Bar', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 0 }, size: { width: 390, height: 54 },
        shapeType: 'rectangle', style: { fill: '#0f172a' },
      },
      {
        id: 'el-time', name: 'Time', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 16 }, size: { width: 60, height: 20 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 14, fontWeight: '600' },
        text: '9:41',
      },
      // Page title
      {
        id: 'el-page-title', name: 'Page Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 80 }, size: { width: 350, height: 36 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 28, fontWeight: '700' },
        text: 'Button States',
      },
      // Subtitle
      {
        id: 'el-subtitle', name: 'Subtitle', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 120 }, size: { width: 350, height: 20 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 14 },
        text: 'Interactive button with press feedback',
      },
      // Card container
      {
        id: 'el-card', name: 'Card', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 180 }, size: { width: 350, height: 280 },
        shapeType: 'rectangle', style: { fill: '#1e293b', borderRadius: 20 },
      },
      // Card inner label
      {
        id: 'el-card-label', name: 'Card Label', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 40, y: 200 }, size: { width: 200, height: 20 },
        shapeType: 'text', style: { textColor: '#94a3b8', fontSize: 12, fontWeight: '500' },
        text: 'PRIMARY ACTION',
      },
      // Divider line
      {
        id: 'el-divider', name: 'Divider', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 40, y: 228 }, size: { width: 310, height: 1 },
        shapeType: 'rectangle', style: { fill: '#334155' },
      },
      // Main button
      {
        id: 'el-btn', name: 'Button', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 55, y: 280 }, size: { width: 280, height: 56 },
        shapeType: 'rectangle', style: { fill: '#3b82f6', borderRadius: 16 },
      },
      // Button text
      {
        id: 'el-btn-text', name: 'Submit', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 130, y: 296 }, size: { width: 130, height: 24 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 17, fontWeight: '600' },
        text: 'Submit',
      },
      // Hint text below button
      {
        id: 'el-hint', name: 'Hint', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 105, y: 350 }, size: { width: 180, height: 20 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 13 },
        text: 'Tap to see feedback',
      },
      // Secondary outline button
      {
        id: 'el-btn2', name: 'Secondary Button', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 55, y: 400 }, size: { width: 280, height: 44 },
        shapeType: 'rectangle', style: { fill: 'transparent', borderRadius: 12, stroke: '#334155', strokeWidth: 1 },
      },
      {
        id: 'el-btn2-text', name: 'Cancel', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 150, y: 410 }, size: { width: 90, height: 24 },
        shapeType: 'text', style: { textColor: '#94a3b8', fontSize: 15, fontWeight: '500' },
        text: 'Cancel',
      },
    ],
    displayStates: [
      { id: 'ds-default', name: 'Default', layerOverrides: [] },
      { id: 'ds-hover', name: 'Pressed', layerOverrides: [
        { layerId: 'el-btn', properties: { fill: '#1d4ed8', transform: 'scale(0.95)' }, isKey: true },
        { layerId: 'el-btn-text', properties: { textColor: '#dbeafe' }, isKey: true },
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
        id: 'p-switch', type: 'switchDisplayState', name: 'Switch → Pressed',
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
      // Full-screen dark background
      {
        id: 'el-bg', name: 'Background', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 0 }, size: { width: 390, height: 844 },
        shapeType: 'rectangle', style: { fill: '#0f172a' },
      },
      // Status bar
      {
        id: 'el-time', name: 'Time', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 16 }, size: { width: 60, height: 20 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 14, fontWeight: '600' },
        text: '9:41',
      },
      // Page title
      {
        id: 'el-page-title', name: 'Page Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 70 }, size: { width: 350, height: 36 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 28, fontWeight: '700' },
        text: 'Notifications',
      },
      // Subtitle
      {
        id: 'el-page-sub', name: 'Subtitle', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 110 }, size: { width: 350, height: 20 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 14 },
        text: '3 unread messages',
      },
      // Notification card
      {
        id: 'el-card', name: 'Card', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 160 }, size: { width: 350, height: 100 },
        shapeType: 'rectangle', style: { fill: '#1e293b', borderRadius: 16 },
      },
      // Avatar circle
      {
        id: 'el-avatar', name: 'Avatar', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 180 }, size: { width: 44, height: 44 },
        shapeType: 'ellipse', style: { fill: '#3b82f6' },
      },
      // Avatar initial
      {
        id: 'el-avatar-text', name: 'Avatar Initial', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 48, y: 190 }, size: { width: 20, height: 24 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
        text: 'A',
      },
      // Card title
      {
        id: 'el-title', name: 'Card Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 96, y: 178 }, size: { width: 240, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 15, fontWeight: '600' },
        text: 'Alex Johnson',
      },
      // Card description
      {
        id: 'el-desc', name: 'Description', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 96, y: 202 }, size: { width: 250, height: 18 },
        shapeType: 'text', style: { textColor: '#94a3b8', fontSize: 13 },
        text: 'Hey! Check out the new design...',
      },
      // Timestamp
      {
        id: 'el-timestamp', name: 'Timestamp', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 96, y: 224 }, size: { width: 100, height: 16 },
        shapeType: 'text', style: { textColor: '#475569', fontSize: 11 },
        text: '2 min ago',
      },
      // Expanded content area (hidden by default via opacity)
      {
        id: 'el-expand-body', name: 'Expand Body', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 260 }, size: { width: 310, height: 60 },
        shapeType: 'text', style: { textColor: '#cbd5e1', fontSize: 13, opacity: 0 },
        text: 'I just finished the prototype for the new dashboard. Let me know what you think about the layout and color scheme.',
      },
      // Expand hint
      {
        id: 'el-expand-hint', name: 'Expand Hint', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 140, y: 244 }, size: { width: 120, height: 16 },
        shapeType: 'text', style: { textColor: '#3b82f6', fontSize: 11 },
        text: 'Tap to expand',
      },
      // Second card (static, for visual depth)
      {
        id: 'el-card2', name: 'Card 2', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 280 }, size: { width: 350, height: 80 },
        shapeType: 'rectangle', style: { fill: '#1e293b', borderRadius: 16 },
      },
      {
        id: 'el-avatar2', name: 'Avatar 2', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 296 }, size: { width: 44, height: 44 },
        shapeType: 'ellipse', style: { fill: '#8b5cf6' },
      },
      {
        id: 'el-avatar2-text', name: 'Avatar 2 Initial', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 48, y: 306 }, size: { width: 20, height: 24 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
        text: 'M',
      },
      {
        id: 'el-title2', name: 'Card 2 Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 96, y: 298 }, size: { width: 240, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 15, fontWeight: '600' },
        text: 'Maria Chen',
      },
      {
        id: 'el-desc2', name: 'Card 2 Desc', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 96, y: 320 }, size: { width: 250, height: 18 },
        shapeType: 'text', style: { textColor: '#94a3b8', fontSize: 13 },
        text: 'Meeting moved to 3pm tomorrow',
      },
    ],
    displayStates: [
      { id: 'ds-collapsed', name: 'Collapsed', layerOverrides: [] },
      { id: 'ds-expanded', name: 'Expanded', layerOverrides: [
        { layerId: 'el-card', properties: { size: { width: 350, height: 200 } }, isKey: true },
        { layerId: 'el-expand-body', properties: { opacity: 1 }, isKey: true },
        { layerId: 'el-expand-hint', properties: { opacity: 0 }, isKey: true },
        { layerId: 'el-card2', properties: { position: { x: 20, y: 380 } }, isKey: true },
        { layerId: 'el-avatar2', properties: { position: { x: 36, y: 396 } }, isKey: true },
        { layerId: 'el-avatar2-text', properties: { position: { x: 48, y: 406 } }, isKey: true },
        { layerId: 'el-title2', properties: { position: { x: 96, y: 398 } }, isKey: true },
        { layerId: 'el-desc2', properties: { position: { x: 96, y: 420 } }, isKey: true },
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
      // Full-screen dark background
      {
        id: 'el-bg', name: 'Background', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 0 }, size: { width: 390, height: 844 },
        shapeType: 'rectangle', style: { fill: '#0f172a' },
      },
      // Status bar time
      {
        id: 'el-time', name: 'Time', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 16 }, size: { width: 60, height: 20 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 14, fontWeight: '600' },
        text: '9:41',
      },
      // Nav bar title
      {
        id: 'el-nav-title', name: 'Nav Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 140, y: 60 }, size: { width: 110, height: 24 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 17, fontWeight: '600' },
        text: 'Home',
      },
      // Nav bar divider
      {
        id: 'el-nav-divider', name: 'Nav Divider', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 94 }, size: { width: 390, height: 1 },
        shapeType: 'rectangle', style: { fill: '#1e293b' },
      },
      // Content area - Tab 1 content
      {
        id: 'el-content1', name: 'Content 1', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 130 }, size: { width: 350, height: 30 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 22, fontWeight: '700' },
        text: 'Welcome Home',
      },
      {
        id: 'el-content1-sub', name: 'Content 1 Sub', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 168 }, size: { width: 350, height: 20 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 14 },
        text: 'Your personalized feed',
      },
      // Content card for Tab 1
      {
        id: 'el-content-card', name: 'Content Card', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 210 }, size: { width: 350, height: 160 },
        shapeType: 'rectangle', style: { fill: '#1e293b', borderRadius: 16 },
      },
      {
        id: 'el-content-card-title', name: 'Card Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 40, y: 230 }, size: { width: 200, height: 22 },
        shapeType: 'text', style: { textColor: '#e2e8f0', fontSize: 15, fontWeight: '600' },
        text: 'Featured Story',
      },
      {
        id: 'el-content-card-body', name: 'Card Body', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 40, y: 260 }, size: { width: 290, height: 40 },
        shapeType: 'text', style: { textColor: '#94a3b8', fontSize: 13 },
        text: 'Discover the latest trends in design and technology.',
      },
      // Tab bar background
      {
        id: 'el-tab-bar', name: 'Tab Bar', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 780 }, size: { width: 390, height: 64 },
        shapeType: 'rectangle', style: { fill: '#111827' },
      },
      // Tab bar top border
      {
        id: 'el-tab-border', name: 'Tab Border', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 780 }, size: { width: 390, height: 1 },
        shapeType: 'rectangle', style: { fill: '#1e293b' },
      },
      // Tab labels
      {
        id: 'el-tab1', name: 'Tab 1', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 30, y: 798 }, size: { width: 100, height: 20 },
        shapeType: 'text', style: { textColor: '#3b82f6', fontSize: 11, fontWeight: '600' },
        text: 'Home',
      },
      {
        id: 'el-tab2', name: 'Tab 2', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 145, y: 798 }, size: { width: 100, height: 20 },
        shapeType: 'text', style: { textColor: '#6b7280', fontSize: 11 },
        text: 'Search',
      },
      {
        id: 'el-tab3', name: 'Tab 3', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 260, y: 798 }, size: { width: 100, height: 20 },
        shapeType: 'text', style: { textColor: '#6b7280', fontSize: 11 },
        text: 'Profile',
      },
      // Tab icons (circles as icon placeholders)
      {
        id: 'el-icon1', name: 'Icon 1', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 55, y: 788 }, size: { width: 8, height: 8 },
        shapeType: 'ellipse', style: { fill: '#3b82f6' },
      },
      {
        id: 'el-icon2', name: 'Icon 2', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 170, y: 788 }, size: { width: 8, height: 8 },
        shapeType: 'ellipse', style: { fill: '#6b7280' },
      },
      {
        id: 'el-icon3', name: 'Icon 3', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 285, y: 788 }, size: { width: 8, height: 8 },
        shapeType: 'ellipse', style: { fill: '#6b7280' },
      },
      // Indicator bar
      {
        id: 'el-indicator', name: 'Indicator', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 30, y: 822 }, size: { width: 100, height: 3 },
        shapeType: 'rectangle', style: { fill: '#3b82f6', borderRadius: 2 },
      },
    ],
    displayStates: [
      { id: 'ds-tab1', name: 'Tab 1', layerOverrides: [] },
      { id: 'ds-tab2', name: 'Tab 2', layerOverrides: [
        { layerId: 'el-nav-title', properties: { text: 'Search' }, isKey: true },
        { layerId: 'el-content1', properties: { text: 'Explore' }, isKey: true },
        { layerId: 'el-content1-sub', properties: { text: 'Find what you\'re looking for' }, isKey: true },
        { layerId: 'el-content-card-title', properties: { text: 'Trending Now' }, isKey: true },
        { layerId: 'el-content-card-body', properties: { text: 'Browse popular topics and creators.' }, isKey: true },
        { layerId: 'el-tab1', properties: { textColor: '#6b7280', fontWeight: '400' }, isKey: true },
        { layerId: 'el-tab2', properties: { textColor: '#3b82f6', fontWeight: '600' }, isKey: true },
        { layerId: 'el-icon1', properties: { fill: '#6b7280' }, isKey: true },
        { layerId: 'el-icon2', properties: { fill: '#3b82f6' }, isKey: true },
        { layerId: 'el-indicator', properties: { position: { x: 145, y: 822 } }, isKey: true },
      ]},
      { id: 'ds-tab3', name: 'Tab 3', layerOverrides: [
        { layerId: 'el-nav-title', properties: { text: 'Profile' }, isKey: true },
        { layerId: 'el-content1', properties: { text: 'Your Profile' }, isKey: true },
        { layerId: 'el-content1-sub', properties: { text: 'Manage your account settings' }, isKey: true },
        { layerId: 'el-content-card-title', properties: { text: 'Account Info' }, isKey: true },
        { layerId: 'el-content-card-body', properties: { text: 'Update your profile and preferences.' }, isKey: true },
        { layerId: 'el-tab1', properties: { textColor: '#6b7280', fontWeight: '400' }, isKey: true },
        { layerId: 'el-tab3', properties: { textColor: '#3b82f6', fontWeight: '600' }, isKey: true },
        { layerId: 'el-icon1', properties: { fill: '#6b7280' }, isKey: true },
        { layerId: 'el-icon3', properties: { fill: '#3b82f6' }, isKey: true },
        { layerId: 'el-indicator', properties: { position: { x: 260, y: 822 } }, isKey: true },
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
      // Full-screen dark background
      {
        id: 'el-bg', name: 'Background', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 0 }, size: { width: 390, height: 844 },
        shapeType: 'rectangle', style: { fill: '#0f172a' },
      },
      // Status bar time
      {
        id: 'el-time', name: 'Time', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 16 }, size: { width: 60, height: 20 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 14, fontWeight: '600' },
        text: '9:41',
      },
      // Page title
      {
        id: 'el-page-title', name: 'Settings Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 70 }, size: { width: 350, height: 36 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 28, fontWeight: '700' },
        text: 'Settings',
      },
      // Settings group card
      {
        id: 'el-group', name: 'Settings Group', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 140 }, size: { width: 350, height: 240 },
        shapeType: 'rectangle', style: { fill: '#1e293b', borderRadius: 16 },
      },
      // Group label
      {
        id: 'el-group-label', name: 'Group Label', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 152 }, size: { width: 200, height: 16 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 11, fontWeight: '600' },
        text: 'APPEARANCE',
      },
      // Row 1: Dark Mode toggle
      {
        id: 'el-row1-label', name: 'Dark Mode Label', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 186 }, size: { width: 200, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 16 },
        text: 'Dark Mode',
      },
      // Toggle track
      {
        id: 'el-track', name: 'Track', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 298, y: 182 }, size: { width: 52, height: 30 },
        shapeType: 'rectangle', style: { fill: '#374151', borderRadius: 15 },
      },
      // Toggle thumb
      {
        id: 'el-thumb', name: 'Thumb', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 301, y: 185 }, size: { width: 24, height: 24 },
        shapeType: 'ellipse', style: { fill: '#ffffff' },
      },
      // Divider 1
      {
        id: 'el-div1', name: 'Divider 1', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 220 }, size: { width: 318, height: 1 },
        shapeType: 'rectangle', style: { fill: '#334155' },
      },
      // Row 2: Notifications (static)
      {
        id: 'el-row2-label', name: 'Notifications Label', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 240 }, size: { width: 200, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 16 },
        text: 'Notifications',
      },
      {
        id: 'el-row2-value', name: 'Notifications Value', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 280, y: 240 }, size: { width: 70, height: 22 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 14 },
        text: 'On',
      },
      // Divider 2
      {
        id: 'el-div2', name: 'Divider 2', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 274 }, size: { width: 318, height: 1 },
        shapeType: 'rectangle', style: { fill: '#334155' },
      },
      // Row 3: Language (static)
      {
        id: 'el-row3-label', name: 'Language Label', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 294 }, size: { width: 200, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 16 },
        text: 'Language',
      },
      {
        id: 'el-row3-value', name: 'Language Value', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 260, y: 294 }, size: { width: 90, height: 22 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 14 },
        text: 'English',
      },
      // Divider 3
      {
        id: 'el-div3', name: 'Divider 3', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 328 }, size: { width: 318, height: 1 },
        shapeType: 'rectangle', style: { fill: '#334155' },
      },
      // Row 4: Sound (static)
      {
        id: 'el-row4-label', name: 'Sound Label', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 348 }, size: { width: 200, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 16 },
        text: 'Sound',
      },
      {
        id: 'el-row4-value', name: 'Sound Value', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 280, y: 348 }, size: { width: 70, height: 22 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 14 },
        text: 'Default',
      },
    ],
    displayStates: [
      { id: 'ds-off', name: 'Off', layerOverrides: [] },
      { id: 'ds-on', name: 'On', layerOverrides: [
        { layerId: 'el-track', properties: { fill: '#22c55e' }, isKey: true },
        { layerId: 'el-thumb', properties: { position: { x: 323, y: 185 } }, isKey: true },
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
      // Full-screen dark background
      {
        id: 'el-bg', name: 'Background', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 0, y: 0 }, size: { width: 390, height: 844 },
        shapeType: 'rectangle', style: { fill: '#0f172a' },
      },
      // Status bar time
      {
        id: 'el-time', name: 'Time', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 16 }, size: { width: 60, height: 20 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 14, fontWeight: '600' },
        text: '9:41',
      },
      // Page title
      {
        id: 'el-page-title', name: 'Page Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 70 }, size: { width: 350, height: 36 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 28, fontWeight: '700' },
        text: 'Inbox',
      },
      // Subtitle
      {
        id: 'el-page-sub', name: 'Subtitle', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 110 }, size: { width: 350, height: 20 },
        shapeType: 'text', style: { textColor: '#64748b', fontSize: 14 },
        text: 'Swipe notifications to dismiss',
      },
      // Notification card (draggable)
      {
        id: 'el-card', name: 'Notification Card', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 170 }, size: { width: 350, height: 100 },
        shapeType: 'rectangle', style: { fill: '#1e293b', borderRadius: 16 },
      },
      // Notification icon circle
      {
        id: 'el-icon', name: 'Icon', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 192 }, size: { width: 40, height: 40 },
        shapeType: 'ellipse', style: { fill: '#ef4444' },
      },
      // Icon letter
      {
        id: 'el-icon-text', name: 'Icon Text', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 48, y: 200 }, size: { width: 20, height: 24 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
        text: '!',
      },
      // Notification title
      {
        id: 'el-notif-title', name: 'Notif Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 92, y: 188 }, size: { width: 240, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 15, fontWeight: '600' },
        text: 'System Alert',
      },
      // Notification description
      {
        id: 'el-notif-desc', name: 'Notif Desc', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 92, y: 212 }, size: { width: 250, height: 18 },
        shapeType: 'text', style: { textColor: '#94a3b8', fontSize: 13 },
        text: 'Your storage is almost full. Free up space.',
      },
      // Timestamp
      {
        id: 'el-notif-time', name: 'Notif Time', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 92, y: 236 }, size: { width: 100, height: 16 },
        shapeType: 'text', style: { textColor: '#475569', fontSize: 11 },
        text: 'Just now',
      },
      // Second notification (static, for depth)
      {
        id: 'el-card2', name: 'Card 2', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 290 }, size: { width: 350, height: 80 },
        shapeType: 'rectangle', style: { fill: '#1e293b', borderRadius: 16 },
      },
      {
        id: 'el-icon2', name: 'Icon 2', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 306 }, size: { width: 40, height: 40 },
        shapeType: 'ellipse', style: { fill: '#3b82f6' },
      },
      {
        id: 'el-icon2-text', name: 'Icon 2 Text', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 48, y: 314 }, size: { width: 20, height: 24 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
        text: '✓',
      },
      {
        id: 'el-title2', name: 'Card 2 Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 92, y: 308 }, size: { width: 240, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 15, fontWeight: '600' },
        text: 'Update Complete',
      },
      {
        id: 'el-desc2', name: 'Card 2 Desc', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 92, y: 330 }, size: { width: 250, height: 18 },
        shapeType: 'text', style: { textColor: '#94a3b8', fontSize: 13 },
        text: 'App has been updated to v2.4.1',
      },
      // Third notification (static)
      {
        id: 'el-card3', name: 'Card 3', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 20, y: 390 }, size: { width: 350, height: 80 },
        shapeType: 'rectangle', style: { fill: '#1e293b', borderRadius: 16 },
      },
      {
        id: 'el-icon3', name: 'Icon 3', category: 'shape' as const, isKeyElement: true,
        attributes: [], position: { x: 36, y: 406 }, size: { width: 40, height: 40 },
        shapeType: 'ellipse', style: { fill: '#8b5cf6' },
      },
      {
        id: 'el-icon3-text', name: 'Icon 3 Text', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 48, y: 414 }, size: { width: 20, height: 24 },
        shapeType: 'text', style: { textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
        text: '★',
      },
      {
        id: 'el-title3', name: 'Card 3 Title', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 92, y: 408 }, size: { width: 240, height: 22 },
        shapeType: 'text', style: { textColor: '#f1f5f9', fontSize: 15, fontWeight: '600' },
        text: 'New Feature',
      },
      {
        id: 'el-desc3', name: 'Card 3 Desc', category: 'text' as const, isKeyElement: true,
        attributes: [], position: { x: 92, y: 430 }, size: { width: 250, height: 18 },
        shapeType: 'text', style: { textColor: '#94a3b8', fontSize: 13 },
        text: 'Try the new gesture controls',
      },
    ],
    displayStates: [
      { id: 'ds-visible', name: 'Visible', layerOverrides: [] },
      { id: 'ds-dismissed', name: 'Dismissed', layerOverrides: [
        { layerId: 'el-card', properties: { position: { x: 400, y: 170 }, style: { opacity: 0 } }, isKey: true },
        { layerId: 'el-icon', properties: { opacity: 0 }, isKey: true },
        { layerId: 'el-icon-text', properties: { opacity: 0 }, isKey: true },
        { layerId: 'el-notif-title', properties: { opacity: 0 }, isKey: true },
        { layerId: 'el-notif-desc', properties: { opacity: 0 }, isKey: true },
        { layerId: 'el-notif-time', properties: { opacity: 0 }, isKey: true },
        { layerId: 'el-card2', properties: { position: { x: 20, y: 170 } }, isKey: true },
        { layerId: 'el-icon2', properties: { position: { x: 36, y: 186 } }, isKey: true },
        { layerId: 'el-icon2-text', properties: { position: { x: 48, y: 194 } }, isKey: true },
        { layerId: 'el-title2', properties: { position: { x: 92, y: 188 } }, isKey: true },
        { layerId: 'el-desc2', properties: { position: { x: 92, y: 210 } }, isKey: true },
        { layerId: 'el-card3', properties: { position: { x: 20, y: 270 } }, isKey: true },
        { layerId: 'el-icon3', properties: { position: { x: 36, y: 286 } }, isKey: true },
        { layerId: 'el-icon3-text', properties: { position: { x: 48, y: 294 } }, isKey: true },
        { layerId: 'el-title3', properties: { position: { x: 92, y: 288 } }, isKey: true },
        { layerId: 'el-desc3', properties: { position: { x: 92, y: 310 } }, isKey: true },
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
      sharedElements: state.sharedElements,
      displayStates: state.displayStates,
      patches: state.patches,
      patchConnections: state.patchConnections,
      componentsV2: state.componentsV2,
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
