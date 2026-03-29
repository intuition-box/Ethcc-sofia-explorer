import { describe, it, expect, vi } from "vitest";
import { FeeCalculationService } from "./FeeCalculationService";
import { createMockWallet } from "../test/mocks/walletMocks";

describe("FeeCalculationService", () => {
  describe("calculateTripleCreationCost", () => {
    it("should calculate cost for creating triples", async () => {
      const wallet = createMockWallet();
      const tripleCount = 5;
      const depositPerTriple = 100000000000000000n; // 0.1 ETH

      const result = await FeeCalculationService.calculateTripleCreationCost(
        wallet,
        tripleCount,
        depositPerTriple
      );

      expect(result.itemCount).toBe(5);
      expect(result.depositPerItem).toBe(depositPerTriple);
      expect(result.depositAmount).toBe(500000000000000000n); // 5 * 0.1 ETH
      expect(result.tripleCost).toBe(100000000000000000n); // From mock
      expect(result.grandTotal).toBeGreaterThan(0n);
      expect(wallet.multiVault.getTripleCost).toHaveBeenCalled();
      expect(wallet.proxy.getTotalCreationCost).toHaveBeenCalled();
    });

    it("should use default deposit if not provided", async () => {
      const wallet = createMockWallet();
      const tripleCount = 3;

      const result = await FeeCalculationService.calculateTripleCreationCost(
        wallet,
        tripleCount
      );

      expect(result.depositPerItem).toBe(100000000000000000n); // DEFAULT_DEPOSIT_PER_TRIPLE
    });

    it("should calculate sofia fees correctly", async () => {
      const wallet = createMockWallet();
      const tripleCount = 2;

      const result = await FeeCalculationService.calculateTripleCreationCost(
        wallet,
        tripleCount
      );

      expect(result.sofiaFeeTotal).toBe(result.grandTotal - result.multiVaultTotal);
      expect(result.sofiaFeeTotal).toBeGreaterThanOrEqual(0n);
    });

    it("should handle zero triple count", async () => {
      const wallet = createMockWallet();

      const result = await FeeCalculationService.calculateTripleCreationCost(
        wallet,
        0
      );

      expect(result.itemCount).toBe(0);
      expect(result.depositAmount).toBe(0n);
      expect(result.grandTotal).toBe(500000000000000000n); // Mock returns fixed value
    });
  });

  describe("calculateAtomCreationCost", () => {
    it("should calculate cost for creating atoms", async () => {
      const wallet = createMockWallet();
      const atomCount = 3;
      const depositPerAtom = 50000000000000000n; // 0.05 ETH

      const result = await FeeCalculationService.calculateAtomCreationCost(
        wallet,
        atomCount,
        depositPerAtom
      );

      expect(result.itemCount).toBe(3);
      expect(result.depositPerItem).toBe(depositPerAtom);
      expect(result.depositAmount).toBe(150000000000000000n); // 3 * 0.05 ETH
      expect(result.atomCost).toBe(50000000000000000n); // From mock
      expect(result.tripleCost).toBe(0n); // No triples
      expect(wallet.multiVault.getAtomCost).toHaveBeenCalled();
    });
  });

  describe("calculateDepositBatchCost", () => {
    it("should calculate cost for deposit batch", async () => {
      const wallet = createMockWallet();
      const termCount = 10;
      const depositPerTerm = 100000000000000000n; // 0.1 ETH

      const result = await FeeCalculationService.calculateDepositBatchCost(
        wallet,
        termCount,
        depositPerTerm
      );

      expect(result.itemCount).toBe(10);
      expect(result.depositPerItem).toBe(depositPerTerm);
      expect(result.depositAmount).toBe(1000000000000000000n); // 10 * 0.1 ETH
      expect(result.tripleCost).toBe(0n); // No creation
      expect(result.atomCost).toBe(0n); // No creation
      expect(wallet.proxy.calculateDepositFee).toHaveBeenCalled();
    });

    it("should include deposit fee in grand total", async () => {
      const wallet = createMockWallet();
      wallet.proxy.calculateDepositFee = vi.fn().mockResolvedValue(20000000000000000n); // 0.02 ETH
      const termCount = 5;
      const depositPerTerm = 100000000000000000n; // 0.1 ETH

      const result = await FeeCalculationService.calculateDepositBatchCost(
        wallet,
        termCount,
        depositPerTerm
      );

      const expectedDeposit = 500000000000000000n; // 5 * 0.1 ETH
      const expectedFee = 20000000000000000n; // 0.02 ETH
      expect(result.grandTotal).toBe(expectedDeposit + expectedFee);
    });
  });

  describe("estimateBatchedTripleCreation", () => {
    it("should estimate cost for multiple batches", async () => {
      const wallet = createMockWallet();
      const tripleCount = 60; // Will create 3 batches of 25, 25, 10
      const batchSize = 25;

      const result = await FeeCalculationService.estimateBatchedTripleCreation(
        wallet,
        tripleCount,
        batchSize
      );

      expect(result.batchCount).toBe(3);
      expect(result.batches).toHaveLength(3);
      expect(result.batches[0].itemCount).toBe(25);
      expect(result.batches[1].itemCount).toBe(25);
      expect(result.batches[2].itemCount).toBe(10);
      expect(result.totalCost).toBeGreaterThan(0n);
    });

    it("should handle exact batch size match", async () => {
      const wallet = createMockWallet();
      const tripleCount = 50;
      const batchSize = 25;

      const result = await FeeCalculationService.estimateBatchedTripleCreation(
        wallet,
        tripleCount,
        batchSize
      );

      expect(result.batchCount).toBe(2);
      expect(result.batches[0].itemCount).toBe(25);
      expect(result.batches[1].itemCount).toBe(25);
    });

    it("should handle single batch", async () => {
      const wallet = createMockWallet();
      const tripleCount = 10;
      const batchSize = 25;

      const result = await FeeCalculationService.estimateBatchedTripleCreation(
        wallet,
        tripleCount,
        batchSize
      );

      expect(result.batchCount).toBe(1);
      expect(result.batches[0].itemCount).toBe(10);
    });

    it("should calculate total cost correctly", async () => {
      const wallet = createMockWallet();
      wallet.proxy.getTotalCreationCost = vi.fn()
        .mockResolvedValueOnce(100000000000000000n) // Batch 1: 0.1 ETH
        .mockResolvedValueOnce(150000000000000000n); // Batch 2: 0.15 ETH

      const tripleCount = 30;
      const batchSize = 20;

      const result = await FeeCalculationService.estimateBatchedTripleCreation(
        wallet,
        tripleCount,
        batchSize
      );

      expect(result.totalCost).toBe(250000000000000000n); // 0.1 + 0.15 ETH
    });
  });

  describe("formatTrust", () => {
    it("should format bigint to readable $TRUST string", () => {
      const amount = 1234567890123456789n; // 1.234... ETH

      const result = FeeCalculationService.formatTrust(amount, 4);

      expect(result).toBe("1.2346"); // Rounded to 4 decimals
    });

    it("should format zero correctly", () => {
      const result = FeeCalculationService.formatTrust(0n);
      expect(result).toBe("0.0000");
    });

    it("should format small amounts correctly", () => {
      const amount = 1000000000000000n; // 0.001 ETH
      const result = FeeCalculationService.formatTrust(amount, 6);
      expect(result).toBe("0.001000");
    });

    it("should use default 4 decimals", () => {
      const amount = 500000000000000000n; // 0.5 ETH
      const result = FeeCalculationService.formatTrust(amount);
      expect(result).toBe("0.5000");
    });

    it("should handle very large amounts", () => {
      const amount = 1000000000000000000000n; // 1000 ETH
      const result = FeeCalculationService.formatTrust(amount, 2);
      expect(result).toBe("1000.00");
    });
  });

  describe("parseTrust", () => {
    it("should parse readable string to wei", () => {
      const result = FeeCalculationService.parseTrust("1.5");
      expect(result).toBe(1500000000000000000n); // 1.5 ETH in wei
    });

    it("should parse zero correctly", () => {
      const result = FeeCalculationService.parseTrust("0");
      expect(result).toBe(0n);
    });

    it("should parse small amounts correctly", () => {
      const result = FeeCalculationService.parseTrust("0.001");
      expect(result).toBe(1000000000000000n); // 0.001 ETH
    });

    it("should handle integer strings", () => {
      const result = FeeCalculationService.parseTrust("10");
      expect(result).toBe(10000000000000000000n); // 10 ETH
    });

    it("should handle very precise decimals", () => {
      const result = FeeCalculationService.parseTrust("0.123456789012345678");
      expect(result).toBe(123456789012345678n);
    });
  });

  describe("formatTrust + parseTrust roundtrip", () => {
    it("should maintain precision through format/parse cycle", () => {
      const original = 1234567890123456789n;
      const formatted = FeeCalculationService.formatTrust(original, 18);
      const parsed = FeeCalculationService.parseTrust(formatted);

      // Allow small precision loss due to JavaScript float math (< 0.0001%)
      const diff = parsed > original ? parsed - original : original - parsed;
      const tolerance = original / 1000000n; // 0.0001% tolerance
      expect(diff).toBeLessThan(tolerance);
    });

    it("should handle loss of precision with fewer decimals", () => {
      const original = 1234567890123456789n;
      const formatted = FeeCalculationService.formatTrust(original, 4); // Loses precision
      const parsed = FeeCalculationService.parseTrust(formatted);

      expect(parsed).not.toBe(original);
      expect(parsed).toBe(1234600000000000000n); // Rounded to 4 decimals
    });
  });
});
