import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";
import type { FiniteFieldCurve } from "../../curve-visualization/domain/model/FiniteFieldCurve.js";
import type { FieldMode, ECDHPhase, StepData } from "../hooks/useCurveState.js";
import { CryptoPresets } from "./CryptoPresets.js";
import { CollapsibleCard } from "./CollapsibleCard.js";
import { ECDHPanel } from "./ECDHPanel.js";
import type { CryptoPreset } from "../data/cryptoPresets.js";

interface Props {
  mode: FieldMode;
  a: number;
  b: number;
  p: number;
  isSingular: boolean;
  isPrimeValid: boolean;
  selectedP: CurvePoint | null;
  selectedQ: CurvePoint | null;
  result: CurvePoint | null;
  scalarN: number;
  activePresetId: string | null;
  onSetA: (a: number) => void;
  onSetB: (b: number) => void;
  onSetP: (p: number) => void;
  onClearSelection: () => void;
  onAdd: () => void;
  onDouble: () => void;
  onInverse: () => void;
  onScalar: () => void;
  onOrbit: () => void;
  onDLP: () => void;
  onECDH: () => void;
  onECDSA: () => void;
  onDoubleAndAdd: () => void;
  onNonceReuse: () => void;
  onSchnorr: () => void;
  onPedersen: () => void;
  onSelectPreset: (preset: CryptoPreset) => void;
  onSetScalar: (n: number) => void;
  ecdhA: number;
  ecdhB: number;
  onSetEcdhA: (v: number) => void;
  onSetEcdhB: (v: number) => void;
  finiteCurve: FiniteFieldCurve;
  ecdhPhase: ECDHPhase;
  ecdhAliceSecret: number | null;
  ecdhBobSecret: number | null;
  onStartEcdh: () => void;
  onSetAliceSecret: (v: number) => void;
  onSetBobSecret: (v: number) => void;
  onEcdhAdvance: () => void;
  onEcdhReset: () => void;
  onSetResultDirect: (result: CurvePoint | null, steps: StepData[]) => void;
}

function formatCoord(pt: CurvePoint | null, mode: FieldMode): string {
  if (!pt) return "";
  if (mode === "real") return `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`;
  return `(${pt.x}, ${pt.y})`;
}

function EquationCard({ mode, a, b, p }: { mode: FieldMode; a: number; b: number; p: number }) {
  const eq = mode === "real"
    ? `y\u00B2 = x\u00B3 ${a >= 0 ? "+" : ""}${a}x ${b >= 0 ? "+" : ""}${b}`
    : `y\u00B2 \u2261 x\u00B3 ${a >= 0 ? "+" : ""}${a}x ${b >= 0 ? "+" : ""}${b} (mod ${p})`;
  return (
    <div className="card">
      <div style={{
        fontFamily: "var(--md-sys-typescale-code-font)",
        fontSize: "15px",
        color: "var(--md-sys-color-primary)",
        textAlign: "center",
        padding: "4px 0",
      }}>
        {eq}
      </div>
    </div>
  );
}

function ParametersCard({ mode, a, b, p, isSingular, isPrimeValid, onSetA, onSetB, onSetP }: {
  mode: FieldMode; a: number; b: number; p: number;
  isSingular: boolean; isPrimeValid: boolean;
  onSetA: (a: number) => void; onSetB: (b: number) => void; onSetP: (p: number) => void;
}) {
  return (
    <CollapsibleCard title="Parameters" defaultOpen={true}>
      <div className="param-row">
        <span className="param-label">a</span>
        <input type="range" min={-10} max={10} step={1} value={a} onChange={(e) => onSetA(Number(e.target.value))} />
        <span className="param-value">{a}</span>
      </div>
      <div className="param-row">
        <span className="param-label">b</span>
        <input type="range" min={-10} max={10} step={1} value={b} onChange={(e) => onSetB(Number(e.target.value))} />
        <span className="param-value">{b}</span>
      </div>
      {mode !== "real" && (
        <div className="param-row">
          <span className="param-label">p</span>
          <input type="number" min={2} max={97} value={p} onChange={(e) => onSetP(Number(e.target.value))} />
        </div>
      )}
      {isSingular && (
        <div className="warning-banner">Singular curve: 4a&sup3; + 27b&sup2; = 0. The discriminant must be non-zero.</div>
      )}
      {mode !== "real" && !isPrimeValid && (
        <div className="warning-banner">{p} is not a prime number. The field order must be prime.</div>
      )}
    </CollapsibleCard>
  );
}

function PointsCard({ mode, selectedP, selectedQ, result, onClearSelection }: {
  mode: FieldMode; selectedP: CurvePoint | null; selectedQ: CurvePoint | null;
  result: CurvePoint | null; onClearSelection: () => void;
}) {
  const pointCount = [selectedP, selectedQ, result].filter(Boolean).length;
  return (
    <CollapsibleCard title="Selected Points" defaultOpen={true} badge={pointCount > 0 ? <>{pointCount}</> : undefined}>
      <div className="points-list">
        {selectedP ? (
          <span className="point-chip p"><span className="dot" /> P = {formatCoord(selectedP, mode)}</span>
        ) : (
          <span className="no-selection">Click the curve to select P</span>
        )}
        {selectedQ && <span className="point-chip q"><span className="dot" /> Q = {formatCoord(selectedQ, mode)}</span>}
        {result && <span className="point-chip result"><span className="dot" /> R = {formatCoord(result, mode)}</span>}
      </div>
      {selectedP && (
        <button className="op-btn" style={{ marginTop: "8px", width: "100%" }} onClick={onClearSelection}>
          Clear Selection
        </button>
      )}
    </CollapsibleCard>
  );
}

export function Sidebar({
  mode, a, b, p, isSingular, isPrimeValid,
  selectedP, selectedQ, result, scalarN, activePresetId,
  onSetA, onSetB, onSetP, onClearSelection,
  onAdd, onDouble, onInverse, onScalar, onOrbit, onDLP, onECDH, onECDSA, onDoubleAndAdd, onNonceReuse, onSchnorr, onPedersen, onSetScalar, ecdhA, ecdhB, onSetEcdhA, onSetEcdhB, onSelectPreset,
  finiteCurve, ecdhPhase, ecdhAliceSecret, ecdhBobSecret, onStartEcdh, onSetAliceSecret, onSetBobSecret, onEcdhAdvance, onEcdhReset, onSetResultDirect,
}: Props) {
  return (
    <div className="sidebar">
      <EquationCard mode={mode} a={a} b={b} p={p} />
      <ParametersCard mode={mode} a={a} b={b} p={p} isSingular={isSingular} isPrimeValid={isPrimeValid} onSetA={onSetA} onSetB={onSetB} onSetP={onSetP} />

      {/* Crypto presets — finite and zk modes */}
      {mode !== "real" && (
        <CollapsibleCard title="Crypto Curves" defaultOpen={false} badge={activePresetId ?? undefined}>
          <CryptoPresets onSelect={onSelectPreset} activePresetId={activePresetId} />
        </CollapsibleCard>
      )}

      <PointsCard mode={mode} selectedP={selectedP} selectedQ={selectedQ} result={result} onClearSelection={onClearSelection} />

      {/* ===== Mode: Real or Finite Field ===== */}
      {mode !== "zk" && (
        <>
          <CollapsibleCard title="Group Operations" defaultOpen={true}>
            <div className="op-grid">
              <button className="op-btn primary" disabled={!selectedP || !selectedQ} onClick={onAdd}>P + Q</button>
              <button className="op-btn" disabled={!selectedP} onClick={onDouble}>2P</button>
              <button className="op-btn" disabled={!selectedP} onClick={onInverse}>-P</button>
              {mode === "finite" && (
                <div className="scalar-row" style={{ gridColumn: "1 / -1" }}>
                  <input type="number" min={1} max={200} value={scalarN} onChange={(e) => onSetScalar(Number(e.target.value))} />
                  <button className="op-btn primary" style={{ flex: 1 }} disabled={!selectedP} onClick={onScalar}>{scalarN}P</button>
                </div>
              )}
            </div>
          </CollapsibleCard>

          {mode === "finite" && (
            <>
              <CollapsibleCard title="Exploration & Crypto" defaultOpen={true}>
                <div className="op-grid">
                  <button className="op-btn" disabled={!selectedP} onClick={onOrbit}>Orbit of P</button>
                  <button className="op-btn" disabled={!selectedP || !selectedQ} onClick={onDLP}>DLP: find n</button>
                  <button className="op-btn primary" disabled={!selectedP} onClick={onECDSA} style={{ gridColumn: "1 / -1" }}>ECDSA Sign &amp; Verify</button>
                  <button className="op-btn" disabled={!selectedP} onClick={onNonceReuse} style={{ gridColumn: "1 / -1", color: "var(--md-sys-color-error)" }}>ECDSA Nonce Reuse Attack</button>
                  <button className="op-btn" disabled={!selectedP} onClick={onDoubleAndAdd} style={{ gridColumn: "1 / -1" }}>Double-and-Add ({scalarN}P)</button>
                </div>
              </CollapsibleCard>

              <CollapsibleCard title="Alice & Bob Key Exchange" defaultOpen={false}>
                <ECDHPanel
                  basePoint={selectedP}
                  curve={finiteCurve}
                  phase={ecdhPhase}
                  aliceSecret={ecdhAliceSecret}
                  bobSecret={ecdhBobSecret}
                  onStart={onStartEcdh}
                  onSetAliceSecret={onSetAliceSecret}
                  onSetBobSecret={onSetBobSecret}
                  onAdvance={onEcdhAdvance}
                  onReset={onEcdhReset}
                  onSetResult={onSetResultDirect}
                />
              </CollapsibleCard>
            </>
          )}
        </>
      )}

      {/* ===== Mode: Zero-Knowledge ===== */}
      {mode === "zk" && (
        <>
          <CollapsibleCard title="Zero-Knowledge Proofs" defaultOpen={true}>
            <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", marginBottom: "12px", lineHeight: "1.6" }}>
              Prove you know a secret <strong style={{ color: "var(--md-sys-color-on-surface)" }}>without revealing it</strong>.
              The verifier is convinced, but learns nothing about your secret.
            </div>
            <div className="op-grid">
              <button className="op-btn primary" disabled={!selectedP} onClick={onSchnorr} style={{ gridColumn: "1 / -1" }}>
                Schnorr Protocol
              </button>
              <button className="op-btn primary" disabled={!selectedP || !selectedQ} onClick={onPedersen} style={{ gridColumn: "1 / -1" }}>
                Pedersen Commitment
              </button>
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="How it works" defaultOpen={true}>
            <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", lineHeight: "1.7" }}>
              <div style={{ marginBottom: "10px" }}>
                <strong style={{ color: "#FFD166" }}>Schnorr</strong>
                <span style={{ opacity: 0.6 }}> — select G (base point)</span>
                <br />
                Proves knowledge of secret x where Q = xG.
                <br />
                <span style={{ fontFamily: "var(--md-sys-typescale-code-font)", fontSize: "11px", color: "var(--md-sys-color-primary)" }}>
                  commit R=rG → challenge c → respond s=r+cx → verify sG=R+cQ
                </span>
              </div>
              <div>
                <strong style={{ color: "#FF7B6B" }}>Pedersen</strong>
                <span style={{ opacity: 0.6 }}> — select G and H (two generators)</span>
                <br />
                Commit to a value without revealing it. Hiding + binding.
                <br />
                <span style={{ fontFamily: "var(--md-sys-typescale-code-font)", fontSize: "11px", color: "var(--md-sys-color-primary)" }}>
                  C = vG + rH → hiding → opening → binding
                </span>
              </div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Group Toolkit" defaultOpen={false}>
            <div style={{ fontSize: "11px", color: "var(--md-sys-color-on-surface-variant)", marginBottom: "8px" }}>
              ZK proofs use the same group operations under the hood.
            </div>
            <div className="op-grid">
              <button className="op-btn" disabled={!selectedP || !selectedQ} onClick={onAdd}>P + Q</button>
              <button className="op-btn" disabled={!selectedP} onClick={onDouble}>2P</button>
              <button className="op-btn" disabled={!selectedP} onClick={onInverse}>-P</button>
              <button className="op-btn" disabled={!selectedP} onClick={onOrbit}>Orbit</button>
              <div className="scalar-row" style={{ gridColumn: "1 / -1" }}>
                <input type="number" min={1} max={200} value={scalarN} onChange={(e) => onSetScalar(Number(e.target.value))} />
                <button className="op-btn" style={{ flex: 1 }} disabled={!selectedP} onClick={onScalar}>{scalarN}P</button>
              </div>
            </div>
          </CollapsibleCard>
        </>
      )}
    </div>
  );
}
