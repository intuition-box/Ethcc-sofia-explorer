import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../contexts/EmbeddedWalletContext", () => ({
  useEmbeddedWallet: () => ({
    wallet: null, address: "", balance: null, needsUnlock: false,
    unlocking: false, error: "",
    unlock: vi.fn(async () => true), disconnect: vi.fn(),
    refreshBalance: vi.fn(),
    setWalletDirectly: vi.fn((_conn: unknown, addr: string) => {
      localStorage.setItem("ethcc-wallet-address", addr);
    }),
  }),
}));

vi.mock("../../styles/shared.module.css", () => ({ default: {} }));
vi.mock("../components/onboarding/WalletPickerModal.module.css", () => ({ default: {} }));
vi.mock("../components/shared/QrDisplay.module.css", () => ({ default: {} }));

vi.mock("@reown/appkit/react", () => ({
  useAppKitAccount: () => ({ address: null, isConnected: false }),
  useAppKitProvider: () => ({ walletProvider: null }),
  useAppKit: () => ({ open: vi.fn() }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

vi.mock("../services/embeddedWallet", () => ({
  createEmbeddedWallet: vi.fn(),
  connectEmbeddedWallet: vi.fn(),
  hasEmbeddedWallet: vi.fn(() => false),
  getEmbeddedAddress: vi.fn(() => null),
  markBackupDone: vi.fn(),
  deleteEmbeddedWallet: vi.fn(),
  isBackupDone: vi.fn(() => false),
}));

vi.mock("../services/intuition", () => ({
  ensureUserAtom: vi.fn(),
  buildProfileTriples: vi.fn(() => []),
  createProfileTriples: vi.fn(),
  depositOnAtoms: vi.fn(),
  TRACK_ATOM_IDS: {},
}));

vi.mock("../hooks/useVibeMatches", () => ({
  useVibeMatches: () => ({ matches: [], loading: false }),
}));

vi.mock("../hooks/usePwaInstall", () => ({
  usePwaInstall: () => ({ canInstall: false, installed: false, promptInstall: vi.fn() }),
}));

vi.mock("../data", () => ({
  sessions: [
    { id: "s1", title: "Test Session", speaker: "Alice", track: "DeFi", type: "Talk", time: "10:00", date: "March 30", stage: "Main", interested: 10, trend: "up", up: true, tags: [], desc: "" },
  ],
}));
vi.mock("../data/social", () => ({ VIBES: [] }));

// Mock onboarding sub-components
vi.mock("../components/onboarding", () => ({
  SplashStep: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>SplashNext</button>,
  SlideStep: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>SlideNext</button>,
  InterestPicker: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>InterestNext</button>,
  SessionPicker: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>SessionNext</button>,
}));

// Mock Step6 and Step7 as thin renders to test the page router
vi.mock("../components/onboarding/Step6ReviewPublish", () => ({
  Step6ReviewPublish: ({ onBack, onPublish }: { onBack: () => void; onPublish: () => void }) => (
    <div data-testid="step6">
      <button onClick={onBack}>Step6Back</button>
      <button onClick={onPublish}>Step6Publish</button>
      <span>Review &amp; publish</span>
    </div>
  ),
}));
vi.mock("../components/onboarding/Step7Success", () => ({
  Step7Success: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="step7">
      <button onClick={onComplete}>EnterApp</button>
      <span>Profile Published!</span>
    </div>
  ),
}));

vi.mock("../hooks/useOnboardingWallet", () => ({
  useOnboardingWallet: () => ({
    effectiveWallet: null, effectiveAddress: "", effectiveBalance: null,
    computeWalletState: () => "idle",
    walletConnected: false,
    txError: "", setTxError: vi.fn(),
    txStatus: "", setTxStatus: vi.fn(),
    showSettings: false, setShowSettings: vi.fn(),
    showWalletPicker: false, setShowWalletPicker: vi.fn(),
    embeddedMode: "none", setEmbeddedMode: vi.fn(),
    embeddedPrivateKey: "", embeddedKeyCopied: false, setEmbeddedKeyCopied: vi.fn(),
    embeddedWallet: null, balanceRefreshing: false,
    refreshEmbeddedBalance: vi.fn(),
    openWalletModal: vi.fn(), disconnectWallet: vi.fn(),
    handleCreateEmbedded: vi.fn(), handleUnlockEmbedded: vi.fn(async () => true),
    handleBackupDone: vi.fn(), handleDisconnect: vi.fn(), handleClearAllData: vi.fn(),
  }),
}));

vi.mock("../hooks/useOnboardingPublish", () => ({
  useOnboardingPublish: () => ({ txState: "idle", txHash: "", publish: vi.fn() }),
}));

vi.mock("../components/ui/SplashBg", () => ({
  SplashBg: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../components/ui/CBends", () => ({
  CBends: () => <div data-testid="cbends" />,
}));

import OnboardingPage from "../pages/OnboardingPage";

// ─── Helper ───────────────────────────────────────────────────────

function advanceTo(targetStep: number) {
  const result = render(<OnboardingPage />);
  if (targetStep >= 1) fireEvent.click(screen.getByText("SplashNext"));
  if (targetStep >= 2) fireEvent.click(screen.getByText("SlideNext"));
  if (targetStep >= 3) fireEvent.click(screen.getByText("SlideNext"));
  if (targetStep >= 4) fireEvent.click(screen.getByText("SlideNext"));
  if (targetStep >= 5) fireEvent.click(screen.getByText("InterestNext"));
  if (targetStep >= 6) fireEvent.click(screen.getByText("SessionNext"));
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────

describe("OnboardingPage — step navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("starts at splash (step 0)", () => {
    render(<OnboardingPage />);
    expect(screen.getByText("SplashNext")).toBeTruthy();
  });

  it("advances through slides (steps 1-3)", () => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByText("SplashNext"));
    expect(screen.getByText("SlideNext")).toBeTruthy();
  });

  it("reaches interest picker (step 4)", () => {
    advanceTo(4);
    expect(screen.getByText("InterestNext")).toBeTruthy();
  });

  it("reaches session picker (step 5)", () => {
    advanceTo(5);
    expect(screen.getByText("SessionNext")).toBeTruthy();
  });

  it("reaches review & publish (step 6)", () => {
    advanceTo(6);
    expect(screen.getByTestId("step6")).toBeTruthy();
    expect(screen.getByText(/Review/)).toBeTruthy();
  });

  it("step 6 Back goes to step 5", () => {
    advanceTo(6);
    fireEvent.click(screen.getByText("Step6Back"));
    expect(screen.getByText("SessionNext")).toBeTruthy();
  });

  it("shows transaction details heading at step 6", () => {
    advanceTo(6);
    expect(screen.getByText(/Review/)).toBeTruthy();
  });
});
