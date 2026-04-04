import { useCallback, useMemo, useReducer } from "react";
import { EllipticCurve } from "../../curve-visualization/domain/model/EllipticCurve.js";
import { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";

export type FieldMode = "real" | "finite";

interface CurveState {
  mode: FieldMode;
  a: number;
  b: number;
  p: number;
  selectedP: CurvePoint | null;
  selectedQ: CurvePoint | null;
  result: CurvePoint | null;
  steps: StepData[];
  currentStepIndex: number;
  scalarN: number;
}

export interface StepData {
  label: string;
  explanation: string;
  formula?: string;
  highlightLine?: { from: CurvePoint; to: CurvePoint };
  highlightPoint?: CurvePoint;
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
  | { type: "SET_SCALAR"; n: number };

function reducer(state: CurveState, action: Action): CurveState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode, selectedP: null, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
    case "SET_A":
      return { ...state, a: action.a, selectedP: null, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
    case "SET_B":
      return { ...state, b: action.b, selectedP: null, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
    case "SET_P":
      return { ...state, p: action.p, selectedP: null, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
    case "SELECT_POINT":
      if (!state.selectedP) return { ...state, selectedP: action.point, result: null, steps: [], currentStepIndex: 0 };
      if (!state.selectedQ) return { ...state, selectedQ: action.point };
      return { ...state, selectedP: action.point, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
    case "CLEAR_SELECTION":
      return { ...state, selectedP: null, selectedQ: null, result: null, steps: [], currentStepIndex: 0 };
    case "SET_RESULT":
      return { ...state, result: action.result, steps: action.steps, currentStepIndex: 0 };
    case "NEXT_STEP":
      return { ...state, currentStepIndex: Math.min(state.currentStepIndex + 1, state.steps.length - 1) };
    case "PREV_STEP":
      return { ...state, currentStepIndex: Math.max(state.currentStepIndex - 1, 0) };
    case "SET_SCALAR":
      return { ...state, scalarN: action.n };
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

    if (state.mode === "finite") {
      const result = finiteCurve.addPoints(p, q);
      const mod = (n: number) => ((n % state.p) + state.p) % state.p;
      const dx = mod(q.x - p.x);
      const dy = mod(q.y - p.y);
      const steps: StepData[] = [
        {
          label: "Draw secant line",
          explanation: `Line through P(${p.x}, ${p.y}) and Q(${q.x}, ${q.y})`,
          highlightLine: { from: p, to: q },
        },
        {
          label: "Compute slope",
          explanation: `s = (${q.y} - ${p.y}) \u00b7 (${q.x} - ${p.x})\u207b\u00b9 mod ${state.p}`,
          formula: `s \\equiv ${dy} \\cdot ${dx}^{-1} \\pmod{${state.p}}`,
        },
        {
          label: "Compute result",
          explanation: result ? `R = (${result.x}, ${result.y})` : "R = O (point at infinity)",
          highlightPoint: result ?? undefined,
        },
      ];
      dispatch({ type: "SET_RESULT", result, steps });
    } else {
      const result = realCurve.addPoints(p, q);
      const s = (q.y - p.y) / (q.x - p.x);
      const steps: StepData[] = [
        {
          label: "Draw secant line",
          explanation: `Line through P(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) and Q(${q.x.toFixed(2)}, ${q.y.toFixed(2)})`,
          formula: `s = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${(q.y - p.y).toFixed(2)}}{${(q.x - p.x).toFixed(2)}} = ${s.toFixed(4)}`,
          highlightLine: { from: p, to: q },
        },
        {
          label: "Find third intersection",
          explanation: `The line intersects the curve at R'(${result.x.toFixed(2)}, ${(-result.y).toFixed(2)})`,
          highlightPoint: { x: result.x, y: -result.y },
        },
        {
          label: "Reflect over x-axis",
          explanation: `R = P + Q = (${result.x.toFixed(2)}, ${result.y.toFixed(2)})`,
          highlightPoint: result,
        },
      ];
      dispatch({ type: "SET_RESULT", result, steps });
    }
  }, [state.selectedP, state.selectedQ, state.mode, realCurve, finiteCurve, state.p]);

  const doublePoint = useCallback(() => {
    if (!state.selectedP) return;
    const p = state.selectedP;

    if (state.mode === "finite") {
      const result = finiteCurve.doublePoint(p);
      const steps: StepData[] = [
        { label: "Tangent at P", explanation: `Compute tangent slope at P(${p.x}, ${p.y})`, formula: `s \\equiv (3x^2 + a) \\cdot (2y)^{-1} \\pmod{${state.p}}` },
        { label: "Result", explanation: `2P = (${result.x}, ${result.y})`, highlightPoint: result },
      ];
      dispatch({ type: "SET_RESULT", result, steps });
    } else {
      const result = realCurve.doublePoint(p);
      const steps: StepData[] = [
        { label: "Tangent at P", explanation: `Draw tangent to the curve at P(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`, formula: `s = \\frac{3x^2 + a}{2y}` },
        { label: "Reflect", explanation: `2P = (${result.x.toFixed(2)}, ${result.y.toFixed(2)})`, highlightPoint: result },
      ];
      dispatch({ type: "SET_RESULT", result, steps });
    }
  }, [state.selectedP, state.mode, realCurve, finiteCurve, state.p]);

  const computeInverse = useCallback(() => {
    if (!state.selectedP) return;
    const p = state.selectedP;

    if (state.mode === "finite") {
      const inv = finiteCurve.inversePoint(p);
      const steps: StepData[] = [
        { label: "Inverse", explanation: `-P = (${p.x}, ${state.p} - ${p.y}) = (${inv.x}, ${inv.y})`, highlightPoint: inv },
      ];
      dispatch({ type: "SET_RESULT", result: inv, steps });
    } else {
      const inv = realCurve.inversePoint(p);
      const steps: StepData[] = [
        { label: "Inverse", explanation: `-P = (${p.x.toFixed(2)}, ${(-p.y).toFixed(2)})`, highlightPoint: inv },
      ];
      dispatch({ type: "SET_RESULT", result: inv, steps });
    }
  }, [state.selectedP, state.mode, realCurve, finiteCurve, state.p]);

  const computeScalar = useCallback(() => {
    if (!state.selectedP || state.mode !== "finite") return;
    const result = finiteCurve.scalarMultiply(state.selectedP, state.scalarN);
    const steps: StepData[] = [];
    let current: CurvePoint | null = state.selectedP;
    for (let i = 2; i <= state.scalarN && current; i++) {
      current = finiteCurve.addPoints(current, state.selectedP);
      steps.push({
        label: `${i}P`,
        explanation: current ? `${i}P = (${current.x}, ${current.y})` : `${i}P = O`,
        highlightPoint: current ?? undefined,
      });
    }
    dispatch({ type: "SET_RESULT", result, steps });
  }, [state.selectedP, state.scalarN, state.mode, finiteCurve]);

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
  };
}
