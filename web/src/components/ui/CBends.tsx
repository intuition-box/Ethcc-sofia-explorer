import React from "react";

interface CBendItem {
  c: string;
  v: number;
}

export const CBends: React.FC<{ items: CBendItem[] }> = ({ items }) => {
  const t = items.reduce((s, i) => s + i.v, 0);
  return (
    <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden" }}>
      {items.map((i, x) => (
        <div key={x} style={{ width: `${(i.v / t) * 100}%`, background: i.c }} />
      ))}
    </div>
  );
};
