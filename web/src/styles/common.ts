/**
 * Shared style constants used across multiple pages.
 * Import these instead of writing inline styles.
 */
import type { CSSProperties } from "react";
import { C, R, FONT, glassSurface } from "../config/theme";

// ─── Layout ──────────────────────────────────────────────────────

/** Flex child that fills available width, truncates overflow */
export const fluidContent: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

/** Scrollable page content area */
export const scrollContent: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  paddingBottom: 24,
  position: "relative",
  zIndex: 1,
};

/** Two-column grid */
export const twoColGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

/** Flex row with wrap */
export const flexWrap: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

/** Standard section padding */
export const sectionPad: CSSProperties = {
  padding: "0 16px",
};

/** Horizontal scroll row (no scrollbar) */
export const horizontalScroll: CSSProperties = {
  display: "flex",
  gap: 12,
  overflowX: "auto",
  scrollbarWidth: "none",
};

// ─── Text ────────────────────────────────────────────────────────

/** Card title — 13px bold, truncated */
export const cardTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: C.textPrimary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** Secondary metadata text — 11px */
export const metaText: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 2,
};

/** Tertiary/hint text — 11px dimmer */
export const hintText: CSSProperties = {
  fontSize: 11,
  color: C.textTertiary,
};

/** Section title — 15px bold */
export const sectionTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: C.textPrimary,
  padding: "20px 16px 10px",
};

/** Monospace address text */
export const monoText: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: C.textPrimary,
  fontFamily: "monospace",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** Empty state italic text */
export const emptyStateText: CSSProperties = {
  fontSize: 13,
  color: C.textTertiary,
  fontStyle: "italic",
};

/** "In cart" badge */
export const inCartBadge: CSSProperties = {
  fontSize: 10,
  color: C.flat,
  fontWeight: 600,
};

// ─── Cards & Items ───────────────────────────────────────────────

/** Standard glass list item with flex row */
export const glassListItem: CSSProperties = {
  ...glassSurface,
  padding: 12,
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
};

/** Glass card for empty states / info */
export const glassInfoCard: CSSProperties = {
  ...glassSurface,
  margin: "0 16px",
  padding: 16,
  textAlign: "center",
};

/** Vertical list container */
export const listColumn: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "0 16px",
};

/** Color accent bar (left side of card) */
export const accentBar = (color: string): CSSProperties => ({
  width: 4,
  alignSelf: "stretch",
  borderRadius: 2,
  background: color,
  flexShrink: 0,
});

// ─── Buttons ─────────────────────────────────────────────────────

/** Small round delete button */
export const deleteBtn: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  background: C.errorLight,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

/** Small round close button (modal) */
export const closeBtn: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 16,
  background: C.surfaceGray,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Text-only link button */
export const linkBtn: CSSProperties = {
  background: "none",
  border: "none",
  color: C.textSecondary,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: FONT,
  padding: "8px 0",
};

// ─── Avatars & Icons ─────────────────────────────────────────────

/** Small avatar circle (36px) */
export const avatarSmall = (bg: string): CSSProperties => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  background: bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  color: "#0a0a0a",
  flexShrink: 0,
});

/** Track/category icon box (40px) */
export const iconBox = (color: string): CSSProperties => ({
  width: 40,
  height: 40,
  borderRadius: 12,
  background: `${color}22`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
});

/** Small icon box (36px, for list items) */
export const iconBoxSmall = (color: string): CSSProperties => ({
  width: 36,
  height: 36,
  borderRadius: R.md,
  background: `${color}22`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  flexShrink: 0,
});

// ─── Track badge pill ────────────────────────────────────────────

/** Colored track/interest badge */
export const trackBadge = (color: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: R.btn,
  fontSize: 12,
  fontWeight: 500,
  background: `${color}22`,
  color,
  fontFamily: FONT,
});

/** Small track badge (for session detail) */
export const trackBadgeSmall = (color: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 8px",
  borderRadius: R.btn,
  fontSize: 10,
  fontWeight: 600,
  background: `${color}22`,
  color,
});

// ─── Modal ───────────────────────────────────────────────────────

/** Full-screen overlay for bottom sheet modals */
export const modalOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 300,
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

/** Bottom sheet modal content */
export const modalSheet: CSSProperties = {
  width: "100%",
  maxWidth: 390,
  background: C.background,
  borderRadius: "20px 20px 0 0",
  border: `1px solid ${C.border}`,
  borderBottom: "none",
  maxHeight: "75vh",
  fontFamily: FONT,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

/** Modal fixed header area */
export const modalHeader: CSSProperties = {
  flexShrink: 0,
  padding: "20px 20px 0",
};

/** Modal title row (title + close button) */
export const modalTitleRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

/** Modal description text */
export const modalDesc: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
  lineHeight: 1.5,
  marginBottom: 16,
};

/** Modal scrollable list area */
export const modalScrollArea: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "0 20px 24px",
};

// ─── Hero ────────────────────────────────────────────────────────

/** Colored hero background (absolute positioned) */
export const heroBackground = (color: string): CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 200,
  background: color,
  borderRadius: `0 0 ${R.xl}px ${R.xl}px`,
  zIndex: 0,
});

// ─── Stats ───────────────────────────────────────────────────────

/** Stats row container */
export const statsRow: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 24,
  marginTop: 16,
};

/** Individual stat cell */
export const statCell: CSSProperties = {
  textAlign: "center",
};

/** Stat value (big number) */
export const statValue: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
};

/** Stat label (small text below) */
export const statLabel: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
};

// ─── Helpers ─────────────────────────────────────────────────────

/** Truncate a label: addresses get 0x1234...abcd, names get max N chars */
export function truncateLabel(label: string, maxLen = 20): string {
  if (label.startsWith("0x") && label.length === 42) {
    return `${label.slice(0, 6)}...${label.slice(-4)}`;
  }
  return label.length > maxLen ? `${label.slice(0, maxLen - 2)}...` : label;
}

/** Get initials from a label */
export function getInitials(label: string): string {
  if (label.startsWith("0x")) return label.slice(2, 4).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}
