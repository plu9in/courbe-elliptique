import { CurvePoint } from "./CurvePoint.js";

export class FiniteFieldCurve {
  readonly a: number;
  readonly b: number;
  readonly p: number;

  constructor(a: number, b: number, p: number) {
    this.a = a;
    this.b = b;
    this.p = p;
  }

  evaluateAt(x: number): number {
    return ((x * x * x + this.a * x + this.b) % this.p + this.p) % this.p;
  }

  yValuesAt(x: number): number[] {
    const rhs = this.evaluateAt(x);
    const roots: number[] = [];
    for (let y = 0; y < this.p; y++) {
      if ((y * y) % this.p === rhs) {
        roots.push(y);
      }
    }
    return roots;
  }

  isPointOnCurve(x: number, y: number): boolean {
    return (y * y) % this.p === this.evaluateAt(x);
  }

  computeAllPoints(): CurvePoint[] {
    const points: CurvePoint[] = [];
    for (let x = 0; x < this.p; x++) {
      for (const y of this.yValuesAt(x)) {
        points.push({ x, y });
      }
    }
    return points;
  }
}
