import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/toumo/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk: core framework + state management
          vendor: ['react', 'react-dom', 'zustand'],
          // Libs chunk: heavy third-party libraries
          libs: ['html2canvas', 'gif.js', 'lucide-react', 'lz-string', 'uuid'],
          // Editor chunk: Canvas, Inspector, LayerPanel and related editor UI
          editor: [
            './src/components/Canvas/Canvas.tsx',
            './src/components/Canvas/CanvasElement.tsx',
            './src/components/Canvas/AlignmentGuides.tsx',
            './src/components/Canvas/SelectionBox.tsx',
            './src/components/Canvas/PenTool.tsx',
            './src/components/Canvas/PathEditor.tsx',
            './src/components/Canvas/ZoomControls.tsx',
            './src/components/Canvas/GuideLines.tsx',
            './src/components/Canvas/DisplayStateBar.tsx',
            './src/components/Canvas/CanvasHints.tsx',
            './src/components/Inspector/index.tsx',
            './src/components/Inspector/DesignPanel.tsx',
            './src/components/Inspector/AlignmentPanel.tsx',
            './src/components/Inspector/ColorPicker.tsx',
            './src/components/Inspector/GradientEditor.tsx',
            './src/components/Inspector/TextPropertiesPanel.tsx',
            './src/components/Inspector/ConstraintsPanel.tsx',
            './src/components/Inspector/AutoLayoutPanel.tsx',
            './src/components/Inspector/OverflowPanel.tsx',
            './src/components/Inspector/TransitionInspector.tsx',
            './src/components/Inspector/PrototypeLinkPanel.tsx',
            './src/components/Inspector/StateInspector.tsx',
            './src/components/Inspector/MultiSelectPanel.tsx',
            './src/components/LayerPanel/index.tsx',
            './src/components/LayerManager/index.tsx',
          ],
          // Engine chunk: runtime, animation, and export utilities
          engine: [
            './src/engine/PatchRuntime.ts',
            './src/engine/GestureEngine.ts',
            './src/engine/InteractionExecutor.ts',
            './src/engine/Interpolator.ts',
            './src/engine/SmartAnimate.ts',
            './src/engine/SpringAnimation.ts',
            './src/utils/exportPrototype.ts',
            './src/utils/exportGenerators.ts',
            './src/utils/lottieGenerator.ts',
            './src/utils/booleanOperations.ts',
            './src/utils/gifExport.ts',
          ],
        },
      },
    },
  },
})
