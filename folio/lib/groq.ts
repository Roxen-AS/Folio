import { Transaction } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are Folio, an AI finance controller assistant. You are handed only the
transactions a deterministic reconciliation pass could NOT clear \u2014 no
prior-period history, or a period-over-period swing outside tolerance.

For each transaction, decide:
- category: your best-guess expense category (e.g. "Professional Services",
  "Cloud Infrastructure", "Facilities", "Payment Processing", "Uncategorized"
  if truly unclear)
- status: "reconciled" if you're confident it's a legitimate, explainable
  charge despite lacking history, or "flagged" if it warrants human review
  before close
- confidence: 0-100
- reason: one plain-English sentence a controller would actually write in
  a close memo. No hedging filler, no "as an AI". State the fact and the
  implication.

Respond with strict JSON only, matching this shape:
{"transactions": [{"id": "...", "category": "...", "status": "reconciled"|"flagged", "confidence": 0, "reason": "..."}]}`;

export async function analyzeExceptions(
  exceptions: Transaction[],
  apiKey: string
): Promise<{ id: string; category: string; status: "reconciled" | "flagged"; confidence: number; reason: string }[]> {
  if (exceptions.length === 0) return [];

  const userPayload = exceptions.map((t) => ({
    id: t.id,
    vendor: t.vendor,
    amount: t.amount,
    priorAmount: t.priorAmount,
    currentCategory: t.category,
  }));

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return parsed.transactions ?? [];
}
