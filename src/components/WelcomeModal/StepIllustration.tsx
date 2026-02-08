import { useEffect, useState } from 'react';

/**
 * Animated illustrations for each onboarding step.
 * Pure CSS animations — no external assets needed.
 */

// Step 1: Create Element — shows a rectangle being drawn
function CreateElementAnim() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ position: 'relative', width: 240, height: 160 }}>
      {/* Canvas background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#0d0d0e', borderRadius: 12,
        border: '1px solid #222',
        overflow: 'hidden',
      }}>
        {/* Grid dots */}
        <svg width="240" height="160" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          {Array.from({ length: 12 }).map((_, i) =>
            Array.from({ length: 8 }).map((_, j) => (
              <circle key={`${i}-${j}`} cx={20 * i + 10} cy={20 * j + 10} r={1} fill="#888" />
            ))
          )}
        </svg>

        {/* Cursor */}
        <div style={{
          position: 'absolute',
          left: phase >= 1 ? 40 : 20,
          top: phase >= 1 ? 30 : 20,
          // folme
          zIndex: 10,
        }}>
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path d="M1 1L1 15L5 11L9 19L12 17.5L8 10L14 10L1 1Z" fill="white" stroke="#000" strokeWidth="1" />
          </svg>
        </div>

        {/* Rectangle being drawn */}
        {phase >= 1 && (
          <div style={{
            position: 'absolute',
            left: 40, top: 30,
            width: phase >= 2 ? 160 : 0,
            height: phase >= 2 ? 90 : 0,
            background: phase >= 3
              ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
              : 'rgba(59, 130, 246, 0.15)',
            border: `2px ${phase >= 3 ? 'solid' : 'dashed'} #3b82f6`,
            borderRadius: phase >= 3 ? 12 : 0,
            // folme
          }} />
        )}

        {/* Selection handles */}
        {phase >= 3 && (
          <>
            {[[40, 30], [200, 30], [40, 120], [200, 120]].map(([x, y], i) => (
              <div key={i} style={{
                position: 'absolute', left: x - 3, top: y - 3,
                width: 6, height: 6, background: '#fff',
                border: '1px solid #3b82f6', borderRadius: 1,
              }} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Step 2: Add State — shows two states side by side
function AddStateAnim() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActive(a => (a + 1) % 2), 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', width: 240, height: 160 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: '#0d0d0e', borderRadius: 12,
        border: '1px solid #222',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        {/* State 1 */}
        <div style={{
          width: 80, height: 80,
          background: active === 0
            ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
            : '#1a1a1a',
          borderRadius: 12,
          border: active === 0 ? '2px solid #3b82f6' : '1px solid #333',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
          // folme
          transform: active === 0 ? 'scale(1.05)' : 'scale(0.95)',
        }}>
          <span style={{ fontSize: 20 }}>🟦</span>
          <span style={{ fontSize: 9, color: active === 0 ? '#fff' : '#666' }}>默认</span>
        </div>

        {/* Arrow */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* State 2 */}
        <div style={{
          width: 80, height: 80,
          background: active === 1
            ? 'linear-gradient(135deg, #22c55e, #06b6d4)'
            : '#1a1a1a',
          borderRadius: 12,
          border: active === 1 ? '2px solid #22c55e' : '1px solid #333',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
          // folme
          transform: active === 1 ? 'scale(1.05)' : 'scale(0.95)',
        }}>
          <span style={{ fontSize: 20 }}>🟩</span>
          <span style={{ fontSize: 9, color: active === 1 ? '#fff' : '#666' }}>悬停</span>
        </div>
      </div>
    </div>
  );
}

// Step 3: Set Interaction — shows a tap trigger with transition
function SetInteractionAnim() {
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTapped(t => !t), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', width: 240, height: 160 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: '#0d0d0e', borderRadius: 12,
        border: '1px solid #222',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Button element */}
        <div style={{
          width: 140, height: 48,
          background: tapped
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          // folme
          transform: tapped ? 'scale(0.95)' : 'scale(1)',
          boxShadow: tapped
            ? '0 2px 8px rgba(34, 197, 94, 0.4)'
            : '0 4px 16px rgba(59, 130, 246, 0.3)',
        }}>
          <span style={{
            color: '#fff', fontSize: 14, fontWeight: 600,
            // folme
          }}>
            {tapped ? '✓ 已完成' : '点击我'}
          </span>
        </div>

        {/* Tap ripple */}
        {tapped && (
          <div style={{
            position: 'absolute',
            width: 40, height: 40,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)',
            animation: 'ripple 0.6s ease-out forwards',
          }} />
        )}

        {/* Finger icon */}
        <div style={{
          position: 'absolute', bottom: 20, right: 40,
          fontSize: 24,
          // folme
          transform: tapped ? 'translateY(2px) scale(0.9)' : 'translateY(0) scale(1)',
          opacity: 0.8,
        }}>
          👆
        </div>
      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Step 4: Preview — shows a phone frame with live content
function PreviewAnim() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollY(y => y >= 30 ? 0 : y + 1);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', width: 240, height: 160 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: '#0d0d0e', borderRadius: 12,
        border: '1px solid #222',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Phone frame */}
        <div style={{
          width: 72, height: 130,
          background: '#111',
          borderRadius: 12,
          border: '2px solid #333',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Notch */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 28, height: 8, background: '#000', borderRadius: '0 0 6 6',
            zIndex: 5,
          }} />

          {/* Content scrolling */}
          <div style={{
            position: 'absolute', top: -scrollY, left: 0, right: 0,
            padding: 6, paddingTop: 12,
            // folme
          }}>
            {/* Header bar */}
            <div style={{
              height: 8, background: '#333', borderRadius: 2, marginBottom: 6,
              width: '60%',
            }} />
            {/* Card */}
            <div style={{
              height: 32, borderRadius: 6, marginBottom: 6,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            }} />
            {/* Text lines */}
            {[0.9, 0.7, 0.8, 0.5].map((w, i) => (
              <div key={i} style={{
                height: 4, background: '#2a2a2a', borderRadius: 1,
                marginBottom: 4, width: `${w * 100}%`,
              }} />
            ))}
            {/* Button */}
            <div style={{
              height: 14, borderRadius: 4, marginTop: 6,
              background: '#22c55e',
            }} />
          </div>
        </div>

        {/* Play button overlay */}
        <div style={{
          position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
          }}>
            <span style={{ color: '#fff', fontSize: 14, marginLeft: 2 }}>▶</span>
          </div>
          <span style={{ fontSize: 9, color: '#666' }}>预览</span>
        </div>
      </div>
    </div>
  );
}

export function StepIllustration({ step }: { step: number }) {
  switch (step) {
    case 0: return <CreateElementAnim />;
    case 1: return <AddStateAnim />;
    case 2: return <SetInteractionAnim />;
    case 3: return <PreviewAnim />;
    default: return null;
  }
}
