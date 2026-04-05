import { useEffect, useRef } from "react";
import katex from "katex";
import type { StepData } from "../hooks/useCurveState.js";

interface Props {
  steps: StepData[];
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkipToEnd: () => void;
}

function KaTeX({ formula }: { formula: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isMultiline = formula.includes("\\begin{aligned}");

  useEffect(() => {
    if (ref.current && formula) {
      try {
        katex.render(formula, ref.current, {
          throwOnError: false,
          displayMode: isMultiline,
        });
      } catch {
        if (ref.current) ref.current.textContent = formula;
      }
    }
  }, [formula]);

  return <span ref={ref} className="step-formula" />;
}

function Legend({ step }: { step: StepData }) {
  const hasSecant = step.lines?.some((l) => l.style === "secant");
  const hasTangent = step.lines?.some((l) => l.style === "tangent");
  const hasVertical = step.lines?.some((l) => l.style === "vertical") || step.verticalX !== undefined;
  const hasModLine = !!step.modularLine;
  const hasRPrime = step.points?.some((p) => p.label.includes("R'"));
  const hasResult = step.points?.some((p) => p.label.includes("R") && !p.label.includes("R'"));
  const hasTrail = step.trail && step.trail.length > 0;

  if (!hasSecant && !hasTangent && !hasVertical && !hasModLine && !hasRPrime && !hasResult && !hasTrail) return null;

  return (
    <div style={{
      display: "flex",
      gap: "12px",
      marginTop: "4px",
      flexWrap: "wrap",
    }}>
      {hasSecant && (
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#FF7B6B" }}>
          <span style={{ width: "16px", height: "0", borderTop: "2px dashed #FF7B6B", display: "inline-block" }} />
          secant
        </span>
      )}
      {hasTangent && (
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#FFD166" }}>
          <span style={{ width: "16px", height: "0", borderTop: "2px dashed #FFD166", display: "inline-block" }} />
          tangent
        </span>
      )}
      {hasModLine && (
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#FF7B6B" }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#FF7B6B", display: "inline-block" }} />
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#FF7B6B", display: "inline-block", opacity: 0.5 }} />
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#FF7B6B", display: "inline-block", opacity: 0.3 }} />
          mod line
        </span>
      )}
      {hasVertical && (
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#A78BFA" }}>
          <span style={{ width: "16px", height: "0", borderTop: "2px dashed #A78BFA", display: "inline-block" }} />
          reflection
        </span>
      )}
      {hasRPrime && (
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#A78BFA" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#A78BFA", display: "inline-block" }} />
          R&apos;
        </span>
      )}
      {hasResult && (
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#06D6A0" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#06D6A0", display: "inline-block" }} />
          result
        </span>
      )}
      {hasTrail && (
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#06D6A0" }}>
          <span style={{ width: "16px", height: "0", borderTop: "2px dashed rgba(6,214,160,0.5)", display: "inline-block" }} />
          orbit trail
        </span>
      )}
    </div>
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
        <button onClick={onPrev} disabled={isFirst} aria-label="Previous step">
          &#x25C0;
        </button>
        <span className="step-counter">
          {currentStepIndex + 1} / {steps.length}
        </span>
        <button onClick={onNext} disabled={isLast} aria-label="Next step">
          &#x25B6;
        </button>
        <button onClick={onSkipToEnd} disabled={isLast} aria-label="Skip to end" style={{ fontSize: "14px" }}>
          &#x25B6;&#x25B6;
        </button>
      </div>
      <div className="step-content">
        <div className="step-label">{step.label}</div>
        <div className="step-explanation">{step.explanation}</div>
        {step.formula && <KaTeX formula={step.formula} />}
        <Legend step={step} />
      </div>
    </div>
  );
}
