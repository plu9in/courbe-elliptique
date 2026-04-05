import { useState } from "react";
import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";
import type { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { ECDHPhase, StepData, GradientPath, LabeledPoint, ComputationRow } from "../hooks/useCurveState.js";

// Path colors
const ALICE_PATH = "rgb(96, 165, 250)";     // blue
const BOB_PATH = "rgb(244, 114, 182)";      // pink
const ALICE_END = "rgb(96, 165, 250)";      // blue (A destination)
const BOB_END = "rgb(244, 114, 182)";       // pink (B destination)
const COMMON_PATH = "rgb(125, 211, 192)";   // teal (shared prefix)
const DIVERGE_PATH = "rgb(251, 146, 60)";   // orange (where alice and bob diverge)
const EXTRA_PATH = "rgb(167, 139, 250)";    // violet (extra steps to S)
const S_END = "rgb(250, 204, 21)";          // gold (shared secret)
const G_LABEL = "rgb(125, 211, 192)";       // teal for G

interface Props {
  basePoint: CurvePoint | null;
  curve: FiniteFieldCurve;
  phase: ECDHPhase;
  aliceSecret: number | null;
  bobSecret: number | null;
  onStart: () => void;
  onSetAliceSecret: (v: number) => void;
  onSetBobSecret: (v: number) => void;
  onAdvance: () => void;
  onReset: () => void;
  onSetResult: (result: CurvePoint | null, steps: StepData[]) => void;
}

function buildTrail(curve: FiniteFieldCurve, base: CurvePoint, n: number): CurvePoint[] {
  const trail: CurvePoint[] = [];
  for (let i = 1; i <= n; i++) {
    const pt = curve.scalarMultiply(base, i);
    if (pt) trail.push(pt);
  }
  return trail;
}

export function ECDHPanel({
  basePoint, curve, phase, aliceSecret, bobSecret,
  onStart, onSetAliceSecret, onSetBobSecret, onAdvance, onReset, onSetResult,
}: Props) {
  const [aliceInput, setAliceInput] = useState("");
  const [bobInput, setBobInput] = useState("");
  const [error, setError] = useState("");

  if (phase === "idle") {
    return (
      <div>
        <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", marginBottom: "10px", lineHeight: "1.6" }}>
          Interactive ECDH key exchange with visible computation paths.
          <strong style={{ color: "var(--md-sys-color-on-surface)" }}> Select a base point G first.</strong>
        </div>
        <button className="op-btn primary" disabled={!basePoint} onClick={() => { onStart(); setAliceInput(""); setBobInput(""); setError(""); }} style={{ width: "100%" }}>
          Start ECDH Exchange
        </button>
      </div>
    );
  }

  const G = basePoint!;
  const order = curve.pointOrder(G);
  const alicePub = aliceSecret !== null ? curve.scalarMultiply(G, aliceSecret) : null;
  const bobPub = bobSecret !== null ? curve.scalarMultiply(G, bobSecret) : null;

  // === Step generators for each phase ===

  function computeStep(k: number, base: CurvePoint, baseName: string, prevName: string, trail: CurvePoint[]): { header: string; computation?: ComputationRow[] } {
    const pp = curve.p;
    const mod = (n: number) => ((n % pp) + pp) % pp;

    if (k === 1) {
      return { header: `1\u00b7${baseName} = ${baseName} = (${trail[0].x}, ${trail[0].y})` };
    }

    const prev = trail[k - 2];
    const cur = trail[k - 1];
    const isDouble = k === 2 && prev.x === base.x && prev.y === base.y;

    if (isDouble) {
      const twoY = mod(2 * base.y);
      const twoYInv = curve.modInverse(twoY);
      const num = mod(3 * base.x * base.x + curve.a);
      const s = mod(num * twoYInv);
      return {
        header: `${k}\u00b7${baseName} = ${baseName} + ${baseName} = doubling (tangent)`,
        computation: [
          {
            label: "Slope (tangent)",
            description: `s = (3x\u00b2 + a) / (2y) mod p`,
            substitution: `= (3\u00b7${base.x}\u00b2 + ${curve.a}) \u00b7 (2\u00b7${base.y})\u207b\u00b9`,
            intermediate: `= ${num} \u00b7 ${twoY}\u207b\u00b9 = ${num} \u00b7 ${twoYInv}`,
            result: `\u2261 ${s} (mod ${pp})`,
          },
          {
            label: "New x",
            description: `x\u2083 = s\u00b2 \u2212 2\u00b7x mod p`,
            substitution: `= ${s}\u00b2 \u2212 2\u00b7${base.x}`,
            intermediate: `= ${s * s} \u2212 ${2 * base.x}`,
            result: `\u2261 ${cur.x} (mod ${pp})`,
          },
          {
            label: "New y",
            description: `y\u2083 = s\u00b7(x \u2212 x\u2083) \u2212 y mod p`,
            substitution: `= ${s}\u00b7(${base.x} \u2212 ${cur.x}) \u2212 ${base.y}`,
            intermediate: `= ${s}\u00b7${mod(base.x - cur.x)} \u2212 ${base.y}`,
            result: `\u2261 ${cur.y} (mod ${pp})`,
          },
        ],
      };
    }

    // Addition: k·base = prev + base
    const dx = mod(base.x - prev.x);
    const dy = mod(base.y - prev.y);
    try {
      const dxInv = curve.modInverse(dx);
      const s = mod(dy * dxInv);
      return {
        header: `${k}\u00b7${baseName} = ${prevName} + ${baseName} = (${prev.x}, ${prev.y}) + (${base.x}, ${base.y})`,
        computation: [
          {
            label: "Slope (secant)",
            description: `s = (y${baseName} \u2212 y${prevName}) / (x${baseName} \u2212 x${prevName}) mod p`,
            substitution: `= (${base.y} \u2212 ${prev.y}) \u00b7 (${base.x} \u2212 ${prev.x})\u207b\u00b9`,
            intermediate: `= ${dy} \u00b7 ${dx}\u207b\u00b9 = ${dy} \u00b7 ${dxInv}`,
            result: `\u2261 ${s} (mod ${pp})`,
          },
          {
            label: "New x",
            description: `x\u2083 = s\u00b2 \u2212 x${prevName} \u2212 x${baseName} mod p`,
            substitution: `= ${s}\u00b2 \u2212 ${prev.x} \u2212 ${base.x}`,
            intermediate: `= ${s * s} \u2212 ${prev.x + base.x}`,
            result: `\u2261 ${cur.x} (mod ${pp})`,
          },
          {
            label: "New y",
            description: `y\u2083 = s\u00b7(x${prevName} \u2212 x\u2083) \u2212 y${prevName} mod p`,
            substitution: `= ${s}\u00b7(${prev.x} \u2212 ${cur.x}) \u2212 ${prev.y}`,
            intermediate: `= ${s}\u00b7${mod(prev.x - cur.x)} \u2212 ${prev.y}`,
            result: `\u2261 ${cur.y} (mod ${pp})`,
          },
        ],
      };
    } catch {
      return { header: `${k}\u00b7${baseName} = ${prevName} + ${baseName} (vertical line \u2192 O)` };
    }
  }

  function makeAliceSteps(a: number): StepData[] {
    const steps: StepData[] = [];
    const fullTrail = buildTrail(curve, G, a);
    for (let k = 1; k <= a; k++) {
      const partial = fullTrail.slice(0, k);
      const isLast = k === a;
      const prevName = k > 1 ? `${k - 1}G` : "G";
      const step = computeStep(k, G, "G", prevName, fullTrail);
      steps.push({
        label: `Alice: ${k}G`,
        explanation: isLast ? `A = ${a}G = (${partial[k - 1].x}, ${partial[k - 1].y})` : `${k}G = (${partial[k - 1].x}, ${partial[k - 1].y})`,
        computation: step.computation,
        gradientPaths: [{
          points: partial,
          color: ALICE_PATH,
          endLabel: isLast ? "A" : undefined,
          endColor: isLast ? ALICE_END : undefined,
          endSize: isLast ? 9 : undefined,
        }],
        landmarks: [{ point: G, color: G_LABEL, label: "G" }],
      });
    }
    return steps;
  }

  function makeBobSteps(b: number): StepData[] {
    const aLandmarks: LabeledPoint[] = alicePub ? [{ point: G, color: G_LABEL, label: "G" }, { point: alicePub, color: ALICE_END, label: "A" }] : [{ point: G, color: G_LABEL, label: "G" }];
    const fullTrail = buildTrail(curve, G, b);
    const steps: StepData[] = [];
    for (let k = 1; k <= b; k++) {
      const partial = fullTrail.slice(0, k);
      const isLast = k === b;
      const prevName = k > 1 ? `${k - 1}G` : "G";
      const bStep = computeStep(k, G, "G", prevName, fullTrail);
      steps.push({
        label: `Bob: ${k}G`,
        explanation: isLast ? `B = ${b}G = (${partial[k - 1].x}, ${partial[k - 1].y})` : `${k}G = (${partial[k - 1].x}, ${partial[k - 1].y})`,
        computation: bStep.computation,
        gradientPaths: [{
          points: partial,
          color: BOB_PATH,
          endLabel: isLast ? "B" : undefined,
          endColor: isLast ? BOB_END : undefined,
          endSize: isLast ? 9 : undefined,
        }],
        landmarks: aLandmarks,
      });
    }
    return steps;
  }

  function makeSharedSteps(): StepData[] {
    if (!aliceSecret || !bobSecret || !alicePub || !bobPub) return [];
    const a = aliceSecret;
    const b = bobSecret;
    const pp = curve.p;
    const mod = (n: number) => ((n % pp) + pp) % pp;

    const commonLen = Math.min(a, b);
    const maxLen = Math.max(a, b);
    const totalSteps = a;

    const allLandmarks: LabeledPoint[] = [
      { point: G, color: G_LABEL, label: "G" },
      { point: alicePub, color: ALICE_END, label: "A" },
      { point: bobPub, color: BOB_END, label: "B" },
    ];

    const fullTrail = buildTrail(curve, bobPub, totalSteps);
    const steps: StepData[] = [];
    for (let k = 1; k <= totalSteps; k++) {
      const partial = fullTrail.slice(0, k);
      const isLast = k === totalSteps;
      const current = partial[k - 1];

      // Build colored segments
      const paths: GradientPath[] = [];
      const commonEnd = Math.min(k, commonLen);
      if (commonEnd >= 1) {
        paths.push({ points: partial.slice(0, commonEnd), color: COMMON_PATH });
      }
      if (k > commonLen) {
        const divEnd = Math.min(k, maxLen);
        paths.push({ points: partial.slice(Math.max(0, commonLen - 1), divEnd), color: DIVERGE_PATH, startIndex: commonLen + 1 });
      }
      if (k > maxLen) {
        paths.push({ points: partial.slice(Math.max(0, maxLen - 1), k), color: EXTRA_PATH, startIndex: maxLen + 1 });
      }
      if (isLast && paths.length > 0) {
        const lastPath = paths[paths.length - 1];
        lastPath.endLabel = "S";
        lastPath.endColor = S_END;
        lastPath.endSize = 10;
      }

      const prevName = k > 1 ? `${k - 1}\u00b7B` : "B";
      const sStep = computeStep(k, bobPub, "B", prevName, fullTrail);
      steps.push({
        label: isLast ? `S = ${a}\u00b7B` : `${k}\u00b7B`,
        explanation: isLast
          ? `S = ${a}\u00b7B = ${a}\u00b7${b}G = ${a * b}G = (${current.x}, ${current.y})`
          : `${k}\u00b7B = (${current.x}, ${current.y})`,
        computation: sStep.computation,
        gradientPaths: paths,
        landmarks: allLandmarks,
      });
    }
    return steps;
  }

  function handleAliceConfirm() {
    const v = parseInt(aliceInput);
    if (!v || v < 1 || v >= order) { setError(`Secret must be between 1 and ${order - 1}`); return; }
    setError("");
    onSetAliceSecret(v);
    onSetResult(curve.scalarMultiply(G, v), makeAliceSteps(v));
    onAdvance();
  }

  function handleAliceSends() {
    onSetResult(null, makeAliceSteps(aliceSecret!));
    onAdvance();
  }

  function handleBobConfirm() {
    const v = parseInt(bobInput);
    if (!v || v < 1 || v >= order) { setError(`Secret must be between 1 and ${order - 1}`); return; }
    setError("");
    onSetBobSecret(v);
    // Generate bob steps (not alice steps — alice trail disappears, only A landmark stays)
    const bTrail = buildTrail(curve, G, v);
    const B = bTrail[bTrail.length - 1];
    const bobSteps = makeBobSteps(v);
    // Override: the last bob step needs the B result
    onSetResult(B, bobSteps);
    onAdvance();
  }

  function handleBobSends() {
    onSetResult(null, makeBobSteps(bobSecret!));
    onAdvance();
  }

  function handleComputeShared() {
    const S = curve.scalarMultiply(bobPub!, aliceSecret!);
    onSetResult(S, makeSharedSteps());
    onAdvance();
  }

  const phases: ECDHPhase[] = ["alice-secret", "alice-sends", "bob-secret", "bob-sends", "shared", "done"];
  const currentIdx = phases.indexOf(phase);

  return (
    <div>
      <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", marginBottom: "8px" }}>
        G = ({G.x}, {G.y}), order = {order}
      </div>

      <div className="ecdh-progress">
        {phases.map((ph, i) => (
          <div key={ph} className={`ecdh-progress-dot ${i <= currentIdx ? "active" : ""} ${ph.startsWith("alice") ? "alice" : ph.startsWith("bob") ? "bob" : "shared"}`} />
        ))}
      </div>

      {/* Persistent secret values once entered */}
      {(aliceSecret !== null || bobSecret !== null) && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "8px", fontSize: "12px" }}>
          {aliceSecret !== null && (
            <span style={{ color: "#60A5FA", fontFamily: "var(--md-sys-typescale-code-font)" }}>
              a = {aliceSecret}
            </span>
          )}
          {bobSecret !== null && (
            <span style={{ color: "#F472B6", fontFamily: "var(--md-sys-typescale-code-font)" }}>
              b = {bobSecret}
            </span>
          )}
        </div>
      )}

      {phase === "alice-secret" && (
        <div>
          <div className="ecdh-phase-label alice">Alice chooses a secret</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
            <input type="number" min={1} max={order - 1} value={aliceInput} onChange={(e) => setAliceInput(e.target.value)} placeholder={`1..${order - 1}`} style={{ flex: 1 }} />
            <button className="op-btn primary" onClick={handleAliceConfirm}>Confirm</button>
          </div>
          {!aliceInput && <div className="ecdh-error">Alice must enter a secret to continue.</div>}
          {error && <div className="ecdh-error">{error}</div>}
        </div>
      )}

      {phase === "alice-sends" && (
        <div>
          <div className="ecdh-phase-label alice">Alice sends A = {aliceSecret}G</div>
          <p style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Navigate with ◀▶ below to trace the path step by step.
          </p>
          <button className="op-btn" onClick={handleAliceSends} style={{ width: "100%" }}>Send A to Bob →</button>
        </div>
      )}

      {phase === "bob-secret" && (
        <div>
          <div className="ecdh-phase-label bob">Bob chooses a secret</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
            <input type="number" min={1} max={order - 1} value={bobInput} onChange={(e) => setBobInput(e.target.value)} placeholder={`1..${order - 1}`} style={{ flex: 1 }} />
            <button className="op-btn primary" onClick={handleBobConfirm}>Confirm</button>
          </div>
          {!bobInput && <div className="ecdh-error">Bob must enter a secret to continue.</div>}
          {error && <div className="ecdh-error">{error}</div>}
        </div>
      )}

      {phase === "bob-sends" && (
        <div>
          <div className="ecdh-phase-label bob">Bob sends B = {bobSecret}G</div>
          <p style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Alice's trail is gone. Her point A stays. Navigate Bob's path with ◀▶.
          </p>
          <button className="op-btn" onClick={handleBobSends} style={{ width: "100%" }}>Send B to Alice →</button>
        </div>
      )}

      {phase === "shared" && (
        <div>
          <div className="ecdh-phase-label shared">Compute shared secret</div>
          <p style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Alice computes {aliceSecret}·B. Three colors show the structure.
          </p>
          <button className="op-btn primary" onClick={handleComputeShared} style={{ width: "100%" }}>Trace shared computation</button>
        </div>
      )}

      {phase === "done" && (
        <div>
          <div className="ecdh-phase-label shared">Exchange complete! ✔</div>
          <p style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Navigate with ◀▶ to see each step of {aliceSecret}·B building up.
          </p>
          <button className="op-btn" onClick={onReset} style={{ width: "100%" }}>Reset</button>
        </div>
      )}

      {/* Legend */}
      {phase !== "idle" && (
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7DD3C0" }} /> G
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>
            <span style={{ width: "12px", borderTop: "2px dashed #60A5FA" }} />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#60A5FA" }} /> A
          </span>
          {(bobSecret !== null || phase === "bob-secret") && (
            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>
              <span style={{ width: "12px", borderTop: "2px dashed #F472B6" }} />
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F472B6" }} /> B
            </span>
          )}
          {(phase === "shared" || phase === "done") && (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>
                <span style={{ width: "12px", borderTop: "2px dashed #7DD3C0" }} /> common
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>
                <span style={{ width: "12px", borderTop: "2px dashed #FB923C" }} /> diverge
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>
                <span style={{ width: "12px", borderTop: "2px dashed #A78BFA" }} /> extra
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FACC15" }} /> S
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
