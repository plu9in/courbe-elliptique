import { useCallback, useMemo, useReducer } from "react";
import { EllipticCurve } from "../../curve-visualization/domain/model/EllipticCurve.js";
import { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";

export type FieldMode = "real" | "finite" | "zk";

export type ECDHPhase = "idle" | "choose-curve" | "alice-secret" | "alice-sends" | "bob-secret" | "bob-sends" | "shared" | "done";

interface CurveState {
  mode: FieldMode;
  a: number;
  b: number;
  p: number;
  selectedP: CurvePoint | null;
  selectedQ: CurvePoint | null;
  ecdhA: number;
  ecdhB: number;
  ecdhPhase: ECDHPhase;
  ecdhAliceSecret: number | null;
  ecdhBobSecret: number | null;
  result: CurvePoint | null;
  steps: StepData[];
  currentStepIndex: number;
  scalarN: number;
  activePresetId: string | null;
}

export interface ConstructionLine {
  from: CurvePoint;
  to: CurvePoint;
  style: "secant" | "tangent" | "vertical";
}

export interface LabeledPoint {
  point: CurvePoint;
  color: string;
  label: string;
}

export interface ModularLine {
  slope: number;
  intercept: number;
  p: number;
  /** Intersection points with the curve (P, Q, R') */
  intersections?: LabeledPoint[];
}

export interface StepData {
  label: string;
  explanation: string;
  formula?: string;
  /** Lines to draw at this step (real mode: geometric, extended) */
  lines?: ConstructionLine[];
  /** Modular line visualization (finite field mode: p discrete dots) */
  modularLine?: ModularLine;
  /** Vertical x-coordinate for vertical line in finite field */
  verticalX?: number;
  /** Extra labeled points to show at this step */
  points?: LabeledPoint[];
  /** Single-color trail (orbit, DLP search — rendered in green) */
  trail?: CurvePoint[];
  /** Multi-color trails (ECDH) */
  trails?: { points: CurvePoint[]; color: string; label?: string }[];
  /** Rich gradient paths with numbered points (ECDH interactive) */
  gradientPaths?: GradientPath[];
  /** Persistent labeled landmark points (A, B, S — always visible even after trail clears) */
  landmarks?: LabeledPoint[];
  /** Structured computation table for pedagogical display */
  computation?: ComputationRow[];
}

export interface ComputationRow {
  label: string;       // e.g. "Slope"
  description: string; // e.g. "s = (yB - y_prev) / (xB - x_prev) mod p"
  substitution: string; // e.g. "= (18 - 10) · (10 - 9)⁻¹"
  intermediate?: string; // e.g. "= 8 · 1"  (optional simplification)
  result: string;      // e.g. "≡ 8 (mod 23)"
}

export interface GradientPath {
  points: CurvePoint[];
  color: string;        // uniform color for dots and line
  startIndex?: number;  // numbering offset (default 1)
  endLabel?: string;    // label at end point (e.g. "A", "B", "S")
  endColor?: string;    // distinct color for end point (if different from path)
  endSize?: number;     // larger radius for destination points
}

type Action =
  | { type: "SET_MODE"; mode: FieldMode }
  | { type: "SET_A"; a: number }
  | { type: "SET_B"; b: number }
  | { type: "SET_P"; p: number }
  | { type: "SELECT_POINT"; point: CurvePoint }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_RESULT"; result: CurvePoint | null; steps: StepData[] }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SKIP_TO_END" }
  | { type: "SET_SCALAR"; n: number }
  | { type: "SET_ECDH_A"; value: number }
  | { type: "START_ECDH_INTERACTIVE" }
  | { type: "SET_ALICE_SECRET"; value: number }
  | { type: "SET_BOB_SECRET"; value: number }
  | { type: "ECDH_ADVANCE" }
  | { type: "ECDH_RESET" }
  | { type: "SET_ECDH_B"; value: number }
  | { type: "LOAD_PRESET"; a: number; b: number; p: number; presetId: string };

const cleanInteraction = { selectedP: null, selectedQ: null, result: null, steps: [] as StepData[], currentStepIndex: 0, ecdhPhase: "idle" as ECDHPhase, ecdhAliceSecret: null, ecdhBobSecret: null };

function reducer(state: CurveState, action: Action): CurveState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode, ...cleanInteraction };
    case "SET_A":
      return { ...state, a: action.a, ...cleanInteraction, activePresetId: null };
    case "SET_B":
      return { ...state, b: action.b, ...cleanInteraction, activePresetId: null };
    case "SET_P":
      return { ...state, p: action.p, ...cleanInteraction, activePresetId: null };
    case "LOAD_PRESET":
      return { ...state, mode: "finite", a: action.a, b: action.b, p: action.p, activePresetId: action.presetId, ...cleanInteraction };
    case "SELECT_POINT": {
      const pt = action.point;
      // Deselect P if clicking the same point
      if (state.selectedP && state.selectedP.x === pt.x && state.selectedP.y === pt.y) {
        return { ...state, selectedP: state.selectedQ, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
      }
      // Deselect Q if clicking the same point
      if (state.selectedQ && state.selectedQ.x === pt.x && state.selectedQ.y === pt.y) {
        return { ...state, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
      }
      if (!state.selectedP) return { ...state, selectedP: pt, result: null, steps: [], currentStepIndex: 0 };
      if (!state.selectedQ) return { ...state, selectedQ: pt };
      return { ...state, selectedP: pt, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
    }
    case "CLEAR_SELECTION":
      return { ...state, selectedP: null, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
    case "SET_RESULT":
      return { ...state, result: action.result, steps: action.steps, currentStepIndex: Math.max(action.steps.length - 1, 0) };
    case "NEXT_STEP":
      return { ...state, currentStepIndex: Math.min(state.currentStepIndex + 1, state.steps.length - 1) };
    case "PREV_STEP":
      return { ...state, currentStepIndex: Math.max(state.currentStepIndex - 1, 0) };
    case "SKIP_TO_END":
      return { ...state, currentStepIndex: Math.max(state.steps.length - 1, 0) };
    case "SET_SCALAR":
      return { ...state, scalarN: action.n };
    case "SET_ECDH_A":
      return { ...state, ecdhA: action.value };
    case "SET_ECDH_B":
      return { ...state, ecdhB: action.value };
    case "START_ECDH_INTERACTIVE":
      return { ...state, ecdhPhase: "alice-secret", ecdhAliceSecret: null, ecdhBobSecret: null, result: null, steps: [], currentStepIndex: 0 };
    case "SET_ALICE_SECRET":
      return { ...state, ecdhAliceSecret: action.value };
    case "SET_BOB_SECRET":
      return { ...state, ecdhBobSecret: action.value };
    case "ECDH_ADVANCE": {
      const nextPhases: Record<ECDHPhase, ECDHPhase> = {
        "idle": "idle", "choose-curve": "alice-secret", "alice-secret": "alice-sends",
        "alice-sends": "bob-secret", "bob-secret": "bob-sends", "bob-sends": "shared", "shared": "done", "done": "done",
      };
      return { ...state, ecdhPhase: nextPhases[state.ecdhPhase] };
    }
    case "ECDH_RESET":
      return { ...state, ecdhPhase: "idle", ecdhAliceSecret: null, ecdhBobSecret: null, result: null, steps: [], currentStepIndex: 0 };
    default:
      return state;
  }
}

const initialState: CurveState = {
  mode: "real",
  a: -1,
  b: 1,
  p: 23,
  selectedP: null,
  selectedQ: null,
  result: null,
  steps: [],
  currentStepIndex: 0,
  scalarN: 2,
  ecdhA: 7,
  ecdhB: 11,
  ecdhPhase: "idle" as ECDHPhase,
  ecdhAliceSecret: null,
  ecdhBobSecret: null,
  activePresetId: null,
};

export function useCurveState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const realCurve = useMemo(() => new EllipticCurve(state.a, state.b), [state.a, state.b]);
  const finiteCurve = useMemo(() => new FiniteFieldCurve(state.a, state.b, state.p), [state.a, state.b, state.p]);

  const isSingular = realCurve.isSingular();
  const isPrimeValid = FiniteFieldCurve.isPrime(state.p);

  const addPoints = useCallback(() => {
    if (!state.selectedP || !state.selectedQ) return;
    const p = state.selectedP;
    const q = state.selectedQ;

    if (state.mode !== "real") {
      const result = finiteCurve.addPoints(p, q);
      const mod = (n: number) => ((n % state.p) + state.p) % state.p;
      const s = mod((q.y - p.y) * finiteCurve.modInverse(q.x - p.x));
      const c = mod(p.y - s * p.x);
      // R' is the third intersection before reflection: R' = (result.x, p - result.y)
      const rPrime = result ? { x: result.x, y: mod(-result.y) } : null;
      const intersections: LabeledPoint[] = [
        { point: p, color: "#FFD166", label: "P" },
        { point: q, color: "#FF7B6B", label: "Q" },
      ];
      if (rPrime) intersections.push({ point: rPrime, color: "#A78BFA", label: "R'" });
      const mLine: ModularLine = { slope: s, intercept: c, p: state.p, intersections };
      const steps: StepData[] = [
        {
          label: "Modular secant line",
          explanation: `y \u2261 ${s}x + ${c} (mod ${state.p}) — ${state.p} discrete points`,
          formula: `s = (y_Q - y_P) \\cdot (x_Q - x_P)^{-1} \\equiv ${s} \\pmod{${state.p}}`,
          modularLine: mLine,
        },
        {
          label: "Third intersection R'",
          explanation: rPrime ? `R' = (${rPrime.x}, ${rPrime.y}) — before reflection` : "R' = O",
          modularLine: mLine,
          points: rPrime ? [{ point: rPrime, color: "#A78BFA", label: "R'" }] : [],
        },
        {
          label: "Reflect: R = (x\u2083, y\u2083)",
          explanation: result ? `R = P + Q = (${result.x}, ${result.y})` : "R = O (point at infinity)",
          modularLine: mLine,
          verticalX: result ? result.x : undefined,
          points: [
            ...(rPrime ? [{ point: rPrime, color: "#A78BFA", label: "R'" }] : []),
            ...(result ? [{ point: result, color: "#06D6A0", label: "R = P+Q" }] : []),
          ],
        },
      ];
      dispatch({ type: "SET_RESULT", result, steps });
    } else {
      const result = realCurve.addPoints(p, q);
      const s = (q.y - p.y) / (q.x - p.x);
      const rPrime: CurvePoint = { x: result.x, y: -result.y };
      const secant: ConstructionLine = { from: p, to: q, style: "secant" };
      const vertical: ConstructionLine = { from: rPrime, to: result, style: "vertical" };
      const steps: StepData[] = [
        {
          label: "Draw secant line",
          explanation: `Secant through P and Q with slope s`,
          formula: `s = \\frac{y_Q - y_P}{x_Q - x_P} = \\frac{${(q.y - p.y).toFixed(2)}}{${(q.x - p.x).toFixed(2)}} = ${s.toFixed(4)}`,
          lines: [secant],
        },
        {
          label: "Third intersection R'",
          explanation: `The secant meets the curve again at R'(${rPrime.x.toFixed(2)}, ${rPrime.y.toFixed(2)})`,
          formula: `x_{R'} = s^2 - x_P - x_Q = ${result.x.toFixed(4)}`,
          lines: [secant],
          points: [{ point: rPrime, color: "#A78BFA", label: "R'" }],
        },
        {
          label: "Reflect over x-axis",
          explanation: `R = P + Q = (${result.x.toFixed(2)}, ${result.y.toFixed(2)})`,
          formula: `R = (x_{R'},\\, -y_{R'})`,
          lines: [secant, vertical],
          points: [
            { point: rPrime, color: "#A78BFA", label: "R'" },
            { point: result, color: "#06D6A0", label: "R = P+Q" },
          ],
        },
      ];
      dispatch({ type: "SET_RESULT", result, steps });
    }
  }, [state.selectedP, state.selectedQ, state.mode, realCurve, finiteCurve, state.p]);

  const doublePoint = useCallback(() => {
    if (!state.selectedP) return;
    const pt = state.selectedP;

    if (state.mode !== "real") {
      const result = finiteCurve.doublePoint(pt);
      if (!result) {
        dispatch({ type: "SET_RESULT", result: null, steps: [{ label: "2P = O", explanation: `P has y=0, tangent is vertical. 2P = O (identity).` }] });
        return;
      }
      const mod = (n: number) => ((n % state.p) + state.p) % state.p;
      const s = mod((3 * pt.x * pt.x + state.a) * finiteCurve.modInverse(2 * pt.y));
      const c = mod(pt.y - s * pt.x);
      const rPrime: CurvePoint = { x: result.x, y: mod(-result.y) };
      const intersections: LabeledPoint[] = [
        { point: pt, color: "#FFD166", label: "P (×2)" },
        { point: rPrime, color: "#A78BFA", label: "R'" },
      ];
      const mLine: ModularLine = { slope: s, intercept: c, p: state.p, intersections };
      const steps: StepData[] = [
        {
          label: "Modular tangent at P",
          explanation: `y \u2261 ${s}x + ${c} (mod ${state.p}) — tangent at P(${pt.x}, ${pt.y})`,
          formula: `s \\equiv (3x_P^2 + a) \\cdot (2y_P)^{-1} \\equiv ${s} \\pmod{${state.p}}`,
          modularLine: mLine,
        },
        {
          label: "Second intersection R'",
          explanation: `R' = (${rPrime.x}, ${rPrime.y}) — before reflection`,
          modularLine: mLine,
          points: [{ point: rPrime, color: "#A78BFA", label: "R'" }],
        },
        {
          label: "Reflect: 2P = (x\u2083, y\u2083)",
          explanation: `2P = (${result.x}, ${result.y})`,
          modularLine: mLine,
          verticalX: result.x,
          points: [
            { point: rPrime, color: "#A78BFA", label: "R'" },
            { point: result, color: "#06D6A0", label: "2P" },
          ],
        },
      ];
      dispatch({ type: "SET_RESULT", result, steps });
    } else {
      const result = realCurve.doublePoint(pt);
      const rPrime: CurvePoint = { x: result.x, y: -result.y };
      const tangent: ConstructionLine = { from: pt, to: rPrime, style: "tangent" };
      const vertical: ConstructionLine = { from: rPrime, to: result, style: "vertical" };
      const s = (3 * pt.x * pt.x + state.a) / (2 * pt.y);
      const steps: StepData[] = [
        {
          label: "Draw tangent at P",
          explanation: `Tangent to the curve at P(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`,
          formula: `s = \\frac{3x_P^2 + a}{2y_P} = \\frac{${(3 * pt.x * pt.x + state.a).toFixed(2)}}{${(2 * pt.y).toFixed(2)}} = ${s.toFixed(4)}`,
          lines: [tangent],
        },
        {
          label: "Second intersection R'",
          explanation: `The tangent meets the curve again at R'(${rPrime.x.toFixed(2)}, ${rPrime.y.toFixed(2)})`,
          lines: [tangent],
          points: [{ point: rPrime, color: "#A78BFA", label: "R'" }],
        },
        {
          label: "Reflect over x-axis",
          explanation: `2P = (${result.x.toFixed(2)}, ${result.y.toFixed(2)})`,
          formula: `2P = (x_{R'},\\, -y_{R'})`,
          lines: [tangent, vertical],
          points: [
            { point: rPrime, color: "#A78BFA", label: "R'" },
            { point: result, color: "#06D6A0", label: "2P" },
          ],
        },
      ];
      dispatch({ type: "SET_RESULT", result, steps });
    }
  }, [state.selectedP, state.mode, state.a, realCurve, finiteCurve, state.p]);

  const computeInverse = useCallback(() => {
    if (!state.selectedP) return;
    const pt = state.selectedP;

    if (state.mode !== "real") {
      const inv = finiteCurve.inversePoint(pt);
      const steps: StepData[] = [
        {
          label: "Vertical line at x = " + pt.x,
          explanation: `-P = (${pt.x}, ${state.p} - ${pt.y}) = (${inv.x}, ${inv.y})`,
          formula: `-P = (x,\\, p - y) = (${pt.x},\\, ${state.p} - ${pt.y})`,
          verticalX: pt.x,
          points: [{ point: inv, color: "#06D6A0", label: "-P" }],
        },
      ];
      dispatch({ type: "SET_RESULT", result: inv, steps });
    } else {
      const inv = realCurve.inversePoint(pt);
      const vertical: ConstructionLine = { from: pt, to: inv, style: "vertical" };
      const steps: StepData[] = [
        {
          label: "Reflect over x-axis",
          explanation: `-P = (${pt.x.toFixed(2)}, ${inv.y.toFixed(2)})`,
          formula: `-P = (x_P,\\, -y_P)`,
          lines: [vertical],
          points: [{ point: inv, color: "#06D6A0", label: "-P" }],
        },
      ];
      dispatch({ type: "SET_RESULT", result: inv, steps });
    }
  }, [state.selectedP, state.mode, realCurve, finiteCurve, state.p]);

  const computeScalar = useCallback(() => {
    if (!state.selectedP || state.mode === "real") return;
    const n = state.scalarN;
    const result = finiteCurve.scalarMultiply(state.selectedP, n);
    const fullTrail: CurvePoint[] = [];
    let current: CurvePoint | null = state.selectedP;
    for (let i = 1; i <= n && current; i++) {
      fullTrail.push(current);
      if (i < n) current = finiteCurve.addPoints(current, state.selectedP);
    }
    const steps: StepData[] = fullTrail.map((pt, i) => {
      const k = i + 1;
      const isLast = k === n;
      return {
        label: `${k}P`,
        explanation: `${k}P = (${pt.x}, ${pt.y})`,
        trail: fullTrail.slice(0, i + 1),
        points: [{ point: pt, color: isLast ? "#06D6A0" : "#A78BFA", label: isLast ? `${n}P` : `${k}P` }],
      };
    });
    dispatch({ type: "SET_RESULT", result, steps });
  }, [state.selectedP, state.scalarN, state.mode, finiteCurve]);

  const computeOrbit = useCallback(() => {
    if (!state.selectedP || state.mode === "real") return;
    const orbit = finiteCurve.computeOrbit(state.selectedP);
    const order = orbit.length + 1;
    const isGen = finiteCurve.isGenerator(state.selectedP);
    const steps: StepData[] = orbit.map((pt, i) => ({
      label: `${i + 1}P`,
      explanation: `${i + 1}P = (${pt.x}, ${pt.y})`,
      trail: orbit.slice(0, i + 1),
      points: [{ point: pt, color: "#06D6A0", label: `${i + 1}P` }],
    }));
    steps.push({
      label: `${order}P = O`,
      explanation: `Order of P is ${order}${isGen ? " — P is a generator of the full group!" : ""}`,
      trail: orbit,
    });
    dispatch({ type: "SET_RESULT", result: null, steps });
  }, [state.selectedP, state.mode, finiteCurve]);

  const computeDLP = useCallback(() => {
    if (!state.selectedP || !state.selectedQ || state.mode === "real") return;
    const base = state.selectedP;
    const target = state.selectedQ;
    const isGen = finiteCurve.isGenerator(base);
    const orderP = finiteCurve.pointOrder(base);
    const n = finiteCurve.discreteLog(base, target);

    // Build the full search trail
    const searchTrail: CurvePoint[] = [];
    const steps: StepData[] = [];

    // Warning step if P is not a generator
    if (!isGen) {
      steps.push({
        label: "Warning",
        explanation: `P has order ${orderP} < ${finiteCurve.groupOrder()} (group order). P is NOT a generator — only ${orderP - 1} points are reachable from P. Q may not be found.`,
      });
    }

    let current: CurvePoint | null = base;
    for (let i = 1; current !== null && i <= orderP; i++) {
      searchTrail.push(current);
      const found = current.x === target.x && current.y === target.y;
      steps.push({
        label: `${i}P`,
        explanation: found
          ? `${i}P = (${current.x}, ${current.y}) = Q  \u2190 Found! n = ${i}`
          : `${i}P = (${current.x}, ${current.y}) \u2260 Q`,
        trail: [...searchTrail],
        points: [
          { point: current, color: found ? "#06D6A0" : "#A78BFA", label: found ? `${i}P = Q` : `${i}P` },
          ...(!found ? [{ point: target, color: "#FF7B6B", label: "Q (target)" }] : []),
        ],
      });
      if (found) break;
      current = finiteCurve.addPoints(current, base);
    }

    if (n === null) {
      steps.push({
        label: "Not found",
        explanation: `Q is not in the subgroup \u27E8P\u27E9. Exhausted all ${orderP - 1} multiples of P without finding Q.`,
        trail: searchTrail,
        points: [{ point: target, color: "#FF7B6B", label: "Q (unreachable)" }],
      });
    }

    dispatch({ type: "SET_RESULT", result: n !== null ? target : null, steps });
  }, [state.selectedP, state.selectedQ, state.mode, finiteCurve]);

  const computeECDH = useCallback(() => {
    if (!state.selectedP || state.mode === "real") return;
    const g = state.selectedP;
    const ka = state.ecdhA, kb = state.ecdhB;
    const pubA = finiteCurve.scalarMultiply(g, ka);
    const pubB = finiteCurve.scalarMultiply(g, kb);
    if (!pubA || !pubB) { dispatch({ type: "SET_RESULT", result: null, steps: [{ label: "Error", explanation: "Invalid key (produces identity). Choose a different value." }] }); return; }
    const sharedA = finiteCurve.scalarMultiply(pubB, ka);
    const sharedB = finiteCurve.scalarMultiply(pubA, kb);
    const ab = ka * kb;
    const steps: StepData[] = [
      { label: "Base point G", explanation: `G = (${g.x}, ${g.y})`, points: [{ point: g, color: "#FFD166", label: "G" }] },
      { label: `Alice: a = ${ka}`, explanation: `A = ${ka}G = (${pubA.x}, ${pubA.y})`, points: [{ point: pubA, color: "#FFD166", label: "A" }], formula: `A = aG = ${ka} \\cdot G` },
      { label: `Bob: b = ${kb}`, explanation: `B = ${kb}G = (${pubB.x}, ${pubB.y})`, points: [{ point: pubB, color: "#FF7B6B", label: "B" }], formula: `B = bG = ${kb} \\cdot G` },
      { label: "Alice computes S", explanation: sharedA ? `S = ${ka}B = (${sharedA.x}, ${sharedA.y})` : "S = O", points: sharedA ? [{ point: sharedA, color: "#06D6A0", label: "S" }] : [], formula: `S_A = a \\cdot B = ${ka} \\cdot ${kb}G = ${ab}G` },
      { label: "Bob computes S", explanation: sharedB ? `S = ${kb}A = (${sharedB.x}, ${sharedB.y})` : "S = O", points: sharedB ? [{ point: sharedB, color: "#06D6A0", label: "S" }] : [], formula: `S_B = b \\cdot A = ${kb} \\cdot ${ka}G = ${ab}G` },
      { label: "Shared secret", explanation: sharedA && sharedB ? `S_A = S_B = (${sharedA.x}, ${sharedA.y}) \u2714` : "Both reach O", formula: `a \\cdot bG = b \\cdot aG \\quad \\text{(commutativity)}` },
    ];
    dispatch({ type: "SET_RESULT", result: sharedA, steps });
  }, [state.selectedP, state.mode, state.ecdhA, state.ecdhB, finiteCurve]);

  const computeNonceReuse = useCallback(() => {
    if (!state.selectedP || state.mode === "real") return;
    const g = state.selectedP;
    const d = 7;
    const result = finiteCurve.ecdsaNonceReuse(g, d, "Hello", "World", 3);
    const steps: StepData[] = [
      { label: "Setup", explanation: `Private key d = ${d}. Signer signs TWO different messages with the SAME nonce k = 3.`, formula: `\\text{DANGER: same } k \\text{ for both signatures}` },
      { label: "Signature 1", explanation: `Sign("Hello"): (r = ${result.sig1.r}, s = ${result.sig1.s}), hash e = ${result.sig1.e}`, formula: `s_1 = k^{-1}(e_1 + r \\cdot d) \\bmod n` },
      { label: "Signature 2", explanation: `Sign("World"): (r = ${result.sig2.r}, s = ${result.sig2.s}), hash e = ${result.sig2.e}`, formula: `s_2 = k^{-1}(e_2 + r \\cdot d) \\bmod n` },
      { label: "Same r!", explanation: `Both signatures share r = ${result.sig1.r} because same nonce k was used. This leaks information.`, formula: `r_1 = r_2 = ${result.sig1.r} \\quad \\text{(same } k \\text{)}` },
      { label: "Attack: recover k", explanation: `k = (e_1 - e_2) / (s_1 - s_2) mod n`, formula: `k = \\frac{e_1 - e_2}{s_1 - s_2} \\bmod n` },
      { label: result.recoveredKey !== null ? "Key recovered!" : "Attack failed", explanation: result.recoveredKey !== null ? `Private key d = ${result.recoveredKey} recovered from public signatures alone! The signer's secret is completely compromised.` : "Attack failed (group order not prime for this base point). Try a generator of prime order.", formula: result.recoveredKey !== null ? `d = \\frac{s_1 \\cdot k - e_1}{r} \\equiv ${result.recoveredKey} \\pmod{n} \\quad \\text{COMPROMISED}` : `\\text{gcd}(s_1 - s_2, n) > 1` },
    ];
    dispatch({ type: "SET_RESULT", result: null, steps });
  }, [state.selectedP, state.mode, finiteCurve]);

  const computeECDSA = useCallback(() => {
    if (!state.selectedP || state.mode === "real") return;
    const g = state.selectedP;
    const d = 7;
    const k = 3;
    const message = "Hello";
    const pubQ = finiteCurve.scalarMultiply(g, d)!;
    const sig = finiteCurve.ecdsaSign(g, d, message, k);
    if (!sig) return;
    const verif = finiteCurve.ecdsaVerify(g, pubQ, message, { r: sig.r, s: sig.s });
    const n = finiteCurve.pointOrder(g);

    const steps: StepData[] = [
      { label: "Key pair", explanation: `Private key d = ${d}, Public key Q = dG = (${pubQ.x}, ${pubQ.y})`, points: [{ point: pubQ, color: "#FFD166", label: "Q=dG" }], formula: `Q = d \\cdot G = ${d} \\cdot G` },
      { label: "Hash message", explanation: `e = H("${message}") mod ${n} = ${sig.e}`, formula: `e = H(\\text{"${message}"}) \\bmod ${n} = ${sig.e}` },
      { label: "Nonce k = " + k, explanation: `kG = ${k}G = (${sig.kG.x}, ${sig.kG.y})`, points: [{ point: sig.kG, color: "#A78BFA", label: "kG" }], formula: `R = kG = ${k} \\cdot G` },
      { label: "Signature (r, s)", explanation: `r = R.x mod n = ${sig.r}, s = k\u207b\u00b9(e + r\u00b7d) mod n = ${sig.s}`, formula: `(r, s) = (${sig.r},\\, ${sig.s})` },
      { label: "Verify: compute w", explanation: `w = s\u207b\u00b9 mod ${n} = ${verif.w}`, formula: `w = s^{-1} \\bmod n = ${verif.w}` },
      { label: "Verify: u\u2081, u\u2082", explanation: `u\u2081 = e\u00b7w = ${verif.u1}, u\u2082 = r\u00b7w = ${verif.u2}`, formula: `u_1 = ${verif.u1},\\quad u_2 = ${verif.u2}` },
      { label: verif.valid ? "Verified!" : "FAILED", explanation: verif.v ? `V = u\u2081G + u\u2082Q = (${verif.v.x}, ${verif.v.y}). V.x mod n = ${verif.v.x % n} ${verif.valid ? "= r" : "\u2260 r"}` : "V = O", points: verif.v ? [{ point: verif.v, color: verif.valid ? "#06D6A0" : "#FF7B6B", label: "V" }] : [], formula: verif.valid ? `V.x \\bmod n = ${sig.r} = r \\quad \\checkmark` : `V.x \\bmod n \\neq r` },
    ];
    dispatch({ type: "SET_RESULT", result: verif.v, steps });
  }, [state.selectedP, state.mode, finiteCurve]);

  const computeDoubleAndAdd = useCallback(() => {
    if (!state.selectedP || state.mode === "real") return;
    const { result, steps: daSteps } = finiteCurve.doubleAndAdd(state.selectedP, state.scalarN);
    const binary = state.scalarN.toString(2);
    const steps: StepData[] = [
      { label: `Binary: ${binary}`, explanation: `${state.scalarN} = ${binary}\u2082 (${binary.length} bits)` },
      ...daSteps.map((s, i) => ({
        label: `Step ${i + 1}: ${s.op}`,
        explanation: s.value ? `${s.op === "double" ? "Double" : "Add P"} \u2192 (${s.value.x}, ${s.value.y})` : `\u2192 O`,
        points: s.value ? [{ point: s.value, color: s.op === "double" ? "#A78BFA" : "#06D6A0", label: s.op === "double" ? "2\u00d7" : "+P" }] : [],
        formula: `\\text{bit } ${s.bit} \\rightarrow \\text{${s.op}}`,
      })),
    ];
    dispatch({ type: "SET_RESULT", result, steps });
  }, [state.selectedP, state.scalarN, state.mode, finiteCurve]);

  const computeSchnorr = useCallback(() => {
    if (!state.selectedP || state.mode === "real") return;
    const g = state.selectedP;
    const secret = 7;
    const nonce = 5;
    const challenge = 3;
    const order = finiteCurve.pointOrder(g);
    const pubQ = finiteCurve.scalarMultiply(g, secret)!;
    const R = finiteCurve.schnorrCommit(g, nonce)!;
    const s = finiteCurve.schnorrRespond(nonce, challenge, secret, order);
    const verif = finiteCurve.schnorrVerify(g, pubQ, R, challenge, s);

    const steps: StepData[] = [
      {
        label: "Setup",
        explanation: `Prover knows secret x = ${secret}. Public key Q = ${secret}G = (${pubQ.x}, ${pubQ.y})`,
        formula: `Q = x \\cdot G = ${secret} \\cdot G`,
        points: [{ point: pubQ, color: "#FFD166", label: "Q = xG" }],
      },
      {
        label: "1. Commit",
        explanation: `Prover picks random nonce r = ${nonce}, computes R = rG = (${R.x}, ${R.y}), sends R`,
        formula: `R = r \\cdot G = ${nonce} \\cdot G`,
        points: [{ point: pubQ, color: "#FFD166", label: "Q" }, { point: R, color: "#A78BFA", label: "R = rG" }],
      },
      {
        label: "2. Challenge",
        explanation: `Verifier sends random challenge c = ${challenge}`,
        formula: `c = ${challenge} \\quad \\text{(random)}`,
        points: [{ point: pubQ, color: "#FFD166", label: "Q" }, { point: R, color: "#A78BFA", label: "R" }],
      },
      {
        label: "3. Response",
        explanation: `Prover computes s = r + c\u00b7x mod ${order} = ${nonce} + ${challenge}\u00d7${secret} mod ${order} = ${s}`,
        formula: `s = r + c \\cdot x = ${nonce} + ${challenge} \\times ${secret} \\equiv ${s} \\pmod{${order}}`,
        points: [{ point: pubQ, color: "#FFD166", label: "Q" }, { point: R, color: "#A78BFA", label: "R" }],
      },
      {
        label: "4. Verify",
        explanation: verif.lhs && verif.rhs
          ? `sG = (${verif.lhs.x}, ${verif.lhs.y}) vs R + cQ = (${verif.rhs.x}, ${verif.rhs.y}) ${verif.valid ? "\u2714 Equal!" : "\u2718 Not equal"}`
          : "Computation error",
        formula: `s \\cdot G \\stackrel{?}{=} R + c \\cdot Q`,
        points: verif.lhs ? [
          { point: verif.lhs, color: verif.valid ? "#06D6A0" : "#FF7B6B", label: "sG" },
          { point: R, color: "#A78BFA", label: "R" },
          { point: pubQ, color: "#FFD166", label: "Q" },
        ] : [],
      },
      {
        label: verif.valid ? "Zero-Knowledge!" : "FAILED",
        explanation: verif.valid
          ? "Verifier is convinced Prover knows x, but learned NOTHING about x. Only R, c, s were exchanged \u2014 none reveal x."
          : "Verification failed \u2014 prover does not know the secret.",
        formula: verif.valid
          ? `\\text{Revealed: } R, c, s \\quad \\text{Secret: } x = ? \\quad \\text{ZK} \\checkmark`
          : `\\text{sG} \\neq R + cQ`,
      },
    ];
    dispatch({ type: "SET_RESULT", result: verif.lhs, steps });
  }, [state.selectedP, state.mode, finiteCurve]);

  const computePedersen = useCallback(() => {
    if (!state.selectedP || !state.selectedQ || state.mode === "real") return;
    const g = state.selectedP;
    const h = state.selectedQ;
    const value = 5;
    const blinding = 11;
    const vG = finiteCurve.scalarMultiply(g, value);
    const rH = finiteCurve.scalarMultiply(h, blinding);
    const C = finiteCurve.pedersenCommit(g, h, value, blinding);

    const steps: StepData[] = [
      {
        label: "Setup: two generators",
        explanation: `G = (${g.x}, ${g.y}), H = (${h.x}, ${h.y}). Nobody knows the discrete log of H w.r.t. G.`,
        points: [
          { point: g, color: "#FFD166", label: "G" },
          { point: h, color: "#FF7B6B", label: "H" },
        ],
      },
      {
        label: "Choose secret value & blinding",
        explanation: `Value v = ${value} (the secret to commit), Blinding factor r = ${blinding} (randomness for hiding)`,
        formula: `v = ${value}, \\quad r = ${blinding}`,
      },
      {
        label: "Compute commitment",
        explanation: vG && rH
          ? `C = ${value}G + ${blinding}H = (${vG.x}, ${vG.y}) + (${rH.x}, ${rH.y})${C ? ` = (${C.x}, ${C.y})` : " = O"}`
          : "Computation error",
        formula: `C = v \\cdot G + r \\cdot H = ${value}G + ${blinding}H`,
        points: [
          ...(vG ? [{ point: vG, color: "#FFD166", label: `${value}G` }] : []),
          ...(rH ? [{ point: rH, color: "#FF7B6B", label: `${blinding}H` }] : []),
          ...(C ? [{ point: C, color: "#A78BFA", label: "C" }] : []),
        ],
      },
      {
        label: "Commitment is hiding",
        explanation: `C = (${C?.x}, ${C?.y}) reveals nothing about v = ${value}. An observer sees only C \u2014 they can't determine v without knowing r.`,
        formula: `\\text{Given only } C, \\text{ finding } v \\text{ requires solving DLP}`,
        points: C ? [{ point: C, color: "#A78BFA", label: "C (public)" }] : [],
      },
      {
        label: "Opening: reveal v and r",
        explanation: `Prover reveals v = ${value}, r = ${blinding}. Verifier checks: ${value}G + ${blinding}H == C?`,
        formula: `${value} \\cdot G + ${blinding} \\cdot H \\stackrel{?}{=} C`,
        points: C ? [{ point: C, color: "#06D6A0", label: "C \u2714" }] : [],
      },
      {
        label: "Binding property",
        explanation: "The prover cannot open C to a different value v'. Doing so would require finding r' such that v'G + r'H = C, which means solving the DLP for H w.r.t. G.",
        formula: `\\text{Cannot find } (v', r') \\neq (v, r) \\text{ s.t. } v'G + r'H = C`,
      },
    ];
    dispatch({ type: "SET_RESULT", result: C, steps });
  }, [state.selectedP, state.selectedQ, state.mode, finiteCurve]);

  return {
    state,
    dispatch,
    realCurve,
    finiteCurve,
    isSingular,
    isPrimeValid,
    addPoints,
    doublePoint,
    computeInverse,
    computeScalar,
    computeOrbit,
    computeDLP,
    computeECDH,
    computeECDSA,
    computeDoubleAndAdd,
    computeSchnorr,
    computePedersen,
    computeNonceReuse,
  };
}
