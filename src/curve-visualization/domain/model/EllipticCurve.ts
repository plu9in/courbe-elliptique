import { CurvePoint } from "./CurvePoint.js";

export class EllipticCurve {
  readonly a: number;
  readonly b: number;

  constructor(a: number, b: number) {
    this.a = a;
    this.b = b;
  }

  evaluateAt(x: number): number {
    return x * x * x + this.a * x + this.b;
  }

  yValuesAt(x: number): number[] {
    const fx = this.evaluateAt(x);
    if (fx < 0) return [];
    const y = Math.sqrt(fx);
    return [y, -y];
  }

  nearestPoint(x: number, targetY: number): CurvePoint | null {
    const yValues = this.yValuesAt(x);
    if (yValues.length === 0) return null;
    const closest = yValues.reduce((a, b) =>
      Math.abs(a - targetY) <= Math.abs(b - targetY) ? a : b
    );
    return { x, y: closest };
  }

  doublePoint(p: CurvePoint): CurvePoint {
    const s = (3 * p.x * p.x + this.a) / (2 * p.y);
    const x3 = s * s - 2 * p.x;
    const y3 = s * (p.x - x3) - p.y;
    return { x: x3, y: y3 };
  }

  inversePoint(p: CurvePoint): CurvePoint {
    return { x: p.x, y: -p.y };
  }

  addPoints(p: CurvePoint, q: CurvePoint): CurvePoint {
    const s = (q.y - p.y) / (q.x - p.x);
    const x3 = s * s - p.x - q.x;
    const y3 = s * (p.x - x3) - p.y;
    return { x: x3, y: y3 };
  }

  computePoints(xMin: number, xMax: number, step: number): CurvePoint[] {
    const points: CurvePoint[] = [];
    for (let x = xMin; x <= xMax; x += step) {
      for (const y of this.yValuesAt(x)) {
        points.push({ x, y });
      }
    }
    return points;
  }
}
