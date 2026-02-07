import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useEditorStore } from '../../store';
import type { Transition } from '../../types';
import './Timeline.css';

const PIXELS_PER_MS = 0.4;
const MIN_DURATION = 50;
const RULER_STEP = 100; // ms per minor tick
const MAJOR_EVERY = 5;  // major tick every N minor ticks

type DragMode =
  | { type: 'playhead' }
  | { type: 'duration'; transitionId: string; startDuration: number }
  | { type: 'delay'; transitionId: string; startDelay: number }
  | { type: 'move'; transitionId: string; startDelay: number; startDuration: number }
  | null;

export function Timeline() {
  const {
    keyframes,
    transitions,
    selectedKeyframeId,
    selectedTransitionId,
    setSelectedKeyframeId,
    setSelectedTransitionId,
    setPreviewTransitionId,
    updateTransition,
  } = useEditorStore();

  const [playheadMs, setPlayheadMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<DragMode>(null);
  const dragStartX = useRef(0);
  const tracksRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const playStartRef = useRef<{ time: number; offset: number }>({ time: 0, offset: 0 });

  const pxPerMs = PIXELS_PER_MS * zoom;

  // Compute total timeline duration
  const totalDuration = useMemo(() => {
    let max = 1000;
    for (const tr of transitions) {
      const end = tr.delay + tr.duration;
      if (end > max) max = end;
    }
    return Math.ceil(max / 500) * 500 + 500;
  }, [transitions]);

  const totalWidth = totalDuration * pxPerMs;

  // Build rows: one per transition, grouped by "from" keyframe
  const rows = useMemo(() => {
    const result: Array<{
      id: string;
      label: string;
      color: string;
      transition: Transition;
      fromKeyframeName: string;
      toKeyframeName: string;
    }> = [];

    const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

    transitions.forEach((tr, i) => {
      const fromKf = keyframes.find((kf) => kf.id === tr.from);
      const toKf = keyframes.find((kf) => kf.id === tr.to);
      result.push({
        id: tr.id,
        label: `${fromKf?.name ?? '?'} → ${toKf?.name ?? '?'}`,
        color: colors[i % colors.length],
        transition: tr,
        fromKeyframeName: fromKf?.name ?? '?',
        toKeyframeName: toKf?.name ?? '?',
      });
    });

    return result;
  }, [transitions, keyframes]);

  // Keyframe time positions (for diamond markers)
  const keyframePositions = useMemo(() => {
    const positions: Array<{ id: string; name: string; timeMs: number }> = [];
    // Place first keyframe at t=0
    if (keyframes.length > 0) {
      positions.push({ id: keyframes[0].id, name: keyframes[0].name, timeMs: 0 });
    }
    // Place other keyframes at the end of transitions that lead to them
    for (const tr of transitions) {
      const endTime = tr.delay + tr.duration;
      const existing = positions.find((p) => p.id === tr.to);
      if (!existing) {
        const kf = keyframes.find((k) => k.id === tr.to);
        if (kf) positions.push({ id: kf.id, name: kf.name, timeMs: endTime });
      } else {
        // Update to latest time
        if (endTime > existing.timeMs) existing.timeMs = endTime;
      }
    }
    // Add any keyframes not yet placed
    for (const kf of keyframes) {
      if (!positions.find((p) => p.id === kf.id)) {
        positions.push({ id: kf.id, name: kf.name, timeMs: 0 });
      }
    }
    return positions;
  }, [keyframes, transitions]);

  // --- Playback ---
  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    playStartRef.current = { time: performance.now(), offset: playheadMs };
    const animate = () => {
      const elapsed = performance.now() - playStartRef.current.time;
      const newMs = playStartRef.current.offset + elapsed;
      if (newMs >= totalDuration) {
        setPlayheadMs(0);
        setIsPlaying(false);
        return;
      }
      setPlayheadMs(newMs);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [playheadMs, totalDuration]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // --- Preview: update previewTransitionId based on playhead ---
  useEffect(() => {
    for (const tr of transitions) {
      if (playheadMs >= tr.delay && playheadMs <= tr.delay + tr.duration) {
        setPreviewTransitionId(tr.id);
        return;
      }
    }
    setPreviewTransitionId(null);
  }, [playheadMs, transitions, setPreviewTransitionId]);

  // --- Drag handlers ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = mode;
      dragStartX.current = e.clientX;

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragStartX.current;
        const dMs = dx / pxPerMs;
        const drag = dragRef.current;
        if (!drag) return;

        if (drag.type === 'playhead') {
          const rect = tracksRef.current?.getBoundingClientRect();
          if (rect) {
            const x = ev.clientX - rect.left + (tracksRef.current?.scrollLeft ?? 0);
            setPlayheadMs(Math.max(0, Math.min(totalDuration, x / pxPerMs)));
          }
        } else if (drag.type === 'duration') {
          const newDur = Math.max(MIN_DURATION, Math.round(drag.startDuration + dMs));
          updateTransition(drag.transitionId, { duration: newDur });
        } else if (drag.type === 'delay') {
          const newDelay = Math.max(0, Math.round(drag.startDelay + dMs));
          updateTransition(drag.transitionId, { delay: newDelay });
        } else if (drag.type === 'move') {
          const newDelay = Math.max(0, Math.round(drag.startDelay + dMs));
          updateTransition(drag.transitionId, { delay: newDelay });
        }
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [pxPerMs, totalDuration, updateTransition]
  );

  // Click on ruler to set playhead
  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + (tracksRef.current?.scrollLeft ?? 0);
      setPlayheadMs(Math.max(0, x / pxPerMs));
    },
    [pxPerMs]
  );

  // --- Render ruler ticks ---
  const renderRuler = () => {
    const ticks: React.ReactElement[] = [];
    const step = RULER_STEP;
    const count = Math.ceil(totalDuration / step) + 1;
    for (let i = 0; i <= count; i++) {
      const ms = i * step;
      const x = ms * pxPerMs;
      const isMajor = i % MAJOR_EVERY === 0;
      ticks.push(
        <div
          key={i}
          className={`timeline-ruler-tick ${isMajor ? 'major' : ''}`}
          style={{ left: x }}
        >
          {isMajor && <span>{ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`}</span>}
        </div>
      );
    }
    return ticks;
  };

  // --- Render ---
  if (keyframes.length === 0) {
    return (
      <div className="timeline-container">
        <div className="timeline-empty">No keyframes yet</div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {/* Header */}
      <div className="timeline-header">
        <span className="timeline-header-title">⏱ Timeline</span>
        <div className="timeline-header-controls">
          <div className="timeline-time-display">
            {playheadMs >= 1000
              ? `${(playheadMs / 1000).toFixed(2)}s`
              : `${Math.round(playheadMs)}ms`}
          </div>
          <button
            onClick={() => { setPlayheadMs(0); stopPlayback(); }}
            title="Reset"
          >
            ⏮
          </button>
          <button
            className={isPlaying ? 'active' : ''}
            onClick={() => (isPlaying ? stopPlayback() : startPlayback())}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>−</button>
          <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>+</button>
          <span style={{ fontSize: 10, color: '#555' }}>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Body */}
      <div className="timeline-body">
        {/* Labels column */}
        <div className="timeline-labels">
          <div className="timeline-label-header">Keyframes</div>
          {keyframePositions.map((kfp) => (
            <div
              key={kfp.id}
              className={`timeline-label-row ${selectedKeyframeId === kfp.id ? 'selected' : ''}`}
              onClick={() => setSelectedKeyframeId(kfp.id)}
            >
              <span className="label-dot" style={{ background: '#f59e0b' }} />
              {kfp.name}
            </div>
          ))}
          {rows.length > 0 && (
            <div className="timeline-label-header" style={{ marginTop: 4 }}>
              Transitions
            </div>
          )}
          {rows.map((row) => (
            <div
              key={row.id}
              className={`timeline-label-row ${selectedTransitionId === row.id ? 'selected' : ''}`}
              onClick={() => setSelectedTransitionId(row.id)}
            >
              <span className="label-dot" style={{ background: row.color }} />
              {row.label}
            </div>
          ))}
        </div>

        {/* Tracks area */}
        <div className="timeline-tracks" ref={tracksRef}>
          <div className="timeline-tracks-inner" style={{ width: totalWidth + 60 }}>
            {/* Ruler */}
            <div
              className="timeline-ruler"
              onClick={handleRulerClick}
              style={{ width: totalWidth + 60, cursor: 'pointer' }}
            >
              {renderRuler()}
            </div>

            {/* Keyframe diamond rows */}
            {keyframePositions.map((kfp) => (
              <div key={kfp.id} className="timeline-track-row">
                <div
                  className={`timeline-keyframe-diamond ${selectedKeyframeId === kfp.id ? 'selected' : ''}`}
                  style={{ left: kfp.timeMs * pxPerMs }}
                  onClick={() => setSelectedKeyframeId(kfp.id)}
                  title={`${kfp.name} @ ${kfp.timeMs}ms`}
                />
              </div>
            ))}

            {/* Transition bar rows */}
            {rows.map((row) => {
              const tr = row.transition;
              const barLeft = tr.delay * pxPerMs;
              const barWidth = Math.max(tr.duration * pxPerMs, 8);

              return (
                <div key={row.id} className="timeline-track-row">
                  {/* Delay zone (hatched area before the bar) */}
                  {tr.delay > 0 && (
                    <div
                      className="timeline-delay-zone"
                      style={{ left: 0, width: barLeft }}
                      onMouseDown={(e) =>
                        handleMouseDown(e, {
                          type: 'delay',
                          transitionId: tr.id,
                          startDelay: tr.delay,
                        })
                      }
                      title={`Delay: ${tr.delay}ms`}
                    />
                  )}

                  {/* Transition bar */}
                  <div
                    className={`timeline-transition-bar ${selectedTransitionId === tr.id ? 'selected' : ''}`}
                    style={{
                      left: barLeft,
                      width: barWidth,
                      background: `linear-gradient(90deg, ${row.color}cc, ${row.color}88)`,
                    }}
                    onClick={() => setSelectedTransitionId(tr.id)}
                    onMouseDown={(e) =>
                      handleMouseDown(e, {
                        type: 'move',
                        transitionId: tr.id,
                        startDelay: tr.delay,
                        startDuration: tr.duration,
                      })
                    }
                    title={`${row.label}\nDuration: ${tr.duration}ms | Delay: ${tr.delay}ms | ${tr.curve}`}
                  >
                    {barWidth > 40 && (
                      <span style={{ padding: '0 8px', pointerEvents: 'none' }}>
                        {tr.duration}ms
                      </span>
                    )}

                    {/* Left handle (delay) */}
                    <div
                      className="timeline-transition-handle left"
                      onMouseDown={(e) =>
                        handleMouseDown(e, {
                          type: 'delay',
                          transitionId: tr.id,
                          startDelay: tr.delay,
                        })
                      }
                    />

                    {/* Right handle (duration) */}
                    <div
                      className="timeline-transition-handle right"
                      onMouseDown={(e) =>
                        handleMouseDown(e, {
                          type: 'duration',
                          transitionId: tr.id,
                          startDuration: tr.duration,
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}

            {/* Playhead */}
            <div
              className="timeline-playhead"
              style={{ left: playheadMs * pxPerMs }}
              onMouseDown={(e) => handleMouseDown(e, { type: 'playhead' })}
            >
              <div className="timeline-playhead-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
