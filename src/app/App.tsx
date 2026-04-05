import { useCurveState } from "./hooks/useCurveState.js";
import { CurveCanvas } from "./components/CurveCanvas.js";
import { Sidebar } from "./components/Sidebar.js";
import { StepPanel } from "./components/StepPanel.js";

export function App() {
  const {
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
  } = useCurveState();

  const pointCount = state.mode === "finite" && isPrimeValid
    ? finiteCurve.computeAllPoints().length
    : null;

  return (
    <div className="app-layout">
      <header className="top-bar">
        <h1>Elliptic Curve <em>Group Explorer</em></h1>
        <div className="mode-toggle">
          <button
            className={state.mode === "real" ? "active" : ""}
            onClick={() => dispatch({ type: "SET_MODE", mode: "real" })}
          >
            Real Numbers
          </button>
          <button
            className={state.mode === "finite" ? "active" : ""}
            onClick={() => dispatch({ type: "SET_MODE", mode: "finite" })}
          >
            Finite Field 𝔽ₚ
          </button>
        </div>
      </header>

      <Sidebar
        mode={state.mode}
        a={state.a}
        b={state.b}
        p={state.p}
        isSingular={isSingular}
        isPrimeValid={isPrimeValid}
        selectedP={state.selectedP}
        selectedQ={state.selectedQ}
        result={state.result}
        scalarN={state.scalarN}
        activePresetId={state.activePresetId}
        onSetA={(a) => dispatch({ type: "SET_A", a })}
        onSetB={(b) => dispatch({ type: "SET_B", b })}
        onSetP={(p) => dispatch({ type: "SET_P", p })}
        onClearSelection={() => dispatch({ type: "CLEAR_SELECTION" })}
        onAdd={addPoints}
        onDouble={doublePoint}
        onInverse={computeInverse}
        onScalar={computeScalar}
        onOrbit={computeOrbit}
        onDLP={computeDLP}
        onECDH={computeECDH}
        onECDSA={computeECDSA}
        onDoubleAndAdd={computeDoubleAndAdd}
        onSchnorr={computeSchnorr}
        onPedersen={computePedersen}
        onSetScalar={(n) => dispatch({ type: "SET_SCALAR", n })}
        onSelectPreset={(preset) => dispatch({
          type: "LOAD_PRESET",
          a: preset.toyParams.a,
          b: preset.toyParams.b,
          p: preset.toyParams.p,
          presetId: preset.id,
        })}
      />

      <CurveCanvas
        mode={state.mode}
        realCurve={realCurve}
        finiteCurve={finiteCurve}
        p={state.p}
        isSingular={isSingular}
        isPrimeValid={isPrimeValid}
        selectedP={state.selectedP}
        selectedQ={state.selectedQ}
        result={state.result}
        steps={state.steps}
        currentStepIndex={state.currentStepIndex}
        onPointClick={(point) => dispatch({ type: "SELECT_POINT", point })}
      />

      <StepPanel
        steps={state.steps}
        currentStepIndex={state.currentStepIndex}
        onNext={() => dispatch({ type: "NEXT_STEP" })}
        onPrev={() => dispatch({ type: "PREV_STEP" })}
        onSkipToEnd={() => dispatch({ type: "SKIP_TO_END" })}
      />

      {state.mode === "finite" && isPrimeValid && pointCount !== null && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "16px",
          zIndex: 5,
          fontFamily: "var(--md-sys-typescale-code-font)",
          fontSize: "13px",
          color: "var(--md-sys-color-on-surface-variant)",
          background: "rgba(13, 17, 23, 0.85)",
          padding: "6px 14px",
          borderRadius: "var(--md-sys-shape-corner-small)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--md-sys-color-outline-variant)",
        }}>
          |E(𝔽<sub>{state.p}</sub>)| = <strong style={{ color: "var(--md-sys-color-primary)" }}>{pointCount + 1}</strong> <span style={{ opacity: 0.6 }}>({pointCount} + O)</span>
        </div>
      )}
    </div>
  );
}
