import { describe, it, expect, vi } from "vitest";
import { TransactionValidationService } from "./TransactionValidationService";
import {
  createMockWallet,
  createMockWalletInsufficientBalance,
  createMockWalletMissingAtoms,
  createMockWalletSimulationFailure,
} from "../test/mocks/walletMocks";

describe("TransactionValidationService", () => {
  describe("validateTripleCreation", () => {
    it("should validate successful triple creation", async () => {
      const wallet = createMockWallet();
      const validation = {
        subjectIds: ["0x111", "0x222"],
        predicateIds: ["0xaaa", "0xbbb"],
        objectIds: ["0x333", "0x444"],
        depositPerTriple: 100000000000000000n,
      };

      const result = await TransactionValidationService.validateTripleCreation(
        wallet,
        validation
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.costBreakdown).toBeDefined();
      expect(result.balanceCheck).toBeDefined();
      expect(result.simulation).toBeDefined();
      expect(result.simulation?.success).toBe(true);
    });

    it("should detect array length mismatch", async () => {
      const wallet = createMockWallet();
      const validation = {
        subjectIds: ["0x111", "0x222"],
        predicateIds: ["0xaaa"],  // Mismatch!
        objectIds: ["0x333", "0x444"],
      };

      const result = await TransactionValidationService.validateTripleCreation(
        wallet,
        validation
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("INVALID_INPUT");
      expect(result.errors[0].message).toContain("Array length mismatch");
    });

    it("should detect empty triple list", async () => {
      const wallet = createMockWallet();
      const validation = {
        subjectIds: [],
        predicateIds: [],
        objectIds: [],
      };

      const result = await TransactionValidationService.validateTripleCreation(
        wallet,
        validation
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("INVALID_INPUT");
      expect(result.errors[0].message).toContain("No triples to create");
    });

    it("should detect missing atoms", async () => {
      const wallet = createMockWalletMissingAtoms(["0x222", "0x444"]);
      const validation = {
        subjectIds: ["0x111", "0x222"],
        predicateIds: ["0xaaa", "0xbbb"],
        objectIds: ["0x333", "0x444"],
      };

      const result = await TransactionValidationService.validateTripleCreation(
        wallet,
        validation
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe("ATOM_MISSING");
      expect(result.errors[0].message).toContain("do not exist on-chain");
    });

    it("should detect insufficient balance", async () => {
      const wallet = createMockWalletInsufficientBalance();
      const validation = {
        subjectIds: ["0x111"],
        predicateIds: ["0xaaa"],
        objectIds: ["0x333"],
      };

      const result = await TransactionValidationService.validateTripleCreation(
        wallet,
        validation
      );

      expect(result.isValid).toBe(false);
      const insufficientError = result.errors.find(e => e.type === "INSUFFICIENT_BALANCE");
      expect(insufficientError).toBeDefined();
      expect(insufficientError?.message).toContain("Insufficient $TRUST");
    });

    it("should detect simulation failure", async () => {
      const wallet = createMockWalletSimulationFailure("gas estimation failed");
      const validation = {
        subjectIds: ["0x111"],
        predicateIds: ["0xaaa"],
        objectIds: ["0x333"],
      };

      const result = await TransactionValidationService.validateTripleCreation(
        wallet,
        validation
      );

      expect(result.isValid).toBe(false);
      const simError = result.errors.find(e => e.type === "SIMULATION_FAILED");
      expect(simError).toBeDefined();
    });

    it("should provide warnings for low balance", async () => {
      const wallet = createMockWallet();
      // Balance = 1 ETH, cost = 0.95 ETH → less than 10% buffer
      wallet.provider.getBalance = vi.fn().mockResolvedValue(1000000000000000000n);
      wallet.proxy.getTotalCreationCost = vi.fn().mockResolvedValue(950000000000000000n);

      const validation = {
        subjectIds: ["0x111"],
        predicateIds: ["0xaaa"],
        objectIds: ["0x333"],
      };

      const result = await TransactionValidationService.validateTripleCreation(
        wallet,
        validation
      );

      expect(result.isValid).toBe(true); // Not blocking
      expect(result.warnings.length).toBeGreaterThan(0);
      const lowBalanceWarning = result.warnings.find(w => w.type === "LOW_BALANCE");
      expect(lowBalanceWarning).toBeDefined();
    });

    it("should provide warnings for large batch", async () => {
      const wallet = createMockWallet();
      const validation = {
        subjectIds: Array(30).fill("0x111"),
        predicateIds: Array(30).fill("0xaaa"),
        objectIds: Array(30).fill("0x333"),
      };

      const result = await TransactionValidationService.validateTripleCreation(
        wallet,
        validation
      );

      const largeBatchWarning = result.warnings.find(w => w.type === "LARGE_BATCH");
      expect(largeBatchWarning).toBeDefined();
      expect(largeBatchWarning?.message).toContain("Large batch size");
    });
  });

  describe("validateDepositBatch", () => {
    it("should validate successful deposit batch", async () => {
      const wallet = createMockWallet();
      const validation = {
        termIds: ["0x111", "0x222", "0x333"],
        depositPerTerm: 100000000000000000n,
      };

      const result = await TransactionValidationService.validateDepositBatch(
        wallet,
        validation
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.costBreakdown).toBeDefined();
      expect(result.balanceCheck).toBeDefined();
    });

    it("should detect empty term list", async () => {
      const wallet = createMockWallet();
      const validation = {
        termIds: [],
      };

      const result = await TransactionValidationService.validateDepositBatch(
        wallet,
        validation
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe("INVALID_INPUT");
      expect(result.errors[0].message).toContain("No terms to deposit");
    });

    it("should detect missing terms", async () => {
      const wallet = createMockWalletMissingAtoms(["0x222"]);
      const validation = {
        termIds: ["0x111", "0x222"],
      };

      const result = await TransactionValidationService.validateDepositBatch(
        wallet,
        validation
      );

      expect(result.isValid).toBe(false);
      const atomError = result.errors.find(e => e.type === "ATOM_MISSING");
      expect(atomError).toBeDefined();
    });

    it("should detect insufficient balance for deposit", async () => {
      const wallet = createMockWalletInsufficientBalance();
      const validation = {
        termIds: ["0x111", "0x222", "0x333"],
      };

      const result = await TransactionValidationService.validateDepositBatch(
        wallet,
        validation
      );

      expect(result.isValid).toBe(false);
      const balanceError = result.errors.find(e => e.type === "INSUFFICIENT_BALANCE");
      expect(balanceError).toBeDefined();
    });
  });

  describe("validateBatchedTripleCreation", () => {
    it("should validate batched creation successfully", async () => {
      const wallet = createMockWallet();
      wallet.provider.getBalance = vi.fn().mockResolvedValue(10000000000000000000n); // 10 ETH
      const validation = {
        subjectIds: Array(60).fill("0x111"),
        predicateIds: Array(60).fill("0xaaa"),
        objectIds: Array(60).fill("0x333"),
      };
      const batchSize = 25;

      const result = await TransactionValidationService.validateBatchedTripleCreation(
        wallet,
        validation,
        batchSize
      );

      expect(result.isValid).toBe(true);
      expect(result.costBreakdown).toBeDefined();
      expect(result.balanceCheck).toBeDefined();
    });

    it("should detect insufficient balance for all batches", async () => {
      const wallet = createMockWalletInsufficientBalance();
      wallet.provider.getBalance = vi.fn().mockResolvedValue(100000000000000000n); // 0.1 ETH
      const validation = {
        subjectIds: Array(60).fill("0x111"),
        predicateIds: Array(60).fill("0xaaa"),
        objectIds: Array(60).fill("0x333"),
      };
      const batchSize = 25;

      const result = await TransactionValidationService.validateBatchedTripleCreation(
        wallet,
        validation,
        batchSize
      );

      expect(result.isValid).toBe(false);
      const balanceError = result.errors.find(e => e.type === "INSUFFICIENT_BALANCE");
      expect(balanceError).toBeDefined();
      expect(balanceError?.message).toContain("all batches");
    });

    it("should warn about multiple signatures required", async () => {
      const wallet = createMockWallet();
      wallet.provider.getBalance = vi.fn().mockResolvedValue(10000000000000000000n);
      const validation = {
        subjectIds: Array(60).fill("0x111"),
        predicateIds: Array(60).fill("0xaaa"),
        objectIds: Array(60).fill("0x333"),
      };
      const batchSize = 25;

      const result = await TransactionValidationService.validateBatchedTripleCreation(
        wallet,
        validation,
        batchSize
      );

      const multiSigWarning = result.warnings.find(w => w.type === "LARGE_BATCH");
      expect(multiSigWarning).toBeDefined();
      expect(multiSigWarning?.message).toContain("separate transactions");
    });

    it("should not warn for single batch", async () => {
      const wallet = createMockWallet();
      wallet.provider.getBalance = vi.fn().mockResolvedValue(10000000000000000000n);
      const validation = {
        subjectIds: Array(10).fill("0x111"),
        predicateIds: Array(10).fill("0xaaa"),
        objectIds: Array(10).fill("0x333"),
      };
      const batchSize = 25;

      const result = await TransactionValidationService.validateBatchedTripleCreation(
        wallet,
        validation,
        batchSize
      );

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("quickBalanceCheck", () => {
    it("should return true for sufficient balance", async () => {
      const wallet = createMockWallet();
      wallet.provider.getBalance = vi.fn().mockResolvedValue(2000000000000000000n);
      const estimatedCost = 1000000000000000000n;

      const result = await TransactionValidationService.quickBalanceCheck(
        wallet,
        estimatedCost
      );

      expect(result).toBe(true);
    });

    it("should return false for insufficient balance", async () => {
      const wallet = createMockWalletInsufficientBalance();
      wallet.provider.getBalance = vi.fn().mockResolvedValue(100000000000000000n);
      const estimatedCost = 500000000000000000n;

      const result = await TransactionValidationService.quickBalanceCheck(
        wallet,
        estimatedCost
      );

      expect(result).toBe(false);
    });

    it("should handle exact balance match", async () => {
      const wallet = createMockWallet();
      const amount = 1000000000000000000n;
      wallet.provider.getBalance = vi.fn().mockResolvedValue(amount);

      const result = await TransactionValidationService.quickBalanceCheck(
        wallet,
        amount
      );

      expect(result).toBe(true);
    });
  });
});
