import React from "react";
import { C } from "../../config/theme";
import type { CSSProperties } from "react";

export const StatusBar: React.FC<{ light?: boolean }> = ({ light = false }) => {
  const color = light ? C.white : C.textPrimary;
  return (
    <div style={{
      height: 54, display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      padding: "0 28px 8px", fontSize: 15, fontWeight: 600, color, flexShrink: 0,
    } as CSSProperties}>
      <span>9:41</span>
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <rect x="0" y="3" width="3" height="9" rx="1" fill={color} />
          <rect x="4.5" y="2" width="3" height="10" rx="1" fill={color} />
          <rect x="9" y="0" width="3" height="12" rx="1" fill={color} />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill={color} opacity="0.3" />
        </svg>
        <div style={{
          width: 25, height: 12, border: `1.5px solid ${color}`, borderRadius: 4,
          position: "relative", marginLeft: 4,
        }}>
          <div style={{
            position: "absolute", left: 2, top: 2, bottom: 2, width: 15,
            background: color, borderRadius: 2,
          }} />
        </div>
      </div>
    </div>
  );
};
