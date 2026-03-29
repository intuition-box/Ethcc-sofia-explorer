import { describe, it, expect } from "vitest";
import { ErrorHandlingService } from "./ErrorHandlingService";
import type { SimulationResult } from "./SimulationService";
import type { ValidationResult, ValidationError, ValidationWarning } from "./TransactionValidationService";

describe("ErrorHandlingService", () => {
  describe("parseSimulationError", () => {
    it("should parse INSUFFICIENT_FUNDS error", () => {
      const simulation: SimulationResult = {
        success: false,
        error: "insufficient funds for transfer",
        errorType: "INSUFFICIENT_FUNDS",
      };
      const balance = 100000000000000000n; // 0.1 ETH
      const required = 500000000000000000n; // 0.5 ETH

      const result = ErrorHandlingService.parseSimulationError(
        simulation,
        balance,
        required
      );

      expect(result.title).toBe("Insufficient $TRUST");
      expect(result.message).toContain("0.5000");
      expect(result.message).toContain("0.1000");
      expect(result.solution).toContain("0.4000");
      expect(result.canRetry).toBe(true);
      expect(result.isBlocking).toBe(true);
    });

    it("should parse ATOM_MISSING error", () => {
      const simulation: SimulationResult = {
        success: false,
        error: "TermDoesNotExist",
        errorType: "ATOM_MISSING",
      };

      const result = ErrorHandlingService.parseSimulationError(simulation);

      expect(result.title).toBe("Missing On-Chain Data");
      expect(result.message).toContain("don't exist on-chain");
      expect(result.solution).toContain("refresh");
      expect(result.canRetry).toBe(true);
      expect(result.isBlocking).toBe(true);
    });

    it("should parse TRIPLE_EXISTS error", () => {
      const simulation: SimulationResult = {
        success: false,
        error: "MultiVault_TripleExists",
        errorType: "TRIPLE_EXISTS",
      };

      const result = ErrorHandlingService.parseSimulationError(simulation);

      expect(result.title).toBe("Triple Already Exists");
      expect(result.message).toContain("already exist");
      expect(result.solution).toContain("deposit more");
      expect(result.canRetry).toBe(false);
      expect(result.isBlocking).toBe(false);
    });

    it("should parse GAS_ERROR error", () => {
      const simulation: SimulationResult = {
        success: false,
        error: "exceeds block gas limit",
        errorType: "GAS_ERROR",
      };

      const result = ErrorHandlingService.parseSimulationError(simulation);

      expect(result.title).toBe("Transaction Too Large");
      expect(result.message).toContain("too much gas");
      expect(result.solution).toContain("reducing");
      expect(result.canRetry).toBe(false);
      expect(result.isBlocking).toBe(true);
    });

    it("should parse USER_REJECTED error", () => {
      const simulation: SimulationResult = {
        success: false,
        error: "user rejected transaction",
        errorType: "USER_REJECTED",
      };

      const result = ErrorHandlingService.parseSimulationError(simulation);

      expect(result.title).toBe("Transaction Cancelled");
      expect(result.message).toContain("cancelled");
      expect(result.solution).toContain("try again when ready");
      expect(result.canRetry).toBe(true);
      expect(result.isBlocking).toBe(false);
    });

    it("should parse UNKNOWN error", () => {
      const simulation: SimulationResult = {
        success: false,
        error: "some random error message",
        errorType: "UNKNOWN",
      };

      const result = ErrorHandlingService.parseSimulationError(simulation);

      expect(result.title).toBe("Simulation Failed");
      expect(result.message).toContain("random error");
      expect(result.canRetry).toBe(true);
      expect(result.isBlocking).toBe(true);
    });

    it("should handle simulation with no error message", () => {
      const simulation: SimulationResult = {
        success: false,
      };

      const result = ErrorHandlingService.parseSimulationError(simulation);

      expect(result.title).toBe("Unknown Error");
      expect(result.message).toContain("unknown reasons");
    });

    it("should truncate long error messages", () => {
      const longError = "a".repeat(300);
      const simulation: SimulationResult = {
        success: false,
        error: longError,
        errorType: "UNKNOWN",
      };

      const result = ErrorHandlingService.parseSimulationError(simulation);

      // Message gets truncated + "..." appended
      expect(result.message.length).toBeLessThanOrEqual(203);
    });
  });

  describe("parseValidationError", () => {
    it("should parse INSUFFICIENT_BALANCE validation error", () => {
      const error: ValidationError = {
        type: "INSUFFICIENT_BALANCE",
        message: "Not enough $TRUST",
        details: "Need 0.5, have 0.1",
        isBlocking: true,
      };

      const result = ErrorHandlingService.parseValidationError(error);

      expect(result.title).toBe("Insufficient $TRUST");
      expect(result.message).toBe("Not enough $TRUST");
      expect(result.solution).toContain("Need 0.5, have 0.1");
      expect(result.isBlocking).toBe(true);
    });

    it("should parse ATOM_MISSING validation error", () => {
      const error: ValidationError = {
        type: "ATOM_MISSING",
        message: "2 atoms missing",
        details: "Missing: 0x111, 0x222",
        isBlocking: true,
      };

      const result = ErrorHandlingService.parseValidationError(error);

      expect(result.title).toBe("Missing Data");
      expect(result.solution).toContain("Missing: 0x111, 0x222");
    });

    it("should parse SIMULATION_FAILED validation error", () => {
      const error: ValidationError = {
        type: "SIMULATION_FAILED",
        message: "Simulation failed",
        details: "Gas estimation error",
        isBlocking: true,
      };

      const result = ErrorHandlingService.parseValidationError(error);

      expect(result.title).toBe("Validation Failed");
      expect(result.technicalDetails).toBe("Gas estimation error");
    });

    it("should parse INVALID_INPUT validation error", () => {
      const error: ValidationError = {
        type: "INVALID_INPUT",
        message: "Array length mismatch",
        details: "Must have same length",
        isBlocking: true,
      };

      const result = ErrorHandlingService.parseValidationError(error);

      expect(result.title).toBe("Invalid Input");
      expect(result.canRetry).toBe(false);
    });
  });

  describe("parseValidationWarning", () => {
    it("should parse LOW_BALANCE warning", () => {
      const warning: ValidationWarning = {
        type: "LOW_BALANCE",
        message: "Balance low after tx",
        details: "Will have 0.05 ETH remaining",
      };

      const result = ErrorHandlingService.parseValidationWarning(warning);

      expect(result.title).toBe("Low Balance Warning");
      expect(result.isBlocking).toBe(false);
      // Solution uses details if provided
      expect(result.solution).toContain("Will have 0.05 ETH remaining");
    });

    it("should parse HIGH_GAS warning", () => {
      const warning: ValidationWarning = {
        type: "HIGH_GAS",
        message: "High gas cost",
        details: "Transaction will cost 1 ETH in gas",
      };

      const result = ErrorHandlingService.parseValidationWarning(warning);

      expect(result.title).toBe("High Gas Cost");
      expect(result.isBlocking).toBe(false);
    });

    it("should parse LARGE_BATCH warning", () => {
      const warning: ValidationWarning = {
        type: "LARGE_BATCH",
        message: "Large batch",
        details: "30 triples in one tx",
      };

      const result = ErrorHandlingService.parseValidationWarning(warning);

      expect(result.title).toBe("Large Batch");
      expect(result.isBlocking).toBe(false);
    });
  });

  describe("parseValidationResult", () => {
    it("should parse validation result with multiple errors", () => {
      const validation: ValidationResult = {
        isValid: false,
        errors: [
          {
            type: "INSUFFICIENT_BALANCE",
            message: "Not enough funds",
            isBlocking: true,
          },
          {
            type: "ATOM_MISSING",
            message: "Missing atoms",
            isBlocking: true,
          },
        ],
        warnings: [],
      };

      const result = ErrorHandlingService.parseValidationResult(validation);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Insufficient $TRUST");
      expect(result[1].title).toBe("Missing Data");
    });

    it("should parse validation result with warnings", () => {
      const validation: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          {
            type: "LOW_BALANCE",
            message: "Low balance",
          },
          {
            type: "LARGE_BATCH",
            message: "Large batch",
          },
        ],
      };

      const result = ErrorHandlingService.parseValidationResult(validation);

      expect(result).toHaveLength(2);
      expect(result[0].isBlocking).toBe(false);
      expect(result[1].isBlocking).toBe(false);
    });

    it("should handle empty validation result", () => {
      const validation: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const result = ErrorHandlingService.parseValidationResult(validation);

      expect(result).toHaveLength(0);
    });
  });

  describe("parseBatchError", () => {
    it("should parse user rejection mid-batch", () => {
      const error = new Error("user rejected transaction");
      const context = {
        batchNumber: 2,
        totalBatches: 3,
        successfulBatches: 1,
      };

      const result = ErrorHandlingService.parseBatchError(error, context);

      expect(result.title).toBe("Transaction Cancelled");
      expect(result.message).toContain("batch 2/3");
      expect(result.solution).toContain("Previous batches (1)");
      expect(result.canRetry).toBe(true);
      expect(result.isBlocking).toBe(false);
    });

    it("should parse insufficient funds mid-batch", () => {
      const error = new Error("insufficient funds");
      const context = {
        batchNumber: 3,
        totalBatches: 4,
        successfulBatches: 2,
      };

      const result = ErrorHandlingService.parseBatchError(error, context);

      expect(result.title).toBe("Insufficient $TRUST");
      expect(result.message).toContain("Batch 3/4 failed");
      expect(result.solution).toContain("Batches 1-2 were successful");
      expect(result.solution).toContain("remaining 2 batch");
      expect(result.canRetry).toBe(true);
      expect(result.isBlocking).toBe(true);
    });

    it("should parse generic batch failure", () => {
      const error = new Error("network timeout");
      const context = {
        batchNumber: 1,
        totalBatches: 2,
        successfulBatches: 0,
      };

      const result = ErrorHandlingService.parseBatchError(error, context);

      expect(result.title).toContain("Batch 1/2 Failed");
      expect(result.solution).toContain("No changes were made");
      expect(result.canRetry).toBe(true);
    });

    it("should handle first batch failure", () => {
      const error = new Error("something went wrong");
      const context = {
        batchNumber: 1,
        totalBatches: 1,
        successfulBatches: 0,
      };

      const result = ErrorHandlingService.parseBatchError(error, context);

      expect(result.solution).toContain("No changes were made on-chain");
    });
  });

  describe("isRetryableError", () => {
    it("should identify network errors as retryable", () => {
      expect(ErrorHandlingService.isRetryableError(new Error("network error"))).toBe(true);
      expect(ErrorHandlingService.isRetryableError(new Error("connection timeout"))).toBe(true);
      expect(ErrorHandlingService.isRetryableError(new Error("fetch failed"))).toBe(true);
    });

    it("should identify user rejection as retryable", () => {
      expect(ErrorHandlingService.isRetryableError(new Error("user rejected"))).toBe(true);
    });

    it("should identify nonce errors as retryable", () => {
      expect(ErrorHandlingService.isRetryableError(new Error("nonce too low"))).toBe(true);
    });

    it("should identify non-retryable errors", () => {
      expect(ErrorHandlingService.isRetryableError(new Error("invalid signature"))).toBe(false);
      expect(ErrorHandlingService.isRetryableError(new Error("revert"))).toBe(false);
    });

    it("should handle string errors", () => {
      expect(ErrorHandlingService.isRetryableError("network timeout")).toBe(true);
      expect(ErrorHandlingService.isRetryableError("invalid input")).toBe(false);
    });
  });

  describe("extractTxHashFromError", () => {
    it("should extract tx hash from error message", () => {
      const error = new Error("Transaction failed: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

      const result = ErrorHandlingService.extractTxHashFromError(error);

      expect(result).toBe("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    });

    it("should return null if no tx hash found", () => {
      const error = new Error("Transaction failed with no hash");

      const result = ErrorHandlingService.extractTxHashFromError(error);

      expect(result).toBeNull();
    });

    it("should handle string errors", () => {
      const error = "Reverted: 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

      const result = ErrorHandlingService.extractTxHashFromError(error);

      expect(result).toBe("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
    });
  });

  describe("formatErrorForLogging", () => {
    it("should format complete error for logging", () => {
      const userError = {
        title: "Insufficient Funds",
        message: "Not enough ETH",
        solution: "Add more ETH",
        canRetry: true,
        isBlocking: true,
        technicalDetails: "balance: 0.1, required: 0.5",
      };

      const result = ErrorHandlingService.formatErrorForLogging(userError);

      expect(result).toContain("[Insufficient Funds]");
      expect(result).toContain("Not enough ETH");
      expect(result).toContain("Technical: balance: 0.1, required: 0.5");
      expect(result).toContain("Solution: Add more ETH");
      expect(result).toContain("Retry: true, Blocking: true");
    });

    it("should handle error without technical details", () => {
      const userError = {
        title: "Error",
        message: "Something went wrong",
        solution: "Try again",
        canRetry: false,
        isBlocking: true,
      };

      const result = ErrorHandlingService.formatErrorForLogging(userError);

      expect(result).not.toContain("Technical:");
      expect(result).toContain("Retry: false");
    });
  });
});
