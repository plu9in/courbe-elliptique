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

function drawGrid(ctx: CanvasRenderingContext2D, vp: Viewport, w: number, h: number) {
  // Minor grid
  ctx.strokeStyle = "#1E2A3A";
  ctx.lineWidth = 0.5;
  for (let x = Math.ceil(vp.xMin); x <= vp.xMax; x++) {
    const [px] = toCanvas(x, 0, vp, w, h);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
  }
  for (let y = Math.ceil(vp.yMin); y <= vp.yMax; y++) {
    const [, py] = toCanvas(0, y, vp, w, h);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
  }
  // Axes
  ctx.strokeStyle = "#4A5568";
  ctx.lineWidth = 1.5;
  const [ax] = toCanvas(0, 0, vp, w, h);
  const [, ay] = toCanvas(0, 0, vp, w, h);
  ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(w, ay); ctx.stroke();

  // Axis labels
  ctx.fillStyle = "#6B7280";
  ctx.font = "11px 'Source Sans 3', sans-serif";
  ctx.textAlign = "center";
  for (let x = Math.ceil(vp.xMin); x <= vp.xMax; x++) {
    if (x === 0) continue;
    const [px, py] = toCanvas(x, 0, vp, w, h);
    ctx.fillText(String(x), px, py + 14);
  }
  ctx.textAlign = "right";
  for (let y = Math.ceil(vp.yMin); y <= vp.yMax; y++) {
    if (y === 0) continue;
    const [px, py] = toCanvas(0, y, vp, w, h);
    ctx.fillText(String(y), px - 6, py + 4);
  }
}

function drawRealCurve(ctx: CanvasRenderingContext2D, curve: EllipticCurve, vp: Viewport, w: number, h: number) {
  const step = (vp.xMax - vp.xMin) / w * 0.5;

  // Glow effect
  ctx.shadowColor = "rgba(78, 205, 196, 0.4)";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "#4ECDC4";
  ctx.lineWidth = 2.5;

  // Upper branch (y > 0)
  ctx.beginPath();
  let started = false;
  for (let x = vp.xMin; x <= vp.xMax; x += step) {
    const fx = curve.evaluateAt(x);
    if (fx < 0) { started = false; continue; }
    const y = Math.sqrt(fx);
    const [px, py] = toCanvas(x, y, vp, w, h);
    if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Lower branch (y < 0)
  ctx.beginPath();
  started = false;
  for (let x = vp.xMin; x <= vp.xMax; x += step) {
    const fx = curve.evaluateAt(x);
    if (fx < 0) { started = false; continue; }
    const y = -Math.sqrt(fx);
    const [px, py] = toCanvas(x, y, vp, w, h);
    if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.shadowBlur = 0;
}

function drawFiniteFieldPoints(
  ctx: CanvasRenderingContext2D,
  curve: FiniteFieldCurve,
  p: number,
  vp: Viewport,
  w: number,
  h: number,
) {
  const points = curve.computeAllPoints();

  // Draw all points
  for (const pt of points) {
    const [px, py] = toCanvas(pt.x, pt.y, vp, w, h);
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(125, 211, 192, 0.7)";
    ctx.fill();
  }

  // Point at infinity symbol
  ctx.fillStyle = "#7DD3C0";
  ctx.font = "bold 14px 'Fira Code', monospace";
  ctx.textAlign = "right";
  ctx.fillText("O (point at infinity)", w - 16, 36);
}

function drawPoint(
  ctx: CanvasRenderingContext2D,
  pt: CurvePoint,
  color: string,
  label: string,
  vp: Viewport,
  w: number,
  h: number,
) {
  const [px, py] = toCanvas(pt.x, pt.y, vp, w, h);

  // Outer glow
  ctx.beginPath();
  ctx.arc(px, py, 12, 0, Math.PI * 2);
  ctx.fillStyle = color.replace(")", ", 0.2)").replace("rgb", "rgba");
  ctx.fill();

  // Inner dot
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#0D1117";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Label
  ctx.fillStyle = color;
  ctx.font = "bold 13px 'Fira Code', monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, px + 14, py - 8);
}

function drawConstructionLine(
  ctx: CanvasRenderingContext2D,
  from: CurvePoint,
  to: CurvePoint,
  vp: Viewport,
  w: number,
  h: number,
) {
  // Extend line beyond points
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const t = 20;
  const x1 = from.x - dx * t;
  const y1 = from.y - dy * t;
  const x2 = to.x + dx * t;
  const y2 = to.y + dy * t;

  const [px1, py1] = toCanvas(x1, y1, vp, w, h);
  const [px2, py2] = toCanvas(x2, y2, vp, w, h);

  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = "#FF7B6B";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px1, py1);
  ctx.lineTo(px2, py2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function CurveCanvas({
  mode, realCurve, finiteCurve, p, isSingular, isPrimeValid,
  selectedP, selectedQ, result, steps, currentStepIndex, onPointClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const getViewport = useCallback((): Viewport => {
    if (mode === "finite") {
      return { xMin: -1, xMax: p, yMin: -1, yMax: p };
    }
    return { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
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

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid
    drawGrid(ctx, vp, w, h);

    // Curve
    if (mode === "real" && !isSingular) {
      drawRealCurve(ctx, realCurve, vp, w, h);
    } else if (mode === "finite" && isPrimeValid) {
      drawFiniteFieldPoints(ctx, finiteCurve, p, vp, w, h);
    }

    // Construction lines from current step
    const currentStep = steps[currentStepIndex];
    if (currentStep?.highlightLine) {
      drawConstructionLine(ctx, currentStep.highlightLine.from, currentStep.highlightLine.to, vp, w, h);
    }

    // Selected points
    if (selectedP) drawPoint(ctx, selectedP, "#FFD166", "P", vp, w, h);
    if (selectedQ) drawPoint(ctx, selectedQ, "#FF7B6B", "Q", vp, w, h);

    // Result or step highlight
    if (currentStep?.highlightPoint) {
      drawPoint(ctx, currentStep.highlightPoint, "#06D6A0", "R", vp, w, h);
    } else if (result && steps.length === 0) {
      drawPoint(ctx, result, "#06D6A0", "R", vp, w, h);
    }
  }, [mode, realCurve, finiteCurve, p, isSingular, isPrimeValid, selectedP, selectedQ, result, steps, currentStepIndex, getViewport]);

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
      // Snap to nearest grid point
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
