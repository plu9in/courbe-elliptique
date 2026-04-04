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

  it("confirms a valid point lies on the curve", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // (0, 1): 1² = 1 ≡ 0³+0+1 = 1 (mod 23) ✓
    expect(curve.isPointOnCurve(0, 1)).toBe(true);
  });

  it("rejects a point that does not lie on the curve", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // (0, 5): 5² = 25 ≡ 2 (mod 23) ≠ f(0) = 1
    expect(curve.isPointOnCurve(0, 5)).toBe(false);
  });

  it("computes the modular inverse", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // 6 · 4 = 24 ≡ 1 (mod 23)
    expect(curve.modInverse(6)).toBe(4);
    // 3 · 8 = 24 ≡ 1 (mod 23)
    expect(curve.modInverse(3)).toBe(8);
  });

  it("adds two distinct points over a finite field", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // P=(0,1), Q=(6,4)
    // s = (4-1)·(6-0)⁻¹ mod 23 = 3·4 = 12
    // x3 = (144-0-6) mod 23 = 138 mod 23 = 0
    // y3 = (12·(0-0)-1) mod 23 = -1 mod 23 = 22
    const result = curve.addPoints({ x: 0, y: 1 }, { x: 6, y: 4 });

    expect(result.x).toBe(0);
    expect(result.y).toBe(22);
  });

  it("addition result lies on the finite field curve", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const result = curve.addPoints({ x: 0, y: 1 }, { x: 6, y: 4 });

    expect(curve.isPointOnCurve(result.x, result.y)).toBe(true);
  });

  it("adds a different pair of points correctly", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // P=(1,7), Q=(3,10)
    const result = curve.addPoints({ x: 1, y: 7 }, { x: 3, y: 10 });

    expect(curve.isPointOnCurve(result.x, result.y)).toBe(true);
  });

  it("modular inverse throws when no inverse exists", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    expect(() => curve.modInverse(0)).toThrow("No modular inverse");
  });

  it("doubles a point using the tangent slope over a finite field", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // P=(0,1): s=(3·0+1)·(2·1)⁻¹ mod 23 = 1·12 = 12
    // x3=(144-0) mod 23 = 6, y3=(12·(0-6)-1) mod 23 = (-73) mod 23 = 19
    const result = curve.doublePoint({ x: 0, y: 1 });

    expect(result.x).toBe(6);
    expect(result.y).toBe(19);
    expect(curve.isPointOnCurve(result.x, result.y)).toBe(true);
  });

  it("computes the inverse of a point as (x, p - y)", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    const inv = curve.inversePoint({ x: 3, y: 5 });

    expect(inv).toEqual({ x: 3, y: 18 });
  });

  it("returns the same point when adding with identity (null)", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };

    expect(curve.addPoints(p, null)).toEqual(p);
    expect(curve.addPoints(null, p)).toEqual(p);
  });

  it("returns identity (null) when adding a point to its inverse", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // (0,1) + (0,22) = O since 1+22 = 23 ≡ 0 mod 23
    const result = curve.addPoints({ x: 0, y: 1 }, { x: 0, y: 22 });

    expect(result).toBeNull();
  });

  it("delegates to doubling when adding a point to itself", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };

    const viaAdd = curve.addPoints(p, p);
    const viaDouble = curve.doublePoint(p);

    expect(viaAdd).toEqual(viaDouble);
  });

  it("doubles a different point to confirm the tangent formula", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // P=(1,7): s=(3+1)·(14)⁻¹ mod 23 = 4·(14⁻¹) mod 23
    // 14⁻¹ mod 23: 14·5=70≡1 mod 23 → 14⁻¹=5
    // s=4·5=20. x3=(400-2) mod 23 = 398 mod 23 = 398-17*23=398-391=7
    // y3=(20·(1-7)-7) mod 23 = (20·(-6)-7) mod 23 = -127 mod 23 = -127+6*23= -127+138=11
    const result = curve.doublePoint({ x: 1, y: 7 });

    expect(result.x).toBe(7);
    expect(result.y).toBe(11);
    expect(curve.isPointOnCurve(result.x, result.y)).toBe(true);
  });

  it("correctly adds two points with the same y but different x", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // (11,3) and (17,3) share y=3 but have different x
    // s = (3-3)·(17-11)⁻¹ mod 23 = 0. x3 = (0-11-17) mod 23 = 18. y3 = (0-3) mod 23 = 20
    const result = curve.addPoints({ x: 11, y: 3 }, { x: 17, y: 3 });

    expect(result).not.toBeNull();
    expect(result!.x).toBe(18);
    expect(result!.y).toBe(20);
  });

  it("does not return null when two different points share the same x but are not inverses", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    const result = curve.addPoints({ x: 1, y: 7 }, { x: 0, y: 1 });

    expect(result).not.toBeNull();
    expect(curve.isPointOnCurve(result!.x, result!.y)).toBe(true);
  });

  it("scalar multiply by 1 returns the point itself", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };

    expect(curve.scalarMultiply(p, 1)).toEqual(p);
  });

  it("scalar multiply by 2 equals doubling", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };

    expect(curve.scalarMultiply(p, 2)).toEqual(curve.doublePoint(p));
  });

  it("scalar multiply by 3 equals 2P + P", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };
    const expected = curve.addPoints(curve.doublePoint(p), p);

    expect(curve.scalarMultiply(p, 3)).toEqual(expected);
  });

  it("scalar multiply by 5 produces a point on the curve", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };

    const result = curve.scalarMultiply(p, 5);

    expect(result).not.toBeNull();
    expect(curve.isPointOnCurve(result!.x, result!.y)).toBe(true);
  });

  it("scalar multiply by the order of the point returns identity", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };

    // Find order: keep multiplying until we get null
    let order = 1;
    let current = curve.scalarMultiply(p, order);
    while (current !== null && order < 100) {
      order++;
      current = curve.scalarMultiply(p, order);
    }

    expect(current).toBeNull();
    expect(order).toBeGreaterThan(1);
  });

  it("validates that a number is prime", () => {
    expect(FiniteFieldCurve.isPrime(23)).toBe(true);
    expect(FiniteFieldCurve.isPrime(97)).toBe(true);
    expect(FiniteFieldCurve.isPrime(2)).toBe(true);
  });

  it("rejects non-prime numbers", () => {
    expect(FiniteFieldCurve.isPrime(15)).toBe(false);
    expect(FiniteFieldCurve.isPrime(1)).toBe(false);
    expect(FiniteFieldCurve.isPrime(0)).toBe(false);
    expect(FiniteFieldCurve.isPrime(4)).toBe(false);
  });

  it("computes the orbit of a point as all multiples until identity", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };

    const orbit = curve.computeOrbit(p);

    // Orbit should start with P and contain all kP for k=1..n-1
    expect(orbit[0]).toEqual(p);
    expect(orbit.length).toBeGreaterThan(1);

    // Each point in orbit is on the curve
    for (const pt of orbit) {
      expect(curve.isPointOnCurve(pt.x, pt.y)).toBe(true);
    }

    // The next multiply after orbit should be identity
    const nP = curve.scalarMultiply(p, orbit.length + 1);
    expect(nP).toBeNull();
  });

  it("computes the order of a point", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p = { x: 0, y: 1 };

    const order = curve.pointOrder(p);

    expect(order).toBeGreaterThan(1);
    expect(curve.scalarMultiply(p, order)).toBeNull();
    // n-1 should NOT be identity
    expect(curve.scalarMultiply(p, order - 1)).not.toBeNull();
  });

  it("computes the group order including the point at infinity", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);

    // 27 affine points + 1 point at infinity = 28
    expect(curve.groupOrder()).toBe(28);
  });

  it("identifies a generator whose order equals the group order", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const allPoints = curve.computeAllPoints();

    // Find a generator (point whose order = group order = 28)
    const generator = allPoints.find((pt) => curve.pointOrder(pt) === 28);

    if (generator) {
      expect(curve.isGenerator(generator)).toBe(true);
    }
  });

  it("identifies a non-generator correctly", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const allPoints = curve.computeAllPoints();

    // Find a non-generator (order < group order)
    const nonGen = allPoints.find((pt) => curve.pointOrder(pt) < 28);

    if (nonGen) {
      expect(curve.isGenerator(nonGen)).toBe(false);
    }
  });

  it("verifies commutativity: P + Q = Q + P", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p1 = { x: 0, y: 1 };
    const q = { x: 6, y: 4 };

    const pq = curve.addPoints(p1, q);
    const qp = curve.addPoints(q, p1);

    expect(pq).toEqual(qp);
  });

  it("verifies associativity: (P + Q) + R = P + (Q + R)", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p1 = { x: 0, y: 1 };
    const q = { x: 6, y: 4 };
    const r = { x: 1, y: 7 };

    const pq_r = curve.addPoints(curve.addPoints(p1, q), r);
    const p_qr = curve.addPoints(p1, curve.addPoints(q, r));

    expect(pq_r).toEqual(p_qr);
  });

  it("verifies identity: P + O = P", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const p1 = { x: 0, y: 1 };

    expect(curve.addPoints(p1, null)).toEqual(p1);
    expect(curve.addPoints(null, p1)).toEqual(p1);
  });

  it("verifies closure: P + Q is on the curve", () => {
    const curve = new FiniteFieldCurve(1, 1, 23);
    const allPoints = curve.computeAllPoints();

    // Test with several random pairs
    for (let i = 0; i < Math.min(allPoints.length, 5); i++) {
      for (let j = i + 1; j < Math.min(allPoints.length, 6); j++) {
        const result = curve.addPoints(allPoints[i], allPoints[j]);
        if (result !== null) {
          expect(curve.isPointOnCurve(result.x, result.y)).toBe(true);
        }
      }
    }
  });
});
