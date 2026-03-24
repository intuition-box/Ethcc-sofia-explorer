import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Mocks ────────────────────────────────────────────────────────

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock EmbeddedWalletContext
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

// Mock CSS modules (vitest/jsdom returns undefined for .module.css)
vi.mock("../../styles/shared.module.css", () => ({ default: {} }));
vi.mock("../components/onboarding/WalletPickerModal.module.css", () => ({ default: {} }));
vi.mock("../components/shared/QrDisplay.module.css", () => ({ default: {} }));

// Mock appkit hooks (used by useWalletConnection)
vi.mock("@reown/appkit/react", () => ({
  useAppKitAccount: () => ({ address: null, isConnected: false }),
  useAppKitProvider: () => ({ walletProvider: null }),
  useAppKit: () => ({ open: vi.fn() }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

// Mock embedded wallet service
const mockCreateEmbeddedWallet = vi.fn();
const mockConnectEmbeddedWallet = vi.fn();
const mockHasEmbeddedWallet = vi.fn(() => false);
const mockGetEmbeddedAddress = vi.fn(() => null);
const mockMarkBackupDone = vi.fn();

vi.mock("../services/embeddedWallet", () => ({
  createEmbeddedWallet: (...args: unknown[]) => mockCreateEmbeddedWallet(...args),
  connectEmbeddedWallet: (...args: unknown[]) => mockConnectEmbeddedWallet(...args),
  hasEmbeddedWallet: () => mockHasEmbeddedWallet(),
  getEmbeddedAddress: () => mockGetEmbeddedAddress(),
  markBackupDone: () => mockMarkBackupDone(),
  deleteEmbeddedWallet: vi.fn(),
  isBackupDone: vi.fn(() => false),
}));

// Mock intuition service
vi.mock("../services/intuition", () => ({
  ensureUserAtom: vi.fn(),
  buildProfileTriples: vi.fn(() => []),
  createProfileTriples: vi.fn(),
  depositOnAtoms: vi.fn(),
  TRACK_ATOM_IDS: {},
}));

// Mock vibeMatches hook
vi.mock("../hooks/useVibeMatches", () => ({
  useVibeMatches: () => ({ matches: [], loading: false }),
}));

// Mock PWA hook
vi.mock("../hooks/usePwaInstall", () => ({
  usePwaInstall: () => ({ canInstall: false, installed: false, promptInstall: vi.fn() }),
}));

// Mock data
vi.mock("../data", () => ({
  sessions: [
    { id: "s1", title: "Test Session", speaker: "Alice", track: "DeFi", type: "Talk", time: "10:00", date: "March 30", stage: "Main", interested: 10, trend: "up", up: true, tags: [], desc: "" },
  ],
}));
vi.mock("../data/social", () => ({
  VIBES: [],
}));

// Mock onboarding sub-components (SplashStep, SlideStep, InterestPicker, SessionPicker)
// We skip steps 0-5 and focus on step 6 (wallet + QR)
vi.mock("../components/onboarding", () => ({
  SplashStep: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>SplashNext</button>,
  SlideStep: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>SlideNext</button>,
  InterestPicker: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>InterestNext</button>,
  SessionPicker: ({ onNext }: { onNext: () => void }) => <button onClick={onNext}>SessionNext</button>,
  WalletPickerModal: ({ onClose, onCreateEmbedded, embeddedMode, onBackupDone }: {
    onClose: () => void;
    onCreateEmbedded: (pw: string) => Promise<void>;
    embeddedMode: string;
    onBackupDone: () => void;
  }) => (
    <div data-testid="wallet-picker-modal">
      <button onClick={() => onCreateEmbedded("testpass")}>MockCreateEmbedded</button>
      <button onClick={onClose}>MockClose</button>
      {embeddedMode === "backup" && <button onClick={onBackupDone}>MockBackupDone</button>}
    </div>
  ),
}));

// Mock SplashBg and other UI
vi.mock("../components/ui/SplashBg", () => ({
  SplashBg: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../components/ui/CBends", () => ({
  CBends: () => <div data-testid="cbends" />,
}));

import OnboardingPage from "../pages/OnboardingPage";

// ─── Helper: advance to step 6 ───────────────────────────────────

function renderAndAdvanceToStep6() {
  const result = render(<OnboardingPage />);

  // Step 0 → 1
  fireEvent.click(screen.getByText("SplashNext"));
  // Step 1 → 2
  fireEvent.click(screen.getByText("SlideNext"));
  // Step 2 → 3
  fireEvent.click(screen.getByText("SlideNext"));
  // Step 3 → 4
  fireEvent.click(screen.getByText("SlideNext"));
  // Step 4 → 5
  fireEvent.click(screen.getByText("InterestNext"));
  // Step 5 → 6
  fireEvent.click(screen.getByText("SessionNext"));

  return result;
}

// ─── Tests ────────────────────────────────────────────────────────

describe("Onboarding Step 6 — QR Code + Embedded Wallet", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows 'Review & publish' heading at step 6", () => {
    renderAndAdvanceToStep6();
    expect(screen.getByText("Review & publish")).toBeTruthy();
  });

  it("shows QR placeholder when wallet is not connected", () => {
    renderAndAdvanceToStep6();
    expect(screen.getByText("QR Code")).toBeTruthy();
    expect(screen.getByText("Connect wallet to show your address QR")).toBeTruthy();
  });

  it("shows Connect Wallet button when idle", () => {
    renderAndAdvanceToStep6();
    expect(screen.getByText("Connect Wallet")).toBeTruthy();
  });

  it("opens WalletPickerModal on Connect Wallet click", () => {
    renderAndAdvanceToStep6();
    fireEvent.click(screen.getByText("Connect Wallet"));
    expect(screen.getByTestId("wallet-picker-modal")).toBeTruthy();
  });

  it("creates embedded wallet and shows QR code with address", async () => {
    const FAKE_ADDR = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
    const FAKE_PK = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

    mockCreateEmbeddedWallet.mockResolvedValue({
      address: FAKE_ADDR,
      privateKey: FAKE_PK,
    });

    const mockProvider = {
      getBalance: vi.fn().mockResolvedValue(BigInt(0)),
    };
    const mockConn = {
      provider: mockProvider,
      signer: {},
      proxy: {},
      multiVault: {},
      address: FAKE_ADDR,
      ethers: { formatEther: (v: bigint) => (Number(v) / 1e18).toString() },
    };
    mockConnectEmbeddedWallet.mockResolvedValue(mockConn);

    renderAndAdvanceToStep6();

    // Open modal
    fireEvent.click(screen.getByText("Connect Wallet"));

    // Create embedded wallet via mock modal
    fireEvent.click(screen.getByText("MockCreateEmbedded"));

    await waitFor(() => {
      expect(mockCreateEmbeddedWallet).toHaveBeenCalledWith("testpass");
      expect(mockConnectEmbeddedWallet).toHaveBeenCalledWith("testpass");
    });

    // After wallet creation, QR code should appear (SVG from qrcode.react)
    await waitFor(() => {
      const svgs = document.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });

    // Truncated address should be displayed
    await waitFor(() => {
      expect(screen.getByText(/0xAbCd.*Ef12/)).toBeTruthy();
    });
  });

  it("shows 'Waiting for $TRUST...' when balance is 0", async () => {
    const FAKE_ADDR = "0x1111111111111111111111111111111111111111";

    mockCreateEmbeddedWallet.mockResolvedValue({
      address: FAKE_ADDR,
      privateKey: "0x0",
    });

    const mockConn = {
      provider: { getBalance: vi.fn().mockResolvedValue(BigInt(0)) },
      signer: {},
      proxy: {},
      multiVault: {},
      address: FAKE_ADDR,
      ethers: { formatEther: () => "0" },
    };
    mockConnectEmbeddedWallet.mockResolvedValue(mockConn);

    renderAndAdvanceToStep6();
    fireEvent.click(screen.getByText("Connect Wallet"));
    fireEvent.click(screen.getByText("MockCreateEmbedded"));

    await waitFor(() => {
      expect(screen.getByText("Waiting for $TRUST...")).toBeTruthy();
    });
  });

  it("shows balance when TRUST is available", async () => {
    const FAKE_ADDR = "0x2222222222222222222222222222222222222222";

    mockCreateEmbeddedWallet.mockResolvedValue({
      address: FAKE_ADDR,
      privateKey: "0x0",
    });

    const mockConn = {
      provider: { getBalance: vi.fn().mockResolvedValue(BigInt(5e17)) },
      signer: {},
      proxy: {},
      multiVault: {},
      address: FAKE_ADDR,
      ethers: { formatEther: () => "0.5000" },
    };
    mockConnectEmbeddedWallet.mockResolvedValue(mockConn);

    renderAndAdvanceToStep6();
    fireEvent.click(screen.getByText("Connect Wallet"));
    fireEvent.click(screen.getByText("MockCreateEmbedded"));

    await waitFor(() => {
      expect(screen.getByText("0.5000 TRUST")).toBeTruthy();
    });
  });

  it("shows transaction details with chain info", () => {
    renderAndAdvanceToStep6();
    expect(screen.getByText("Transaction Details")).toBeTruthy();
    expect(screen.getByText("Intuition (Chain 1155)")).toBeTruthy();
  });

  it("shows Back button to return to step 5", () => {
    renderAndAdvanceToStep6();
    const backBtn = screen.getByText("Back");
    expect(backBtn).toBeTruthy();
  });

  it("shows backup private key inline after wallet creation", async () => {
    const FAKE_ADDR = "0x3333333333333333333333333333333333333333";
    const FAKE_PK = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    mockCreateEmbeddedWallet.mockResolvedValue({
      address: FAKE_ADDR,
      privateKey: FAKE_PK,
    });

    const mockConn = {
      provider: { getBalance: vi.fn().mockResolvedValue(BigInt(0)) },
      signer: {},
      proxy: {},
      multiVault: {},
      address: FAKE_ADDR,
      ethers: { formatEther: () => "0" },
    };
    mockConnectEmbeddedWallet.mockResolvedValue(mockConn);

    renderAndAdvanceToStep6();
    fireEvent.click(screen.getByText("Connect Wallet"));
    fireEvent.click(screen.getByText("MockCreateEmbedded"));

    // The inline backup UI shows the private key
    await waitFor(() => {
      expect(screen.getByText(/Save your private key/)).toBeTruthy();
      expect(screen.getByText(FAKE_PK)).toBeTruthy();
    });
  });

  it("dismisses backup and shows publish button on 'I've saved it'", async () => {
    const FAKE_ADDR = "0x4444444444444444444444444444444444444444";

    mockCreateEmbeddedWallet.mockResolvedValue({
      address: FAKE_ADDR,
      privateKey: "0xbb",
    });

    const mockConn = {
      provider: { getBalance: vi.fn().mockResolvedValue(BigInt(1e18)) },
      signer: {},
      proxy: {},
      multiVault: {},
      address: FAKE_ADDR,
      ethers: { formatEther: () => "1.0000" },
    };
    mockConnectEmbeddedWallet.mockResolvedValue(mockConn);

    renderAndAdvanceToStep6();
    fireEvent.click(screen.getByText("Connect Wallet"));
    fireEvent.click(screen.getByText("MockCreateEmbedded"));

    // Wait for backup mode to show
    await waitFor(() => {
      expect(screen.getByText("I've saved it — Continue")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("I've saved it — Continue"));

    await waitFor(() => {
      expect(mockMarkBackupDone).toHaveBeenCalled();
    });
  });

  it("stores wallet address in localStorage after creation", async () => {
    const FAKE_ADDR = "0x5555555555555555555555555555555555555555";

    mockCreateEmbeddedWallet.mockResolvedValue({
      address: FAKE_ADDR,
      privateKey: "0x0",
    });

    const mockConn = {
      provider: { getBalance: vi.fn().mockResolvedValue(BigInt(0)) },
      signer: {},
      proxy: {},
      multiVault: {},
      address: FAKE_ADDR,
      ethers: { formatEther: () => "0" },
    };
    mockConnectEmbeddedWallet.mockResolvedValue(mockConn);

    renderAndAdvanceToStep6();
    fireEvent.click(screen.getByText("Connect Wallet"));
    fireEvent.click(screen.getByText("MockCreateEmbedded"));

    await waitFor(() => {
      expect(localStorage.getItem("ethcc-wallet-address")).toBe(FAKE_ADDR);
    });
  });
});
