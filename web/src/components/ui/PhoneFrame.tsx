import React from "react";
import { FONT } from "../../config/theme";

export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="phone-frame">
    <div style={{
      position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {children}
    </div>

    <style>{`
      .phone-frame {
        width: 100%;
        height: 100%;
        background: #060a10;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
        font-family: ${FONT};
      }
      @media (min-width: 500px) {
        .phone-frame {
          width: 390px;
          height: 844px;
          max-width: 430px;
          border-radius: 44px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
        }
      }
    `}</style>
  </div>
);
