import { useState } from "react";
import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";
import type { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { ECDHPhase, StepData } from "../hooks/useCurveState.js";

const ALICE_COLOR = "rgba(255, 209, 102, 1)";
const BOB_COLOR = "rgba(255, 123, 107, 1)";
const SHARED_COLOR = "rgba(6, 214, 160, 1)";

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
          Interactive ECDH key exchange. Alice and Bob agree on a shared secret
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
  const alicePub = aliceSecret !== null ? curve.scalarMultiply(G, aliceSecret) : null;
  const bobPub = bobSecret !== null ? curve.scalarMultiply(G, bobSecret) : null;

  function handleAliceConfirm() {
    const v = parseInt(aliceInput);
    if (!v || v < 1 || v >= order) {
      setError(`Alice must choose a secret between 1 and ${order - 1}`);
      return;
    }
    setError("");
    onSetAliceSecret(v);
    const aliceTrail = buildTrail(curve, G, v);
    const A = curve.scalarMultiply(G, v)!;
    onSetResult(A, [{
      label: `Alice: secret a = ${v}`,
      explanation: `Alice computes A = ${v}G = (${A.x}, ${A.y})`,
      formula: `A = a \\cdot G = ${v} \\cdot G`,
      trails: [{ points: aliceTrail, color: ALICE_COLOR, label: "Alice: G \u2192 aG" }],
      points: [
        { point: G, color: "#7DD3C0", label: "G" },
        { point: A, color: "#FFD166", label: `A = ${v}G` },
      ],
    }]);
    onAdvance();
  }

  function handleAliceSends() {
    const A = alicePub!;
    const aliceTrail = buildTrail(curve, G, aliceSecret!);
    onSetResult(null, [{
      label: "Alice sends A to Bob",
      explanation: `A = (${A.x}, ${A.y}) is sent publicly. The secret a = ${aliceSecret} stays hidden.`,
      formula: `\\text{Public: } A = (${A.x}, ${A.y}) \\quad \\text{Secret: } a = ?`,
      trails: [{ points: aliceTrail, color: ALICE_COLOR, label: "Alice" }],
      points: [
        { point: G, color: "#7DD3C0", label: "G" },
        { point: A, color: "#FFD166", label: "A (public)" },
      ],
    }]);
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
    const aliceTrail = buildTrail(curve, G, aliceSecret!);
    const bobTrail = buildTrail(curve, G, v);
    const A = alicePub!;
    const B = curve.scalarMultiply(G, v)!;
    onSetResult(B, [{
      label: `Bob: secret b = ${v}`,
      explanation: `Bob computes B = ${v}G = (${B.x}, ${B.y})`,
      formula: `B = b \\cdot G = ${v} \\cdot G`,
      trails: [
        { points: aliceTrail, color: ALICE_COLOR, label: "Alice: G \u2192 aG" },
        { points: bobTrail, color: BOB_COLOR, label: "Bob: G \u2192 bG" },
      ],
      points: [
        { point: G, color: "#7DD3C0", label: "G" },
        { point: A, color: "#FFD166", label: "A (Alice)" },
        { point: B, color: "#FF7B6B", label: `B = ${v}G` },
      ],
    }]);
    onAdvance();
  }

  function handleBobSends() {
    const A = alicePub!;
    const B = bobPub!;
    const aliceTrail = buildTrail(curve, G, aliceSecret!);
    const bobTrail = buildTrail(curve, G, bobSecret!);
    onSetResult(null, [{
      label: "Bob sends B to Alice",
      explanation: `B = (${B.x}, ${B.y}) is sent publicly. Eavesdropper sees A and B but cannot compute the shared secret.`,
      formula: `\\text{Eavesdropper sees } A, B \\text{ but } a \\cdot B = ? \\text{ (DLP)}`,
      trails: [
        { points: aliceTrail, color: ALICE_COLOR, label: "Alice" },
        { points: bobTrail, color: BOB_COLOR, label: "Bob" },
      ],
      points: [
        { point: G, color: "#7DD3C0", label: "G" },
        { point: A, color: "#FFD166", label: "A (public)" },
        { point: B, color: "#FF7B6B", label: "B (public)" },
      ],
    }]);
    onAdvance();
  }

  function handleComputeShared() {
    const a = aliceSecret!;
    const b = bobSecret!;
    const A = alicePub!;
    const B = bobPub!;
    // Alice computes a·B, Bob computes b·A
    const aliceSharedTrail = buildTrail(curve, B, a);
    const bobSharedTrail = buildTrail(curve, A, b);
    const S = curve.scalarMultiply(B, a);

    onSetResult(S, [{
      label: "Shared secret computed!",
      explanation: S
        ? `Alice: ${a}\u00b7B = (${S.x}, ${S.y}). Bob: ${b}\u00b7A = (${S.x}, ${S.y}). Same point! \u2714`
        : "Shared secret = O (point at infinity)",
      formula: `a \\cdot B = ${a} \\cdot ${b}G = ${b} \\cdot ${a}G = b \\cdot A = ${a * b}G`,
      trails: [
        { points: aliceSharedTrail, color: ALICE_COLOR, label: `Alice: B \u2192 ${a}B` },
        { points: bobSharedTrail, color: BOB_COLOR, label: `Bob: A \u2192 ${b}A` },
      ],
      points: [
        { point: A, color: "#FFD166", label: "A" },
        { point: B, color: "#FF7B6B", label: "B" },
        ...(S ? [{ point: S, color: "#06D6A0", label: `S = ${a * b}G` }] : []),
      ],
    }]);
    onAdvance();
  }

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

      {/* Phase: Alice secret */}
      {phase === "alice-secret" && (
        <div>
          <div className="ecdh-phase-label alice">Alice chooses a secret</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
            <input type="number" min={1} max={order - 1} value={aliceInput} onChange={(e) => setAliceInput(e.target.value)} placeholder={`1 to ${order - 1}`} style={{ flex: 1 }} />
            <button className="op-btn primary" onClick={handleAliceConfirm}>Confirm</button>
          </div>
          {!aliceInput && <div className="ecdh-error">Alice must enter a secret number to continue.</div>}
          {error && <div className="ecdh-error">{error}</div>}
        </div>
      )}

      {/* Phase: Alice sends */}
      {phase === "alice-sends" && (
        <div>
          <div className="ecdh-phase-label alice">Alice sends A = {aliceSecret}G to Bob</div>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            A = ({alicePub?.x}, {alicePub?.y}) is now public. The amber trail shows the computation path G \u2192 2G \u2192 ... \u2192 {aliceSecret}G.
          </div>
          <button className="op-btn" onClick={handleAliceSends} style={{ width: "100%" }}>Send A to Bob \u2192</button>
        </div>
      )}

      {/* Phase: Bob secret */}
      {phase === "bob-secret" && (
        <div>
          <div className="ecdh-phase-label bob">Bob chooses a secret</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "8px" }}>
            <input type="number" min={1} max={order - 1} value={bobInput} onChange={(e) => setBobInput(e.target.value)} placeholder={`1 to ${order - 1}`} style={{ flex: 1 }} />
            <button className="op-btn primary" onClick={handleBobConfirm}>Confirm</button>
          </div>
          {!bobInput && <div className="ecdh-error">Bob must enter a secret number to continue.</div>}
          {error && <div className="ecdh-error">{error}</div>}
        </div>
      )}

      {/* Phase: Bob sends */}
      {phase === "bob-sends" && (
        <div>
          <div className="ecdh-phase-label bob">Bob sends B = {bobSecret}G to Alice</div>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            B = ({bobPub?.x}, {bobPub?.y}) is now public. Both trails are visible: amber (Alice) and coral (Bob).
          </div>
          <button className="op-btn" onClick={handleBobSends} style={{ width: "100%" }}>Send B to Alice \u2192</button>
        </div>
      )}

      {/* Phase: Shared */}
      {phase === "shared" && (
        <div>
          <div className="ecdh-phase-label shared">Compute shared secret</div>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Alice computes {aliceSecret}\u00b7B (amber trail from B). Bob computes {bobSecret}\u00b7A (coral trail from A). Both reach the same point.
          </div>
          <button className="op-btn primary" onClick={handleComputeShared} style={{ width: "100%" }}>Compute shared secret</button>
        </div>
      )}

      {/* Phase: Done */}
      {phase === "done" && (
        <div>
          <div className="ecdh-phase-label shared">Exchange complete! \u2714</div>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Alice (a={aliceSecret}) and Bob (b={bobSecret}) both computed S = {aliceSecret! * bobSecret!}G.
            The amber trail shows Alice's path (B \u2192 aB), the coral trail shows Bob's path (A \u2192 bA).
            An eavesdropper saw A and B but cannot find S without solving the DLP.
          </div>
          <button className="op-btn" onClick={onReset} style={{ width: "100%" }}>Reset</button>
        </div>
      )}

      {/* Legend */}
      {phase !== "idle" && (
        <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#FFD166" }}>
            <span style={{ width: "16px", height: "0", borderTop: "2px dashed #FFD166", display: "inline-block" }} /> Alice
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#FF7B6B" }}>
            <span style={{ width: "16px", height: "0", borderTop: "2px dashed #FF7B6B", display: "inline-block" }} /> Bob
          </span>
          {(phase === "shared" || phase === "done") && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#06D6A0" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#06D6A0", display: "inline-block" }} /> Shared
            </span>
          )}
        </div>
      )}
    </div>
  );
}
