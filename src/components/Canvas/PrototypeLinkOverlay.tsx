import { useMemo } from 'react';
import type { Keyframe } from '../../types';

interface FrameLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PrototypeLinkOverlayProps {
  keyframes: Keyframe[];
  frameLayouts: FrameLayout[];
  selectedKeyframeId: string;
  selectedElementIds: string[];
}

interface LinkInfo {
  fromElementId: string;
  fromElementName: string;
  fromFrameId: string;
  targetFrameId: string;
  trigger: string;
  // Source point (element center, in stage coords)
  sx: number;
  sy: number;
  // Target point (frame left-center, in stage coords)
  tx: number;
  ty: number;
  isSelected: boolean;
}

export function PrototypeLinkOverlay({
  keyframes,
  frameLayouts,
  selectedKeyframeId,
  selectedElementIds,
}: PrototypeLinkOverlayProps) {
  const links = useMemo(() => {
    const result: LinkInfo[] = [];
    const layoutMap = new Map(frameLayouts.map(l => [l.id, l]));

    keyframes.forEach(kf => {
      const srcLayout = layoutMap.get(kf.id);
      if (!srcLayout) return;

      kf.keyElements.forEach(el => {
        if (!el.prototypeLink?.enabled || !el.prototypeLink.targetFrameId) return;
        if (el.prototypeLink.targetFrameId === 'back') return;

        const targetLayout = layoutMap.get(el.prototypeLink.targetFrameId);
        if (!targetLayout) return;

        const sx = srcLayout.x + el.position.x + el.size.width / 2;
        const sy = srcLayout.y + el.position.y + el.size.height / 2;

        // Connect to the nearest edge of the target frame
        const tx = targetLayout.x < srcLayout.x
          ? targetLayout.x + targetLayout.width
          : targetLayout.x;
        const ty = targetLayout.y + targetLayout.height / 2;

        const isSelected = kf.id === selectedKeyframeId &&
          selectedElementIds.includes(el.id);

        result.push({
          fromElementId: el.id,
          fromElementName: el.name,
          fromFrameId: kf.id,
          targetFrameId: el.prototypeLink.targetFrameId,
          trigger: el.prototypeLink.trigger,
          sx, sy, tx, ty,
          isSelected,
        });
      });
    });

    return result;
  }, [keyframes, frameLayouts, selectedKeyframeId, selectedElementIds]);

  if (links.length === 0) return null;

  // Calculate SVG bounds
  const allX = links.flatMap(l => [l.sx, l.tx]);
  const allY = links.flatMap(l => [l.sy, l.ty]);
  const minX = Math.min(...allX) - 50;
  const minY = Math.min(...allY) - 50;
  const maxX = Math.max(...allX) + 50;
  const maxY = Math.max(...allY) + 50;

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: maxX - minX + 100,
        height: maxY - minY + 100,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id="proto-arrow"
          viewBox="0 0 10 8"
          refX="9"
          refY="4"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 4 L 0 8 z" fill="#3b82f6" />
        </marker>
        <marker
          id="proto-arrow-selected"
          viewBox="0 0 10 8"
          refX="9"
          refY="4"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 4 L 0 8 z" fill="#60a5fa" />
        </marker>
      </defs>

      {links.map(link => {
        const isActive = link.isSelected;
        return (
          <LinkCurve
            key={`${link.fromFrameId}-${link.fromElementId}`}
            link={link}
            isActive={isActive}
          />
        );
      })}
    </svg>
  );
}

function LinkCurve({ link, isActive }: { link: LinkInfo; isActive: boolean }) {
  const { sx, sy, tx, ty } = link;

  // Bezier control points for a smooth curve
  const dx = tx - sx;
  const cpOffset = Math.min(Math.abs(dx) * 0.4, 120);
  const cp1x = sx + cpOffset;
  const cp1y = sy;
  const cp2x = tx - cpOffset;
  const cp2y = ty;

  const pathD = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;

  return (
    <g>
      {/* Shadow / glow for selected */}
      {isActive && (
        <path
          d={pathD}
          fill="none"
          stroke="rgba(59,130,246,0.2)"
          strokeWidth={6}
          strokeLinecap="round"
        />
      )}
      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke={isActive ? '#60a5fa' : '#3b82f6'}
        strokeWidth={isActive ? 2 : 1.5}
        strokeDasharray={isActive ? 'none' : '6 3'}
        strokeLinecap="round"
        markerEnd={isActive ? 'url(#proto-arrow-selected)' : 'url(#proto-arrow)'}
        opacity={isActive ? 1 : 0.6}
      />
      {/* Source dot */}
      <circle
        cx={sx}
        cy={sy}
        r={isActive ? 4 : 3}
        fill={isActive ? '#60a5fa' : '#3b82f6'}
        opacity={isActive ? 1 : 0.7}
      />
    </g>
  );
}
