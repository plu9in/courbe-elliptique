import { useEffect, useRef, useCallback } from "react";
import type { EllipticCurve } from "../../curve-visualization/domain/model/EllipticCurve.js";
import type { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";
import type { FieldMode, StepData, ModularLine, GradientPath } from "../hooks/useCurveState.js";

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

  const showLabels = p <= 13;
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
    // Coordinate label for small primes
    if (showLabels) {
      ctx.fillStyle = "rgba(125, 211, 192, 0.5)";
      ctx.font = "9px 'Fira Code', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${pt.x},${pt.y}`, px, py - radius - 4);
    }
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

// ===== Modular line (finite field) =====

function drawModularLine(
  ctx: CanvasRenderingContext2D,
  ml: ModularLine,
  curvePoints: Set<string>,
  vp: Viewport,
  w: number,
  h: number,
) {
  const { slope, intercept, p } = ml;
  const mod = (n: number) => ((n % p) + p) % p;

  // Draw all p points on the line
  for (let x = 0; x < p; x++) {
    const y = mod(slope * x + intercept);
    const [px, py] = toCanvas(x, y, vp, w, h);
    const isOnCurve = curvePoints.has(`${x},${y}`);

    if (isOnCurve) {
      // Intersection with curve: bright ring
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 123, 107, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Regular line point: small coral dot
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 123, 107, 0.35)";
      ctx.fill();
    }
  }

  // Connect consecutive line points with faint segments to show the pattern
  ctx.strokeStyle = "rgba(255, 123, 107, 0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  const linePoints: [number, number][] = [];
  for (let x = 0; x < p; x++) {
    const y = mod(slope * x + intercept);
    linePoints.push(toCanvas(x, y, vp, w, h));
  }
  // Sort by x pixel position and draw segments
  linePoints.sort((a, b) => a[0] - b[0]);
  ctx.beginPath();
  ctx.moveTo(linePoints[0][0], linePoints[0][1]);
  for (let i = 1; i < linePoints.length; i++) {
    ctx.lineTo(linePoints[i][0], linePoints[i][1]);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

// ===== Vertical line (finite field) =====

function drawVerticalFiniteField(
  ctx: CanvasRenderingContext2D,
  x: number,
  p: number,
  vp: Viewport,
  w: number,
  h: number,
) {
  // Draw all p points on the vertical line x = constant
  for (let y = 0; y < p; y++) {
    const [px, py] = toCanvas(x, y, vp, w, h);
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(167, 139, 250, 0.3)";
    ctx.fill();
  }
  // Vertical dashed connector
  const [px, pyTop] = toCanvas(x, 0, vp, w, h);
  const [, pyBot] = toCanvas(x, p - 1, vp, w, h);
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(167, 139, 250, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, Math.min(pyTop, pyBot));
  ctx.lineTo(px, Math.max(pyTop, pyBot));
  ctx.stroke();
  ctx.setLineDash([]);
}

// ===== Orbit trail =====

function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: CurvePoint[],
  vp: Viewport,
  w: number,
  h: number,
  color: string = "rgba(6, 214, 160, 1)",
) {
  if (trail.length < 2) return;

  // Parse color to create alpha variants
  const lineColor = color.replace("1)", "0.35)").replace("rgb", "rgba");
  const dotBaseAlpha = 0.3;

  // Trail line
  ctx.strokeStyle = lineColor;
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
    const alpha = dotBaseAlpha + 0.5 * (i / trail.length);
    ctx.beginPath();
    ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color.replace("1)", `${alpha})`);
    ctx.fill();
  }
}

// ===== Gradient path (ECDH: numbered points with color gradient) =====

function drawGradientPath(
  ctx: CanvasRenderingContext2D,
  path: GradientPath,
  vp: Viewport,
  w: number,
  h: number,
) {
  const { points, color, startIndex = 1, endLabel, endColor, endSize } = path;
  if (points.length === 0) return;

  // Dashed connecting line
  if (points.length >= 2) {
    ctx.strokeStyle = color.replace("rgb", "rgba").replace(")", ", 0.5)");
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const [sx, sy] = toCanvas(points[0].x, points[0].y, vp, w, h);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = toCanvas(points[i].x, points[i].y, vp, w, h);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw intermediate numbered dots
  for (let i = 0; i < points.length; i++) {
    const [px, py] = toCanvas(points[i].x, points[i].y, vp, w, h);
    const isEnd = i === points.length - 1;
    const dotColor = isEnd && endColor ? endColor : color;
    const radius = isEnd && endSize ? endSize : (isEnd ? 8 : 5);

    // Glow for end point
    if (isEnd && endLabel) {
      ctx.beginPath();
      ctx.arc(px, py, radius + 6, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(px, py, radius, px, py, radius + 6);
      grad.addColorStop(0, dotColor.replace("rgb", "rgba").replace(")", ", 0.3)"));
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Filled circle
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.strokeStyle = "#0D1117";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Number inside (skip for labeled endpoints — they get a letter outside)
    if (!(isEnd && endLabel)) {
      const num = startIndex + i;
      ctx.fillStyle = "#0D1117";
      ctx.font = `bold ${radius > 6 ? 9 : 7}px 'Fira Code', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(num), px, py + 0.5);
      ctx.textBaseline = "alphabetic";
    }

    // External label for endpoint (like P has "P" outside)
    if (isEnd && endLabel) {
      ctx.fillStyle = dotColor;
      ctx.font = "bold 13px 'Fira Code', monospace";
      ctx.textAlign = "left";
      ctx.fillText(endLabel, px + radius + 4, py - radius);
    }
  }
}

// Draw persistent landmark labels (A, B, S that stay visible after trail clears)
function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: { point: CurvePoint; color: string; label: string }[],
  vp: Viewport,
  w: number,
  h: number,
) {
  for (const lm of landmarks) {
    const [px, py] = toCanvas(lm.point.x, lm.point.y, vp, w, h);
    const radius = 8;

    // Glow
    ctx.beginPath();
    ctx.arc(px, py, radius + 5, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(px, py, radius, px, py, radius + 5);
    grad.addColorStop(0, lm.color.replace("rgb", "rgba").replace(")", ", 0.25)"));
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fill();

    // Filled circle
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = lm.color;
    ctx.fill();
    ctx.strokeStyle = "#0D1117";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // External label
    ctx.fillStyle = lm.color;
    ctx.font = "bold 13px 'Fira Code', monospace";
    ctx.textAlign = "left";
    ctx.fillText(lm.label, px + radius + 4, py - radius);
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
    if (mode !== "real") {
      // Collect all interesting points from current step
      const currentStep = steps[currentStepIndex];
      const interestPts: CurvePoint[] = [];

      if (currentStep?.gradientPaths) {
        for (const gp of currentStep.gradientPaths) {
          interestPts.push(...gp.points);
        }
      }
      if (currentStep?.landmarks) {
        for (const lm of currentStep.landmarks) {
          interestPts.push(lm.point);
        }
      }
      if (selectedP) interestPts.push(selectedP);
      if (selectedQ) interestPts.push(selectedQ);
      if (result) interestPts.push(result);

      // If we have active points, zoom to fit them with generous padding
      if (interestPts.length >= 2) {
        let xLo = Infinity, xHi = -Infinity, yLo = Infinity, yHi = -Infinity;
        for (const pt of interestPts) {
          xLo = Math.min(xLo, pt.x);
          xHi = Math.max(xHi, pt.x);
          yLo = Math.min(yLo, pt.y);
          yHi = Math.max(yHi, pt.y);
        }
        const dx = Math.max(xHi - xLo, 1);
        const dy = Math.max(yHi - yLo, 1);
        const span = Math.max(dx, dy);
        const pad = Math.max(2, span * 0.35);
        const cx = (xLo + xHi) / 2;
        const cy = (yLo + yHi) / 2;
        const half = span / 2 + pad;
        // Clamp to [0, p-1] range but allow going outside if needed
        return {
          xMin: Math.min(cx - half, -1),
          xMax: Math.max(cx + half, p),
          yMin: Math.min(cy - half, -1),
          yMax: Math.max(cy + half, p),
        };
      }

      // Default: show full grid
      const pad = Math.max(1, p * 0.06);
      return { xMin: -pad, xMax: p - 1 + pad, yMin: -pad, yMax: p - 1 + pad };
    }
    // Auto-zoom for real curves: find x range where curve exists
    const a = realCurve.a, b = realCurve.b;
    // For y²=x³+ax+b, find approximate x range where f(x) >= 0
    let xLo = -3, xHi = 3;
    for (let x = -20; x <= 20; x += 0.5) {
      if (realCurve.evaluateAt(x) >= 0) {
        xLo = Math.min(xLo, x - 1);
        xHi = Math.max(xHi, x + 1);
      }
    }
    // Include selected points and result
    for (const pt of [selectedP, selectedQ, result]) {
      if (pt) {
        xLo = Math.min(xLo, pt.x - 1);
        xHi = Math.max(xHi, pt.x + 1);
      }
    }
    const yRange = Math.max(Math.abs(xLo), Math.abs(xHi), 4);
    const pad = 1.5;
    return { xMin: xLo - pad, xMax: xHi + pad, yMin: -yRange - pad, yMax: yRange + pad };
  }, [mode, p, realCurve, selectedP, selectedQ, result, steps, currentStepIndex]);

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
    drawGrid(ctx, vp, w, h, mode !== "real");

    // Curve
    if (mode === "real" && !isSingular) {
      drawRealCurve(ctx, realCurve, vp, w, h);
    } else if (mode !== "real" && isPrimeValid) {
      drawFiniteFieldPoints(ctx, finiteCurve, p, vp, w, h);
    }

    // Step visuals (construction lines, trail, extra points)
    const currentStep = steps[currentStepIndex];

    // Gradient paths (ECDH interactive: numbered points with color segments)
    if (currentStep?.gradientPaths) {
      for (const gp of currentStep.gradientPaths) {
        drawGradientPath(ctx, gp, vp, w, h);
      }
    }

    // Persistent landmarks (A, B, S labels that remain after trail clears)
    if (currentStep?.landmarks) {
      drawLandmarks(ctx, currentStep.landmarks, vp, w, h);
    }

    // Multi-color trails (simple colored trails)
    if (currentStep?.trails) {
      for (const t of currentStep.trails) {
        drawTrail(ctx, t.points, vp, w, h, t.color);
      }
    }

    // Single-color trail (orbit, DLP)
    if (currentStep?.trail) {
      drawTrail(ctx, currentStep.trail, vp, w, h);
    }

    // Modular line (finite field — p discrete dots forming the "line")
    if (currentStep?.modularLine && mode !== "real" && isPrimeValid) {
      const curvePointSet = new Set(finiteCurve.computeAllPoints().map((pt) => `${pt.x},${pt.y}`));
      drawModularLine(ctx, currentStep.modularLine, curvePointSet, vp, w, h);
    }

    // Vertical line in finite field (for inverse / reflection)
    if (currentStep?.verticalX !== undefined && mode !== "real") {
      drawVerticalFiniteField(ctx, currentStep.verticalX, p, vp, w, h);
    }

    // Construction lines (real mode — geometric, extended)
    if (currentStep) {
      drawConstructionLines(ctx, currentStep, vp, w, h);
    }

    // Selected points (visible unless ECDH landmarks are handling them)
    const hasLandmarks = currentStep?.landmarks && currentStep.landmarks.length > 0;
    if (selectedP && !hasLandmarks) drawLabeledPoint(ctx, selectedP, "#FFD166", "P", vp, w, h);
    if (selectedQ && !hasLandmarks) drawLabeledPoint(ctx, selectedQ, "#FF7B6B", "Q", vp, w, h);

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

    // Singular overlay
    if (isSingular && mode === "real") {
      ctx.fillStyle = "rgba(255, 180, 171, 0.7)";
      ctx.font = "bold 16px 'Source Sans 3', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Singular curve (\u0394 = 0)", w / 2, h / 2 - 10);
      ctx.font = "13px 'Fira Code', monospace";
      ctx.fillStyle = "rgba(255, 180, 171, 0.5)";
      ctx.fillText("4a\u00B3 + 27b\u00B2 = 0 \u2014 not a valid elliptic curve", w / 2, h / 2 + 14);
    }

    // Topology label for real curves (1 or 2 connected components)
    if (mode === "real" && !isSingular) {
      const disc = 4 * realCurve.a * realCurve.a * realCurve.a + 27 * realCurve.b * realCurve.b;
      const components = disc < 0 ? 2 : 1;
      ctx.fillStyle = "rgba(125, 211, 192, 0.35)";
      ctx.font = "11px 'Source Sans 3', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${components} connected component${components > 1 ? "s" : ""}`, w - 12, h - 12);
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
