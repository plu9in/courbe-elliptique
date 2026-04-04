import { useEffect, useRef, useCallback } from "react";
import type { EllipticCurve } from "../../curve-visualization/domain/model/EllipticCurve.js";
import type { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";
import type { FieldMode, StepData } from "../hooks/useCurveState.js";

interface Viewport {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
}

interface Props {
  mode: FieldMode;
  realCurve: EllipticCurve;
  finiteCurve: FiniteFieldCurve;
  p: number;
  isSingular: boolean;
  isPrimeValid: boolean;
  selectedP: CurvePoint | null;
  selectedQ: CurvePoint | null;
  result: CurvePoint | null;
  steps: StepData[];
  currentStepIndex: number;
  onPointClick: (point: CurvePoint) => void;
}

function toCanvas(x: number, y: number, vp: Viewport, w: number, h: number): [number, number] {
  const px = ((x - vp.xMin) / (vp.xMax - vp.xMin)) * w;
  const py = h - ((y - vp.yMin) / (vp.yMax - vp.yMin)) * h;
  return [px, py];
}

function fromCanvas(px: number, py: number, vp: Viewport, w: number, h: number): [number, number] {
  const x = vp.xMin + (px / w) * (vp.xMax - vp.xMin);
  const y = vp.yMin + ((h - py) / h) * (vp.yMax - vp.yMin);
  return [x, y];
}

// ===== Grid =====

function drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport, w: number, h: number, isFinite: boolean) {
  const step = isFinite ? 1 : 1;
  // Minor grid
  ctx.strokeStyle = "#1A2535";
  ctx.lineWidth = 0.5;
  for (let x = Math.ceil(vp.xMin); x <= vp.xMax; x += step) {
    const [px] = toCanvas(x, 0, vp, w, h);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
  }
  for (let y = Math.ceil(vp.yMin); y <= vp.yMax; y += step) {
    const [, py] = toCanvas(0, y, vp, w, h);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
  }
  // Axes
  ctx.strokeStyle = "#3D4A5C";
  ctx.lineWidth = 1.5;
  const [ax] = toCanvas(0, 0, vp, w, h);
  const [, ay] = toCanvas(0, 0, vp, w, h);
  ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(w, ay); ctx.stroke();

  // Axis labels
  ctx.fillStyle = "#556270";
  ctx.font = "11px 'Source Sans 3', sans-serif";
  const labelStep = isFinite ? (vp.xMax > 40 ? 5 : 1) : 1;
  ctx.textAlign = "center";
  for (let x = Math.ceil(vp.xMin / labelStep) * labelStep; x <= vp.xMax; x += labelStep) {
    if (x === 0) continue;
    const [px, py] = toCanvas(x, 0, vp, w, h);
    ctx.fillText(String(x), px, py + 14);
  }
  ctx.textAlign = "right";
  for (let y = Math.ceil(vp.yMin / labelStep) * labelStep; y <= vp.yMax; y += labelStep) {
    if (y === 0) continue;
    const [px, py] = toCanvas(0, y, vp, w, h);
    ctx.fillText(String(y), px - 6, py + 4);
  }
}

// ===== Real curve =====

function drawRealCurve(ctx: CanvasRenderingContext2D, curve: EllipticCurve, vp: Viewport, w: number, h: number) {
  const step = (vp.xMax - vp.xMin) / w * 0.5;

  ctx.shadowColor = "rgba(78, 205, 196, 0.35)";
  ctx.shadowBlur = 14;
  ctx.strokeStyle = "#4ECDC4";
  ctx.lineWidth = 2.5;

  for (const sign of [1, -1]) {
    ctx.beginPath();
    let started = false;
    for (let x = vp.xMin; x <= vp.xMax; x += step) {
      const fx = curve.evaluateAt(x);
      if (fx < 0) { started = false; continue; }
      const y = sign * Math.sqrt(fx);
      const [px, py] = toCanvas(x, y, vp, w, h);
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

// ===== Finite field points =====

function drawFiniteFieldPoints(ctx: CanvasRenderingContext2D, curve: FiniteFieldCurve, p: number, vp: Viewport, w: number, h: number) {
  const points = curve.computeAllPoints();
  const radius = Math.max(2, Math.min(5, w / p / 3));

  for (const pt of points) {
    const [px, py] = toCanvas(pt.x, pt.y, vp, w, h);
    // Glow
    ctx.beginPath();
    ctx.arc(px, py, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(78, 205, 196, 0.15)";
    ctx.fill();
    // Dot
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(125, 211, 192, 0.75)";
    ctx.fill();
  }

  // Point at infinity
  ctx.fillStyle = "rgba(125, 211, 192, 0.5)";
  ctx.font = `bold ${Math.max(11, 14)}px 'Fira Code', monospace`;
  ctx.textAlign = "right";
  ctx.fillText("O \u221E", w - 12, 24);
}

// ===== Construction lines =====

function drawConstructionLines(
  ctx: CanvasRenderingContext2D,
  step: StepData,
  vp: Viewport,
  w: number,
  h: number,
) {
  if (!step.lines) return;

  for (const line of step.lines) {
    const dx = line.to.x - line.from.x;
    const dy = line.to.y - line.from.y;

    if (line.style === "vertical") {
      // Vertical dashed line (reflection)
      const [px1, py1] = toCanvas(line.from.x, line.from.y, vp, w, h);
      const [, py2] = toCanvas(line.to.x, line.to.y, vp, w, h);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(167, 139, 250, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px1, py2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow head at bottom
      const headY = py2 > py1 ? py2 - 6 : py2 + 6;
      const dir = py2 > py1 ? 1 : -1;
      ctx.fillStyle = "rgba(167, 139, 250, 0.7)";
      ctx.beginPath();
      ctx.moveTo(px1, py2);
      ctx.lineTo(px1 - 4, headY);
      ctx.lineTo(px1 + 4, headY);
      ctx.closePath();
      ctx.fill();
    } else {
      // Secant or tangent — extend across the full viewport
      const ext = 50;
      const x1 = line.from.x - dx * ext;
      const y1 = line.from.y - dy * ext;
      const x2 = line.to.x + dx * ext;
      const y2 = line.to.y + dy * ext;

      const [px1, py1] = toCanvas(x1, y1, vp, w, h);
      const [px2, py2] = toCanvas(x2, y2, vp, w, h);

      if (line.style === "tangent") {
        ctx.setLineDash([8, 5]);
        ctx.strokeStyle = "rgba(255, 209, 102, 0.55)";
      } else {
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(255, 123, 107, 0.6)";
      }
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ===== Orbit trail =====

function drawTrail(ctx: CanvasRenderingContext2D, trail: CurvePoint[], vp: Viewport, w: number, h: number) {
  if (trail.length < 2) return;

  // Trail line
  ctx.strokeStyle = "rgba(6, 214, 160, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  const [sx, sy] = toCanvas(trail[0].x, trail[0].y, vp, w, h);
  ctx.moveTo(sx, sy);
  for (let i = 1; i < trail.length; i++) {
    const [tx, ty] = toCanvas(trail[i].x, trail[i].y, vp, w, h);
    ctx.lineTo(tx, ty);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Trail dots (small, fading)
  for (let i = 0; i < trail.length; i++) {
    const [tx, ty] = toCanvas(trail[i].x, trail[i].y, vp, w, h);
    const alpha = 0.3 + 0.5 * (i / trail.length);
    ctx.beginPath();
    ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(6, 214, 160, ${alpha})`;
    ctx.fill();
  }
}

// ===== Labeled points =====

function drawLabeledPoint(
  ctx: CanvasRenderingContext2D,
  pt: CurvePoint,
  color: string,
  label: string,
  vp: Viewport,
  w: number,
  h: number,
  size: number = 6,
) {
  const [px, py] = toCanvas(pt.x, pt.y, vp, w, h);

  // Outer glow
  ctx.beginPath();
  ctx.arc(px, py, size + 6, 0, Math.PI * 2);
  const gradient = ctx.createRadialGradient(px, py, size, px, py, size + 6);
  gradient.addColorStop(0, color + "44");
  gradient.addColorStop(1, color + "00");
  ctx.fillStyle = gradient;
  ctx.fill();

  // Inner dot
  ctx.beginPath();
  ctx.arc(px, py, size, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#0D1117";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Label background
  if (label) {
    ctx.font = "bold 12px 'Fira Code', monospace";
    const textWidth = ctx.measureText(label).width;
    const lx = px + size + 6;
    const ly = py - size - 2;
    ctx.fillStyle = "rgba(13, 17, 23, 0.8)";
    ctx.beginPath();
    ctx.roundRect(lx - 3, ly - 11, textWidth + 6, 16, 3);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(label, lx, ly);
  }
}

// ===== Main component =====

export function CurveCanvas({
  mode, realCurve, finiteCurve, p, isSingular, isPrimeValid,
  selectedP, selectedQ, result, steps, currentStepIndex, onPointClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const getViewport = useCallback((): Viewport => {
    if (mode === "finite") {
      const pad = Math.max(1, p * 0.06);
      return { xMin: -pad, xMax: p - 1 + pad, yMin: -pad, yMax: p - 1 + pad };
    }
    return { xMin: -6, xMax: 6, yMin: -6, yMax: 6 };
  }, [mode, p]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const vp = getViewport();

    ctx.clearRect(0, 0, w, h);

    // Background subtle gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0B0F15");
    bg.addColorStop(1, "#0D1219");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid
    drawGrid(ctx, vp, w, h, mode === "finite");

    // Curve
    if (mode === "real" && !isSingular) {
      drawRealCurve(ctx, realCurve, vp, w, h);
    } else if (mode === "finite" && isPrimeValid) {
      drawFiniteFieldPoints(ctx, finiteCurve, p, vp, w, h);
    }

    // Step visuals (construction lines, trail, extra points)
    const currentStep = steps[currentStepIndex];

    if (currentStep?.trail) {
      drawTrail(ctx, currentStep.trail, vp, w, h);
    }

    if (currentStep) {
      drawConstructionLines(ctx, currentStep, vp, w, h);
    }

    // Selected points (always visible)
    if (selectedP) drawLabeledPoint(ctx, selectedP, "#FFD166", "P", vp, w, h);
    if (selectedQ) drawLabeledPoint(ctx, selectedQ, "#FF7B6B", "Q", vp, w, h);

    // Step-labeled points
    if (currentStep?.points) {
      for (const lp of currentStep.points) {
        drawLabeledPoint(ctx, lp.point, lp.color, lp.label, vp, w, h);
      }
    }

    // Equation overlay
    ctx.fillStyle = "rgba(78, 205, 196, 0.6)";
    ctx.font = "14px 'Fira Code', monospace";
    ctx.textAlign = "left";
    const eq = mode === "real"
      ? `y\u00B2 = x\u00B3 ${realCurve.a >= 0 ? "+" : ""}${realCurve.a}x ${realCurve.b >= 0 ? "+" : ""}${realCurve.b}`
      : `y\u00B2 \u2261 x\u00B3 ${finiteCurve.a >= 0 ? "+" : ""}${finiteCurve.a}x ${finiteCurve.b >= 0 ? "+" : ""}${finiteCurve.b} (mod ${p})`;
    ctx.fillText(eq, 12, h - 12);

  }, [mode, realCurve, finiteCurve, p, isSingular, isPrimeValid, selectedP, selectedQ, steps, currentStepIndex, getViewport]);

  useEffect(() => {
    const render = () => {
      draw();
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const vp = getViewport();
    const [mx, my] = fromCanvas(px, py, vp, rect.width, rect.height);

    if (mode === "real") {
      const nearest = realCurve.nearestPoint(mx, my);
      if (nearest) onPointClick(nearest);
    } else {
      const rx = Math.round(mx);
      const ry = Math.round(my);
      if (rx >= 0 && rx < p && ry >= 0 && ry < p && finiteCurve.isPointOnCurve(rx, ry)) {
        onPointClick({ x: rx, y: ry });
      }
    }
  }, [mode, realCurve, finiteCurve, p, onPointClick, getViewport]);

  return (
    <div className="canvas-area">
      <canvas ref={canvasRef} onClick={handleClick} />
    </div>
  );
}
