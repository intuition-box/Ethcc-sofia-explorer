import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT } from "../config/theme";


// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  color: C.textPrimary,
  fontFamily: FONT,
  overflow: "hidden",
};

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px 0",
  flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: C.surfaceGray,
  border: "none",
  color: C.textPrimary,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const title: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  flex: 1,
};

const tabRow: CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "20px 16px 16px",
  flexShrink: 0,
};

const tabBtn = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: "10px 0",
  borderRadius: R.btn,
  border: "none",
  background: active ? C.flat : C.surfaceGray,
  color: active ? "#0a0a0a" : C.textSecondary,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
});

// QR Styles
const qrBox: CSSProperties = {
  ...glassSurface,
  margin: "0 16px",
  padding: 24,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
};

const qrGrid: CSSProperties = {
  width: 200,
  height: 200,
  display: "grid",
  gridTemplateColumns: "repeat(11, 1fr)",
  gridTemplateRows: "repeat(11, 1fr)",
  gap: 2,
  padding: 16,
  background: "#fff",
  borderRadius: R.lg,
};

const qrCell = (dark: boolean): CSSProperties => ({
  borderRadius: 2,
  background: dark ? "#0a0a0a" : "#fff",
});

const infoRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  padding: "8px 0",
  borderBottom: `1px solid ${C.border}`,
};

const infoLabel: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
};

const infoValue: CSSProperties = {
  fontSize: 12,
  color: C.textPrimary,
  fontWeight: 600,
};

// Scan styles
const scanArea: CSSProperties = {
  ...glassSurface,
  margin: "0 16px",
  height: 240,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative" as const,
  overflow: "hidden",
};

const scanOverlay: CSSProperties = {
  position: "absolute" as const,
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const scanFrame: CSSProperties = {
  width: 160,
  height: 160,
  border: `2px solid ${C.primary}`,
  borderRadius: R.lg,
  position: "relative" as const,
};

const scanLine: CSSProperties = {
  position: "absolute" as const,
  left: 4,
  right: 4,
  height: 2,
  background: C.primary,
  top: "50%",
  boxShadow: `0 0 12px ${C.primary}`,
  animation: "scanMove 2s ease-in-out infinite",
};

const cornerStyle = (pos: { top?: number; bottom?: number; left?: number; right?: number }): CSSProperties => ({
  position: "absolute" as const,
  width: 20,
  height: 20,
  ...pos,
  borderColor: C.primary,
  borderStyle: "solid",
  borderWidth: 0,
  ...(pos.top !== undefined && pos.left !== undefined
    ? { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 }
    : pos.top !== undefined && pos.right !== undefined
    ? { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 }
    : pos.bottom !== undefined && pos.left !== undefined
    ? { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 }
    : { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 }),
});

const amountSection: CSSProperties = {
  margin: "16px 16px 0",
};

const amountInput: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: R.lg,
  border: `1px solid ${C.border}`,
  background: "rgba(255,255,255,0.04)",
  color: C.textPrimary,
  fontSize: 24,
  fontWeight: 700,
  fontFamily: FONT,
  textAlign: "center" as const,
  outline: "none",
  boxSizing: "border-box" as const,
};

const presetRow: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 12,
};

const presetBtn = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: "8px 0",
  borderRadius: R.btn,
  border: active ? "none" : `1px solid ${C.border}`,
  background: active ? C.flat : "transparent",
  color: active ? "#0a0a0a" : C.textSecondary,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
});

const confirmBox: CSSProperties = {
  ...glassSurface,
  margin: "16px 16px 0",
  padding: 16,
};

const confirmRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
};

const sendBtn: CSSProperties = {
  ...btnPill,
  margin: "16px",
};

// ─── QR Pattern (deterministic pseudo-random) ────────

function generateQRPattern(): boolean[] {
  const cells: boolean[] = [];
  for (let i = 0; i < 121; i++) {
    const row = Math.floor(i / 11);
    const col = i % 11;
    // Corner markers
    if ((row < 3 && col < 3) || (row < 3 && col > 7) || (row > 7 && col < 3)) {
      cells.push(
        (row === 0 || row === 2 || col === 0 || col === 2 || col === 8 || col === 10 || row === 8 || row === 10) ||
        (row === 1 && col === 1) || (row === 1 && col === 9) || (row === 9 && col === 1)
      );
    } else {
      cells.push(((i * 7 + 3) % 5) < 2);
    }
  }
  return cells;
}

// ─── Component ───────────────────────────────────────

type Mode = "qr" | "scan";

export default function SendPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("qr");
  const [amount, setAmount] = useState("1.0");
  const [activePreset, setActivePreset] = useState<string | null>("1.0");

  const qrPattern = generateQRPattern();

  const presets = ["0.1", "0.5", "1.0", "5.0"];

  const handlePreset = (val: string) => {
    setAmount(val);
    setActivePreset(val);
  };

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          &#8249;
        </button>
        <div style={title}>Send $TRUST</div>
      </div>

      {/* Mode Tabs */}
      <div style={tabRow}>
        <button style={tabBtn(mode === "qr")} onClick={() => setMode("qr")}>
          My QR Code
        </button>
        <button style={tabBtn(mode === "scan")} onClick={() => setMode("scan")}>
          Scan & Send
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      {/* ─── QR Code Mode ────────────────── */}
      {mode === "qr" && (
        <>
          <div style={qrBox}>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>
              Scan to receive $TRUST
            </div>
            <div style={qrGrid}>
              {qrPattern.map((dark, i) => (
                <div key={i} style={qrCell(dark)} />
              ))}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Samuel Chauche</div>
            <div style={{ fontSize: 12, color: C.textSecondary }}>0x1a2b...3c4d</div>
          </div>

          <div style={{ ...glassSurface, margin: "16px", padding: 16 }}>
            <div style={infoRow}>
              <span style={infoLabel}>Network</span>
              <span style={infoValue}>Intuition (Chain 1155)</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>Token</span>
              <span style={infoValue}>$TRUST</span>
            </div>
            <div style={{ ...infoRow, borderBottom: "none" }}>
              <span style={infoLabel}>Status</span>
              <span style={{ ...infoValue, color: C.success }}>Ready to receive</span>
            </div>
          </div>
        </>
      )}

      {/* ─── Scan & Send Mode ────────────── */}
      {mode === "scan" && (
        <>
          {/* Camera Placeholder */}
          <div style={scanArea}>
            <div style={{ color: C.textTertiary, fontSize: 13 }}>Camera feed placeholder</div>
            <div style={scanOverlay}>
              <div style={scanFrame}>
                <div style={cornerStyle({ top: -1, left: -1 })} />
                <div style={cornerStyle({ top: -1, right: -1 })} />
                <div style={cornerStyle({ bottom: -1, left: -1 })} />
                <div style={cornerStyle({ bottom: -1, right: -1 })} />
                <div style={scanLine} />
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div style={amountSection}>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              Amount to send
            </div>
            <input
              type="text"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setActivePreset(null);
              }}
              style={amountInput}
              placeholder="0.0"
            />
            <div style={presetRow}>
              {presets.map((p) => (
                <button
                  key={p}
                  style={presetBtn(activePreset === p)}
                  onClick={() => handlePreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div style={confirmBox}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Transaction Summary
            </div>
            <div style={confirmRow}>
              <span style={infoLabel}>To</span>
              <span style={infoValue}>Scan a QR code</span>
            </div>
            <div style={confirmRow}>
              <span style={infoLabel}>Amount</span>
              <span style={infoValue}>{amount} TRUST</span>
            </div>
            <div style={confirmRow}>
              <span style={infoLabel}>Network Fee</span>
              <span style={infoValue}>~0.001 TRUST</span>
            </div>
            <div style={confirmRow}>
              <span style={infoLabel}>Total</span>
              <span style={{ ...infoValue, color: C.flat }}>
                {(parseFloat(amount || "0") + 0.001).toFixed(3)} TRUST
              </span>
            </div>
          </div>

          {/* Send Button */}
          <button
            style={{
              ...sendBtn,
              ...(parseFloat(amount || "0") <= 0
                ? { opacity: 0.5, cursor: "not-allowed" }
                : {}),
            }}
            disabled={parseFloat(amount || "0") <= 0}
            onClick={() => {
              if (parseFloat(amount || "0") > 0) {
                alert(`Ready to scan QR and send ${amount} TRUST.\nCamera access required — not yet implemented on this device.`);
              }
            }}
          >
            {parseFloat(amount || "0") > 0 ? `Send ${amount} TRUST` : "Enter amount to send"}
          </button>
        </>
      )}

      </div>{/* end scrollable content */}

      {/* Inline keyframe for scan animation */}
      <style>{`
        @keyframes scanMove {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  );
}
