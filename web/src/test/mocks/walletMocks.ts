import { vi } from "vitest";
import type { WalletConnection } from "../../services/intuition";

/**
 * Mock wallet connection for testing.
 * Provides stubs for provider, signer, contracts, etc.
 */
export function createMockWallet(overrides?: Partial<WalletConnection>): WalletConnection {
  const mockProvider = {
    call: vi.fn().mockResolvedValue("0x"),
    estimateGas: vi.fn().mockResolvedValue(100000n),
    getBalance: vi.fn().mockResolvedValue(1000000000000000000n), // 1 ETH
    send: vi.fn().mockResolvedValue({}),
  };

  const mockSigner = {
    getAddress: vi.fn().mockResolvedValue("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
  };

  const mockProxy = {
    interface: {
      encodeFunctionData: vi.fn().mockReturnValue("0xabcd"),
    },
    getTotalCreationCost: vi.fn().mockResolvedValue(500000000000000000n), // 0.5 ETH
    calculateDepositFee: vi.fn().mockResolvedValue(10000000000000000n), // 0.01 ETH
    createTriples: vi.fn().mockResolvedValue({
      hash: "0x123",
      wait: vi.fn().mockResolvedValue({ status: 1, blockNumber: 12345 }),
    }),
    createAtoms: vi.fn().mockResolvedValue({
      hash: "0x456",
      wait: vi.fn().mockResolvedValue({ status: 1, blockNumber: 12346 }),
    }),
    depositBatch: vi.fn().mockResolvedValue({
      hash: "0x789",
      wait: vi.fn().mockResolvedValue({ status: 1, blockNumber: 12347 }),
    }),
    creationFixedFee: vi.fn().mockResolvedValue(1000000000000000n), // 0.001 ETH
    depositFixedFee: vi.fn().mockResolvedValue(500000000000000n), // 0.0005 ETH
    depositPercentageFee: vi.fn().mockResolvedValue(100n), // 1% (100 basis points)
  };

  const mockMultiVault = {
    getTripleCost: vi.fn().mockResolvedValue(100000000000000000n), // 0.1 ETH
    getAtomCost: vi.fn().mockResolvedValue(50000000000000000n), // 0.05 ETH
    isTermCreated: vi.fn().mockResolvedValue(true),
    calculateAtomId: vi.fn().mockResolvedValue("0xabc123"),
    getTriple: vi.fn().mockResolvedValue({
      subjectId: "0x111",
      predicateId: "0x222",
      objectId: "0x333",
    }),
  };

  const mockEthers = {
    formatEther: (value: bigint) => (Number(value) / 1e18).toString(),
    parseEther: (value: string) => BigInt(Math.floor(parseFloat(value) * 1e18)),
    hexlify: (value: Uint8Array | string) => `0x${value}`,
    toUtf8Bytes: (value: string) => new TextEncoder().encode(value),
    BrowserProvider: vi.fn(),
    Contract: vi.fn(),
  };

  return {
    provider: mockProvider as any,
    signer: mockSigner as any,
    proxy: mockProxy as any,
    multiVault: mockMultiVault as any,
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    ethers: mockEthers as any,
    ...overrides,
  };
}

/**
 * Create a mock wallet with insufficient balance.
 */
export function createMockWalletInsufficientBalance(): WalletConnection {
  const wallet = createMockWallet();
  wallet.provider.getBalance = vi.fn().mockResolvedValue(100000000000000000n); // 0.1 ETH
  return wallet;
}

/**
 * Create a mock wallet where simulation fails.
 */
export function createMockWalletSimulationFailure(errorMessage: string): WalletConnection {
  const wallet = createMockWallet();
  wallet.provider.call = vi.fn(() => Promise.reject(new Error(errorMessage)));
  wallet.provider.estimateGas = vi.fn(() => Promise.reject(new Error(errorMessage)));
  return wallet;
}

/**
 * Create a mock wallet where atoms don't exist.
 */
export function createMockWalletMissingAtoms(missingIds: string[]): WalletConnection {
  const wallet = createMockWallet();
  wallet.multiVault.isTermCreated = vi.fn().mockImplementation((id: string) => {
    return Promise.resolve(!missingIds.includes(id));
  });
  return wallet;
}

/**
 * Mock window.ethereum for wallet tests.
 */
export function mockWindowEthereum() {
  const mockEthereum = {
    request: vi.fn().mockResolvedValue(["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"]),
    on: vi.fn(),
    removeListener: vi.fn(),
  };

  Object.defineProperty(globalThis, "window", {
    value: { ethereum: mockEthereum },
    writable: true,
  });

  return mockEthereum;
}
