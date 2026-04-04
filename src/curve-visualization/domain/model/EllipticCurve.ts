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
