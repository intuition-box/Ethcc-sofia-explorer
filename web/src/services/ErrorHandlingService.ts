import type { SimulationResult } from "./SimulationService";
import type { ValidationResult, ValidationError, ValidationWarning } from "./TransactionValidationService";
import { FeeCalculationService } from "./FeeCalculationService";

// ─── Types ───────────────────────────────────────────────────────

export interface UserFriendlyError {
  title: string;
  message: string;
  solution: string;
  canRetry: boolean;
  isBlocking: boolean;
  technicalDetails?: string;
}

export interface BatchErrorContext {
  batchNumber: number;
  totalBatches: number;
  successfulBatches: number;
}

// ─── ErrorHandlingService ────────────────────────────────────────

/**
 * Service for converting technical errors into user-friendly messages.
 * Provides actionable solutions and retry guidance.
 *
 * Pattern: Static methods for stateless error transformation.
 */
export class ErrorHandlingService {
  /**
   * Parse simulation error into user-friendly format.
   *
   * @param simulation - Simulation result with error
   * @param balance - User's current balance (optional)
   * @param required - Required amount (optional)
   * @returns User-friendly error object
   */
  static parseSimulationError(
    simulation: SimulationResult,
    balance?: bigint,
    required?: bigint
  ): UserFriendlyError {
    if (!simulation.error) {
      return {
        title: "Unknown Error",
        message: "Transaction simulation failed for unknown reasons.",
        solution: "Please try again or contact support.",
        canRetry: true,
        isBlocking: true,
      };
    }

    switch (simulation.errorType) {
      case "INSUFFICIENT_FUNDS":
        return ErrorHandlingService.createInsufficientFundsError(
          balance,
          required
        );

      case "ATOM_MISSING":
        return {
          title: "Missing On-Chain Data",
          message:
            "One or more atoms (sessions, tracks, or predicates) don't exist on-chain.",
          solution:
            "This is likely a temporary issue. Please refresh the page and try again. If the issue persists, contact support.",
          canRetry: true,
          isBlocking: true,
          technicalDetails: simulation.error,
        };

      case "TRIPLE_EXISTS":
        return {
          title: "Triple Already Exists",
          message:
            "One or more triples you're trying to create already exist on-chain.",
          solution:
            "This usually means you've already published this profile. You can deposit more $TRUST on existing triples instead.",
          canRetry: false,
          isBlocking: false,
          technicalDetails: simulation.error,
        };

      case "GAS_ERROR":
        return {
          title: "Transaction Too Large",
          message:
            "This transaction requires too much gas to process in a single batch.",
          solution:
            "Try reducing the number of sessions or interests selected, then try again. Aim for fewer than 20 items per transaction.",
          canRetry: false,
          isBlocking: true,
          technicalDetails: simulation.error,
        };

      case "USER_REJECTED":
        return {
          title: "Transaction Cancelled",
          message: "You cancelled the transaction in your wallet.",
          solution:
            "No changes were made on-chain. You can try again when ready.",
          canRetry: true,
          isBlocking: false,
          technicalDetails: simulation.error,
        };

      default:
        return {
          title: "Simulation Failed",
          message: ErrorHandlingService.truncateError(simulation.error),
          solution:
            "Please try again. If the issue persists, try refreshing the page or contact support.",
          canRetry: true,
          isBlocking: true,
          technicalDetails: simulation.error,
        };
    }
  }

  /**
   * Parse validation result into user-friendly errors and warnings.
   *
   * @param validation - Validation result
   * @returns Array of user-friendly errors
   */
  static parseValidationResult(validation: ValidationResult): UserFriendlyError[] {
    const userErrors: UserFriendlyError[] = [];

    // Convert validation errors
    for (const error of validation.errors) {
      userErrors.push(ErrorHandlingService.parseValidationError(error));
    }

    // Convert warnings to non-blocking errors
    for (const warning of validation.warnings) {
      userErrors.push(ErrorHandlingService.parseValidationWarning(warning));
    }

    return userErrors;
  }

  /**
   * Parse validation error into user-friendly format.
   *
   * @param error - Validation error
   * @returns User-friendly error
   */
  static parseValidationError(error: ValidationError): UserFriendlyError {
    switch (error.type) {
      case "INSUFFICIENT_BALANCE":
        return {
          title: "Insufficient $TRUST",
          message: error.message,
          solution:
            error.details ||
            "Please add $TRUST to your wallet and try again. You can bridge $TRUST from Ethereum mainnet or buy it on an exchange.",
          canRetry: true,
          isBlocking: true,
        };

      case "ATOM_MISSING":
        return {
          title: "Missing Data",
          message: error.message,
          solution:
            error.details ||
            "Some required data is missing on-chain. Please refresh and try again.",
          canRetry: true,
          isBlocking: true,
        };

      case "SIMULATION_FAILED":
        return {
          title: "Validation Failed",
          message: error.message,
          solution: error.details || "Please try again or contact support.",
          canRetry: true,
          isBlocking: true,
          technicalDetails: error.details,
        };

      case "INVALID_INPUT":
        return {
          title: "Invalid Input",
          message: error.message,
          solution:
            error.details ||
            "Please check your selections and try again.",
          canRetry: false,
          isBlocking: true,
        };

      default:
        return {
          title: "Validation Error",
          message: error.message,
          solution: "Please try again or contact support.",
          canRetry: true,
          isBlocking: error.isBlocking,
          technicalDetails: error.details,
        };
    }
  }

  /**
   * Parse validation warning into user-friendly format.
   *
   * @param warning - Validation warning
   * @returns User-friendly error (non-blocking)
   */
  static parseValidationWarning(warning: ValidationWarning): UserFriendlyError {
    switch (warning.type) {
      case "LOW_BALANCE":
        return {
          title: "Low Balance Warning",
          message: warning.message,
          solution:
            warning.details ||
            "Consider adding more $TRUST to maintain a buffer for future transactions.",
          canRetry: true,
          isBlocking: false,
        };

      case "HIGH_GAS":
        return {
          title: "High Gas Cost",
          message: warning.message,
          solution:
            warning.details ||
            "This transaction will consume significant gas. Consider breaking it into smaller batches.",
          canRetry: true,
          isBlocking: false,
        };

      case "LARGE_BATCH":
        return {
          title: "Large Batch",
          message: warning.message,
          solution:
            warning.details ||
            "Large batches may take longer to process and cost more gas.",
          canRetry: true,
          isBlocking: false,
        };

      default:
        return {
          title: "Warning",
          message: warning.message,
          solution: warning.details || "Proceed with caution.",
          canRetry: true,
          isBlocking: false,
        };
    }
  }

  /**
   * Parse batch transaction error with context.
   *
   * @param error - Error object or message
   * @param context - Batch context (which batch, how many succeeded)
   * @returns User-friendly error
   */
  static parseBatchError(
    error: unknown,
    context: BatchErrorContext
  ): UserFriendlyError {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const { batchNumber, totalBatches, successfulBatches } = context;

    // User rejected transaction
    if (
      errorMsg.includes("user rejected") ||
      errorMsg.includes("denied") ||
      errorMsg.includes("ACTION_REJECTED")
    ) {
      return {
        title: "Transaction Cancelled",
        message: `You cancelled batch ${batchNumber}/${totalBatches}.`,
        solution:
          successfulBatches > 0
            ? `Previous batches (${successfulBatches}) were successfully created on-chain. You can retry to complete the remaining batches.`
            : "No changes were made on-chain. You can try again when ready.",
        canRetry: true,
        isBlocking: false,
        technicalDetails: errorMsg,
      };
    }

    // Insufficient funds mid-batch
    if (
      errorMsg.includes("insufficient funds") ||
      errorMsg.includes("balance")
    ) {
      return {
        title: "Insufficient $TRUST",
        message: `Batch ${batchNumber}/${totalBatches} failed due to insufficient balance.`,
        solution:
          successfulBatches > 0
            ? `Batches 1-${successfulBatches} were successful. Add more $TRUST to complete the remaining ${
                totalBatches - successfulBatches
              } batch(es).`
            : "Please add $TRUST to your wallet and try again.",
        canRetry: true,
        isBlocking: true,
        technicalDetails: errorMsg,
      };
    }

    // Generic batch failure
    return {
      title: `Batch ${batchNumber}/${totalBatches} Failed`,
      message: ErrorHandlingService.truncateError(errorMsg),
      solution:
        successfulBatches > 0
          ? `Batches 1-${successfulBatches} were successful. You can retry to complete the remaining batches. Previous data is already on-chain.`
          : "No changes were made on-chain. Please try again.",
      canRetry: true,
      isBlocking: true,
      technicalDetails: errorMsg,
    };
  }

  /**
   * Create user-friendly error for insufficient funds.
   *
   * @param balance - Current balance
   * @param required - Required amount
   * @returns User-friendly error
   */
  private static createInsufficientFundsError(
    balance?: bigint,
    required?: bigint
  ): UserFriendlyError {
    if (balance !== undefined && required !== undefined) {
      const deficit = required - balance;
      return {
        title: "Insufficient $TRUST",
        message: `You need ${FeeCalculationService.formatTrust(
          required
        )} $TRUST but only have ${FeeCalculationService.formatTrust(
          balance
        )} $TRUST.`,
        solution: `Please add at least ${FeeCalculationService.formatTrust(
          deficit
        )} $TRUST to your wallet and try again. You can bridge $TRUST from Ethereum mainnet or buy it on an exchange.`,
        canRetry: true,
        isBlocking: true,
      };
    }

    return {
      title: "Insufficient $TRUST",
      message: "Your wallet doesn't have enough $TRUST for this transaction.",
      solution:
        "Please add $TRUST to your wallet and try again. You can bridge $TRUST from Ethereum mainnet or buy it on an exchange.",
      canRetry: true,
      isBlocking: true,
    };
  }

  /**
   * Truncate long error messages for display.
   *
   * @param error - Error message
   * @param maxLength - Maximum length (default: 200)
   * @returns Truncated error message
   */
  private static truncateError(error: string, maxLength: number = 200): string {
    if (error.length <= maxLength) return error;
    return error.slice(0, maxLength) + "...";
  }

  /**
   * Format error for logging (includes full technical details).
   *
   * @param userError - User-friendly error
   * @returns Formatted log message
   */
  static formatErrorForLogging(userError: UserFriendlyError): string {
    let log = `[${userError.title}] ${userError.message}`;
    if (userError.technicalDetails) {
      log += `\nTechnical: ${userError.technicalDetails}`;
    }
    log += `\nSolution: ${userError.solution}`;
    log += `\nRetry: ${userError.canRetry}, Blocking: ${userError.isBlocking}`;
    return log;
  }

  /**
   * Check if error is retryable (temporary network issues, user cancellation).
   *
   * @param error - Error object or message
   * @returns True if error is retryable
   */
  static isRetryableError(error: unknown): boolean {
    const errorMsg =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    return (
      errorMsg.includes("network") ||
      errorMsg.includes("timeout") ||
      errorMsg.includes("connection") ||
      errorMsg.includes("fetch") ||
      errorMsg.includes("user rejected") ||
      errorMsg.includes("nonce")
    );
  }

  /**
   * Extract transaction hash from error message if present.
   *
   * @param error - Error object or message
   * @returns Transaction hash or null
   */
  static extractTxHashFromError(error: unknown): string | null {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const match = errorMsg.match(/0x[a-fA-F0-9]{64}/);
    return match ? match[0] : null;
  }
}
