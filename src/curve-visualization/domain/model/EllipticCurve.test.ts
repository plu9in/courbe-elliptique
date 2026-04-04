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

  it("finds the nearest point on the curve given approximate coordinates", () => {
    const curve = new EllipticCurve(-1, 1);

    // f(1) = 1, y = ±1. Clicking near (1, 2) should snap to (1, 1)
    const point = curve.nearestPoint(1, 2);

    expect(point).not.toBeNull();
    expect(point!.x).toBe(1);
    expect(point!.y).toBeCloseTo(1, 10);
  });

  it("snaps to the closest y-value on the curve for a given x", () => {
    const curve = new EllipticCurve(-1, 1);

    // f(1) = 1, y = ±1. Clicking (1, -0.5) should snap to (1, -1)
    const point = curve.nearestPoint(1, -0.5);

    expect(point).not.toBeNull();
    expect(point!.x).toBe(1);
    expect(point!.y).toBeCloseTo(-1, 10);
  });

  it("returns null when no real point exists at the given x", () => {
    const curve = new EllipticCurve(-1, 1);

    // f(-2) = -5 < 0 → no real points
    const point = curve.nearestPoint(-2, 0);

    expect(point).toBeNull();
  });

  it("adds two distinct points with the correct slope", () => {
    const curve = new EllipticCurve(-7, 10);
    // P=(1,2) on curve: 4 = 1-7+10 ✓. Q=(3,4): 16 = 27-21+10 ✓
    const result = curve.addPoints({ x: 1, y: 2 }, { x: 3, y: 4 });

    // s = (4-2)/(3-1) = 1
    // x3 = 1-1-3 = -3, y3 = 1*(1-(-3))-2 = 2
    expect(result.x).toBeCloseTo(-3, 10);
    expect(result.y).toBeCloseTo(2, 10);
  });

  it("addition result lies on the curve", () => {
    const curve = new EllipticCurve(-7, 10);
    const result = curve.addPoints({ x: 1, y: 2 }, { x: 3, y: 4 });

    // Verify y² = x³ + ax + b at result
    const lhs = result.y * result.y;
    const rhs = curve.evaluateAt(result.x);

    expect(lhs).toBeCloseTo(rhs, 10);
  });
});
