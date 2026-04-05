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

/** Parse a computation formula string into table rows */
function ComputationTable({ formula }: { formula: string }) {
  // Check if this is an aligned KaTeX formula — if so, parse it into a table
  if (!formula.includes("\\begin{aligned}")) {
    return <KaTeX formula={formula} />;
  }

  // Extract lines from aligned environment
  const inner = formula.replace(/\\begin\{aligned\}/, "").replace(/\\end\{aligned\}/, "");
  const lines = inner.split("\\\\").map((l) => l.replace(/^[&\s]+/, "").trim()).filter(Boolean);

  if (lines.length === 0) return <KaTeX formula={formula} />;

  // First line is the operation header
  const header = lines[0];
  const compLines = lines.slice(1);

  return (
    <div>
      <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface)", marginBottom: "3px" }}>
        <KaTeX formula={header} />
      </div>
      {compLines.length > 0 && (
        <div className="step-computation">
          {compLines.map((line, i) => {
            // Each line has format: "label = formula \\equiv result \\pmod{p}"
            // Split on \\equiv to get parts
            const parts = line.split(/\\equiv/);
            if (parts.length >= 2) {
              const lhs = parts[0].trim();
              const rest = parts.slice(1).join("\\equiv ");
              // Split rest on \\pmod or \\!\\!\\!\\pmod
              const modMatch = rest.match(/(.+?)\\!*\\\\pmod\{(\d+)\}/);
              if (modMatch) {
                const middle = modMatch[1].trim();
                const mod = modMatch[2];
                // Try to split middle further on \\equiv
                const midParts = middle.split(/\\equiv/);
                if (midParts.length >= 2) {
                  return (
                    <div key={i} style={{ display: "contents" }}>
                      <span className="comp-formula"><KaTeX formula={lhs.replace(/^\s*&?\s*/, "")} /></span>
                      <span className="comp-subst"><KaTeX formula={`\\equiv ${midParts[0].trim()}`} /></span>
                      <span className="comp-simplify"><KaTeX formula={`\\equiv ${midParts[1].trim()}`} /></span>
                      <span className="comp-result"><KaTeX formula={`\\pmod{${mod}}`} /></span>
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ display: "contents" }}>
                    <span className="comp-formula"><KaTeX formula={lhs.replace(/^\s*&?\s*/, "")} /></span>
                    <span className="comp-subst"><KaTeX formula={`\\equiv ${middle}`} /></span>
                    <span className="comp-result" style={{ gridColumn: "span 2" }}><KaTeX formula={`\\pmod{${mod}}`} /></span>
                  </div>
                );
              }
            }
            // Fallback: render the whole line
            return (
              <div key={i} style={{ display: "contents" }}>
                <span className="comp-formula" style={{ gridColumn: "1 / -1" }}><KaTeX formula={line.replace(/^\s*&?\s*/, "")} /></span>
              </div>
            );
          })}
        </div>
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
        {step.formula && <ComputationTable formula={step.formula} />}
      </div>
    </div>
  );
}
