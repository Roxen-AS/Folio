import { Transaction } from "./types";

// mulberry32 — small, fast, deterministic PRNG. Seeding on the period
// (e.g. "2026-08") means the same month always produces the same book,
// so demos and tests are reproducible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

const KNOWN_VENDORS: { vendor: string; category: string; base: number }[] = [
  { vendor: "Amazon Web Services", category: "Cloud Infrastructure", base: 4800 },
  { vendor: "Figma Inc.", category: "Software & Tools", base: 340 },
  { vendor: "WeWork Bangalore", category: "Facilities", base: 2100 },
  { vendor: "Google Workspace", category: "Software & Tools", base: 486 },
  { vendor: "Notion Labs", category: "Software & Tools", base: 240 },
  { vendor: "Razorpay Payouts", category: "Payment Processing", base: 1150 },
];

const WILDCARD_VENDORS = [
  "Linear Regional Corp",
  "Ad-hoc Consulting LLC",
  "Meridian Freight Partners",
  "Northstar Contractors",
];

/** Generates a reproducible month's book of transactions for a given period key. */
export function generatePeriod(period: string): Transaction[] {
  const rand = mulberry32(seedFromString(period));
  const transactions: Transaction[] = [];

  KNOWN_VENDORS.forEach((v, i) => {
    const drift = (rand() - 0.5) * 0.04; // +-2% normal drift
    const amount = Math.round(v.base * (1 + drift) * 100) / 100;
    transactions.push({
      id: `known-${i}`,
      vendor: v.vendor,
      amount,
      priorAmount: v.base,
      category: v.category,
      confidence: 96 + Math.round(rand() * 3),
      status: "pending",
    });
  });

  // one or two wildcard/unseen vendors per period — these are what the
  // reconciliation pass can't clear on rules alone, and get routed to the
  // reasoning agent.
  const wildcardCount = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < wildcardCount; i++) {
    const name =
      WILDCARD_VENDORS[Math.floor(rand() * WILDCARD_VENDORS.length)];
    const amount = Math.round((1500 + rand() * 12000) * 100) / 100;
    transactions.push({
      id: `wild-${i}`,
      vendor: name,
      amount,
      priorAmount: null,
      category: "Uncategorized",
      confidence: 30 + Math.round(rand() * 25),
      status: "pending",
    });
  }

  return transactions;
}
