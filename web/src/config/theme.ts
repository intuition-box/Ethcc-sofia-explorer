import type { CSSProperties } from "react";

// ─── Colors ─────────────────────────────────────────────────────
export const C = {
  primary: "#cea2fd",
  primaryLight: "rgba(206,162,253,0.15)",
  white: "#FBF7F5",
  background: "#02000e",
  surface: "#161618",
  surfaceGray: "#1c1c20",
  dark: "#02000e",
  textPrimary: "#F2DED6",
  textSecondary: "#a09088",
  textTertiary: "#6a5f5a",
  success: "#22c55e",
  successLight: "rgba(34,197,94,0.15)",
  error: "#ef4444",
  errorLight: "rgba(239,68,68,0.15)",
  warning: "#f59e0b",
  actionYellow: "#F59E0B",
  actionOrange: "#d37cbf",
  accent: "#A6AF6B",
  trust: "#00D4AA",
  glass: "rgba(0,0,0,0.14)",
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.1)",
  gold: "#FCD34D",
  iridescence:
    "linear-gradient(135deg, #D790C7 0%, #d37cbf 20%, #ffc6b0 50%, #ffa7b1 80%, #cea2fd 100%)",
  gradIr:
    "linear-gradient(135deg, #D790C7 0%, #d37cbf 20%, #ffc6b0 50%, #ffa7b1 80%, #cea2fd 100%)",
  flat: "#ffc6b0",
  flatLight: "rgba(255,198,176,0.15)",
};

// ─── Radii ──────────────────────────────────────────────────────
export const R = { sm: 4, md: 8, lg: 12, xl: 20, btn: 28 };

// ─── Glass styles ───────────────────────────────────────────────
export const glass: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(24px) saturate(1.3)",
  WebkitBackdropFilter: "blur(24px) saturate(1.3)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

export const glassCard: CSSProperties = {
  ...glass,
  borderRadius: R.lg,
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.03)",
};

export const glassNav: CSSProperties = {
  background: "rgba(10,0,14,0.7)",
  backdropFilter: "blur(32px) saturate(1.5)",
  WebkitBackdropFilter: "blur(32px) saturate(1.5)",
  borderTop: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

export const glassSurface: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: R.lg,
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.02)",
};

// ─── Font ───────────────────────────────────────────────────────
export const FONT =
  "Roboto,-apple-system,BlinkMacSystemFont,'Helvetica Neue','Segoe UI',sans-serif";

// ─── Button pill ────────────────────────────────────────────────
export const btnPill: CSSProperties = {
  width: "100%",
  height: 56,
  borderRadius: R.btn,
  background: C.iridescence,
  color: "#0a0a0a",
  fontSize: 16,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

// ─── Track colors (map track names from bdd to prototype-style colors) ──
export const TRACK_COLORS: Record<string, { color: string; icon: string }> = {
  DeFi: { color: "#27AE60", icon: "📊" },
  Infrastructure: { color: "#3461FF", icon: "🏗️" },
  "Privacy & ZK": { color: "#7B61FF", icon: "🔒" },
  Governance: { color: "#F2994A", icon: "🏛️" },
  "UX & Adoption": { color: "#EB5757", icon: "🎯" },
  "NFT & Culture": { color: "#BB6BD9", icon: "🎨" },
  "Core Protocol": { color: "#2D9CDB", icon: "⚙️" },
  "AI & Crypto": { color: "#9B51E0", icon: "🤖" },
  "Social & Identity": { color: "#219653", icon: "👥" },
  Security: { color: "#EB5757", icon: "🛡️" },
  Gaming: { color: "#F2994A", icon: "🎮" },
  MEV: { color: "#6366F1", icon: "⚡" },
  // Additional tracks from real data
  "Layer 2": { color: "#3461FF", icon: "🔗" },
  Scaling: { color: "#2D9CDB", icon: "📈" },
  "Real World Assets": { color: "#F2994A", icon: "🏠" },
  "Developer Experience": { color: "#EB5757", icon: "🛠️" },
  Regulation: { color: "#F2994A", icon: "⚖️" },
  Staking: { color: "#27AE60", icon: "🥩" },
  "Public Goods": { color: "#219653", icon: "🌍" },
  "Client Diversity": { color: "#2D9CDB", icon: "🔄" },
  "Wallet & Key Management": { color: "#BB6BD9", icon: "🔐" },
  "Data Availability": { color: "#6366F1", icon: "💾" },
  Interoperability: { color: "#3461FF", icon: "🌐" },
  "Account Abstraction": { color: "#9B51E0", icon: "🤖" },
  "Decentralized Science": { color: "#219653", icon: "🔬" },
  "Censorship Resistance": { color: "#EB5757", icon: "🛡️" },
  "Formal Verification": { color: "#7B61FF", icon: "✅" },
};

export function getTrackStyle(trackName: string) {
  return TRACK_COLORS[trackName] ?? { color: "#cea2fd", icon: "📌" };
}

// ─── Session type colors ────────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  Talk: "#F2994A",
  Workshop: "#F59E0B",
  Panel: "#3461FF",
  Demo: "#A6AF6B",
};
