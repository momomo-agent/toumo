import { useRef, useEffect, useCallback } from 'react';
import { cubicBezierAt, solveSpringRK4 } from '../../data/curvePresets';

interface Props {
  bezier?: [number, number, number, number];
  spring?: { damping: number; stiffness: number; mass: number };
  duration?: number;
  width?: number;
  height?: number;
  /** 'horizontal' = ball slides left→right, 'bounce' = ball drops and bounces vertically */
  mode?: 'horizontal' | 'bounce';
}

export function BallPreview({
  bezier,
  spring,
  duration = 800,
  width = 200,
  height = 36,
  mode = 'horizontal',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const drawHorizontal = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
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

    let progress: number;
    if (spring) {
      progress = solveSpringRK4(t, spring.mass, spring.stiffness, spring.damping);
    } else if (bezier) {
      progress = cubicBezierAt(t, bezier[0], bezier[1], bezier[2], bezier[3]);
    } else {
      progress = t;
    }

    const ballX = pad + ballR + progress * trackW;
    const ballY = h / 2;

    // Trail (fading dots)
    const trailCount = 6;
    for (let i = trailCount; i >= 1; i--) {
      const trailT = Math.max(0, t - i * 0.03);
      let tp: number;
      if (spring) {
        tp = solveSpringRK4(trailT, spring.mass, spring.stiffness, spring.damping);
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
  }, [bezier, spring]);

  const drawBounce = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const pad = 10;
    const ballR = 7;
    const groundY = h - pad - ballR;
    const topY = pad + ballR;
    const trackH = groundY - topY;

    // Ground line
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, groundY + ballR + 2);
    ctx.lineTo(w - pad, groundY + ballR + 2);
    ctx.stroke();

    // Vertical guide (faint)
    ctx.strokeStyle = '#1a1a1a';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(w / 2, topY - ballR);
    ctx.lineTo(w / 2, groundY + ballR);
    ctx.stroke();
    ctx.setLineDash([]);

    let progress: number;
    if (spring) {
      progress = solveSpringRK4(t, spring.mass, spring.stiffness, spring.damping);
    } else if (bezier) {
      progress = cubicBezierAt(t, bezier[0], bezier[1], bezier[2], bezier[3]);
    } else {
      progress = t;
    }

    // Ball drops from top to ground (progress 0→1 maps to top→bottom)
    const ballY = topY + progress * trackH;
    const ballX = w / 2;

    // Shadow on ground (scales with distance)
    const shadowScale = 0.3 + 0.7 * progress;
    const shadowAlpha = 0.1 + 0.15 * progress;
    ctx.fillStyle = `rgba(59, 130, 246, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(ballX, groundY + ballR + 2, ballR * shadowScale * 1.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Squash/stretch based on velocity
    const dt = 0.01;
    let nextProgress: number;
    if (spring) {
      nextProgress = solveSpringRK4(Math.min(1, t + dt), spring.mass, spring.stiffness, spring.damping);
    } else if (bezier) {
      nextProgress = cubicBezierAt(Math.min(1, t + dt), bezier[0], bezier[1], bezier[2], bezier[3]);
    } else {
      nextProgress = Math.min(1, t + dt);
    }
    const velocity = (nextProgress - progress) / dt;
    const squash = 1 + Math.abs(velocity) * 0.08;
    const scaleX = 1 / squash;
    const scaleY = squash;

    // Main ball with squash/stretch
    ctx.save();
    ctx.translate(ballX, ballY);
    ctx.scale(scaleX, scaleY);

    // Glow
    ctx.fillStyle = '#3b82f620';
    ctx.beginPath();
    ctx.arc(0, 0, ballR + 4, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const gradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, ballR);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, '#2563eb');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, ballR, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(-2, -2, ballR * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [bezier, spring]);

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

    const now = performance.now();
    const elapsed = now - startRef.current;
    const totalDur = duration + 400;
    const loopT = (elapsed % totalDur) / duration;
    const t = Math.min(1, Math.max(0, loopT));

    if (mode === 'bounce') {
      drawBounce(ctx, w, h, t);
    } else {
      drawHorizontal(ctx, w, h, t);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [drawHorizontal, drawBounce, duration, mode]);

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
  }, [bezier, spring, mode]);

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

export default BallPreview;
