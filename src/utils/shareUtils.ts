import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Keyframe, Size, Variable } from '../types';
type Transition = any;
type Component = any;
type Interaction = any;

export interface ProjectData {
  version: string;
  keyframes: Keyframe[];
  transitions: Transition[];
  components: Component[];
  frameSize: Size;
  canvasBackground?: string;
  // 交互系统数据
  interactions?: Interaction[];
  variables?: Variable[];
}

/**
 * Compress project data to a URL-safe string
 */
export function compressProject(data: ProjectData): string {
  const json = JSON.stringify(data);
  return compressToEncodedURIComponent(json);
}

/**
 * Decompress project data from URL hash
 */
export function decompressProject(compressed: string): ProjectData | null {
  try {
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    
    const data = JSON.parse(json) as ProjectData;
    
    // Validate basic structure
    if (!data.keyframes || !Array.isArray(data.keyframes)) {
      return null;
    }
    if (!data.transitions || !Array.isArray(data.transitions)) {
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Failed to decompress project:', e);
    return null;
  }
}

/**
 * Generate a shareable URL with project data in hash
 */
export function generateShareUrl(data: ProjectData): string {
  const compressed = compressProject(data);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#preview=${compressed}`;
}

/**
 * Check if current URL is a preview/share link
 */
export function isPreviewUrl(): boolean {
  return window.location.hash.startsWith('#preview=');
}

/**
 * Extract project data from preview URL
 */
export function getProjectFromUrl(): ProjectData | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#preview=')) {
    return null;
  }
  
  const compressed = hash.slice('#preview='.length);
  return decompressProject(compressed);
}

/**
 * Clear the preview hash from URL (for entering edit mode)
 */
export function clearPreviewHash(): void {
  history.pushState(null, '', window.location.pathname);
}
