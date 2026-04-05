import type { CurvePoint } from "../../curve-visualization/domain/model/CurvePoint.js";
import type { FieldMode } from "../hooks/useCurveState.js";
import { CryptoPresets } from "./CryptoPresets.js";
import { CollapsibleCard } from "./CollapsibleCard.js";
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
  onSchnorr: () => void;
  onPedersen: () => void;
  onSelectPreset: (preset: CryptoPreset) => void;
  onSetScalar: (n: number) => void;
}

function formatCoord(pt: CurvePoint | null, mode: FieldMode): string {
  if (!pt) return "";
  if (mode === "finite") return `(${pt.x}, ${pt.y})`;
  return `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`;
}

export function Sidebar({
  mode, a, b, p, isSingular, isPrimeValid,
  selectedP, selectedQ, result, scalarN, activePresetId,
  onSetA, onSetB, onSetP, onClearSelection,
  onAdd, onDouble, onInverse, onScalar, onOrbit, onDLP, onECDH, onECDSA, onDoubleAndAdd, onSchnorr, onPedersen, onSetScalar, onSelectPreset,
}: Props) {
  const equationStr = mode === "real"
    ? `y\u00B2 = x\u00B3 ${a >= 0 ? "+" : ""}${a}x ${b >= 0 ? "+" : ""}${b}`
    : `y\u00B2 \u2261 x\u00B3 ${a >= 0 ? "+" : ""}${a}x ${b >= 0 ? "+" : ""}${b} (mod ${p})`;

  const pointCount = [selectedP, selectedQ, result].filter(Boolean).length;

  return (
    <div className="sidebar">
      {/* Equation Display — always visible, not collapsible */}
      <div className="card">
        <div className="equation-display" style={{
          fontFamily: "var(--md-sys-typescale-code-font)",
          fontSize: "15px",
          color: "var(--md-sys-color-primary)",
          textAlign: "center",
          padding: "4px 0",
        }}>
          {equationStr}
        </div>
      </div>

      {/* Parameters */}
      <CollapsibleCard title="Parameters" defaultOpen={true}>
        <div className="param-row">
          <span className="param-label">a</span>
          <input
            type="range"
            min={-10}
            max={10}
            step={1}
            value={a}
            onChange={(e) => onSetA(Number(e.target.value))}
          />
          <span className="param-value">{a}</span>
        </div>
        <div className="param-row">
          <span className="param-label">b</span>
          <input
            type="range"
            min={-10}
            max={10}
            step={1}
            value={b}
            onChange={(e) => onSetB(Number(e.target.value))}
          />
          <span className="param-value">{b}</span>
        </div>
        {mode === "finite" && (
          <div className="param-row">
            <span className="param-label">p</span>
            <input
              type="number"
              min={2}
              max={97}
              value={p}
              onChange={(e) => onSetP(Number(e.target.value))}
            />
          </div>
        )}
        {isSingular && (
          <div className="warning-banner">
            Singular curve: 4a&sup3; + 27b&sup2; = 0. The discriminant must be non-zero.
          </div>
        )}
        {mode === "finite" && !isPrimeValid && (
          <div className="warning-banner">
            {p} is not a prime number. The field order must be prime.
          </div>
        )}
      </CollapsibleCard>

      {/* Crypto Presets */}
      <CollapsibleCard title="Crypto Curves" defaultOpen={false} badge={activePresetId ?? undefined}>
        <CryptoPresets onSelect={onSelectPreset} activePresetId={activePresetId} />
      </CollapsibleCard>

      {/* Selected Points */}
      <CollapsibleCard
        title="Selected Points"
        defaultOpen={true}
        badge={pointCount > 0 ? <>{pointCount}</> : undefined}
      >
        <div className="points-list">
          {selectedP ? (
            <span className="point-chip p"><span className="dot" /> P = {formatCoord(selectedP, mode)}</span>
          ) : (
            <span className="no-selection">Click the curve to select P</span>
          )}
          {selectedQ && (
            <span className="point-chip q"><span className="dot" /> Q = {formatCoord(selectedQ, mode)}</span>
          )}
          {result && (
            <span className="point-chip result"><span className="dot" /> R = {formatCoord(result, mode)}</span>
          )}
        </div>
        {selectedP && (
          <button
            className="op-btn"
            style={{ marginTop: "8px", width: "100%" }}
            onClick={onClearSelection}
          >
            Clear Selection
          </button>
        )}
      </CollapsibleCard>

      {/* Operations */}
      <CollapsibleCard title="Group Operations" defaultOpen={true}>
        <div className="op-grid">
          <button
            className="op-btn primary"
            disabled={!selectedP || !selectedQ}
            onClick={onAdd}
          >
            P + Q
          </button>
          <button
            className="op-btn"
            disabled={!selectedP}
            onClick={onDouble}
          >
            2P
          </button>
          <button
            className="op-btn"
            disabled={!selectedP}
            onClick={onInverse}
          >
            -P
          </button>
          {mode === "finite" && (
            <div className="scalar-row" style={{ gridColumn: "1 / -1" }}>
              <input
                type="number"
                min={1}
                max={200}
                value={scalarN}
                onChange={(e) => onSetScalar(Number(e.target.value))}
              />
              <button
                className="op-btn primary"
                style={{ flex: 1 }}
                disabled={!selectedP}
                onClick={onScalar}
              >
                {scalarN}P
              </button>
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Exploration & Crypto */}
      {mode === "finite" && (
        <CollapsibleCard title="Exploration & Crypto" defaultOpen={true}>
          <div className="op-grid">
            <button className="op-btn" disabled={!selectedP} onClick={onOrbit}>
              Orbit of P
            </button>
            <button className="op-btn" disabled={!selectedP || !selectedQ} onClick={onDLP}>
              DLP: find n
            </button>
            <button
              className="op-btn primary"
              disabled={!selectedP}
              onClick={onECDH}
              style={{ gridColumn: "1 / -1" }}
            >
              ECDH Demo (a=7, b=11)
            </button>
            <button
              className="op-btn primary"
              disabled={!selectedP}
              onClick={onECDSA}
              style={{ gridColumn: "1 / -1" }}
            >
              ECDSA Sign &amp; Verify
            </button>
            <button
              className="op-btn"
              disabled={!selectedP}
              onClick={onDoubleAndAdd}
              style={{ gridColumn: "1 / -1" }}
            >
              Double-and-Add ({scalarN}P)
            </button>
          </div>
        </CollapsibleCard>
      )}

      {/* Zero-Knowledge Proofs */}
      {mode === "finite" && (
        <CollapsibleCard title="Zero-Knowledge Proofs" defaultOpen={false}>
          <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", marginBottom: "10px", lineHeight: "1.5" }}>
            Prove you know a secret without revealing it.
          </div>
          <div className="op-grid">
            <button
              className="op-btn"
              disabled={!selectedP}
              onClick={onSchnorr}
              style={{ gridColumn: "1 / -1" }}
            >
              Schnorr Protocol
            </button>
            <button
              className="op-btn"
              disabled={!selectedP || !selectedQ}
              onClick={onPedersen}
              style={{ gridColumn: "1 / -1" }}
            >
              Pedersen Commitment
            </button>
          </div>
          <div style={{ fontSize: "11px", color: "var(--md-sys-color-on-surface-variant)", marginTop: "8px", lineHeight: "1.5" }}>
            <strong style={{ color: "var(--md-sys-color-primary)" }}>Schnorr</strong>: Select P (base point). Proves knowledge of x where Q = xP.
            <br />
            <strong style={{ color: "var(--md-sys-color-primary)" }}>Pedersen</strong>: Select P and Q (two generators). Commits to a value without revealing it.
          </div>
        </CollapsibleCard>
      )}
    </div>
  );
}
