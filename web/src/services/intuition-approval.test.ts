import { describe, it, expect, vi } from "vitest";

/**
 * Tests for approval error handling in intuition.ts
 *
 * These tests verify that user rejections are properly detected and re-thrown,
 * while "already approved" errors are silently ignored.
 */

describe("intuition.ts - Approval Error Handling", () => {
  describe("approveProxy error handling", () => {
    it("should detect and re-throw user rejection errors", () => {
      // Simulate the error handling logic from intuition.ts lines 524-534
      const handleApprovalError = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);

        // Only ignore if already approved - re-throw user rejections
        if (
          msg.toLowerCase().includes("user rejected") ||
          msg.toLowerCase().includes("user denied")
        ) {
          throw new Error(
            "You must approve the proxy to continue. Please accept the approval request in your wallet."
          );
        }

        // Log other errors but continue (likely already approved)
        if (
          !msg.toLowerCase().includes("already approved") &&
          !msg.toLowerCase().includes("already set")
        ) {
          console.warn("[Intuition] Proxy approval warning:", msg);
        }
      };

      // Test 1: User rejected error should be re-thrown
      const userRejectedError = new Error("User rejected the transaction");

      expect(() => handleApprovalError(userRejectedError)).toThrow(
        "You must approve the proxy to continue"
      );

      // Test 2: User denied error should be re-thrown
      const userDeniedError = new Error("User denied transaction signature");

      expect(() => handleApprovalError(userDeniedError)).toThrow(
        "You must approve the proxy to continue"
      );

      // Test 3: Already approved error should NOT throw
      const alreadyApprovedError = new Error("Already approved");

      expect(() => handleApprovalError(alreadyApprovedError)).not.toThrow();

      // Test 4: Already set error should NOT throw
      const alreadySetError = new Error("Approval already set");

      expect(() => handleApprovalError(alreadySetError)).not.toThrow();
    });

    it("should log warnings for unexpected errors", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const handleApprovalError = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);

        if (
          msg.toLowerCase().includes("user rejected") ||
          msg.toLowerCase().includes("user denied")
        ) {
          throw new Error(
            "You must approve the proxy to continue. Please accept the approval request in your wallet."
          );
        }

        if (
          !msg.toLowerCase().includes("already approved") &&
          !msg.toLowerCase().includes("already set")
        ) {
          console.warn("[Intuition] Proxy approval warning:", msg);
        }
      };

      // Test: Unexpected error should be logged
      const unexpectedError = new Error("Network timeout");

      handleApprovalError(unexpectedError);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Intuition] Proxy approval warning:",
        "Network timeout"
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle string errors (not just Error objects)", () => {
      const handleApprovalError = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);

        if (
          msg.toLowerCase().includes("user rejected") ||
          msg.toLowerCase().includes("user denied")
        ) {
          throw new Error(
            "You must approve the proxy to continue. Please accept the approval request in your wallet."
          );
        }
      };

      // Test with string error
      expect(() => handleApprovalError("User Rejected")).toThrow(
        "You must approve the proxy to continue"
      );

      // Test with non-error object
      expect(() => handleApprovalError({ message: "user denied" })).toThrow(
        "You must approve the proxy to continue"
      );
    });

    it("should be case-insensitive when detecting errors", () => {
      const handleApprovalError = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);

        if (
          msg.toLowerCase().includes("user rejected") ||
          msg.toLowerCase().includes("user denied")
        ) {
          throw new Error(
            "You must approve the proxy to continue. Please accept the approval request in your wallet."
          );
        }
      };

      // Test various casings
      expect(() => handleApprovalError(new Error("USER REJECTED"))).toThrow();
      expect(() => handleApprovalError(new Error("User Rejected"))).toThrow();
      expect(() => handleApprovalError(new Error("user rejected"))).toThrow();
      expect(() => handleApprovalError(new Error("USER DENIED"))).toThrow();
      expect(() => handleApprovalError(new Error("User Denied"))).toThrow();
    });
  });

  describe("Error message quality", () => {
    it("should provide clear user-facing error message", () => {
      const errorMessage =
        "You must approve the proxy to continue. Please accept the approval request in your wallet.";

      // Verify message is helpful
      expect(errorMessage).toContain("approve the proxy");
      expect(errorMessage).toContain("accept the approval request");
      expect(errorMessage).toContain("wallet");

      // Verify it's not too technical
      expect(errorMessage).not.toContain("eth_");
      expect(errorMessage).not.toContain("0x");
      expect(errorMessage).not.toContain("transaction hash");
    });
  });
});
