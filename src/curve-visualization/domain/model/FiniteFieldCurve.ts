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

  isSingular(): boolean {
    const disc = (4 * this.a * this.a * this.a + 27 * this.b * this.b) % this.p;
    return ((disc % this.p) + this.p) % this.p === 0;
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

  doublePoint(pt: CurvePoint): CurvePoint | null {
    if (pt.y === 0) return null; // tangent is vertical → result is O
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
    if (n === 0) return null;
    if (n < 0) {
      const inv = this.inversePoint(pt);
      return this.scalarMultiply(inv, -n);
    }
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

  computeOrbit(pt: CurvePoint): CurvePoint[] {
    const orbit: CurvePoint[] = [pt];
    let current: CurvePoint | null = pt;
    for (let i = 2; i <= this.p * this.p; i++) {
      current = this.addPoints(current, pt);
      if (current === null) break;
      orbit.push(current);
    }
    return orbit;
  }

  pointOrder(pt: CurvePoint): number {
    return this.computeOrbit(pt).length + 1;
  }

  groupOrder(): number {
    return this.computeAllPoints().length + 1;
  }

  isGenerator(pt: CurvePoint): boolean {
    return this.pointOrder(pt) === this.groupOrder();
  }

  discreteLog(base: CurvePoint, target: CurvePoint): number | null {
    let current: CurvePoint | null = base;
    for (let n = 1; current !== null; n++) {
      if (current.x === target.x && current.y === target.y) return n;
      current = this.addPoints(current, base);
    }
    return null;
  }

  /** Simple hash: sum of char codes mod n */
  static simpleHash(message: string, n: number): number {
    let h = 0;
    for (let i = 0; i < message.length; i++) {
      h = (h * 31 + message.charCodeAt(i)) % n;
    }
    return h === 0 ? 1 : h;
  }

  ecdsaSign(
    g: CurvePoint,
    privateKey: number,
    message: string,
    nonce: number,
  ): { r: number; s: number; e: number; kG: CurvePoint } | null {
    const n = this.pointOrder(g);
    const e = FiniteFieldCurve.simpleHash(message, n);
    const kG = this.scalarMultiply(g, nonce);
    if (!kG) return null;
    const r = kG.x % n;
    if (r === 0) return null;
    const kInv = this.modInverseOf(nonce, n);
    const s = (kInv * ((e + r * privateKey) % n)) % n;
    if (s === 0) return null;
    return { r, s, e, kG };
  }

  ecdsaVerify(
    g: CurvePoint,
    publicKey: CurvePoint,
    message: string,
    sig: { r: number; s: number },
  ): { valid: boolean; u1: number; u2: number; v: CurvePoint | null; e: number; w: number } {
    const n = this.pointOrder(g);
    const e = FiniteFieldCurve.simpleHash(message, n);
    const w = this.modInverseOf(sig.s, n);
    const u1 = (e * w) % n;
    const u2 = (sig.r * w) % n;
    const u1G = this.scalarMultiply(g, u1);
    const u2Q = this.scalarMultiply(publicKey, u2);
    let v: CurvePoint | null = null;
    if (u1G && u2Q) v = this.addPoints(u1G, u2Q);
    else if (u1G) v = u1G;
    else if (u2Q) v = u2Q;
    const valid = v !== null && v.x % n === sig.r;
    return { valid, u1, u2, v, e, w };
  }

  /** Demonstrate nonce reuse vulnerability: recover private key from two signatures */
  ecdsaNonceReuse(
    g: CurvePoint,
    privateKey: number,
    msg1: string,
    msg2: string,
    sharedNonce: number,
  ): { sig1: { r: number; s: number; e: number }; sig2: { r: number; s: number; e: number }; recoveredKey: number | null } {
    const n = this.pointOrder(g);
    const sig1Full = this.ecdsaSign(g, privateKey, msg1, sharedNonce);
    const sig2Full = this.ecdsaSign(g, privateKey, msg2, sharedNonce);
    if (!sig1Full || !sig2Full) return { sig1: { r: 0, s: 0, e: 0 }, sig2: { r: 0, s: 0, e: 0 }, recoveredKey: null };

    const sig1 = { r: sig1Full.r, s: sig1Full.s, e: sig1Full.e };
    const sig2 = { r: sig2Full.r, s: sig2Full.s, e: sig2Full.e };

    // Attack: k = (e1 - e2) / (s1 - s2) mod n
    const ds = ((sig1.s - sig2.s) % n + n) % n;
    const de = ((sig1.e - sig2.e) % n + n) % n;
    try {
      const dsInv = this.modInverseOf(ds, n);
      const kRecovered = (de * dsInv) % n;
      // d = (s1*k - e1) / r mod n
      const rInv = this.modInverseOf(sig1.r, n);
      const dRecovered = ((sig1.s * kRecovered - sig1.e) % n + n) % n * rInv % n;
      return { sig1, sig2, recoveredKey: dRecovered };
    } catch {
      return { sig1, sig2, recoveredKey: null };
    }
  }

  /** Double-and-add scalar multiplication with step trace */
  doubleAndAdd(pt: CurvePoint, n: number): { result: CurvePoint | null; steps: { bit: number; op: string; value: CurvePoint | null }[] } {
    const bits = n.toString(2);
    let acc: CurvePoint | null = null;
    const steps: { bit: number; op: string; value: CurvePoint | null }[] = [];
    for (let i = 0; i < bits.length; i++) {
      if (acc !== null) {
        acc = this.doublePoint(acc);
        steps.push({ bit: Number(bits[i]), op: "double", value: acc });
      }
      if (bits[i] === "1") {
        acc = acc ? this.addPoints(acc, pt) : pt;
        steps.push({ bit: 1, op: "add", value: acc });
      }
    }
    return { result: acc, steps };
  }

  // ===== Zero-Knowledge Proofs =====

  /** Schnorr protocol: Prover commits R = nonce·G */
  schnorrCommit(g: CurvePoint, nonce: number): CurvePoint | null {
    return this.scalarMultiply(g, nonce);
  }

  /** Schnorr protocol: Prover responds s = nonce + challenge·secret (mod order) */
  schnorrRespond(nonce: number, challenge: number, secret: number, order: number): number {
    return ((nonce + challenge * secret) % order + order) % order;
  }

  /** Schnorr protocol: Verifier checks sG == R + cQ */
  schnorrVerify(
    g: CurvePoint,
    publicKey: CurvePoint,
    commitment: CurvePoint,
    challenge: number,
    response: number,
  ): { valid: boolean; lhs: CurvePoint | null; rhs: CurvePoint | null } {
    const lhs = this.scalarMultiply(g, response); // sG
    const cQ = this.scalarMultiply(publicKey, challenge); // cQ
    const rhs = this.addPoints(commitment, cQ); // R + cQ
    const valid = lhs !== null && rhs !== null && lhs.x === rhs.x && lhs.y === rhs.y;
    return { valid, lhs, rhs };
  }

  /** Pedersen commitment: C = value·G + blinding·H */
  pedersenCommit(
    g: CurvePoint,
    h: CurvePoint,
    value: number,
    blinding: number,
  ): CurvePoint | null {
    const vG = this.scalarMultiply(g, value);
    const rH = this.scalarMultiply(h, blinding);
    return this.addPoints(vG, rH);
  }

  /** Pedersen verify: check C == value·G + blinding·H */
  pedersenVerify(
    g: CurvePoint,
    h: CurvePoint,
    commitment: CurvePoint,
    value: number,
    blinding: number,
  ): boolean {
    const expected = this.pedersenCommit(g, h, value, blinding);
    return expected !== null && expected.x === commitment.x && expected.y === commitment.y;
  }

  /** Modular inverse of a mod m (for arbitrary modulus, not just this.p) */
  private modInverseOf(a: number, m: number): number {
    const normalized = ((a % m) + m) % m;
    for (let i = 1; i < m; i++) {
      if ((normalized * i) % m === 1) return i;
    }
    throw new Error(`No modular inverse for ${a} mod ${m}`);
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
