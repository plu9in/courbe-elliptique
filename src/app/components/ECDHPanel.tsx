import { useState } from "react";
import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";
import type { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { ECDHPhase, StepData, GradientPath } from "../hooks/useCurveState.js";

// Canvas rendering colors
const G_COLOR = "rgb(125, 211, 192)";       // teal — shared start
const ALICE_END = "rgb(96, 165, 250)";       // blue — Alice's destination A
const ALICE_LINE = "rgb(96, 165, 250)";      // blue — Alice's path line
const BOB_END = "rgb(244, 114, 182)";        // pink — Bob's destination B
const BOB_LINE = "rgb(244, 114, 182)";       // pink — Bob's path line
const SHARED_LINE = "rgb(167, 139, 250)";    // violet — shared secret path
const S_COLOR = "rgb(250, 204, 21)";         // gold — shared secret S

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

  // Build gradient path for Alice: G → 2G → ... → aG with teal→blue gradient
  function alicePath(): GradientPath {
    return {
      points: [G, ...buildTrail(curve, G, aliceSecret!)],
      startColor: G_COLOR,
      endColor: ALICE_END,
      lineColor: ALICE_LINE,
    };
  }

  // Build gradient path for Bob: G → 2G → ... → bG with teal→pink gradient
  function bobPath(): GradientPath {
    return {
      points: [G, ...buildTrail(curve, G, bobSecret!)],
      startColor: G_COLOR,
      endColor: BOB_END,
      lineColor: BOB_LINE,
    };
  }

  function handleAliceConfirm() {
    const v = parseInt(aliceInput);
    if (!v || v < 1 || v >= order) {
      setError(`Alice must choose a secret between 1 and ${order - 1}`);
      return;
    }
    setError("");
    onSetAliceSecret(v);
    const trail = buildTrail(curve, G, v);
    const A = trail[trail.length - 1];
    onSetResult(A, [{
      label: `Alice: secret a = ${v}`,
      explanation: `Alice computes A = ${v}G = (${A.x}, ${A.y}). Each numbered point shows kG.`,
      formula: `A = a \\cdot G = ${v} \\cdot G`,
      gradientPaths: [{
        points: [G, ...trail],
        startColor: G_COLOR,
        endColor: ALICE_END,
        lineColor: ALICE_LINE,
      }],
    }]);
    onAdvance();
  }

  function handleAliceSends() {
    const A = alicePub!;
    onSetResult(null, [{
      label: "Alice sends A to Bob",
      explanation: `A = (${A.x}, ${A.y}) is sent publicly. The blue path shows G → aG.`,
      formula: `\\text{Public: } A \\quad \\text{Secret: } a = ?`,
      gradientPaths: [alicePath()],
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
    const trail = buildTrail(curve, G, v);
    const B = trail[trail.length - 1];
    onSetResult(B, [{
      label: `Bob: secret b = ${v}`,
      explanation: `Bob computes B = ${v}G = (${B.x}, ${B.y}). Blue = Alice's path, Pink = Bob's path.`,
      formula: `B = b \\cdot G = ${v} \\cdot G`,
      gradientPaths: [alicePath(), {
        points: [G, ...trail],
        startColor: G_COLOR,
        endColor: BOB_END,
        lineColor: BOB_LINE,
      }],
    }]);
    onAdvance();
  }

  function handleBobSends() {
    const B = bobPub!;
    onSetResult(null, [{
      label: "Bob sends B to Alice",
      explanation: `B = (${B.x}, ${B.y}) sent publicly. Eavesdropper sees A and B but cannot compute the secret.`,
      formula: `\\text{Eavesdropper: } A, B \\text{ visible. } a \\cdot B = ? \\text{ (DLP)}`,
      gradientPaths: [alicePath(), bobPath()],
    }]);
    onAdvance();
  }

  function handleComputeShared() {
    const a = aliceSecret!;
    const b = bobSecret!;
    const A = alicePub!;
    const B = bobPub!;
    const S = curve.scalarMultiply(B, a);

    // Alice: B → 2B → ... → aB (violet path, blue→gold gradient)
    const aliceSharedTrail = buildTrail(curve, B, a);
    // Bob: A → 2A → ... → bA (violet path, pink→gold gradient)
    const bobSharedTrail = buildTrail(curve, A, b);

    const paths: GradientPath[] = [
      // Keep the original Alice and Bob paths visible
      alicePath(),
      bobPath(),
      // Alice's shared computation: B → aB
      {
        points: [B, ...aliceSharedTrail],
        startColor: ALICE_END,
        endColor: S_COLOR,
        lineColor: SHARED_LINE,
      },
      // Bob's shared computation: A → bA
      {
        points: [A, ...bobSharedTrail],
        startColor: BOB_END,
        endColor: S_COLOR,
        lineColor: SHARED_LINE,
      },
    ];

    onSetResult(S, [{
      label: "Shared secret!",
      explanation: S
        ? `Alice: ${a}\u00b7B = (${S.x}, ${S.y}). Bob: ${b}\u00b7A = (${S.x}, ${S.y}). Gold point = shared secret!`
        : "Shared secret = O",
      formula: `a \\cdot B = ${a} \\cdot ${b}G = ${b} \\cdot ${a}G = b \\cdot A = ${a * b}G`,
      gradientPaths: paths,
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

      {phase === "alice-sends" && (
        <div>
          <div className="ecdh-phase-label alice">Alice sends A = {aliceSecret}G</div>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Blue numbered path shows G → aG. Each dot is kG with its step number.
          </div>
          <button className="op-btn" onClick={handleAliceSends} style={{ width: "100%" }}>Send A to Bob →</button>
        </div>
      )}

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

      {phase === "bob-sends" && (
        <div>
          <div className="ecdh-phase-label bob">Bob sends B = {bobSecret}G</div>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Blue path = Alice. Pink path = Bob. Common prefix shows shared multiples of G.
          </div>
          <button className="op-btn" onClick={handleBobSends} style={{ width: "100%" }}>Send B to Alice →</button>
        </div>
      )}

      {phase === "shared" && (
        <div>
          <div className="ecdh-phase-label shared">Compute shared secret</div>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Violet paths: Alice computes {aliceSecret}·B, Bob computes {bobSecret}·A. Gold destination = shared secret.
          </div>
          <button className="op-btn primary" onClick={handleComputeShared} style={{ width: "100%" }}>Compute shared secret</button>
        </div>
      )}

      {phase === "done" && (
        <div>
          <div className="ecdh-phase-label shared">Exchange complete! ✔</div>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", margin: "6px 0" }}>
            Blue = Alice's G→A. Pink = Bob's G→B. Violet = both paths to S. Gold = shared secret.
          </div>
          <button className="op-btn" onClick={onReset} style={{ width: "100%" }}>Reset</button>
        </div>
      )}

      {/* Color legend */}
      {phase !== "idle" && (
        <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7DD3C0" }} /> G
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
            <span style={{ width: "14px", height: "0", borderTop: "2px dashed #60A5FA" }} />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#60A5FA" }} /> Alice
          </span>
          {(bobSecret !== null || phase === "bob-secret") && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
              <span style={{ width: "14px", height: "0", borderTop: "2px dashed #F472B6" }} />
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F472B6" }} /> Bob
            </span>
          )}
          {(phase === "shared" || phase === "done") && (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
                <span style={{ width: "14px", height: "0", borderTop: "2px dashed #A78BFA" }} /> shared path
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FACC15" }} /> S
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
