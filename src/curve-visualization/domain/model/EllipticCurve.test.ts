import { describe, it, expect } from "vitest";
import { EllipticCurve } from "./EllipticCurve.js";

describe("EllipticCurve", () => {
  it("can be created from parameters a and b", () => {
    const curve = new EllipticCurve(-1, 1);

    expect(curve).toBeDefined();
  });

  it("retains the parameters it was created with", () => {
    const curve = new EllipticCurve(-1, 1);

    expect(curve.a).toBe(-1);
    expect(curve.b).toBe(1);
  });

  it("evaluates the right-hand side of the equation at x = 0", () => {
    const curve = new EllipticCurve(-1, 1);

    expect(curve.evaluateAt(0)).toBe(1);
  });

  it("computes x³ + ax + b for any x value", () => {
    const curve = new EllipticCurve(-1, 1);

    expect(curve.evaluateAt(2)).toBe(7);
  });

  it("computes y-coordinates when the right-hand side is non-negative", () => {
    const curve = new EllipticCurve(-1, 1);

    const yValues = curve.yValuesAt(0);

    expect(yValues).toEqual([1, -1]);
  });

  it("returns no y-coordinates when the right-hand side is negative", () => {
    const curve = new EllipticCurve(-1, 1);

    const yValues = curve.yValuesAt(-2);

    expect(yValues).toEqual([]);
  });

  it("returns y = 0 when the right-hand side is exactly zero", () => {
    const curve = new EllipticCurve(0, 0);

    const yValues = curve.yValuesAt(0);

    expect(yValues).toEqual([0, -0]);
  });

  it("produces plottable points across an x-range, excluding x where no real y exists", () => {
    const curve = new EllipticCurve(-1, 1);

    const points = curve.computePoints(-2, 2, 1);

    // x=-2: f(-2)=-5 < 0 → excluded
    // x=-1: f(-1)=1 → y=±1
    // x= 0: f(0)=1  → y=±1
    // x= 1: f(1)=1  → y=±1
    // x= 2: f(2)=7  → y=±√7
    expect(points).toHaveLength(8);

    expect(points).toContainEqual({ x: -1, y: 1 });
    expect(points).toContainEqual({ x: -1, y: -1 });
    expect(points).toContainEqual({ x: 0, y: 1 });
    expect(points).toContainEqual({ x: 0, y: -1 });
    expect(points).toContainEqual({ x: 1, y: 1 });
    expect(points).toContainEqual({ x: 1, y: -1 });
    expect(points).toContainEqual({ x: 2, y: expect.closeTo(Math.sqrt(7), 10) });
    expect(points).toContainEqual({ x: 2, y: expect.closeTo(-Math.sqrt(7), 10) });

    // No points for x=-2
    expect(points.filter((p) => p.x === -2)).toHaveLength(0);
  });
});
