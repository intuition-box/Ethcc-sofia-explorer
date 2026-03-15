import React from "react";
import type { CSSProperties } from "react";

export const SplashBg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    position: "relative", flex: 1, display: "flex", flexDirection: "column",
    background: "transparent",
  } as CSSProperties}>
    {children}
  </div>
);
