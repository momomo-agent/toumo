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
  const [selectedKeyframeId, setSelectedKeyframeId] = useState(keyframes[0].id);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    keyframes[0].keyElements[0]?.id ?? null
  );
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
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
  const dragRef = useRef<{ elementId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
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
    setIsDragging(true);
    dragRef.current = {
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      origX: element.position.x,
      origY: element.position.y,
    };
  }, [selectedKeyframe]);

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
    
    const dx = (e.clientX - dragRef.current.startX) / canvasScale;
    const dy = (e.clientY - dragRef.current.startY) / canvasScale;
    
    setKeyframes((prev) =>
      prev.map((frame) => {
        if (frame.id !== selectedKeyframeId) return frame;
        return {
          ...frame,
          keyElements: frame.keyElements.map((el) => {
            if (el.id !== dragRef.current!.elementId) return el;
            return {
              ...el,
              position: {
                x: Math.max(0, dragRef.current!.origX + dx),
                y: Math.max(0, dragRef.current!.origY + dy),
              },
            };
          }),
        };
      })
    );
  }, [isDragging, isResizing, isPanning, selectedKeyframeId, canvasScale]);

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
    field: keyof Pick<Transition, "trigger" | "duration" | "delay" | "curve" | "description">,
    value: string
  ) => {
    setTransitions((prev) =>
      prev.map((transition) =>
        transition.id === transitionId
          ? {
              ...transition,
              [field]: field === "duration" || field === "delay" ? Number(value) : value,
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

  const stepPreview = () => {
    const currentIndex = keyframes.findIndex((frame) => frame.id === selectedKeyframeId);
    const nextIndex = (currentIndex + 1) % keyframes.length;
    const nextFrame = keyframes[nextIndex];
    selectKeyframe(nextFrame.id);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedElementId(null);
        setSelectedElementIds([]);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
        deleteElement(selectedElementId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId]);

  const previewElements = selectedKeyframe.keyElements;
  const previewStateLabel =
    functionalStates.find((state) => state.id === selectedFunctionalState)?.name ??
    selectedFunctionalState;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <span className="pill">Toumo</span>
          <strong>Motion Editor</strong>
        </div>
        <div className="top-actions">
          <button className="ghost">Share</button>
          <button className="ghost">Record preview</button>
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
                        }}
                        onMouseDown={(e) => handleCanvasMouseDown(e, element.id)}
                      >
                      <span>{element.name}</span>
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
                    <button className="ghost small danger" onClick={() => deleteElement(selectedElement.id)}>Delete</button>
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
