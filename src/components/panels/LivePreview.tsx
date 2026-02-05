import { useState, useRef, useEffect, useCallback } from 'react';
import './LivePreview.css';

interface KeyElement {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: {
    fill?: string;
    fillOpacity?: number;
    borderRadius?: number;
  };
}

interface Keyframe {
  id: string;
  name: string;
  keyElements: KeyElement[];
}

interface Transition {
  from: string;
  to: string;
  duration: number;
  curve: string;
}

interface Props {
  keyframes: Keyframe[];
  transitions: Transition[];
  initialStateId: string;
}
