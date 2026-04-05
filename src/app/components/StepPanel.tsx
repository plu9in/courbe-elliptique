import { useEffect, useRef } from "react";
import katex from "katex";
import type { StepData, ComputationRow } from "../hooks/useCurveState.js";

interface Props {
  steps: StepData[];
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkipToEnd: () => void;
}

function KaTeX({ formula }: { formula: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current && formula) {
      try {
        katex.render(formula, ref.current, { throwOnError: false, displayMode: false });
      } catch {
        if (ref.current) ref.current.textContent = formula;
      }
    }
  }, [formula]);
  return <span ref={ref} className="step-formula" />;
}

function ComputationTable({ rows }: { rows: ComputationRow[] }) {
  return (
    <table className="comp-table">
      <thead>
        <tr>
          <th>Step</th>
          <th>Formula</th>
          <th>Substitution</th>
          <th>Simplification</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td className="comp-cell-label">{row.label}</td>
            <td className="comp-cell-formula">{row.description}</td>
            <td className="comp-cell-subst">{row.substitution}</td>
            <td className="comp-cell-mid">{row.intermediate ?? ""}</td>
            <td className="comp-cell-result">{row.result}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StepPanel({ steps, currentStepIndex, onNext, onPrev, onSkipToEnd }: Props) {
  if (steps.length === 0) {
    return (
      <div className="step-panel">
        <span className="step-idle">
          Select points on the curve and choose an operation to see the step-by-step construction.
        </span>
      </div>
    );
  }

  const step = steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  return (
    <div className="step-panel">
      <div className="step-nav">
        <button onClick={onPrev} disabled={isFirst} aria-label="Previous step">&#x25C0;</button>
        <span className="step-counter">{currentStepIndex + 1}/{steps.length}</span>
        <button onClick={onNext} disabled={isLast} aria-label="Next step">&#x25B6;</button>
        <button onClick={onSkipToEnd} disabled={isLast} aria-label="Skip to end" style={{ fontSize: "11px" }}>&#x25B6;&#x25B6;</button>
      </div>
      <div className="step-content">
        <div className="step-header">
          <span className="step-label">{step.label}</span>
          <span className="step-explanation">{step.explanation}</span>
        </div>
        {step.computation && <ComputationTable rows={step.computation} />}
        {step.formula && !step.computation && <KaTeX formula={step.formula} />}
      </div>
    </div>
  );
}
