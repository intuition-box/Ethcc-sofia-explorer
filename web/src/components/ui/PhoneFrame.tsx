import React from "react";
import { C, FONT } from "../../config/theme";
import PixelBlast from "./PixelBlast";

export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="phone-frame">
    {/* Animated background */}
    <div style={{
      position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.3,
    }}>
      <PixelBlast
        variant="diamond"
        pixelSize={2}
        color="#ffc6b0"
        patternScale={1}
        patternDensity={0.3}
        pixelSizeJitter={0.45}
        enableRipples={false}
        speed={1.9}
        edgeFade={0}
        transparent
        style={{ width: "100%", height: "100%" }}
      />
    </div>
    {/* Content above animation */}
    <div style={{
      position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {children}
    </div>

    <style>{`
      .phone-frame {
        width: 100%;
        height: 100dvh;
        height: -webkit-fill-available;
        background: ${C.background};
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
        font-family: ${FONT};
        max-width: 430px;
        padding-top: env(safe-area-inset-top, 0px);
      }
      @media (min-width: 500px) {
        .phone-frame {
          width: 390px;
          height: 844px;
          border-radius: 44px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
        }
      }
    `}</style>
  </div>
);
