import type { StateCreator } from 'zustand';
import type { Position } from '../types';

export interface CanvasSlice {
  // State
  canvasOffset: Position;
  canvasScale: number;
  recentColors: string[];
  canvasBackground: string;
  deviceFrame: 'none' | 'iphone-14-pro' | 'iphone-14' | 'iphone-se' | 'android' | 'ipad';
  showRulers: boolean;
  guides: Array<{ id: string; orientation: 'horizontal' | 'vertical'; position: number }>;
  snapToGuides: boolean;
  snapToGrid: boolean;
  gridSize: number;
  frameBackground: string;

  // Actions
  setCanvasOffset: (offset: Position) => void;
  setCanvasScale: (scale: number) => void;
  zoomToFit: () => void;
  zoomTo100: () => void;
  addRecentColor: (color: string) => void;
  setCanvasBackground: (color: string) => void;
  setDeviceFrame: (frame: 'none' | 'iphone-14-pro' | 'iphone-14' | 'iphone-se' | 'android' | 'ipad') => void;
  toggleRulers: () => void;
  addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  updateGuide: (id: string, position: number) => void;
  removeGuide: (id: string) => void;
  clearGuides: () => void;
  toggleSnapToGuides: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  setFrameBackground: (color: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createCanvasSlice: StateCreator<any, [], [], CanvasSlice> = (set, _get) => ({
  // State
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,
  recentColors: [],
  canvasBackground: '#0d0d0e',
  deviceFrame: 'iphone-14-pro' as const,
  showRulers: false,
  guides: [],
  snapToGuides: true,
  snapToGrid: false,
  gridSize: 10,
  frameBackground: '#1a1a1a',

  // Actions
  setCanvasOffset: (offset: Position) => set({ canvasOffset: offset }),
  setCanvasScale: (scale: number) => set({ canvasScale: scale }),

  zoomToFit: () => {
    const containerWidth = window.innerWidth - 560;
    const containerHeight = window.innerHeight - 100;
    set((state: any) => {
      const frameWidth = state.frameSize.width + 200;
      const frameHeight = state.frameSize.height + 200;
      const scale = Math.min(
        containerWidth / frameWidth,
        containerHeight / frameHeight,
        1
      ) * 0.85;
      const offsetX = (containerWidth - state.frameSize.width * scale) / 2 - 100 * scale;
      const offsetY = (containerHeight - state.frameSize.height * scale) / 2 - 60 * scale;
      return {
        canvasScale: scale,
        canvasOffset: { x: offsetX, y: offsetY }
      };
    });
  },

  zoomTo100: () => set({ canvasScale: 1 }),

  addRecentColor: (color: string) => set((state: any) => ({
    recentColors: [color, ...state.recentColors.filter((c: string) => c !== color)].slice(0, 10)
  })),

  setCanvasBackground: (color: string) => set({ canvasBackground: color }),

  setDeviceFrame: (frame: 'none' | 'iphone-14-pro' | 'iphone-14' | 'iphone-se' | 'android' | 'ipad') => set({ deviceFrame: frame }),

  toggleRulers: () => set((state: any) => ({ showRulers: !state.showRulers })),

  addGuide: (orientation: 'horizontal' | 'vertical', position: number) => set((state: any) => ({
    guides: [...state.guides, { id: `guide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, orientation, position }],
  })),

  updateGuide: (id: string, position: number) => set((state: any) => ({
    guides: state.guides.map((g: any) => g.id === id ? { ...g, position } : g),
  })),

  removeGuide: (id: string) => set((state: any) => ({
    guides: state.guides.filter((g: any) => g.id !== id),
  })),

  clearGuides: () => set({ guides: [] }),

  toggleSnapToGuides: () => set((state: any) => ({ snapToGuides: !state.snapToGuides })),

  toggleSnapToGrid: () => set((state: any) => ({ snapToGrid: !state.snapToGrid })),

  setGridSize: (size: number) => set({ gridSize: size }),

  setFrameBackground: (color: string) => set({ frameBackground: color }),
});
