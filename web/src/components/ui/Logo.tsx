import React from "react";

export const Logo: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
    <circle cx="42" cy="42" r="32" fill="#cea2fd" />
    <circle cx="72" cy="42" r="32" fill="none" stroke="#cea2fd" strokeWidth="3" />
  </svg>
);
