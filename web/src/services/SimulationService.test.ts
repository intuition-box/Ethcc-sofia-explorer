import { describe, it, expect, vi } from "vitest";
import { SimulationService } from "./SimulationService";
import {
  createMockWallet,
  createMockWalletInsufficientBalance,
  createMockWalletSimulationFailure,
  createMockWalletMissingAtoms,
} from "../test/mocks/walletMocks";

describe("SimulationService", () => {
  describe("simulateTransaction", () => {
    it("should successfully simulate a valid transaction", async () => {
      const wallet = createMockWallet();
      const contractAddress = "0x123";
      const data = "0xabcd";
      const value = 1000000000000000000n;

      const result = await SimulationService.simulateTransaction(
        wallet,
        contractAddress,
        data,
        value
      );

      expect(result.success).toBe(true);
      expect(result.gasEstimate).toBe(100000n);
      expect(result.error).toBeUndefined();
      expect(wallet.provider.call).toHaveBeenCalledWith({
        to: contractAddress,
        data,
        value,
        from: wallet.address,
      });
    });

    it("should detect insufficient funds error", async () => {
      const wallet = createMockWalletSimulationFailure("insufficient funds for transfer");

      const result = await SimulationService.simulateTransaction(
        wallet,
        "0x123",
        "0xabcd",
        1000000000000000000n
      );

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("INSUFFICIENT_FUNDS");
      expect(result.error).toContain("insufficient funds");
    });

    it("should detect atom missing error", async () => {
      const wallet = createMockWalletSimulationFailure("TermDoesNotExist");

      const result = await SimulationService.simulateTransaction(
        wallet,
        "0x123",
        "0xabcd",
        1000000000000000000n
      );

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("ATOM_MISSING");
    });

    it("should detect gas error", async () => {
      const wallet = createMockWalletSimulationFailure("exceeds block gas limit");

      const result = await SimulationService.simulateTransaction(
        wallet,
        "0x123",
        "0xabcd",
        1000000000000000000n
      );

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("GAS_ERROR");
    });

    it("should detect user rejected error", async () => {
      const wallet = createMockWalletSimulationFailure("user rejected transaction");

      const result = await SimulationService.simulateTransaction(
        wallet,
        "0x123",
        "0xabcd",
        1000000000000000000n
      );

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("USER_REJECTED");
    });

    it("should detect triple exists error", async () => {
      const wallet = createMockWalletSimulationFailure("MultiVault_TripleExists");

      const result = await SimulationService.simulateTransaction(
        wallet,
        "0x123",
        "0xabcd",
        1000000000000000000n
      );

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("TRIPLE_EXISTS");
    });

    it("should return UNKNOWN error type for unrecognized errors", async () => {
      const wallet = createMockWalletSimulationFailure("some random error");

      const result = await SimulationService.simulateTransaction(
        wallet,
        "0x123",
        "0xabcd",
        1000000000000000000n
      );

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("UNKNOWN");
    });
  });

  describe("simulateCreateTriples", () => {
    it("should simulate triple creation successfully", async () => {
      const wallet = createMockWallet();
      const subjectIds = ["0x111", "0x222"];
      const predicateIds = ["0xaaa", "0xbbb"];
      const objectIds = ["0x333", "0x444"];
      const assets = [100000000000000000n, 100000000000000000n];
      const totalCost = 500000000000000000n;

      const result = await SimulationService.simulateCreateTriples(
        wallet,
        subjectIds,
        predicateIds,
        objectIds,
        assets,
        totalCost
      );

      expect(result.success).toBe(true);
      expect(wallet.proxy.interface.encodeFunctionData).toHaveBeenCalledWith(
        "createTriples",
        expect.arrayContaining([wallet.address, subjectIds, predicateIds, objectIds, assets])
      );
    });

    it("should fail simulation if insufficient balance", async () => {
      const wallet = createMockWalletSimulationFailure("insufficient funds");
      const subjectIds = ["0x111"];
      const predicateIds = ["0xaaa"];
      const objectIds = ["0x333"];
      const assets = [100000000000000000n];
      const totalCost = 500000000000000000n;

      const result = await SimulationService.simulateCreateTriples(
        wallet,
        subjectIds,
        predicateIds,
        objectIds,
        assets,
        totalCost
      );

      expect(result.success).toBe(false);
      expect(result.errorType).toBe("INSUFFICIENT_FUNDS");
    });
  });

  describe("simulateDepositBatch", () => {
    it("should simulate deposit batch successfully", async () => {
      const wallet = createMockWallet();
      const termIds = ["0x111", "0x222", "0x333"];
      const assets = [100000000000000000n, 100000000000000000n, 100000000000000000n];
      const totalValue = 350000000000000000n;

      const result = await SimulationService.simulateDepositBatch(
        wallet,
        termIds,
        assets,
        totalValue
      );

      expect(result.success).toBe(true);
      expect(wallet.proxy.interface.encodeFunctionData).toHaveBeenCalledWith(
        "depositBatch",
        expect.any(Array)
      );
    });
  });

  describe("checkBalance", () => {
    it("should return hasEnough=true when balance is sufficient", async () => {
      const wallet = createMockWallet();
      wallet.provider.getBalance = vi.fn().mockResolvedValue(2000000000000000000n); // 2 ETH
      const requiredAmount = 1000000000000000000n; // 1 ETH

      const result = await SimulationService.checkBalance(wallet, requiredAmount);

      expect(result.hasEnough).toBe(true);
      expect(result.balance).toBe(2000000000000000000n);
      expect(result.required).toBe(1000000000000000000n);
      expect(result.deficit).toBe(0n);
    });

    it("should return hasEnough=false when balance is insufficient", async () => {
      const wallet = createMockWalletInsufficientBalance();
      wallet.provider.getBalance = vi.fn().mockResolvedValue(100000000000000000n); // 0.1 ETH
      const requiredAmount = 500000000000000000n; // 0.5 ETH

      const result = await SimulationService.checkBalance(wallet, requiredAmount);

      expect(result.hasEnough).toBe(false);
      expect(result.balance).toBe(100000000000000000n);
      expect(result.required).toBe(500000000000000000n);
      expect(result.deficit).toBe(400000000000000000n); // 0.4 ETH
    });

    it("should handle exact balance match", async () => {
      const wallet = createMockWallet();
      const amount = 1000000000000000000n;
      wallet.provider.getBalance = vi.fn().mockResolvedValue(amount);

      const result = await SimulationService.checkBalance(wallet, amount);

      expect(result.hasEnough).toBe(true);
      expect(result.deficit).toBe(0n);
    });
  });

  describe("verifyAtomsExist", () => {
    it("should return empty array when all atoms exist", async () => {
      const wallet = createMockWallet();
      const atomIds = ["0x111", "0x222", "0x333"];

      const missing = await SimulationService.verifyAtomsExist(
        wallet.multiVault,
        atomIds
      );

      expect(missing).toEqual([]);
      expect(wallet.multiVault.isTermCreated).toHaveBeenCalledTimes(3);
    });

    it("should return missing atom IDs", async () => {
      const missingIds = ["0x222", "0x444"];
      const wallet = createMockWalletMissingAtoms(missingIds);
      const atomIds = ["0x111", "0x222", "0x333", "0x444"];

      const missing = await SimulationService.verifyAtomsExist(
        wallet.multiVault,
        atomIds
      );

      expect(missing).toEqual(missingIds);
    });

    it("should handle empty atom list", async () => {
      const wallet = createMockWallet();

      const missing = await SimulationService.verifyAtomsExist(
        wallet.multiVault,
        []
      );

      expect(missing).toEqual([]);
      expect(wallet.multiVault.isTermCreated).not.toHaveBeenCalled();
    });

    it("should handle errors during atom verification", async () => {
      const wallet = createMockWallet();
      wallet.multiVault.isTermCreated = vi.fn().mockRejectedValue(new Error("Network error"));
      const atomIds = ["0x111"];

      const missing = await SimulationService.verifyAtomsExist(
        wallet.multiVault,
        atomIds
      );

      expect(missing).toEqual(["0x111"]); // Treats error as missing
    });
  });

  describe("simulateCreateAtoms", () => {
    it("should simulate atom creation successfully", async () => {
      const wallet = createMockWallet();
      const atomDataArray = ["0xdata1", "0xdata2"];
      const assets = [50000000000000000n, 50000000000000000n];
      const totalCost = 200000000000000000n;

      const result = await SimulationService.simulateCreateAtoms(
        wallet,
        atomDataArray,
        assets,
        totalCost
      );

      expect(result.success).toBe(true);
      expect(wallet.proxy.interface.encodeFunctionData).toHaveBeenCalledWith(
        "createAtoms",
        expect.any(Array)
      );
    });
  });
});
