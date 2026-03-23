import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QrDisplay } from "../components/shared/QrDisplay";

// Mock CSS modules
vi.mock("../components/shared/QrDisplay.module.css", () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}));
vi.mock("../../styles/shared.module.css", () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

describe("QrDisplay", () => {
  const ADDR = "0x1234567890abcdef1234567890abcdef12345678";

  it("renders QR code SVG with the wallet address", () => {
    const { container } = render(<QrDisplay address={ADDR} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("shows truncated address when address is provided", () => {
    render(<QrDisplay address={ADDR} />);
    // Format: first 10 chars ... last 8 chars
    expect(screen.getByText(/0x12345678.*12345678/)).toBeTruthy();
  });

  it("shows 'Connect your wallet' when no address", () => {
    render(<QrDisplay address="" />);
    expect(screen.getByText("Connect your wallet")).toBeTruthy();
  });

  it("uses fallback QR value when address is empty", () => {
    const { container } = render(<QrDisplay address="" />);
    // QRCodeSVG still renders an SVG (with ethcc.io fallback)
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("renders default label", () => {
    render(<QrDisplay address={ADDR} />);
    expect(screen.getByText("Scan to send me $TRUST")).toBeTruthy();
  });

  it("renders custom label", () => {
    render(<QrDisplay address={ADDR} label="My custom label" />);
    expect(screen.getByText("My custom label")).toBeTruthy();
  });

  it("shows network info by default", () => {
    render(<QrDisplay address={ADDR} />);
    expect(screen.getByText("Intuition (Chain 1155)")).toBeTruthy();
    expect(screen.getByText("$TRUST")).toBeTruthy();
  });

  it("shows 'Ready to receive' when address is set", () => {
    render(<QrDisplay address={ADDR} />);
    expect(screen.getByText("Ready to receive")).toBeTruthy();
  });

  it("shows 'Wallet not connected' when no address", () => {
    render(<QrDisplay address="" />);
    expect(screen.getByText("Wallet not connected")).toBeTruthy();
  });

  it("hides network info when showNetworkInfo=false", () => {
    render(<QrDisplay address={ADDR} showNetworkInfo={false} />);
    expect(screen.queryByText("Intuition (Chain 1155)")).toBeNull();
    expect(screen.queryByText("$TRUST")).toBeNull();
  });
});
