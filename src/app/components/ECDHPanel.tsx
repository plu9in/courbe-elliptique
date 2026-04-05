import { useState } from "react";
import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";
import type { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { ECDHPhase, StepData, LabeledPoint } from "../hooks/useCurveState.js";

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
          Interactive ECDH key exchange. Alice and Bob will agree on a shared secret
          step by step. <strong style={{ color: "var(--md-sys-color-on-surface)" }}>Select a base point G first.</strong>
        </div>
        <button
          className="op-btn primary"
          disabled={!basePoint}
          onClick={() => { onStart(); setAliceInput(""); setBobInput(""); setError(""); }}
          style={{ width: "100%" }}
        >
          Start ECDH Exchange
        </button>
      </div>
    );
  }

  const G = basePoint!;
  const order = curve.pointOrder(G);

  // Compute derived values
  const alicePub = aliceSecret !== null ? curve.scalarMultiply(G, aliceSecret) : null;
  const bobPub = bobSecret !== null ? curve.scalarMultiply(G, bobSecret) : null;
  const sharedAlice = aliceSecret !== null && bobPub ? curve.scalarMultiply(bobPub, aliceSecret) : null;
  const sharedBob = bobSecret !== null && alicePub ? curve.scalarMultiply(alicePub, bobSecret) : null;

  // Build orbit trails
  const aliceTrail: CurvePoint[] = [];
  if (aliceSecret !== null) {
    for (let i = 1; i <= aliceSecret; i++) {
      const pt = curve.scalarMultiply(G, i);
      if (pt) aliceTrail.push(pt);
    }
  }

  const bobTrail: CurvePoint[] = [];
  if (bobSecret !== null) {
    for (let i = 1; i <= bobSecret; i++) {
      const pt = curve.scalarMultiply(G, i);
      if (pt) bobTrail.push(pt);
    }
  }

  function handleAliceConfirm() {
    const v = parseInt(aliceInput);
    if (!v || v < 1 || v >= order) {
      setError(`Alice must choose a secret between 1 and ${order - 1}`);
      return;
    }
    setError("");
    onSetAliceSecret(v);
    // Build steps for this phase
    const trail: CurvePoint[] = [];
    for (let i = 1; i <= v; i++) {
      const pt = curve.scalarMultiply(G, i);
      if (pt) trail.push(pt);
    }
    const A = curve.scalarMultiply(G, v)!;
    const steps: StepData[] = [{
      label: `Alice: secret a = ${v}`,
      explanation: `Alice picks a = ${v} (private). Computes A = ${v}G = (${A.x}, ${A.y}).`,
      formula: `A = a \\cdot G = ${v} \\cdot G`,
      trail,
      points: [{ point: A, color: "#FFD166", label: `A = ${v}G` }],
    }];
    onSetResult(A, steps);
    onAdvance();
  }

  function handleBobConfirm() {
    const v = parseInt(bobInput);
    if (!v || v < 1 || v >= order) {
      setError(`Bob must choose a secret between 1 and ${order - 1}`);
      return;
    }
    setError("");
    onSetBobSecret(v);
    const trail: CurvePoint[] = [];
    for (let i = 1; i <= v; i++) {
      const pt = curve.scalarMultiply(G, i);
      if (pt) trail.push(pt);
    }
    const B = curve.scalarMultiply(G, v)!;
    const A = alicePub!;
    const steps: StepData[] = [{
      label: `Bob: secret b = ${v}`,
      explanation: `Bob picks b = ${v} (private). Computes B = ${v}G = (${B.x}, ${B.y}).`,
      formula: `B = b \\cdot G = ${v} \\cdot G`,
      trail,
      points: [
        { point: A, color: "#FFD166", label: "A (Alice)" },
        { point: B, color: "#FF7B6B", label: `B = ${v}G` },
      ],
    }];
    onSetResult(B, steps);
    onAdvance();
  }

  function handleAdvanceAliceSends() {
    const A = alicePub!;
    const steps: StepData[] = [{
      label: "Alice sends A to Bob",
      explanation: `A = (${A.x}, ${A.y}) is sent publicly. An eavesdropper sees A but cannot find a (DLP).`,
      formula: `\\text{Public: } A = (${A.x}, ${A.y}) \\quad \\text{Secret: } a = ?`,
      trail: aliceTrail,
      points: [{ point: A, color: "#FFD166", label: "A (public)" }],
    }];
    onSetResult(null, steps);
    onAdvance();
  }

  function handleAdvanceBobSends() {
    const A = alicePub!;
    const B = bobPub!;
    const steps: StepData[] = [{
      label: "Bob sends B to Alice",
      explanation: `B = (${B.x}, ${B.y}) is sent publicly. Eavesdropper sees A and B but cannot compute the shared secret.`,
      formula: `\\text{Public: } A, B \\quad \\text{Eavesdropper: } a \\cdot B = ? \\text{ (DLP)}`,
      trail: bobTrail,
      points: [
        { point: A, color: "#FFD166", label: "A (Alice)" },
        { point: B, color: "#FF7B6B", label: "B (Bob, public)" },
      ],
    }];
    onSetResult(null, steps);
    onAdvance();
  }

  function handleComputeShared() {
    const A = alicePub!;
    const B = bobPub!;
    const S = sharedAlice!;
    const a = aliceSecret!;
    const b = bobSecret!;
    const aliceSharedTrail: CurvePoint[] = [];
    for (let i = 1; i <= a; i++) {
      const pt = curve.scalarMultiply(B, i);
      if (pt) aliceSharedTrail.push(pt);
    }
    const points: LabeledPoint[] = [
      { point: A, color: "#FFD166", label: "A" },
      { point: B, color: "#FF7B6B", label: "B" },
    ];
    if (S) points.push({ point: S, color: "#06D6A0", label: `S = ${a * b}G` });

    const steps: StepData[] = [{
      label: "Shared secret!",
      explanation: S
        ? `Alice: ${a}\u00b7B = (${S.x}, ${S.y}). Bob: ${b}\u00b7A = (${sharedBob?.x}, ${sharedBob?.y}). Same point! \u2714`
        : "Shared secret = O (point at infinity)",
      formula: `a \\cdot B = ${a} \\cdot ${b}G = ${b} \\cdot ${a}G = b \\cdot A = ${a * b}G`,
      trail: aliceSharedTrail,
      points,
    }];
    onSetResult(S, steps);
    onAdvance();
  }

  const phaseUI: Record<ECDHPhase, () => JSX.Element> = {
    "idle": () => <></>,
    "choose-curve": () => <></>,
    "alice-secret": () => (
      <div>
        <div className="ecdh-phase-label alice">Alice chooses a secret</div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
          <input
            type="number" min={1} max={order - 1} value={aliceInput}
            onChange={(e) => setAliceInput(e.target.value)}
            placeholder={`1 to ${order - 1}`}
            style={{ flex: 1 }}
          />
          <button className="op-btn primary" onClick={handleAliceConfirm}>Confirm</button>
        </div>
        {!aliceInput && <div className="ecdh-error">Alice must enter a secret number to continue.</div>}
        {error && <div className="ecdh-error">{error}</div>}
      </div>
    ),
    "alice-sends": () => (
      <div>
        <div className="ecdh-phase-label alice">Alice sends A = {aliceSecret}G to Bob</div>
        <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
          A = ({alicePub?.x}, {alicePub?.y}) is now public. The secret a = {aliceSecret} remains hidden.
        </div>
        <button className="op-btn" onClick={handleAdvanceAliceSends} style={{ width: "100%" }}>Send A to Bob →</button>
      </div>
    ),
    "bob-secret": () => (
      <div>
        <div className="ecdh-phase-label bob">Bob chooses a secret</div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
          <input
            type="number" min={1} max={order - 1} value={bobInput}
            onChange={(e) => setBobInput(e.target.value)}
            placeholder={`1 to ${order - 1}`}
            style={{ flex: 1 }}
          />
          <button className="op-btn primary" onClick={handleBobConfirm}>Confirm</button>
        </div>
        {!bobInput && <div className="ecdh-error">Bob must enter a secret number to continue.</div>}
        {error && <div className="ecdh-error">{error}</div>}
      </div>
    ),
    "bob-sends": () => (
      <div>
        <div className="ecdh-phase-label bob">Bob sends B = {bobSecret}G to Alice</div>
        <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
          B = ({bobPub?.x}, {bobPub?.y}) is now public. The secret b = {bobSecret} remains hidden.
        </div>
        <button className="op-btn" onClick={handleAdvanceBobSends} style={{ width: "100%" }}>Send B to Alice →</button>
      </div>
    ),
    "shared": () => (
      <div>
        <div className="ecdh-phase-label shared">Compute shared secret</div>
        <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
          Alice computes {aliceSecret}\u00b7B. Bob computes {bobSecret}\u00b7A. Both get the same point.
        </div>
        <button className="op-btn primary" onClick={handleComputeShared} style={{ width: "100%" }}>Compute shared secret</button>
      </div>
    ),
    "done": () => (
      <div>
        <div className="ecdh-phase-label shared">Exchange complete! \u2714</div>
        <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
          Alice (a={aliceSecret}) and Bob (b={bobSecret}) share the same secret point
          {sharedAlice ? ` (${sharedAlice.x}, ${sharedAlice.y})` : " O"}.
          An eavesdropper saw A and B but cannot compute the secret without solving the DLP.
        </div>
        <button className="op-btn" onClick={onReset} style={{ width: "100%" }}>Reset</button>
      </div>
    ),
  };

  // Progress indicator
  const phases: ECDHPhase[] = ["alice-secret", "alice-sends", "bob-secret", "bob-sends", "shared", "done"];
  const currentIdx = phases.indexOf(phase);

  return (
    <div>
      <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", marginBottom: "8px" }}>
        G = ({G.x}, {G.y}), order = {order}
      </div>

      {/* Progress bar */}
      <div className="ecdh-progress">
        {phases.map((ph, i) => (
          <div key={ph} className={`ecdh-progress-dot ${i <= currentIdx ? "active" : ""} ${ph.startsWith("alice") ? "alice" : ph.startsWith("bob") ? "bob" : "shared"}`} />
        ))}
      </div>

      {phaseUI[phase]()}
    </div>
  );
}
