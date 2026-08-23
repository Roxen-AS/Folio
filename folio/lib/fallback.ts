import { Transaction } from "./types";

/**
 * No-key fallback. Mirrors the shape of the Groq response so the rest of
 * the pipeline doesn't care whether the reasoning came from the model or
 * this rule-of-thumb stand-in. Keeps the product demoable without asking
 * anyone to paste a key first.
 */
export function fallbackAnalyze(exceptions: Transaction[]) {
  return exceptions.map((t) => {
    if (t.priorAmount === null) {
      return {
        id: t.id,
        category: t.category === "Uncategorized" ? "Uncategorized" : t.category,
        status: "flagged" as const,
        confidence: 45,
        reason: `No prior-period history for ${t.vendor} \u2014 held for review before close.`,
      };
    }
    const delta = Math.abs(t.amount - t.priorAmount) / t.priorAmount;
    return {
      id: t.id,
      category: t.category,
      status: "flagged" as const,
      confidence: 60,
      reason: `${t.vendor} moved ${Math.round(delta * 100)}% period-over-period \u2014 outside the 5% auto-clear tolerance.`,
    };
  });
}
