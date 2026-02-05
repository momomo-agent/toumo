import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import type { MouseEvent } from "react";
import "./App.css";
import { ColorPicker } from "./components/ColorPicker";

type KeyAttribute = {
  id: string;
  label: string;
  value: string;
  targeted: boolean;
  curve: string;
};

type Position = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

// Tool types for the toolbar
type ToolType = "select" | "rectangle" | "ellipse" | "text" | "hand";

// Shape element types
type ShapeType = "rectangle" | "ellipse" | "text" | "keyframe-element";

// Style properties for shapes
type ShapeStyle = {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  borderRadius: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
};

type KeyElement = {
  id: string;
  name: string;
  category: "content" | "component" | "system";
  isKeyElement: boolean;
  locked?: boolean;
  visible?: boolean;
  groupId?: string;
  attributes: KeyAttribute[];
  position: Position;
  size: Size;
  // New shape properties
  shapeType?: ShapeType;
  style?: ShapeStyle;
  text?: string;
};

type Keyframe = {
  id: string;
  name: string;
  summary: string;
  functionalState?: string;
  keyElements: KeyElement[];
};

type FunctionalState = {
  id: string;
  name: string;
  description: string;
};

type Transition = {
  id: string;
  from: string;
  to: string;
  trigger: string;
  duration: number;
  delay: number;
  curve: string;
  // Spring animation params
  springDamping?: number;  // dampingRatio: 0-1 (1=critically damped)
  springResponse?: number; // response time in seconds
  description?: string;
};

const functionalStates: FunctionalState[] = [
  { id: "idle", name: "Idle", description: "Waiting for user input" },
  { id: "loading", name: "Loading", description: "Async request in progress" },
  { id: "success", name: "Success", description: "Positive API response" },
  { id: "error", name: "Error", description: "Fallback when request fails" },
];

const initialKeyframes: Keyframe[] = [
  {
    id: "kf-idle",
    name: "Idle",
    summary: "Hero + CTA ready for interaction",
    functionalState: "idle",
    keyElements: [
      {
        id: "hero",
        name: "Hero Card",
        category: "content",
        isKeyElement: true,
        position: { x: 40, y: 20 },
        size: { width: 280, height: 120 },
        attributes: [
          { id: "hero-scale-idle", label: "Scale", value: "100%", targeted: true, curve: "global" },
          { id: "hero-opacity-idle", label: "Opacity", value: "1", targeted: true, curve: "global" },
        ],
      },
      {
        id: "copy",
        name: "Supporting Copy",
        category: "content",
        isKeyElement: true,
        position: { x: 40, y: 150 },
        size: { width: 280, height: 40 },
        attributes: [
          { id: "copy-opacity-idle", label: "Opacity", value: "0.92", targeted: true, curve: "global" },
          { id: "copy-tracking-idle", label: "Letter spacing", value: "0", targeted: false, curve: "inherit" },
        ],
      },
      {
        id: "cta",
        name: "CTA Button",
        category: "component",
        isKeyElement: false,
        position: { x: 100, y: 210 },
        size: { width: 160, height: 48 },
        attributes: [
          { id: "cta-y-idle", label: "Y offset", value: "0px", targeted: false, curve: "inherit" },
          { id: "cta-shadow-idle", label: "Shadow", value: "Soft / L", targeted: false, curve: "inherit" },
        ],
      },
      {
        id: "skeleton",
        name: "Skeleton Loader",
        category: "system",
        isKeyElement: false,
        position: { x: 40, y: 280 },
        size: { width: 280, height: 60 },
        attributes: [
          { id: "skeleton-opacity-idle", label: "Opacity", value: "0", targeted: true, curve: "global" },
        ],
      },
      {
        id: "badge",
        name: "Success Badge",
        category: "component",
        isKeyElement: false,
        position: { x: 270, y: 20 },
        size: { width: 48, height: 48 },
        attributes: [
          { id: "badge-scale-idle", label: "Scale", value: "80%", targeted: false, curve: "inherit" },
          { id: "badge-opacity-idle", label: "Opacity", value: "0", targeted: true, curve: "global" },
        ],
      },
    ],
  },
  {
    id: "kf-loading",
    name: "Loading",
    summary: "CTA lifts, skeleton fades in",
    functionalState: "loading",
    keyElements: [
      {
        id: "hero",
        name: "Hero Card",
        category: "content",
        isKeyElement: true,
        position: { x: 40, y: 20 },
        size: { width: 280, height: 120 },
        attributes: [
          { id: "hero-scale-loading", label: "Scale", value: "96%", targeted: true, curve: "ease-in" },
          { id: "hero-opacity-loading", label: "Opacity", value: "0.35", targeted: true, curve: "ease-in" },
        ],
      },
      {
        id: "copy",
        name: "Supporting Copy",
        category: "content",
        isKeyElement: false,
        position: { x: 40, y: 150 },
        size: { width: 280, height: 40 },
        attributes: [
          { id: "copy-opacity-loading", label: "Opacity", value: "0.4", targeted: true, curve: "ease-in" },
          { id: "copy-blur-loading", label: "Blur", value: "6px", targeted: true, curve: "ease-in" },
        ],
      },
      {
        id: "cta",
        name: "CTA Button",
        category: "component",
        isKeyElement: true,
        position: { x: 100, y: 238 },
        size: { width: 160, height: 48 },
        attributes: [
          { id: "cta-y-loading", label: "Y offset", value: "28px", targeted: true, curve: "spring" },
          { id: "cta-opacity-loading", label: "Opacity", value: "0.5", targeted: true, curve: "ease-in" },
        ],
      },
      {
        id: "skeleton",
        name: "Skeleton Loader",
        category: "system",
        isKeyElement: true,
        position: { x: 40, y: 280 },
        size: { width: 280, height: 60 },
        attributes: [
          { id: "skeleton-opacity-loading", label: "Opacity", value: "1", targeted: true, curve: "ease-out" },
          { id: "skeleton-glow-loading", label: "Glow", value: "Pulse", targeted: true, curve: "ease-out" },
        ],
      },
      {
        id: "badge",
        name: "Success Badge",
        category: "component",
        isKeyElement: false,
        position: { x: 270, y: 20 },
        size: { width: 48, height: 48 },
        attributes: [
          { id: "badge-opacity-loading", label: "Opacity", value: "0", targeted: true, curve: "global" },
        ],
      },
    ],
  },
  {
    id: "kf-success",
    name: "Success",
    summary: "Badge pops, CTA resets",
    functionalState: "success",
    keyElements: [
      {
        id: "hero",
        name: "Hero Card",
        category: "content",
        isKeyElement: false,
        position: { x: 40, y: 20 },
        size: { width: 280, height: 120 },
        attributes: [
          { id: "hero-scale-success", label: "Scale", value: "100%", targeted: true, curve: "ease-out" },
          { id: "hero-opacity-success", label: "Opacity", value: "1", targeted: true, curve: "ease-out" },
        ],
      },
      {
        id: "copy",
        name: "Supporting Copy",
        category: "content",
        isKeyElement: true,
        position: { x: 40, y: 150 },
        size: { width: 280, height: 40 },
        attributes: [
          { id: "copy-opacity-success", label: "Opacity", value: "0.96", targeted: true, curve: "ease-out" },
          { id: "copy-color-success", label: "Color", value: "emerald", targeted: true, curve: "ease-out" },
        ],
      },
      {
        id: "cta",
        name: "CTA Button",
        category: "component",
        isKeyElement: true,
        position: { x: 100, y: 210 },
        size: { width: 160, height: 48 },
        attributes: [
          { id: "cta-y-success", label: "Y offset", value: "0px", targeted: true, curve: "spring" },
          { id: "cta-fill-success", label: "Fill", value: "Accent / Lime", targeted: true, curve: "spring" },
        ],
      },
      {
        id: "skeleton",
        name: "Skeleton Loader",
        category: "system",
        isKeyElement: false,
        position: { x: 40, y: 280 },
        size: { width: 280, height: 60 },
        attributes: [
          { id: "skeleton-opacity-success", label: "Opacity", value: "0", targeted: true, curve: "ease-in" },
        ],
      },
      {
        id: "badge",
        name: "Success Badge",
        category: "component",
        isKeyElement: true,
        position: { x: 270, y: 20 },
        size: { width: 48, height: 48 },
        attributes: [
          { id: "badge-scale-success", label: "Scale", value: "120%", targeted: true, curve: "overshoot" },
          { id: "badge-opacity-success", label: "Opacity", value: "1", targeted: true, curve: "overshoot" },
        ],
      },
    ],
  },
];

const initialTransitions: Transition[] = [
  {
    id: "transition-1",
    from: "kf-idle",
    to: "kf-loading",
    trigger: "On CTA tap",
    duration: 360,
    delay: 40,
    curve: "ease-in-out",
    description: "User submits form",
  },
  {
    id: "transition-2",
    from: "kf-loading",
    to: "kf-success",
    trigger: "API resolves",
    duration: 420,
    delay: 80,
    curve: "spring",
    description: "Server returns success payload",
  },
  {
    id: "transition-3",
    from: "kf-loading",
    to: "kf-idle",
    trigger: "API error",
    duration: 240,
    delay: 0,
    curve: "ease-in",
    description: "Retry scenario",
  },
];

const App = () => {
  const [keyframes, setKeyframes] = useState<Keyframe[]>(initialKeyframes);
  const [transitions, setTransitions] = useState<Transition[]>(initialTransitions);
  
  // Undo/Redo history
  const [history, setHistory] = useState<Keyframe[][]>([initialKeyframes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedo = useRef(false);
  
  useEffect(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(keyframes);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [keyframes]);
  
  const undo = () => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      setHistoryIndex(historyIndex - 1);
      setKeyframes(history[historyIndex - 1]);
    }
  };
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      setHistoryIndex(historyIndex + 1);
      setKeyframes(history[historyIndex + 1]);
    }
  };
  
  const [selectedKeyframeId, setSelectedKeyframeId] = useState(keyframes[0].id);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    keyframes[0].keyElements[0]?.id ?? null
  );
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<KeyElement[]>([]);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectStart, setBoxSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [boxSelectEnd, setBoxSelectEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectedFunctionalState, setSelectedFunctionalState] = useState(
    keyframes[0].functionalState ?? functionalStates[0].id
  );
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(
    initialTransitions[0]?.id ?? null
  );

  // Tool state
  const [currentTool, setCurrentTool] = useState<ToolType>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Default styles for new shapes
  const defaultStyle: ShapeStyle = {
    fill: "#4A90D9",
    fillOpacity: 1,
    stroke: "#2D5A87",
    strokeWidth: 2,
    strokeOpacity: 1,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "normal",
    textAlign: "left",
  };

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  
  // Animation state for smooth transitions
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animatingFromKeyframe, setAnimatingFromKeyframe] = useState<Keyframe | null>(null);
  const [animatingToKeyframe, setAnimatingToKeyframe] = useState<Keyframe | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; elementId: string} | null>(null);
  const panRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const dragRef = useRef<{ elementId: string; startX: number; startY: number; origX: number; origY: number; origPositions?: Record<string, {x: number; y: number}>; altCopy?: boolean } | null>(null);
  const resizeRef = useRef<{ elementId: string; startX: number; startY: number; origW: number; origH: number; corner: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedKeyframe = useMemo(
    () => keyframes.find((frame) => frame.id === selectedKeyframeId)!,
    [keyframes, selectedKeyframeId]
  );

  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    return (
      selectedKeyframe.keyElements.find((el) => el.id === selectedElementId) ?? null
    );
  }, [selectedElementId, selectedKeyframe]);

  const outgoingTransitions = useMemo(
    () => transitions.filter((transition) => transition.from === selectedKeyframeId),
    [transitions, selectedKeyframeId]
  );

  const incomingTransitions = useMemo(
    () => transitions.filter((transition) => transition.to === selectedKeyframeId),
    [transitions, selectedKeyframeId]
  );

  const selectedTransition = useMemo(() => {
    if (!selectedTransitionId) {
      return outgoingTransitions[0] ?? incomingTransitions[0] ?? null;
    }
    return (
      transitions.find((transition) => transition.id === selectedTransitionId) ??
      outgoingTransitions[0] ??
      incomingTransitions[0] ??
      null
    );
  }, [selectedTransitionId, transitions, outgoingTransitions, incomingTransitions]);

  // Drag handlers
  const handleCanvasMouseDown = useCallback((e: MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = selectedKeyframe.keyElements.find((el) => el.id === elementId);
    if (!element) return;
    
    setSelectedElementId(elementId);
    
    // Don't allow dragging locked elements
    if (element.locked) return;
    
    // Record original positions for all selected elements
    const origPositions: Record<string, {x: number; y: number}> = {};
    const idsToMove = selectedElementIds.length > 0 ? selectedElementIds : [elementId];
    idsToMove.forEach(id => {
      const el = selectedKeyframe.keyElements.find(e => e.id === id);
      if (el) origPositions[id] = { x: el.position.x, y: el.position.y };
    });
    origPositions[elementId] = { x: element.position.x, y: element.position.y };
    
    setIsDragging(true);
    dragRef.current = {
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      origX: element.position.x,
      origY: element.position.y,
      origPositions,
      altCopy: e.altKey,
    };
  }, [selectedKeyframe, selectedElementIds]);

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    // Handle panning
    if (isPanning && panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setCanvasOffset({
        x: panRef.current.origX + dx,
        y: panRef.current.origY + dy,
      });
      return;
    }

    if (isResizing && resizeRef.current) {
      const dx = (e.clientX - resizeRef.current.startX) / canvasScale;
      const dy = (e.clientY - resizeRef.current.startY) / canvasScale;
      
      setKeyframes((prev) =>
        prev.map((frame) => {
          if (frame.id !== selectedKeyframeId) return frame;
          return {
            ...frame,
            keyElements: frame.keyElements.map((el) => {
              if (el.id !== resizeRef.current!.elementId) return el;
              return {
                ...el,
                size: {
                  width: Math.max(60, resizeRef.current!.origW + dx),
                  height: Math.max(40, resizeRef.current!.origH + dy),
                },
              };
            }),
          };
        })
      );
      return;
    }
    
    if (!isDragging || !dragRef.current) return;
    
    let dx = (e.clientX - dragRef.current.startX) / canvasScale;
    let dy = (e.clientY - dragRef.current.startY) / canvasScale;
    
    // Shift key constrains to horizontal or vertical
    if (e.shiftKey) {
      if (Math.abs(dx) > Math.abs(dy)) dy = 0;
      else dx = 0;
    }
    
    // Get all elements to move (selected + same group)
    const elementsToMove = new Set<string>([dragRef.current.elementId]);
    if (selectedElementIds.length > 0) {
      selectedElementIds.forEach(id => elementsToMove.add(id));
    }
    
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (!elementsToMove.has(el.id)) return el;
            const origPos = dragRef.current!.origPositions?.[el.id] || { x: el.position.x - dx, y: el.position.y - dy };
            return {
              ...el,
              position: {
                x: Math.max(0, origPos.x + dx),
                y: Math.max(0, origPos.y + dy),
              },
            };
          }),
        };
      })
    );
  }, [isDragging, isResizing, isPanning, selectedKeyframeId, canvasScale, selectedElementIds]);

  // Create shape element - defined before handlers that use it
  const createShapeElement = useCallback((shapeType: ShapeType, x: number, y: number, width: number, height: number) => {
    const names: Record<ShapeType, string> = {
      rectangle: "Rectangle",
      ellipse: "Ellipse",
      text: "Text",
      "keyframe-element": "Element",
    };
    
    const newElement: KeyElement = {
      id: `el-${Date.now()}`,
      name: `${names[shapeType]} ${selectedKeyframe.keyElements.length + 1}`,
      category: "component",
      isKeyElement: false,
      position: { x, y },
      size: { width: Math.max(width, 20), height: Math.max(height, 20) },
      shapeType,
      style: { ...defaultStyle },
      text: shapeType === "text" ? "Text" : undefined,
      attributes: [],
    };

    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return { ...frame, keyElements: [...frame.keyElements, newElement] };
      })
    );
    setSelectedElementId(newElement.id);
    setCurrentTool("select");
    
    if (shapeType === "text") {
      setEditingTextId(newElement.id);
    }
  }, [selectedKeyframe.keyElements.length, selectedKeyframeId, defaultStyle]);

  const handleCanvasMouseUp = useCallback(() => {
    // Handle drawing completion
    if (isDrawing && drawStart && drawEnd) {
      const minX = Math.min(drawStart.x, drawEnd.x);
      const minY = Math.min(drawStart.y, drawEnd.y);
      const width = Math.abs(drawEnd.x - drawStart.x);
      const height = Math.abs(drawEnd.y - drawStart.y);
      
      if (width > 5 && height > 5) {
        const shapeType = currentTool === "rectangle" ? "rectangle" : "ellipse";
        createShapeElement(shapeType, minX, minY, width, height);
      }
      
      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
      return;
    }
    
    // Handle box selection end
    if (isBoxSelecting && boxSelectStart && boxSelectEnd) {
      const minX = Math.min(boxSelectStart.x, boxSelectEnd.x);
      const maxX = Math.max(boxSelectStart.x, boxSelectEnd.x);
      const minY = Math.min(boxSelectStart.y, boxSelectEnd.y);
      const maxY = Math.max(boxSelectStart.y, boxSelectEnd.y);
      
      const selected = selectedKeyframe.keyElements
        .filter((el) => {
          const elRight = el.position.x + el.size.width;
          const elBottom = el.position.y + el.size.height;
          return el.position.x < maxX && elRight > minX && el.position.y < maxY && elBottom > minY;
        })
        .map((el) => el.id);
      
      setSelectedElementIds(selected);
      if (selected.length === 1) {
        setSelectedElementId(selected[0]);
      }
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setIsPanning(false);
    setIsBoxSelecting(false);
    setBoxSelectStart(null);
    setBoxSelectEnd(null);
    dragRef.current = null;
    resizeRef.current = null;
    panRef.current = null;
  }, [isBoxSelecting, boxSelectStart, boxSelectEnd, selectedKeyframe]);

  const handleCanvasPanStart = useCallback((e: MouseEvent) => {
    if (e.button === 1 || (e.altKey && currentTool !== "hand") || currentTool === "hand") {
      e.preventDefault();
      setIsPanning(true);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: canvasOffset.x,
        origY: canvasOffset.y,
      };
    } else if (e.button === 0 && e.target === canvasRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
        
        // Handle drawing tools
        if (currentTool === "rectangle" || currentTool === "ellipse") {
          setIsDrawing(true);
          setDrawStart({ x, y });
          setDrawEnd({ x, y });
          return;
        }
        
        // Handle text tool - create text on click
        if (currentTool === "text") {
          createShapeElement("text", x, y, 120, 30);
          return;
        }
        
        // Start box selection on empty canvas click (select tool)
        if (currentTool === "select") {
          setIsBoxSelecting(true);
          setBoxSelectStart({ x, y });
          setBoxSelectEnd({ x, y });
          setSelectedElementId(null);
          setSelectedElementIds([]);
        }
      }
    }
  }, [canvasOffset, canvasScale, currentTool]);

  const handleCanvasPanMove = useCallback((e: MouseEvent) => {
    if (isPanning && panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setCanvasOffset({
        x: panRef.current.origX + dx,
        y: panRef.current.origY + dy,
      });
      return;
    }
    // Handle drawing preview
    if (isDrawing && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      setDrawEnd({ x, y });
      return;
    }
    if (isBoxSelecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      setBoxSelectEnd({ x, y });
    }
  }, [isPanning, isDrawing, isBoxSelecting, canvasOffset, canvasScale]);

  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasScale((prev) => Math.min(3, Math.max(0.25, prev * delta)));
  }, []);

  const handleResizeStart = useCallback((e: MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = selectedKeyframe.keyElements.find((el) => el.id === elementId);
    if (!element) return;
    
    setIsResizing(true);
    resizeRef.current = {
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      origW: element.size.width,
      origH: element.size.height,
      corner: "se",
    };
  }, [selectedKeyframe]);

  const selectKeyframe = (id: string) => {
    setSelectedKeyframeId(id);
    const nextFrame = keyframes.find((frame) => frame.id === id);
    setSelectedElementId(nextFrame?.keyElements[0]?.id ?? null);
    if (nextFrame?.functionalState) {
      setSelectedFunctionalState(nextFrame.functionalState);
    }
    const firstOutgoing = transitions.find((transition) => transition.from === id);
    if (firstOutgoing) {
      setSelectedTransitionId(firstOutgoing.id);
    }
  };

  const deleteKeyframe = (id: string) => {
    if (keyframes.length <= 1) return;
    const newFrames = keyframes.filter((f) => f.id !== id);
    setKeyframes(newFrames);
    if (selectedKeyframeId === id) {
      setSelectedKeyframeId(newFrames[0].id);
      setSelectedElementId(newFrames[0].keyElements[0]?.id ?? null);
    }
    setTransitions((prev) => prev.filter((t) => t.from !== id && t.to !== id));
  };

  const addKeyframe = () => {
    const template = selectedKeyframe ?? keyframes[0];
    const duplicateElements = template.keyElements.map((element) => ({
      ...element,
      isKeyElement: false,
      attributes: element.attributes.map((attribute) => ({
        ...attribute,
        id: `${attribute.id}-copy-${Date.now()}`,
        targeted: false,
        value: attribute.value,
      })),
    }));

    const newFrame: Keyframe = {
      id: `kf-${Date.now()}`,
      name: `State ${keyframes.length + 1}`,
      summary: "Describe this moment",
      functionalState: undefined,
      keyElements: duplicateElements,
    };

    setKeyframes((prev) => [...prev, newFrame]);
    setSelectedKeyframeId(newFrame.id);
    setSelectedElementId(newFrame.keyElements[0]?.id ?? null);
  };

  const addElement = () => {
    const newElement: KeyElement = {
      id: `el-${Date.now()}`,
      name: `Element ${selectedKeyframe.keyElements.length + 1}`,
      category: "component",
      isKeyElement: true,
      position: { x: 50, y: 50 },
      size: { width: 120, height: 60 },
      attributes: [
        { id: `attr-${Date.now()}`, label: "Opacity", value: "1", targeted: true, curve: "global" },
      ],
    };

    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return { ...frame, keyElements: [...frame.keyElements, newElement] };
      })
    );
    setSelectedElementId(newElement.id);
  };

  const deleteElement = (elementId: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.filter((el) => el.id !== elementId),
        };
      })
    );
    setSelectedElementId(null);
  };

  const moveElementUp = (elementId: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        const idx = frame.keyElements.findIndex((el) => el.id === elementId);
        if (idx <= 0) return frame;
        const arr = [...frame.keyElements];
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        return { ...frame, keyElements: arr };
      })
    );
  };

  const moveElementDown = (elementId: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        const idx = frame.keyElements.findIndex((el) => el.id === elementId);
        if (idx < 0 || idx >= frame.keyElements.length - 1) return frame;
        const arr = [...frame.keyElements];
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        return { ...frame, keyElements: arr };
      })
    );
  };

  const toggleElementLock = (elementId: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) =>
            el.id === elementId ? { ...el, locked: !el.locked } : el
          ),
        };
      })
    );
  };

  const toggleElementVisibility = (elementId: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) =>
            el.id === elementId ? { ...el, visible: el.visible === false ? true : false } : el
          ),
        };
      })
    );
  };

  const groupElements = () => {
    if (selectedElementIds.length < 2) return;
    const groupId = `group-${Date.now()}`;
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) =>
            selectedElementIds.includes(el.id) ? { ...el, groupId } : el
          ),
        };
      })
    );
  };

  const ungroupElements = () => {
    if (!selectedElementId) return;
    const element = selectedKeyframe.keyElements.find((el) => el.id === selectedElementId);
    if (!element?.groupId) return;
    const groupId = element.groupId;
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) =>
            el.groupId === groupId ? { ...el, groupId: undefined } : el
          ),
        };
      })
    );
  };

  const alignElements = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedElementIds.length < 2) return;
    const elements = selectedKeyframe.keyElements.filter(el => selectedElementIds.includes(el.id));
    if (elements.length < 2) return;

    let targetValue: number;
    if (alignment === 'left') {
      targetValue = Math.min(...elements.map(el => el.position.x));
    } else if (alignment === 'right') {
      targetValue = Math.max(...elements.map(el => el.position.x + el.size.width));
    } else if (alignment === 'center') {
      const minX = Math.min(...elements.map(el => el.position.x));
      const maxX = Math.max(...elements.map(el => el.position.x + el.size.width));
      targetValue = (minX + maxX) / 2;
    } else if (alignment === 'top') {
      targetValue = Math.min(...elements.map(el => el.position.y));
    } else if (alignment === 'bottom') {
      targetValue = Math.max(...elements.map(el => el.position.y + el.size.height));
    } else {
      const minY = Math.min(...elements.map(el => el.position.y));
      const maxY = Math.max(...elements.map(el => el.position.y + el.size.height));
      targetValue = (minY + maxY) / 2;
    }

    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (!selectedElementIds.includes(el.id)) return el;
            let newPos = { ...el.position };
            if (alignment === 'left') newPos.x = targetValue;
            else if (alignment === 'right') newPos.x = targetValue - el.size.width;
            else if (alignment === 'center') newPos.x = targetValue - el.size.width / 2;
            else if (alignment === 'top') newPos.y = targetValue;
            else if (alignment === 'bottom') newPos.y = targetValue - el.size.height;
            else newPos.y = targetValue - el.size.height / 2;
            return { ...el, position: newPos };
          }),
        };
      })
    );
  };

  const distributeElements = (direction: 'horizontal' | 'vertical') => {
    if (selectedElementIds.length < 3) return;
    const elements = selectedKeyframe.keyElements.filter(el => selectedElementIds.includes(el.id));
    if (elements.length < 3) return;

    const sorted = [...elements].sort((a, b) => 
      direction === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y
    );
    
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpace = direction === 'horizontal' 
      ? (last.position.x + last.size.width) - first.position.x
      : (last.position.y + last.size.height) - first.position.y;
    const totalSize = sorted.reduce((sum, el) => sum + (direction === 'horizontal' ? el.size.width : el.size.height), 0);
    const gap = (totalSpace - totalSize) / (sorted.length - 1);

    let currentPos = direction === 'horizontal' ? first.position.x : first.position.y;
    const newPositions: Record<string, number> = {};
    sorted.forEach(el => {
      newPositions[el.id] = currentPos;
      currentPos += (direction === 'horizontal' ? el.size.width : el.size.height) + gap;
    });

    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (!selectedElementIds.includes(el.id)) return el;
            const newPos = { ...el.position };
            if (direction === 'horizontal') newPos.x = newPositions[el.id];
            else newPos.y = newPositions[el.id];
            return { ...el, position: newPos };
          }),
        };
      })
    );
  };

  const nudgeElement = (elementId: string, dx: number, dy: number) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (el.id !== elementId) return el;
            return {
              ...el,
              position: {
                x: Math.max(0, el.position.x + dx),
                y: Math.max(0, el.position.y + dy),
              },
            };
          }),
        };
      })
    );
  };

  const copyElements = () => {
    const elementsToCopy = selectedElementIds.length > 0 
      ? selectedKeyframe.keyElements.filter(el => selectedElementIds.includes(el.id))
      : selectedElementId 
        ? selectedKeyframe.keyElements.filter(el => el.id === selectedElementId)
        : [];
    setClipboard(elementsToCopy);
  };

  const pasteElements = () => {
    if (clipboard.length === 0) return;
    const newElements = clipboard.map(el => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${el.name} copy`,
      position: { x: el.position.x + 20, y: el.position.y + 20 },
    }));
    setKeyframes(prev => prev.map(frame => {
      if (frame.id !== selectedKeyframeId) return frame;
      return { ...frame, keyElements: [...frame.keyElements, ...newElements] };
    }));
    setSelectedElementIds(newElements.map(el => el.id));
  };

  const duplicateElement = (elementId: string) => {
    const element = selectedKeyframe.keyElements.find((el) => el.id === elementId);
    if (!element) return;
    
    const newElement: KeyElement = {
      ...element,
      id: `el-${Date.now()}`,
      name: `${element.name} copy`,
      position: { x: element.position.x + 20, y: element.position.y + 20 },
      attributes: element.attributes.map((attr) => ({
        ...attr,
        id: `attr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };

    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return { ...frame, keyElements: [...frame.keyElements, newElement] };
      })
    );
    setSelectedElementId(newElement.id);
  };

  // Update element style
  const updateElementStyle = (elementId: string, styleKey: keyof ShapeStyle, value: string | number) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (el.id !== elementId) return el;
            return {
              ...el,
              style: { ...defaultStyle, ...el.style, [styleKey]: value },
            };
          }),
        };
      })
    );
  };

  // Update element text
  const updateElementText = (elementId: string, text: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) =>
            el.id === elementId ? { ...el, text } : el
          ),
        };
      })
    );
  };

  const updateKeyframeMeta = (field: "name" | "summary" | "functionalState", value: string) => {
    setKeyframes((prev) =>
      prev.map((frame) =>
        frame.id === selectedKeyframeId
          ? {
              ...frame,
              [field]: value,
            }
          : frame
      )
    );
    if (field === "functionalState") {
      setSelectedFunctionalState(value);
    }
  };

  const toggleElementKeyStatus = (elementId: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((element) =>
            element.id === elementId
              ? { ...element, isKeyElement: !element.isKeyElement }
              : element
          ),
        };
      })
    );
  };

  const toggleAttributeTarget = (elementId: string, attributeId: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((element) => {
            if (element.id !== elementId) return element;
            return {
              ...element,
              attributes: element.attributes.map((attribute) =>
                attribute.id === attributeId
                  ? { ...attribute, targeted: !attribute.targeted }
                  : attribute
              ),
            };
          }),
        };
      })
    );
  };

  const updateElementName = (elementId: string, name: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) =>
            el.id === elementId ? { ...el, name } : el
          ),
        };
      })
    );
  };

  const updateElementCategory = (elementId: string, category: "content" | "component" | "system") => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) =>
            el.id === elementId ? { ...el, category } : el
          ),
        };
      })
    );
  };

  const updateElementPosition = (elementId: string, axis: "x" | "y", value: number) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (el.id !== elementId) return el;
            return {
              ...el,
              position: { ...el.position, [axis]: Math.max(0, value) },
            };
          }),
        };
      })
    );
  };

  const updateElementSize = (elementId: string, dim: "width" | "height", value: number) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (el.id !== elementId) return el;
            return {
              ...el,
              size: { ...el.size, [dim]: Math.max(20, value) },
            };
          }),
        };
      })
    );
  };

  const addAttribute = (elementId: string) => {
    const newAttr: KeyAttribute = {
      id: `attr-${Date.now()}`,
      label: "New Attribute",
      value: "0",
      targeted: true,
      curve: "global",
    };
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) =>
            el.id === elementId
              ? { ...el, attributes: [...el.attributes, newAttr] }
              : el
          ),
        };
      })
    );
  };

  const deleteAttribute = (elementId: string, attrId: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (el.id !== elementId) return el;
            return {
              ...el,
              attributes: el.attributes.filter((attr) => attr.id !== attrId),
            };
          }),
        };
      })
    );
  };

  const updateAttributeLabel = (elementId: string, attrId: string, label: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (el.id !== elementId) return el;
            return {
              ...el,
              attributes: el.attributes.map((attr) =>
                attr.id === attrId ? { ...attr, label } : attr
              ),
            };
          }),
        };
      })
    );
  };

  const updateAttributeValue = (elementId: string, attributeId: string, value: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((element) => {
            if (element.id !== elementId) return element;
            return {
              ...element,
              attributes: element.attributes.map((attribute) =>
                attribute.id === attributeId ? { ...attribute, value } : attribute
              ),
            };
          }),
        };
      })
    );
  };

  const updateAttributeCurve = (elementId: string, attributeId: string, curve: string) => {
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((element) => {
            if (element.id !== elementId) return element;
            return {
              ...element,
              attributes: element.attributes.map((attribute) =>
                attribute.id === attributeId ? { ...attribute, curve } : attribute
              ),
            };
          }),
        };
      })
    );
  };

  const updateTransitionTarget = (transitionId: string, field: "from" | "to", value: string) => {
    setTransitions((prev) =>
      prev.map((t) => (t.id === transitionId ? { ...t, [field]: value } : t))
    );
  };

  const updateTransition = (
    transitionId: string,
    field: keyof Pick<Transition, "trigger" | "duration" | "delay" | "curve" | "description" | "springDamping" | "springResponse">,
    value: string
  ) => {
    setTransitions((prev) =>
      prev.map((transition) =>
        transition.id === transitionId
          ? {
              ...transition,
              [field]: ["duration", "delay", "springDamping", "springResponse"].includes(field) ? Number(value) : value,
            }
          : transition
      )
    );
  };

  const deleteTransition = (id: string) => {
    setTransitions((prev) => prev.filter((t) => t.id !== id));
    if (selectedTransitionId === id) {
      setSelectedTransitionId(null);
    }
  };

  const addTransition = () => {
    if (keyframes.length < 2) return;
    const currentIndex = keyframes.findIndex((frame) => frame.id === selectedKeyframeId);
    const nextIndex = (currentIndex + 1) % keyframes.length;
    const targetFrame = keyframes[nextIndex];

    const newTransition: Transition = {
      id: `transition-${Date.now()}`,
      from: selectedKeyframeId,
      to: targetFrame.id,
      trigger: "New trigger",
      duration: 360,
      delay: 40,
      curve: "ease-in-out",
      description: "Describe how this state changes",
    };

    setTransitions((prev) => [...prev, newTransition]);
    setSelectedTransitionId(newTransition.id);
  };

  const exportJSON = () => {
    const data = { keyframes, transitions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "toumo-project.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.keyframes) setKeyframes(data.keyframes);
          if (data.transitions) setTransitions(data.transitions);
        } catch { /* ignore */ }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const stepPreview = () => {
    if (isAnimating) return; // 防止动画重叠
    
    const currentIndex = keyframes.findIndex((frame) => frame.id === selectedKeyframeId);
    const nextIndex = (currentIndex + 1) % keyframes.length;
    const currentFrame = keyframes[currentIndex];
    const nextFrame = keyframes[nextIndex];
    
    // 查找对应的过渡配置
    const transition = transitions.find(
      t => t.from === currentFrame.id && t.to === nextFrame.id
    );
    
    const duration = transition?.duration || 300;
    const easing = transition?.curve || 'ease-out';
    
    // 开始动画
    setIsAnimating(true);
    setAnimatingFromKeyframe(currentFrame);
    setAnimatingToKeyframe(nextFrame);
    setAnimationProgress(0);
    
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // 应用缓动
      let easedProgress = rawProgress;
      if (easing === 'ease-out') {
        easedProgress = rawProgress * (2 - rawProgress);
      } else if (easing === 'ease-in') {
        easedProgress = rawProgress * rawProgress;
      } else if (easing === 'ease-in-out') {
        easedProgress = rawProgress < 0.5 
          ? 2 * rawProgress * rawProgress 
          : -1 + (4 - 2 * rawProgress) * rawProgress;
      }
      
      setAnimationProgress(easedProgress);
      
      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 动画完成
        setIsAnimating(false);
        setAnimatingFromKeyframe(null);
        setAnimatingToKeyframe(null);
        selectKeyframe(nextFrame.id);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing text
      if (editingTextId || editingElementId) return;
      
      // Tool shortcuts (single key, no modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            setCurrentTool("select");
            return;
          case "r":
            setCurrentTool("rectangle");
            return;
          case "o":
            setCurrentTool("ellipse");
            return;
          case "t":
            setCurrentTool("text");
            return;
          case "h":
            setCurrentTool("hand");
            return;
        }
      }
      
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        redo();
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        setShowHelp(prev => !prev);
      }
      if (e.key === "Escape") {
        setSelectedElementId(null);
        setSelectedElementIds([]);
        setShowHelp(false);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
        deleteElement(selectedElementId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        copyElements();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        pasteElements();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "l" && selectedElementId) {
        e.preventDefault();
        toggleElementLock(selectedElementId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "h" && selectedElementId) {
        e.preventDefault();
        toggleElementVisibility(selectedElementId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "]" && selectedElementId) {
        e.preventDefault();
        moveElementUp(selectedElementId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "[" && selectedElementId) {
        e.preventDefault();
        moveElementDown(selectedElementId);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setCanvasScale(prev => Math.min(3, prev * 1.2));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setCanvasScale(prev => Math.max(0.25, prev / 1.2));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setCanvasScale(1);
        setCanvasOffset({ x: 0, y: 0 });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "1" && !e.shiftKey) {
        e.preventDefault();
        setCanvasScale(1);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "1") {
        e.preventDefault();
        // Zoom to fit all elements
        const elements = selectedKeyframe.keyElements;
        if (elements.length === 0) return;
        const bounds = elements.reduce((acc, el) => ({
          minX: Math.min(acc.minX, el.position.x),
          minY: Math.min(acc.minY, el.position.y),
          maxX: Math.max(acc.maxX, el.position.x + el.size.width),
          maxY: Math.max(acc.maxY, el.position.y + el.size.height),
        }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
        const contentW = bounds.maxX - bounds.minX + 100;
        const contentH = bounds.maxY - bounds.minY + 100;
        const scale = Math.min(600 / contentW, 400 / contentH, 2);
        setCanvasScale(scale);
        setCanvasOffset({ x: -bounds.minX * scale + 50, y: -bounds.minY * scale + 50 });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "2" && selectedElementId) {
        e.preventDefault();
        // Zoom to selection
        const el = selectedKeyframe.keyElements.find(e => e.id === selectedElementId);
        if (el) {
          setCanvasScale(2);
          setCanvasOffset({ x: -el.position.x * 2 + 200, y: -el.position.y * 2 + 150 });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedElementId) {
        e.preventDefault();
        duplicateElement(selectedElementId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "g" && !e.shiftKey) {
        e.preventDefault();
        groupElements();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "g") {
        e.preventDefault();
        ungroupElements();
      }
      // Ctrl+A select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedElementIds(selectedKeyframe.keyElements.map(el => el.id));
      }
      // Arrow keys nudge
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedElementId) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        nudgeElement(selectedElementId, dx, dy);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, selectedElementIds]);

  // 计算动画中的元素状态
  const previewElements = useMemo(() => {
    if (!isAnimating || !animatingFromKeyframe || !animatingToKeyframe) {
      return selectedKeyframe.keyElements;
    }
    
    // 插值计算动画中的元素位置和属性
    return animatingFromKeyframe.keyElements.map(fromEl => {
      const toEl = animatingToKeyframe.keyElements.find(e => e.id === fromEl.id);
      if (!toEl) return fromEl;
      
      const progress = animationProgress;
      
      return {
        ...fromEl,
        position: {
          x: fromEl.position.x + (toEl.position.x - fromEl.position.x) * progress,
          y: fromEl.position.y + (toEl.position.y - fromEl.position.y) * progress,
        },
        size: {
          width: fromEl.size.width + (toEl.size.width - fromEl.size.width) * progress,
          height: fromEl.size.height + (toEl.size.height - fromEl.size.height) * progress,
        },
        style: fromEl.style && toEl.style ? {
          ...fromEl.style,
          fillOpacity: fromEl.style.fillOpacity + (toEl.style.fillOpacity - fromEl.style.fillOpacity) * progress,
          borderRadius: fromEl.style.borderRadius + (toEl.style.borderRadius - fromEl.style.borderRadius) * progress,
        } : fromEl.style,
      };
    });
  }, [isAnimating, animatingFromKeyframe, animatingToKeyframe, animationProgress, selectedKeyframe]);

  const previewStateLabel =
    functionalStates.find((state) => state.id === selectedFunctionalState)?.name ??
    selectedFunctionalState;

  return (
    <div className="app-shell">
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-panel" onClick={e => e.stopPropagation()}>
            <h2>Keyboard Shortcuts</h2>
            <div className="help-grid">
              <div><kbd>Ctrl+Z</kbd> Undo</div>
              <div><kbd>Ctrl+Y</kbd> Redo</div>
              <div><kbd>Ctrl+C</kbd> Copy</div>
              <div><kbd>Ctrl+V</kbd> Paste</div>
              <div><kbd>Ctrl+D</kbd> Duplicate</div>
              <div><kbd>Ctrl+A</kbd> Select All</div>
              <div><kbd>Ctrl+G</kbd> Group</div>
              <div><kbd>Ctrl+Shift+G</kbd> Ungroup</div>
              <div><kbd>Ctrl+L</kbd> Lock</div>
              <div><kbd>Ctrl+H</kbd> Hide</div>
              <div><kbd>Ctrl+]</kbd> Bring Forward</div>
              <div><kbd>Ctrl+[</kbd> Send Backward</div>
              <div><kbd>Delete</kbd> Delete</div>
              <div><kbd>Escape</kbd> Deselect</div>
              <div><kbd>↑↓←→</kbd> Nudge 1px</div>
              <div><kbd>Shift+↑↓←→</kbd> Nudge 10px</div>
              <div><kbd>Shift+Drag</kbd> Constrain H/V</div>
              <div><kbd>Ctrl+=</kbd> Zoom In</div>
              <div><kbd>Ctrl+-</kbd> Zoom Out</div>
              <div><kbd>Ctrl+0</kbd> Reset View</div>
              <div><kbd>Ctrl+1</kbd> Zoom 100%</div>
              <div><kbd>Ctrl+Shift+1</kbd> Zoom to Fit</div>
              <div><kbd>Ctrl+2</kbd> Zoom to Selection</div>
              <div><kbd>?</kbd> Toggle Help</div>
            </div>
          </div>
        </div>
      )}
      {contextMenu && (
        <div className="context-menu-overlay" onClick={() => setContextMenu(null)}>
          <div 
            className="context-menu" 
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => { duplicateElement(contextMenu.elementId); setContextMenu(null); }}>Duplicate</button>
            <button onClick={() => { copyElements(); setContextMenu(null); }}>Copy</button>
            <button onClick={() => { toggleElementLock(contextMenu.elementId); setContextMenu(null); }}>
              {selectedKeyframe.keyElements.find(el => el.id === contextMenu.elementId)?.locked ? 'Unlock' : 'Lock'}
            </button>
            <button onClick={() => { toggleElementVisibility(contextMenu.elementId); setContextMenu(null); }}>
              {selectedKeyframe.keyElements.find(el => el.id === contextMenu.elementId)?.visible === false ? 'Show' : 'Hide'}
            </button>
            <hr />
            <button onClick={() => { moveElementUp(contextMenu.elementId); setContextMenu(null); }}>Bring Forward</button>
            <button onClick={() => { moveElementDown(contextMenu.elementId); setContextMenu(null); }}>Send Backward</button>
            <hr />
            <button className="danger" onClick={() => { deleteElement(contextMenu.elementId); setContextMenu(null); }}>Delete</button>
          </div>
        </div>
      )}
      <header className="top-bar">
        <div>
          <span className="logo">Toumo</span>
          <strong>Motion Editor</strong>
        </div>
        <div className="top-actions">
          <button className="ghost" onClick={importJSON}>Import</button>
          <button className="ghost" onClick={exportJSON}>Export</button>
          <button className="primary">Publish</button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <button
          className={`tool-btn ${currentTool === "select" ? "active" : ""}`}
          onClick={() => setCurrentTool("select")}
          title="Select (V)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          </svg>
        </button>
        <button
          className={`tool-btn ${currentTool === "rectangle" ? "active" : ""}`}
          onClick={() => setCurrentTool("rectangle")}
          title="Rectangle (R)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
        </button>
        <button
          className={`tool-btn ${currentTool === "ellipse" ? "active" : ""}`}
          onClick={() => setCurrentTool("ellipse")}
          title="Ellipse (O)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="12" rx="9" ry="9"/>
          </svg>
        </button>
        <button
          className={`tool-btn ${currentTool === "text" ? "active" : ""}`}
          onClick={() => setCurrentTool("text")}
          title="Text (T)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3"/>
            <path d="M12 4v16"/>
            <path d="M8 20h8"/>
          </svg>
        </button>
        <div className="tool-divider" />
        <button
          className={`tool-btn ${currentTool === "hand" ? "active" : ""}`}
          onClick={() => setCurrentTool("hand")}
          title="Hand (H)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
          </svg>
        </button>
      </div>

      <div className="body-grid">
        <aside className="preview-pane">
          <div className="preview-header">
            <div>
              <p className="eyebrow">Functional state</p>
              <h2>{previewStateLabel}</h2>
            </div>
            <div className="playback-controls">
              <button onClick={stepPreview}>Step</button>
              <button onClick={() => selectKeyframe(keyframes[0].id)}>Reset</button>
            </div>
          </div>
          <div className="device-frame">
            <div className="device-screen">
              {previewElements.map((element) => (
                <div
                  key={element.id}
                  className={`device-element element-${element.id} ${
                    element.isKeyElement ? "is-key" : ""
                  }`}
                >
                  <span>{element.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="state-pills">
            {keyframes.map((frame) => (
              <button
                key={frame.id}
                className={frame.id === selectedKeyframeId ? "pill active" : "pill"}
                onClick={() => selectKeyframe(frame.id)}
              >
                {frame.name}
              </button>
            ))}
          </div>
          <div className="legend">
            <span className="dot key" /> key element
            <span className="dot" /> inherited
          </div>
        </aside>

        <main className="editor-pane">
          <section className="keyframe-rail">
            <div className="rail-heading">
              <div>
                <p className="eyebrow">Keyframes</p>
                <strong>{keyframes.length} states</strong>
              </div>
              <button className="ghost" onClick={addKeyframe}>
                + New keyframe
              </button>
            </div>
            <div className="rail-cards">
              {keyframes.map((frame, index) => (
                <div
                  key={frame.id}
                  className={`keyframe-card ${frame.id === selectedKeyframeId ? "active" : ""}`}
                  onClick={() => selectKeyframe(frame.id)}
                >
                  <div className="card-index">{index + 1}</div>
                  <div>
                    <strong>{frame.name}</strong>
                    <p>{frame.summary}</p>
                  </div>
                  <div className="card-meta">
                    <span>{frame.keyElements.filter((el) => el.isKeyElement).length} key</span>
                    {keyframes.length > 1 && (
                      <button
                        className="ghost small danger"
                        onClick={(e) => { e.stopPropagation(); deleteKeyframe(frame.id); }}
                      >×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="edit-grid">
            <div className="panel layers-panel">
              <div className="panel-heading">
                <h3>Layer tree</h3>
                <button className="ghost small" onClick={addElement}>+ Add</button>
              </div>
              <ul>
                {selectedKeyframe.keyElements.map((element) => (
                  <li key={element.id}>
                    <button
                      className={`layer-row ${
                        selectedElementId === element.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedElementId(element.id)}
                    >
                      <div>
                        <span className="layer-name">{element.name}</span>
                        <span className="layer-category">{element.category}</span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={element.isKeyElement}
                          onChange={() => toggleElementKeyStatus(element.id)}
                        />
                        <span>Key</span>
                      </label>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel canvas-panel">
              <div className="canvas-heading">
                <h3>Canvas</h3>
                <div className="canvas-controls">
                  {selectedElementIds.length >= 2 && (
                    <div className="align-buttons">
                      <button className="icon-btn" onClick={() => alignElements('left')} title="Align left">⫷</button>
                      <button className="icon-btn" onClick={() => alignElements('center')} title="Align center H">⫿</button>
                      <button className="icon-btn" onClick={() => alignElements('right')} title="Align right">⫸</button>
                      <button className="icon-btn" onClick={() => alignElements('top')} title="Align top">⊤</button>
                      <button className="icon-btn" onClick={() => alignElements('middle')} title="Align middle">⊝</button>
                      <button className="icon-btn" onClick={() => alignElements('bottom')} title="Align bottom">⊥</button>
                      {selectedElementIds.length >= 3 && (
                        <>
                          <button className="icon-btn" onClick={() => distributeElements('horizontal')} title="Distribute H">⋯</button>
                          <button className="icon-btn" onClick={() => distributeElements('vertical')} title="Distribute V">⋮</button>
                        </>
                      )}
                    </div>
                  )}
                  <span className="zoom-indicator">{Math.round(canvasScale * 100)}%</span>
                  <button className="ghost small" onClick={() => { setCanvasScale(1); setCanvasOffset({ x: 0, y: 0 }); }}>Reset</button>
                </div>
              </div>
              <div className="canvas-content">
                <div 
                  className="board"
                  ref={canvasRef}
                  onMouseDown={handleCanvasPanStart}
                  onMouseMove={(e) => { handleCanvasMouseMove(e); handleCanvasPanMove(e); }}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onWheel={handleCanvasWheel}
                  style={{ cursor: isPanning || currentTool === "hand" ? "grabbing" : currentTool === "select" ? "default" : "crosshair" }}
                >
                  <div
                    className="canvas-transform"
                    style={{
                      transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
                      transformOrigin: "0 0",
                    }}
                  >
                    {previewElements.map((element) => {
                      const style = element.style || defaultStyle;
                      const isShape = element.shapeType === "rectangle" || element.shapeType === "ellipse";
                      const isText = element.shapeType === "text";
                      
                      return (
                        <div
                          key={`board-${element.id}`}
                          className={`board-element element-${element.id} ${
                            element.isKeyElement ? "is-key" : ""
                          } ${selectedElementId === element.id || selectedElementIds.includes(element.id) ? "selected" : ""} ${isShape || isText ? "shape-element" : ""}`}
                          style={{
                            position: "absolute",
                            left: element.position.x,
                            top: element.position.y,
                            width: element.size.width,
                            height: element.size.height,
                            cursor: currentTool === "select" ? (isDragging ? "grabbing" : "grab") : "default",
                            opacity: element.visible === false ? 0.3 : style.fillOpacity,
                            backgroundColor: isShape ? style.fill : (isText ? "transparent" : undefined),
                            borderRadius: element.shapeType === "ellipse" ? "50%" : (isShape ? style.borderRadius : undefined),
                            border: isShape ? `${style.strokeWidth}px solid ${style.stroke}` : undefined,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isText ? style.textAlign : "center",
                            fontSize: isText ? style.fontSize : undefined,
                            fontWeight: isText ? style.fontWeight : undefined,
                            color: isText ? style.fill : undefined,
                            padding: isText ? "4px 8px" : undefined,
                          }}
                          onMouseDown={(e) => {
                            if (currentTool === "select") {
                              handleCanvasMouseDown(e, element.id);
                            }
                          }}
                          onDoubleClick={() => {
                            if (isText) {
                              setEditingTextId(element.id);
                            } else {
                              setEditingElementId(element.id);
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, elementId: element.id });
                            setSelectedElementId(element.id);
                          }}
                        >
                          {editingTextId === element.id && isText ? (
                            <input
                              autoFocus
                              defaultValue={element.text || ""}
                              onBlur={(e) => { updateElementText(element.id, e.target.value); setEditingTextId(null); }}
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter') { 
                                  updateElementText(element.id, (e.target as HTMLInputElement).value); 
                                  setEditingTextId(null); 
                                }
                                if (e.key === 'Escape') {
                                  setEditingTextId(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                width: '100%', 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'inherit', 
                                outline: 'none',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                textAlign: style.textAlign || 'left',
                              }}
                            />
                          ) : editingElementId === element.id ? (
                            <input
                              autoFocus
                              defaultValue={element.name}
                              onBlur={(e) => { updateElementName(element.id, e.target.value); setEditingElementId(null); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { updateElementName(element.id, (e.target as HTMLInputElement).value); setEditingElementId(null); } }}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }}
                            />
                          ) : isText ? (
                            <span>{element.text || "Text"}</span>
                          ) : isShape ? null : (
                            <span>{element.name}</span>
                          )}
                          {element.isKeyElement && !isShape && !isText && <small>Key</small>}
                          {selectedElementId === element.id && (
                            <div
                              className="resize-handle"
                              onMouseDown={(e) => handleResizeStart(e, element.id)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {isBoxSelecting && boxSelectStart && boxSelectEnd && (
                    <div
                      className="selection-box"
                      style={{
                        left: Math.min(boxSelectStart.x, boxSelectEnd.x),
                        top: Math.min(boxSelectStart.y, boxSelectEnd.y),
                        width: Math.abs(boxSelectEnd.x - boxSelectStart.x),
                        height: Math.abs(boxSelectEnd.y - boxSelectStart.y),
                      }}
                    />
                  )}
                  {/* Drawing preview */}
                  {isDrawing && drawStart && drawEnd && (
                    <div
                      className="drawing-preview"
                      style={{
                        position: "absolute",
                        left: Math.min(drawStart.x, drawEnd.x) * canvasScale + canvasOffset.x,
                        top: Math.min(drawStart.y, drawEnd.y) * canvasScale + canvasOffset.y,
                        width: Math.abs(drawEnd.x - drawStart.x) * canvasScale,
                        height: Math.abs(drawEnd.y - drawStart.y) * canvasScale,
                        border: "2px dashed #0d99ff",
                        borderRadius: currentTool === "ellipse" ? "50%" : "4px",
                        background: "rgba(13, 153, 255, 0.1)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                <div className="functional-graph">
                  <h4>Functional states</h4>
                  <div className="graph">
                    {functionalStates.map((state) => (
                      <div
                        key={state.id}
                        className={`graph-node ${
                          state.id === selectedFunctionalState ? "current" : ""
                        }`}
                        onClick={() => setSelectedFunctionalState(state.id)}
                      >
                        <strong>{state.name}</strong>
                        <p>{state.description}</p>
                        <div className="graph-chips">
                          {keyframes
                            .filter((frame) => frame.functionalState === state.id)
                            .map((frame) => (
                              <span key={`chip-${frame.id}`}>{frame.name}</span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="panel inspector-panel">
              <div className="panel-heading">
                <h3>Inspector</h3>
                <span>{selectedKeyframe.name}</span>
              </div>
              <label className="field">
                <span>Keyframe name</span>
                <input
                  type="text"
                  value={selectedKeyframe.name}
                  onChange={(event) => updateKeyframeMeta("name", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Summary</span>
                <textarea
                  value={selectedKeyframe.summary}
                  onChange={(event) => updateKeyframeMeta("summary", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Functional mapping</span>
                <select
                  value={selectedKeyframe.functionalState ?? ""}
                  onChange={(event) => updateKeyframeMeta("functionalState", event.target.value)}
                >
                  <option value="">Not linked</option>
                  {functionalStates.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedElement ? (
                <div className="attributes">
                  <div className="panel-heading">
                    <input
                      type="text"
                      className="element-name-input"
                      value={selectedElement.name}
                      onChange={(e) => updateElementName(selectedElement.id, e.target.value)}
                    />
                    <div className="element-actions">
                      <button className="icon-btn" onClick={() => toggleElementVisibility(selectedElement.id)} title={selectedElement.visible === false ? "Show" : "Hide"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {selectedElement.visible === false ? (
                            <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                          ) : (
                            <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                          )}
                        </svg>
                      </button>
                      <button className="icon-btn" onClick={() => toggleElementLock(selectedElement.id)} title={selectedElement.locked ? "Unlock" : "Lock"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {selectedElement.locked ? (
                            <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                          ) : (
                            <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>
                          )}
                        </svg>
                      </button>
                      <button className="icon-btn" onClick={() => moveElementUp(selectedElement.id)} title="Move up">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="18 15 12 9 6 15"/>
                        </svg>
                      </button>
                      <button className="icon-btn" onClick={() => moveElementDown(selectedElement.id)} title="Move down">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      <button className="icon-btn danger" onClick={() => deleteElement(selectedElement.id)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <label className="field" style={{ marginTop: 8 }}>
                    <span>Category</span>
                    <select
                      value={selectedElement.category}
                      onChange={(e) => updateElementCategory(selectedElement.id, e.target.value as "content" | "component" | "system")}
                    >
                      <option value="content">Content</option>
                      <option value="component">Component</option>
                      <option value="system">System</option>
                    </select>
                  </label>
                  <div className="panel-heading" style={{ marginTop: 8 }}>
                    <span>Transform</span>
                  </div>
                  <div className="transform-grid">
                    <label className="field">
                      <span>X</span>
                      <input
                        type="number"
                        value={selectedElement.position.x}
                        onChange={(e) => updateElementPosition(selectedElement.id, "x", Number(e.target.value))}
                      />
                    </label>
                    <label className="field">
                      <span>Y</span>
                      <input
                        type="number"
                        value={selectedElement.position.y}
                        onChange={(e) => updateElementPosition(selectedElement.id, "y", Number(e.target.value))}
                      />
                    </label>
                    <label className="field">
                      <span>W</span>
                      <input
                        type="number"
                        value={selectedElement.size.width}
                        onChange={(e) => updateElementSize(selectedElement.id, "width", Number(e.target.value))}
                      />
                    </label>
                    <label className="field">
                      <span>H</span>
                      <input
                        type="number"
                        value={selectedElement.size.height}
                        onChange={(e) => updateElementSize(selectedElement.id, "height", Number(e.target.value))}
                      />
                    </label>
                  </div>
                  {/* Style Panel for shapes */}
                  {(selectedElement.shapeType === "rectangle" || selectedElement.shapeType === "ellipse" || selectedElement.shapeType === "text") && (
                    <>
                      <div className="panel-heading" style={{ marginTop: 16 }}>
                        <span>Fill</span>
                      </div>
                      <div className="style-row">
                        <ColorPicker
                          color={selectedElement.style?.fill || defaultStyle.fill}
                          onChange={(c) => updateElementStyle(selectedElement.id, "fill", c)}
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={Math.round((selectedElement.style?.fillOpacity ?? 1) * 100)}
                          onChange={(e) => updateElementStyle(selectedElement.id, "fillOpacity", Number(e.target.value) / 100)}
                          className="opacity-input"
                        />
                        <span className="opacity-label">%</span>
                      </div>
                      
                      {selectedElement.shapeType !== "text" && (
                        <>
                          <div className="panel-heading" style={{ marginTop: 12 }}>
                            <span>Stroke</span>
                          </div>
                          <div className="style-row">
                            <ColorPicker
                              color={selectedElement.style?.stroke || defaultStyle.stroke}
                              onChange={(c) => updateElementStyle(selectedElement.id, "stroke", c)}
                            />
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={selectedElement.style?.strokeWidth ?? defaultStyle.strokeWidth}
                              onChange={(e) => updateElementStyle(selectedElement.id, "strokeWidth", Number(e.target.value))}
                              className="stroke-width-input"
                            />
                            <span className="opacity-label">px</span>
                          </div>
                        </>
                      )}
                      
                      {selectedElement.shapeType === "rectangle" && (
                        <>
                          <div className="panel-heading" style={{ marginTop: 12 }}>
                            <span>Corner Radius</span>
                          </div>
                          <div className="style-row">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={selectedElement.style?.borderRadius ?? defaultStyle.borderRadius}
                              onChange={(e) => updateElementStyle(selectedElement.id, "borderRadius", Number(e.target.value))}
                              style={{ width: 60 }}
                            />
                            <span className="opacity-label">px</span>
                          </div>
                        </>
                      )}
                      
                      {selectedElement.shapeType === "text" && (
                        <>
                          <div className="panel-heading" style={{ marginTop: 12 }}>
                            <span>Text</span>
                          </div>
                          <div className="style-row">
                            <input
                              type="number"
                              min="8"
                              max="200"
                              value={selectedElement.style?.fontSize ?? 16}
                              onChange={(e) => updateElementStyle(selectedElement.id, "fontSize", Number(e.target.value))}
                              style={{ width: 60 }}
                            />
                            <span className="opacity-label">px</span>
                            <select
                              value={selectedElement.style?.fontWeight ?? "normal"}
                              onChange={(e) => updateElementStyle(selectedElement.id, "fontWeight", e.target.value)}
                              style={{ marginLeft: 8 }}
                            >
                              <option value="normal">Regular</option>
                              <option value="500">Medium</option>
                              <option value="600">Semibold</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  <div className="panel-heading" style={{ marginTop: 16 }}>
                    <span>Attributes</span>
                    <button className="ghost small" onClick={() => addAttribute(selectedElement.id)}>+ Add</button>
                  </div>
                  {selectedElement.attributes.map((attribute) => (
                    <div className="attribute-row" key={attribute.id}>
                      <label>
                        <input
                          type="text"
                          className="attr-label-input"
                          value={attribute.label}
                          onChange={(e) => updateAttributeLabel(selectedElement.id, attribute.id, e.target.value)}
                        />
                        <input
                          type="text"
                          value={attribute.value}
                          onChange={(event) =>
                            updateAttributeValue(
                              selectedElement.id,
                              attribute.id,
                              event.target.value
                            )
                          }
                        />
                      </label>
                      <div className="attribute-controls">
                        <button
                          className={attribute.targeted ? "pill active" : "pill"}
                          onClick={() =>
                            toggleAttributeTarget(selectedElement.id, attribute.id)
                          }
                        >
                          {attribute.targeted ? "key" : "inherit"}
                        </button>
                        <select
                          value={attribute.curve}
                          onChange={(event) =>
                            updateAttributeCurve(
                              selectedElement.id,
                              attribute.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="global">Global</option>
                          <option value="ease-in">Ease-in</option>
                          <option value="ease-out">Ease-out</option>
                          <option value="ease-in-out">Ease-in-out</option>
                          <option value="spring">Spring</option>
                          <option value="overshoot">Overshoot</option>
                        </select>
                        <button
                          className="ghost small danger"
                          onClick={() => deleteAttribute(selectedElement.id, attribute.id)}
                        >×</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Select a layer to edit attributes.</p>
              )}
            </div>
          </section>

          <section className="panel transition-panel">
            <div className="panel-heading">
              <h3>Transitions</h3>
              <button className="ghost" onClick={addTransition}>
                Link transition
              </button>
            </div>
            <div className="transition-list">
              {outgoingTransitions.length === 0 && (
                <p className="muted">No outgoing transitions yet.</p>
              )}
              {outgoingTransitions.map((transition) => (
                <div
                  key={transition.id}
                  className={`transition-row ${
                    selectedTransition?.id === transition.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTransitionId(transition.id)}
                >
                  <div>
                    <strong>
                      {transition.from} → {transition.to}
                    </strong>
                    <p>{transition.trigger}</p>
                  </div>
                  <div className="transition-actions">
                    <span>{transition.duration}ms</span>
                    <button
                      className="ghost small danger"
                      onClick={(e) => { e.stopPropagation(); deleteTransition(transition.id); }}
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
            {selectedTransition && (
              <div className="transition-editor">
                <div className="two-col">
                  <label className="field">
                    <span>From</span>
                    <select
                      value={selectedTransition.from}
                      onChange={(e) => updateTransitionTarget(selectedTransition.id, "from", e.target.value)}
                    >
                      {keyframes.map((kf) => (
                        <option key={kf.id} value={kf.id}>{kf.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>To</span>
                    <select
                      value={selectedTransition.to}
                      onChange={(e) => updateTransitionTarget(selectedTransition.id, "to", e.target.value)}
                    >
                      {keyframes.map((kf) => (
                        <option key={kf.id} value={kf.id}>{kf.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span>Trigger</span>
                  <input
                    type="text"
                    value={selectedTransition.trigger}
                    onChange={(event) =>
                      updateTransition(selectedTransition.id, "trigger", event.target.value)
                    }
                  />
                </label>
                <div className="two-col">
                  <label className="field">
                    <span>Duration (ms)</span>
                    <input
                      type="number"
                      value={selectedTransition.duration}
                      onChange={(event) =>
                        updateTransition(selectedTransition.id, "duration", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Delay (ms)</span>
                    <input
                      type="number"
                      value={selectedTransition.delay}
                      onChange={(event) =>
                        updateTransition(selectedTransition.id, "delay", event.target.value)
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Curve</span>
                  <select
                    value={selectedTransition.curve}
                    onChange={(event) =>
                      updateTransition(selectedTransition.id, "curve", event.target.value)
                    }
                  >
                    <option value="ease-in">Ease-in</option>
                    <option value="ease-out">Ease-out</option>
                    <option value="ease-in-out">Ease-in-out</option>
                    <option value="spring">Spring</option>
                    <option value="overshoot">Overshoot</option>
                  </select>
                </label>
                {selectedTransition.curve === "spring" && (
                  <div className="two-col">
                    <label className="field">
                      <span>Damping (0-1)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={selectedTransition.springDamping ?? 0.8}
                        onChange={(e) =>
                          updateTransition(selectedTransition.id, "springDamping", e.target.value)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Response (s)</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        value={selectedTransition.springResponse ?? 0.5}
                        onChange={(e) =>
                          updateTransition(selectedTransition.id, "springResponse", e.target.value)
                        }
                      />
                    </label>
                  </div>
                )}
                <label className="field">
                  <span>Description</span>
                  <textarea
                    value={selectedTransition.description ?? ""}
                    onChange={(event) =>
                      updateTransition(selectedTransition.id, "description", event.target.value)
                    }
                  />
                </label>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
