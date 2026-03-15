import React from "react";
import { C } from "../../config/theme";
import { Ic } from "./Icons";

interface HeaderProps {
  title?: string;
  onLeaderboard?: () => void;
  dark?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title = "Search 'Sessions'", onLeaderboard, dark }) => {
  const ic = dark ? "#0a0a0a" : C.white;
  const bg = dark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)";
  const tc = dark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)";
  return (
    <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div onClick={onLeaderboard} style={{
        width: 40, height: 40, borderRadius: 12, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}>
        <Ic.Trophy c={ic} s={20} />
      </div>
      <div style={{
        flex: 1, height: 44, borderRadius: 22, background: bg,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 10,
      }}>
        <Ic.Search c={tc} s={16} />
        <span style={{ fontSize: 14, color: tc }}>{title}</span>
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 12, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
      }}>
        <Ic.Bell c={ic} s={20} />
        <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: C.error }} />
      </div>
    </div>
  );
};
