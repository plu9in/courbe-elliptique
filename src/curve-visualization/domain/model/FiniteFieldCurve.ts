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

  static isPrime(n: number): boolean {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return false;
    }
    return true;
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

  modInverse(a: number): number {
    const m = this.p;
    const normalized = ((a % m) + m) % m;
    for (let i = 1; i < m; i++) {
      if ((normalized * i) % m === 1) return i;
    }
    throw new Error(`No modular inverse for ${a} mod ${m}`);
  }

  doublePoint(pt: CurvePoint): CurvePoint {
    const mod = (n: number) => ((n % this.p) + this.p) % this.p;
    const s = mod((3 * pt.x * pt.x + this.a) * this.modInverse(2 * pt.y));
    const x3 = mod(s * s - 2 * pt.x);
    const y3 = mod(s * (pt.x - x3) - pt.y);
    return { x: x3, y: y3 };
  }

  inversePoint(pt: CurvePoint): CurvePoint {
    return { x: pt.x, y: (this.p - pt.y) % this.p };
  }

  addPoints(p1: CurvePoint | null, q: CurvePoint | null): CurvePoint | null {
    if (p1 === null) return q;
    if (q === null) return p1;
    if (p1.x === q.x && (p1.y + q.y) % this.p === 0) return null;
    if (p1.x === q.x && p1.y === q.y) return this.doublePoint(p1);

    const mod = (n: number) => ((n % this.p) + this.p) % this.p;
    const s = mod((q.y - p1.y) * this.modInverse(q.x - p1.x));
    const x3 = mod(s * s - p1.x - q.x);
    const y3 = mod(s * (p1.x - x3) - p1.y);
    return { x: x3, y: y3 };
  }

  scalarMultiply(pt: CurvePoint, n: number): CurvePoint | null {
    if (n === 1) return pt;
    let result: CurvePoint | null = pt;
    for (let i = 1; i < n; i++) {
      result = this.addPoints(result, pt);
    }
    return result;
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
