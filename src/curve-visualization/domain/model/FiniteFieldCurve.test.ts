import { describe, it, expect } from "vitest";
import { FiniteFieldCurve } from "./FiniteFieldCurve.js";

describe("FiniteFieldCurve", () => {
  it("can be created from parameters a, b and prime p", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    expect(curve).toBeDefined();
  });

  it("retains its parameters and prime", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    expect(curve.a).toBe(1);
    expect(curve.b).toBe(1);
    expect(curve.p).toBe(23);
  });

  it("evaluates the right-hand side modulo p at x = 0", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    expect(curve.evaluateAt(0)).toBe(1);
  });

  it("computes (x³ + ax + b) mod p for any x", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // f(3) = 27 + 3 + 1 = 31 ≡ 8 (mod 23)
    expect(curve.evaluateAt(3)).toBe(8);
  });

  it("finds y-coordinates when f(x) is a quadratic residue mod p", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // f(0) = 1, and 1² ≡ 1 (mod 23), so y = 1 or y = 22
    const yValues = curve.yValuesAt(0);

    expect(yValues).toEqual([1, 22]);
  });

  it("returns no y-coordinates when f(x) is not a quadratic residue mod p", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // f(2) = 8+2+1 = 11. 11 is not a quadratic residue mod 23.
    const yValues = curve.yValuesAt(2);

    expect(yValues).toEqual([]);
  });

  it("enumerates all points on the curve over the finite field", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    const points = curve.computeAllPoints();

    // Known points include (0,1), (0,22), (1,7), (1,16)
    expect(points).toContainEqual({ x: 0, y: 1 });
    expect(points).toContainEqual({ x: 0, y: 22 });
    expect(points).toContainEqual({ x: 1, y: 7 });
    expect(points).toContainEqual({ x: 1, y: 16 });

    // x=2 has no points (f(2)=11 is not a QR mod 23)
    expect(points.filter((pt) => pt.x === 2)).toHaveLength(0);

    // Every point satisfies y² ≡ x³ + x + 1 (mod 23)
    for (const pt of points) {
      expect((pt.y * pt.y) % 23).toBe(curve.evaluateAt(pt.x));
    }

    // The curve y²=x³+x+1 over F_23 has 27 affine points (28 with point at infinity)
    expect(points).toHaveLength(27);
  });
});
