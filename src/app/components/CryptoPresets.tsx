import { useState } from "react";
import { CRYPTO_PRESETS, CATEGORIES, type CryptoPreset } from "../data/cryptoPresets.js";

interface Props {
  onSelect: (preset: CryptoPreset) => void;
  activePresetId: string | null;
}

const FORM_ICONS: Record<string, string> = {
  weierstrass: "W",
  montgomery: "M",
  "twisted-edwards": "E",
};

const FORM_LABELS: Record<string, string> = {
  weierstrass: "Short Weierstrass",
  montgomery: "Montgomery",
  "twisted-edwards": "Twisted Edwards",
};

export function CryptoPresets({ onSelect, activePresetId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const grouped = Object.entries(CATEGORIES).map(([key, cat]) => ({
    key,
    ...cat,
    presets: CRYPTO_PRESETS.filter((p) => p.category === key),
  }));

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {grouped.map((group) => (
          <div key={group.key}>
            <div style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: group.color,
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span style={{
                width: "6px", height: "6px",
                borderRadius: "50%",
                background: group.color,
                display: "inline-block",
              }} />
              {group.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {group.presets.map((preset) => {
                const isActive = activePresetId === preset.id;
                const isExpanded = expandedId === preset.id;
                return (
                  <div key={preset.id}>
                    <button
                      onClick={() => {
                        onSelect(preset);
                        setExpandedId(isExpanded ? null : preset.id);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 10px",
                        border: isActive
                          ? "1px solid var(--md-sys-color-primary)"
                          : "1px solid transparent",
                        borderRadius: "var(--md-sys-shape-corner-small)",
                        background: isActive
                          ? "rgba(125, 211, 192, 0.1)"
                          : "transparent",
                        color: "var(--md-sys-color-on-surface)",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "var(--md-sys-typescale-body-font)",
                        fontSize: "13px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "var(--md-sys-typescale-code-font)",
                        background: isActive ? "var(--md-sys-color-primary)" : "var(--md-sys-color-surface-container-highest)",
                        color: isActive ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-on-surface-variant)",
                        flexShrink: 0,
                      }}>
                        {FORM_ICONS[preset.nativeForm]}
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ fontWeight: 500 }}>{preset.shortName}</span>
                      </span>
                      <span style={{
                        fontSize: "10px",
                        color: "var(--md-sys-color-on-surface-variant)",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}>
                        &#x25BC;
                      </span>
                    </button>

                    {isExpanded && (
                      <div style={{
                        margin: "4px 0 6px 0",
                        padding: "10px 12px",
                        background: "var(--md-sys-color-surface-container-lowest)",
                        borderRadius: "var(--md-sys-shape-corner-small)",
                        fontSize: "12px",
                        lineHeight: "1.6",
                        color: "var(--md-sys-color-on-surface-variant)",
                        borderLeft: `3px solid ${group.color}`,
                      }}>
                        <div style={{ marginBottom: "6px", color: "var(--md-sys-color-on-surface)", fontWeight: 500 }}>
                          {preset.name}
                        </div>
                        <div style={{ marginBottom: "4px" }}>
                          <span style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Form: </span>
                          <span style={{
                            fontFamily: "var(--md-sys-typescale-code-font)",
                            color: "var(--md-sys-color-primary)",
                            fontSize: "11px",
                          }}>
                            {FORM_LABELS[preset.nativeForm]}
                          </span>
                        </div>
                        <div style={{
                          fontFamily: "var(--md-sys-typescale-code-font)",
                          fontSize: "12px",
                          color: "var(--md-sys-color-primary)",
                          background: "rgba(125, 211, 192, 0.06)",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          marginBottom: "6px",
                        }}>
                          {preset.equation}
                        </div>
                        <div style={{ marginBottom: "4px" }}>
                          <span style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Usage: </span>
                          {preset.usage}
                        </div>
                        <div style={{ marginBottom: "2px" }}>
                          <span style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Field: </span>
                          <span style={{
                            fontFamily: "var(--md-sys-typescale-code-font)",
                            fontSize: "11px",
                            wordBreak: "break-all",
                          }}>
                            {preset.realParams.p.length > 40
                              ? preset.realParams.p.slice(0, 20) + "..." + preset.realParams.p.slice(-10)
                              : preset.realParams.p}
                          </span>
                        </div>
                        {preset.realParams.note && (
                          <div style={{
                            marginTop: "6px",
                            padding: "4px 8px",
                            background: "rgba(255, 209, 102, 0.06)",
                            borderRadius: "4px",
                            fontSize: "11px",
                            color: "var(--md-sys-color-secondary)",
                          }}>
                            {preset.realParams.note}
                          </div>
                        )}
                        <div style={{
                          marginTop: "8px",
                          padding: "4px 8px",
                          background: "rgba(125, 211, 192, 0.06)",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontStyle: "italic",
                        }}>
                          Visualized as toy curve: y&sup2; = x&sup3; {preset.toyParams.a >= 0 ? "+" : ""}{preset.toyParams.a}x {preset.toyParams.b >= 0 ? "+" : ""}{preset.toyParams.b} over 𝔽<sub>{preset.toyParams.p}</sub>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
