import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useEditorStore } from '../store';

export function useFileOperations() {
  const {
    keyframes,
    transitions,
    components,
    selectedKeyframeId,
    frameSize,
    canvasBackground,
    interactions,
    variables,
    loadProject,
    addImageElement,
  } = useEditorStore();

  const selectedKeyframe = keyframes.find((kf) => kf.id === selectedKeyframeId);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Handle image file upload
  const handleImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSrc = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        addImageElement(imageSrc, img.width, img.height);
      };
      img.src = imageSrc;
    };
    reader.readAsDataURL(file);
  }, [addImageElement]);

  // Export current frame as PNG
  const handleExportPNG = useCallback(async () => {
    const frameElement = document.querySelector(`[data-frame-id="${selectedKeyframeId}"]`) as HTMLElement;
    if (!frameElement) {
      alert('No frame to export');
      return;
    }
    
    try {
      const canvas = await html2canvas(frameElement, {
        backgroundColor: canvasBackground,
        scale: 2,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${selectedKeyframe?.name || 'frame'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed');
    }
  }, [selectedKeyframeId, selectedKeyframe?.name, canvasBackground]);

  // Save project as JSON
  const handleSaveProject = useCallback(() => {
    const projectData = {
      version: '1.0',
      keyframes,
      transitions,
      components,
      frameSize,
      canvasBackground,
      interactions,
      variables,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'toumo-project.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [keyframes, transitions, components, frameSize, canvasBackground, interactions, variables]);

  // Load project from JSON
  const handleLoadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.keyframes) {
          loadProject(data);
          // Restore patches/connections/displayStates if present
          if (data.patches || data.patchConnections || data.sharedElements || data.displayStates) {
            useEditorStore.setState({
              ...(data.patches ? { patches: data.patches } : {}),
              ...(data.patchConnections ? { patchConnections: data.patchConnections } : {}),
              ...(data.sharedElements ? { sharedElements: data.sharedElements } : {}),
              ...(data.displayStates ? { displayStates: data.displayStates } : {}),
            });
          }
        } else {
          alert('Invalid project file');
        }
      } catch (err) {
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadProject]);

  // Load example project
  const handleLoadExampleProject = useCallback((project?: any) => {
    if (project) {
      loadProject(project as Parameters<typeof loadProject>[0]);
      return;
    }
    const baseStyle = { fill: '#3b82f6', fillOpacity: 1, stroke: '', strokeWidth: 0, strokeOpacity: 1, borderRadius: 8 };
    const exampleProject = {
      version: '1.0',
      keyframes: [
        {
          id: 'example-frame-1',
          name: '示例页面',
          summary: '展示 Toumo 基本功能',
          keyElements: [
            {
              id: 'ex-header', name: '标题栏', category: 'content' as const, isKeyElement: true, attributes: [],
              shapeType: 'rectangle' as const, position: { x: 0, y: 0 }, size: { width: 390, height: 60 },
              style: { ...baseStyle, fill: '#1a1a1a', borderRadius: 0 }, zIndex: 10,
            },
            {
              id: 'ex-title', name: '标题', category: 'content' as const, isKeyElement: true, attributes: [],
              shapeType: 'text' as const, position: { x: 145, y: 18 }, size: { width: 100, height: 24 },
              text: 'Toumo', style: { ...baseStyle, fill: '#fff', fontSize: 18, fontWeight: 600 }, zIndex: 11,
            },
            {
              id: 'ex-card', name: '卡片', category: 'content' as const, isKeyElement: true, attributes: [],
              shapeType: 'rectangle' as const, position: { x: 20, y: 80 }, size: { width: 350, height: 120 },
              style: { ...baseStyle, borderRadius: 16, gradientType: 'linear' as const, gradientAngle: 135,
                gradientStops: [{ color: '#3b82f6', position: 0 }, { color: '#8b5cf6', position: 100 }] }, zIndex: 5,
            },
            {
              id: 'ex-card-text', name: '卡片文字', category: 'content' as const, isKeyElement: true, attributes: [],
              shapeType: 'text' as const, position: { x: 40, y: 120 }, size: { width: 310, height: 40 },
              text: '欢迎使用 Toumo', style: { ...baseStyle, fill: '#fff', fontSize: 16 }, zIndex: 6,
            },
            {
              id: 'ex-btn', name: '按钮', category: 'content' as const, isKeyElement: true, attributes: [],
              shapeType: 'rectangle' as const, position: { x: 20, y: 220 }, size: { width: 350, height: 48 },
              style: { ...baseStyle, fill: '#22c55e', borderRadius: 12 }, zIndex: 5,
            },
            {
              id: 'ex-btn-text', name: '按钮文字', category: 'content' as const, isKeyElement: true, attributes: [],
              shapeType: 'text' as const, position: { x: 140, y: 232 }, size: { width: 110, height: 24 },
              text: '开始使用', style: { ...baseStyle, fill: '#fff', fontSize: 16, fontWeight: 600 }, zIndex: 6,
            },
          ],
        },
      ],
      transitions: [], components: [],
      frameSize: { width: 390, height: 844 }, canvasBackground: '#0a0a0a',
    };
    loadProject(exampleProject as Parameters<typeof loadProject>[0]);
  }, [loadProject]);

  return {
    projectInputRef,
    handleImageFile,
    handleExportPNG,
    handleSaveProject,
    handleLoadProject,
    handleLoadExampleProject,
  };
}
