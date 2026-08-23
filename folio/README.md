# Folio — the AI finance controller

Folio ingests a period's transactions, clears what a deterministic
tolerance check can reconcile on its own, and hands only the genuine
exceptions to an LLM reasoning agent for categorization and a close memo.

## Pipeline

1. **Ingest** — `lib/telemetry.ts` generates a reproducible month of
   transactions from a seeded PRNG, keyed on the period string. Same
   period, same book, every time.
2. **Reconcile (rules)** — `lib/reconcile.ts` auto-clears any transaction
   with prior-period history within a 5% tolerance. This is the majority
   of a real book, and it never touches the model.
3. **Reason (agent)** — `lib/groq.ts` sends only the unresolved exceptions
   to `llama-3.3-70b-versatile` via Groq, BYOK. No key? `lib/fallback.ts`
   gives a deterministic stand-in so the app is fully demoable offline.
4. **Report** — the API route (`app/api/analyze/route.ts`) assembles the
   agent's per-transaction reasons into the close memo shown in the UI.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, optionally paste a Groq API key, and click
**Run close**. Leaving the key field blank runs the offline fallback path.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Groq (BYOK)
