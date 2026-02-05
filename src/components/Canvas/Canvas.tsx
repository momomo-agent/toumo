import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useEditorStore } from '../../store';
import { CanvasElement } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import { AlignmentGuides, type AlignmentLine } from './AlignmentGuides';
import type { KeyElement, Position } from '../../types';

const SNAP_THRESHOLD = 5;

export const Canvas: React.FC = () => {
  const {
    keyframes,
    selectedKeyframeId,
    selectedElementIds,
    setSelectedElementIds,
    setSelectedElementId,
    currentTool,
    canvasOffset,
    canvasScale,
    setCanvasOffset,
    addElement,
    selectionBox,
    setSelectionBox,
    setIsSelecting,
  } = useEditorStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const drawStartRef = useRef<Position | null>(null);

  const currentKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);
  const elements = currentKeyframe?.keyElements || [];
