import type { WalletConnection } from "./intuition";
import { SimulationService, type SimulationResult, type BalanceCheck } from "./SimulationService";
import { FeeCalculationService, type CostBreakdown } from "./FeeCalculationService";

// ─── Types ───────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  costBreakdown?: CostBreakdown;
  balanceCheck?: BalanceCheck;
  simulation?: SimulationResult;
}

export interface ValidationError {
  type: "INSUFFICIENT_BALANCE" | "ATOM_MISSING" | "SIMULATION_FAILED" | "INVALID_INPUT";
  message: string;
  details?: string;
  isBlocking: boolean;
}

export interface ValidationWarning {
  type: "LOW_BALANCE" | "HIGH_GAS" | "LARGE_BATCH";
  message: string;
  details?: string;
}

export interface TripleCreationValidation {
  subjectIds: string[];
  predicateIds: string[];
  objectIds: string[];
  depositPerTriple?: bigint;
}

export interface DepositBatchValidation {
  termIds: string[];
  depositPerTerm?: bigint;
}

// ─── TransactionValidationService ────────────────────────────────

/**
 * Service for comprehensive transaction validation before submission.
 * Combines balance checks, atom verification, cost calculation, and simulation.
 *
 * Pattern: Validation-first approach - catch errors before user signs tx.
 */
export class TransactionValidationService {
  /**
   * Validate triple creation transaction before submission.
   *
   * @param wallet - Connected wallet
   * @param validation - Triple creation parameters to validate
   * @returns Comprehensive validation result
   */
  static async validateTripleCreation(
    wallet: WalletConnection,
    validation: TripleCreationValidation
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const { subjectIds, predicateIds, objectIds, depositPerTriple } = validation;

    // Step 1: Input validation
    if (subjectIds.length === 0) {
      errors.push({
        type: "INVALID_INPUT",
        message: "No triples to create",
        details: "At least one triple is required",
        isBlocking: true,
      });
      return { isValid: false, errors, warnings };
    }

    if (
      subjectIds.length !== predicateIds.length ||
      predicateIds.length !== objectIds.length
    ) {
      errors.push({
        type: "INVALID_INPUT",
        message: "Array length mismatch",
        details: "Subject, predicate, and object arrays must have same length",
        isBlocking: true,
      });
      return { isValid: false, errors, warnings };
    }

    // Step 2: Verify all atoms exist on-chain
    const allAtomIds = [
      ...new Set([...subjectIds, ...predicateIds, ...objectIds]),
    ];
    const missingAtoms = await SimulationService.verifyAtomsExist(
      wallet.multiVault,
      allAtomIds
    );

    if (missingAtoms.length > 0) {
      errors.push({
        type: "ATOM_MISSING",
        message: `${missingAtoms.length} atom(s) do not exist on-chain`,
        details: `Missing atoms: ${missingAtoms.slice(0, 3).join(", ")}${
          missingAtoms.length > 3 ? "..." : ""
        }`,
        isBlocking: true,
      });
    }

    // Step 3: Calculate cost breakdown
    const costBreakdown = await FeeCalculationService.calculateTripleCreationCost(
      wallet,
      subjectIds.length,
      depositPerTriple
    );

    // Step 4: Check balance
    const balanceCheck = await SimulationService.checkBalance(
      wallet,
      costBreakdown.grandTotal
    );

    if (!balanceCheck.hasEnough) {
      errors.push({
        type: "INSUFFICIENT_BALANCE",
        message: "Insufficient $TRUST balance",
        details: `Need ${FeeCalculationService.formatTrust(
          costBreakdown.grandTotal
        )} $TRUST, have ${FeeCalculationService.formatTrust(
          balanceCheck.balance
        )} $TRUST. Missing ${FeeCalculationService.formatTrust(
          balanceCheck.deficit
        )} $TRUST.`,
        isBlocking: true,
      });
    }

    // Warning: Low balance (less than 10% buffer)
    const bufferRequired = costBreakdown.grandTotal + costBreakdown.grandTotal / 10n;
    if (balanceCheck.balance < bufferRequired && balanceCheck.hasEnough) {
      warnings.push({
        type: "LOW_BALANCE",
        message: "Low balance after transaction",
        details: `You will have ${FeeCalculationService.formatTrust(
          balanceCheck.balance - costBreakdown.grandTotal
        )} $TRUST remaining. Consider keeping a buffer for future transactions.`,
      });
    }

    // Warning: Large batch (> 25 triples)
    if (subjectIds.length > 25) {
      warnings.push({
        type: "LARGE_BATCH",
        message: "Large batch size",
        details: `Creating ${subjectIds.length} triples in one transaction. Consider splitting into smaller batches if transaction fails.`,
      });
    }

    // Step 5: Simulate transaction (only if no blocking errors)
    let simulation: SimulationResult | undefined;
    if (errors.length === 0) {
      const assets = subjectIds.map(() => depositPerTriple ?? 0n);
      simulation = await SimulationService.simulateCreateTriples(
        wallet,
        subjectIds,
        predicateIds,
        objectIds,
        assets,
        costBreakdown.grandTotal
      );

      if (!simulation.success) {
        errors.push({
          type: "SIMULATION_FAILED",
          message: "Transaction simulation failed",
          details: simulation.error || "Unknown simulation error",
          isBlocking: true,
        });
      }
    }

    const isValid = errors.filter((e) => e.isBlocking).length === 0;

    return {
      isValid,
      errors,
      warnings,
      costBreakdown,
      balanceCheck,
      simulation,
    };
  }

  /**
   * Validate deposit batch transaction before submission.
   *
   * @param wallet - Connected wallet
   * @param validation - Deposit batch parameters to validate
   * @returns Comprehensive validation result
   */
  static async validateDepositBatch(
    wallet: WalletConnection,
    validation: DepositBatchValidation
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const { termIds, depositPerTerm } = validation;

    // Step 1: Input validation
    if (termIds.length === 0) {
      errors.push({
        type: "INVALID_INPUT",
        message: "No terms to deposit on",
        details: "At least one term is required",
        isBlocking: true,
      });
      return { isValid: false, errors, warnings };
    }

    // Step 2: Verify all terms exist on-chain
    const missingTerms = await SimulationService.verifyAtomsExist(
      wallet.multiVault,
      termIds
    );

    if (missingTerms.length > 0) {
      errors.push({
        type: "ATOM_MISSING",
        message: `${missingTerms.length} term(s) do not exist on-chain`,
        details: `Missing terms: ${missingTerms.slice(0, 3).join(", ")}${
          missingTerms.length > 3 ? "..." : ""
        }`,
        isBlocking: true,
      });
    }

    // Step 3: Calculate cost breakdown
    const costBreakdown = await FeeCalculationService.calculateDepositBatchCost(
      wallet,
      termIds.length,
      depositPerTerm
    );

    // Step 4: Check balance
    const balanceCheck = await SimulationService.checkBalance(
      wallet,
      costBreakdown.grandTotal
    );

    if (!balanceCheck.hasEnough) {
      errors.push({
        type: "INSUFFICIENT_BALANCE",
        message: "Insufficient $TRUST balance",
        details: `Need ${FeeCalculationService.formatTrust(
          costBreakdown.grandTotal
        )} $TRUST, have ${FeeCalculationService.formatTrust(
          balanceCheck.balance
        )} $TRUST. Missing ${FeeCalculationService.formatTrust(
          balanceCheck.deficit
        )} $TRUST.`,
        isBlocking: true,
      });
    }

    // Step 5: Simulate transaction (only if no blocking errors)
    let simulation: SimulationResult | undefined;
    if (errors.length === 0) {
      const assets = termIds.map(() => depositPerTerm ?? 0n);
      simulation = await SimulationService.simulateDepositBatch(
        wallet,
        termIds,
        assets,
        costBreakdown.grandTotal
      );

      if (!simulation.success) {
        errors.push({
          type: "SIMULATION_FAILED",
          message: "Transaction simulation failed",
          details: simulation.error || "Unknown simulation error",
          isBlocking: true,
        });
      }
    }

    const isValid = errors.filter((e) => e.isBlocking).length === 0;

    return {
      isValid,
      errors,
      warnings,
      costBreakdown,
      balanceCheck,
      simulation,
    };
  }

  /**
   * Validate batched triple creation (multiple batches).
   *
   * @param wallet - Connected wallet
   * @param validation - Triple creation parameters
   * @param batchSize - Size of each batch
   * @returns Validation result for entire batched operation
   */
  static async validateBatchedTripleCreation(
    wallet: WalletConnection,
    validation: TripleCreationValidation,
    batchSize: number
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const { subjectIds, depositPerTriple } = validation;
    const totalTriples = subjectIds.length;

    // Calculate total cost for all batches
    const batchEstimate = await FeeCalculationService.estimateBatchedTripleCreation(
      wallet,
      totalTriples,
      batchSize,
      depositPerTriple
    );

    // Check balance for entire operation
    const balanceCheck = await SimulationService.checkBalance(
      wallet,
      batchEstimate.totalCost
    );

    if (!balanceCheck.hasEnough) {
      errors.push({
        type: "INSUFFICIENT_BALANCE",
        message: "Insufficient $TRUST for all batches",
        details: `Need ${FeeCalculationService.formatTrust(
          batchEstimate.totalCost
        )} $TRUST for ${batchEstimate.batchCount} batch(es), have ${FeeCalculationService.formatTrust(
          balanceCheck.balance
        )} $TRUST. Missing ${FeeCalculationService.formatTrust(
          balanceCheck.deficit
        )} $TRUST.`,
        isBlocking: true,
      });
    }

    // Warning: Multiple batches require multiple signatures
    if (batchEstimate.batchCount > 1) {
      warnings.push({
        type: "LARGE_BATCH",
        message: `${batchEstimate.batchCount} separate transactions required`,
        details: `You will need to sign ${batchEstimate.batchCount} transactions. Each batch will be processed separately.`,
      });
    }

    // Use first batch's cost breakdown as representative
    const costBreakdown = batchEstimate.batches[0];

    const isValid = errors.filter((e) => e.isBlocking).length === 0;

    return {
      isValid,
      errors,
      warnings,
      costBreakdown,
      balanceCheck,
    };
  }

  /**
   * Quick validation: just check if wallet has enough balance.
   * Useful for early validation before full validation.
   *
   * @param wallet - Connected wallet
   * @param estimatedCost - Estimated transaction cost
   * @returns True if balance is sufficient
   */
  static async quickBalanceCheck(
    wallet: WalletConnection,
    estimatedCost: bigint
  ): Promise<boolean> {
    const balanceCheck = await SimulationService.checkBalance(wallet, estimatedCost);
    return balanceCheck.hasEnough;
  }
}
