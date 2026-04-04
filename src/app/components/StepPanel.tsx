import { useEffect, useRef } from "react";
import katex from "katex";
import type { StepData } from "../hooks/useCurveState.js";

interface Props {
  steps: StepData[];
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

function KaTeX({ formula }: { formula: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current && formula) {
      try {
        katex.render(formula, ref.current, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        if (ref.current) ref.current.textContent = formula;
      }
    }
  }, [formula]);

  return <span ref={ref} className="step-formula" />;
}

export function StepPanel({ steps, currentStepIndex, onNext, onPrev }: Props) {
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
      </div>
      <div className="step-content">
        <div className="step-label">{step.label}</div>
        <div className="step-explanation">{step.explanation}</div>
        {step.formula && <KaTeX formula={step.formula} />}
      </div>
    </div>
  );
}
