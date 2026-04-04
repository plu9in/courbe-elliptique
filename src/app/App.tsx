import { useCurveState } from "./hooks/useCurveState.js";
import { CurveCanvas } from "./components/CurveCanvas.js";
import { Sidebar } from "./components/Sidebar.js";
import { StepPanel } from "./components/StepPanel.js";
import { FiniteFieldCurve } from "../curve-visualization/domain/model/FiniteFieldCurve.js";

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
  } = useCurveState();

  const pointCount = state.mode === "finite" && isPrimeValid
    ? finiteCurve.computeAllPoints().length
    : null;

  return (
    <div className="app-layout">
      {/* Top App Bar */}
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

      {/* Sidebar */}
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
        onSetScalar={(n) => dispatch({ type: "SET_SCALAR", n })}
        onSelectPreset={(preset) => dispatch({
          type: "LOAD_PRESET",
          a: preset.toyParams.a,
          b: preset.toyParams.b,
          p: preset.toyParams.p,
          presetId: preset.id,
        })}
      />

      {/* Canvas */}
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

      {/* Step Panel */}
      <StepPanel
        steps={state.steps}
        currentStepIndex={state.currentStepIndex}
        onNext={() => dispatch({ type: "NEXT_STEP" })}
        onPrev={() => dispatch({ type: "PREV_STEP" })}
      />

      {/* Overlays */}
      {state.mode === "finite" && isPrimeValid && pointCount !== null && (
        <div className="point-count-overlay" style={{
          position: "fixed",
          top: "80px",
          right: "16px",
          zIndex: 5,
        }}>
          <strong>{pointCount}</strong> affine points + O
        </div>
      )}
    </div>
  );
}
