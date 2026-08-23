import { NextRequest, NextResponse } from "next/server";
import { generatePeriod } from "@/lib/telemetry";
import { ruleReconcile } from "@/lib/reconcile";
import { analyzeExceptions } from "@/lib/groq";
import { fallbackAnalyze } from "@/lib/fallback";
import { Transaction, AnalyzeResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const period: string = body.period ?? "2026-08";
  const apiKey: string | undefined = body.apiKey || process.env.GROQ_API_KEY;

  // 1. Ingest
  const raw = generatePeriod(period);

  // 2. Rule-based reconcile — clears anything within tolerance
  const afterRules = ruleReconcile(raw);
  const exceptions = afterRules.filter((t) => t.status === "pending");

  // 3. Reason over exceptions only (Groq if a key was supplied, else a
  // deterministic fallback so the app works with zero setup)
  let verdicts;
  try {
    verdicts = apiKey
      ? await analyzeExceptions(exceptions, apiKey)
      : fallbackAnalyze(exceptions);
  } catch (err) {
    verdicts = fallbackAnalyze(exceptions);
  }

  const verdictMap = new Map(verdicts.map((v) => [v.id, v]));

  const transactions: Transaction[] = afterRules.map((t) => {
    const v = verdictMap.get(t.id);
    if (!v) return t;
    return {
      ...t,
      category: v.category,
      status: v.status,
      confidence: v.confidence,
      reason: v.reason,
    };
  });

  // 4. Report — a close memo built from whatever actually got flagged/reasoned over
  const memo = transactions
    .filter((t) => t.reason && (t.status === "flagged" || exceptions.some((e) => e.id === t.id)))
    .map((t) => t.reason as string);

  const response: AnalyzeResponse = { transactions, memo };
  return NextResponse.json(response);
}
