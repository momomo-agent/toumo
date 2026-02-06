import { useRef, useEffect, useCallback } from 'react';
import { cubicBezierAt } from '../../data/curvePresets';

interface Props {
  bezier?: [number, number, number, number];
  spring?: { damping: number; stiffness: number; mass: number };
  duration?: number;
  width?: number;
  height?: number;
}

export function BallPreview({ bezier, spring, duration = 800, width = 200, height = 36 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pad = 8;
    const ballR = 5;
    const trackW = w - pad * 2 - ballR * 2;

    // Track line
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad + ballR, h / 2);
    ctx.lineTo(pad + ballR + trackW, h / 2);
    ctx.stroke();

    // Compute progress
    const now = performance.now();
    const elapsed = now - startRef.current;
    const totalDur = duration + 400; // add pause at end
    const loopT = (elapsed % totalDur) / duration;
    const t = Math.min(1, Math.max(0, loopT));

    let progress: number;
    if (spring) {
      progress = simulateSpring(t, spring.damping, spring.stiffness, spring.mass);
    } else if (bezier) {
      progress = cubicBezierAt(t, bezier[0], bezier[1], bezier[2], bezier[3]);
    } else {
      progress = t;
    }

    // Ball position
    const ballX = pad + ballR + progress * trackW;
    const ballY = h / 2;

    // Trail (fading dots)
    const trailCount = 6;
    for (let i = trailCount; i >= 1; i--) {
      const trailT = Math.max(0, t - i * 0.03);
      let tp: number;
      if (spring) {
        tp = simulateSpring(trailT, spring.damping, spring.stiffness, spring.mass);
      } else if (bezier) {
        tp = cubicBezierAt(trailT, bezier[0], bezier[1], bezier[2], bezier[3]);
      } else {
        tp = trailT;
      }
      const tx = pad + ballR + tp * trackW;
      const alpha = (1 - i / (trailCount + 1)) * 0.25;
      ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
      ctx.beginPath();
      ctx.arc(tx, ballY, ballR * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main ball
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.fillStyle = '#3b82f625';
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR + 3, 0, Math.PI * 2);
    ctx.fill();

    animRef.current = requestAnimationFrame(draw);
  }, [bezier, spring, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    startRef.current = performance.now();
    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [draw, width, height]);

  // Restart animation on param change
  useEffect(() => {
    startRef.current = performance.now();
  }, [bezier, spring]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        borderRadius: 6,
        background: '#111112',
        border: '1px solid #2a2a2a',
        display: 'block',
      }}
    />
  );
}

// Simple spring simulation for preview
function simulateSpring(t: number, damping: number, stiffness: number, mass: number): number {
  const steps = 120;
  const dt = 1 / 60;
  const targetStep = Math.floor(t * steps);

  let x = 0;
  let v = 0;
  for (let i = 0; i < targetStep; i++) {
    const force = stiffness * (1 - x);
    const dampForce = -damping * 20 * v;
    const a = (force + dampForce) / mass;
    v += a * dt;
    x += v * dt;
  }
  return Math.max(0, Math.min(1.5, x));
}

export default BallPreview;
