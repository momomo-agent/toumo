import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import type { MouseEvent } from "react";
import "./App.css";

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

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
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

  const handleCanvasMouseUp = useCallback(() => {
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
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      setIsPanning(true);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: canvasOffset.x,
        origY: canvasOffset.y,
      };
    } else if (e.button === 0 && e.target === canvasRef.current) {
      // Start box selection on empty canvas click
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
        const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
        setIsBoxSelecting(true);
        setBoxSelectStart({ x, y });
        setBoxSelectEnd({ x, y });
        setSelectedElementId(null);
        setSelectedElementIds([]);
      }
    }
  }, [canvasOffset, canvasScale]);

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
    if (isBoxSelecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const y = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      setBoxSelectEnd({ x, y });
    }
  }, [isPanning, isBoxSelecting, canvasOffset, canvasScale]);

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
    const currentIndex = keyframes.findIndex((frame) => frame.id === selectedKeyframeId);
    const nextIndex = (currentIndex + 1) % keyframes.length;
    const nextFrame = keyframes[nextIndex];
    selectKeyframe(nextFrame.id);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        redo();
      }
      if (e.key === "Escape") {
        setSelectedElementId(null);
        setSelectedElementIds([]);
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

  const previewElements = selectedKeyframe.keyElements;
  const previewStateLabel =
    functionalStates.find((state) => state.id === selectedFunctionalState)?.name ??
    selectedFunctionalState;

  return (
    <div className="app-shell">
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
                  style={{ cursor: isPanning ? "grabbing" : "crosshair" }}
                >
                  <div
                    className="canvas-transform"
                    style={{
                      transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
                      transformOrigin: "0 0",
                    }}
                  >
                    {previewElements.map((element) => (
                      <div
                        key={`board-${element.id}`}
                        className={`board-element element-${element.id} ${
                          element.isKeyElement ? "is-key" : ""
                        } ${selectedElementId === element.id || selectedElementIds.includes(element.id) ? "selected" : ""}`}
                        style={{
                          position: "absolute",
                          left: element.position.x,
                          top: element.position.y,
                          width: element.size.width,
                          height: element.size.height,
                          cursor: isDragging ? "grabbing" : "grab",
                          opacity: element.visible === false ? 0.3 : 1,
                        }}
                        onMouseDown={(e) => handleCanvasMouseDown(e, element.id)}
                        onDoubleClick={() => setEditingElementId(element.id)}
                      >
                      {editingElementId === element.id ? (
                        <input
                          autoFocus
                          defaultValue={element.name}
                          onBlur={(e) => { updateElementName(element.id, e.target.value); setEditingElementId(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { updateElementName(element.id, (e.target as HTMLInputElement).value); setEditingElementId(null); } }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', outline: 'none' }}
                        />
                      ) : (
                        <span>{element.name}</span>
                      )}
                      {element.isKeyElement && <small>Key</small>}
                        {selectedElementId === element.id && (
                          <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, element.id)}
                          />
                        )}
                      </div>
                    ))}
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
