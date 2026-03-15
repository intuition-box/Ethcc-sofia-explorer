import React from "react";
import { C } from "../../config/theme";

export const Dots: React.FC<{ n: number; a: number }> = ({ n, a }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} style={{
        width: i === a ? 10 : 28, height: 10, borderRadius: 5,
        background: i === a ? C.flat : "rgba(255,255,255,0.3)",
      }} />
    ))}
  </div>
);
