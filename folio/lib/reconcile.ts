import { Transaction } from "./types";

const TOLERANCE = 0.05; // 5% period-over-period tolerance

/**
 * Deterministic first pass. A transaction clears automatically if it has
 * prior-period history and the delta is within tolerance. Everything else
 * (no history, or amount moved more than tolerance allows) is left
 * "pending" and handed to the reasoning agent — the agent never has to
 * look at the 90% of the book that reconciles on its own.
 */
export function ruleReconcile(transactions: Transaction[]): Transaction[] {
  return transactions.map((t) => {
    if (t.priorAmount === null) {
      return { ...t, status: "pending" as const };
    }
    const delta = Math.abs(t.amount - t.priorAmount) / t.priorAmount;
    if (delta <= TOLERANCE && t.confidence >= 85) {
      return {
        ...t,
        status: "reconciled" as const,
        reason: `Within ${Math.round(TOLERANCE * 100)}% of prior period.`,
      };
    }
    return { ...t, status: "pending" as const };
  });
}
