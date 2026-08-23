"use client";

import { useState } from "react";
import { Inbox, Tags, Scale, Flag, FileText, ChevronRight, Loader2 } from "lucide-react";
import { Transaction, AnalyzeResponse } from "@/lib/types";

const STEPS = [
  { key: "ingest", label: "Ingest", icon: Inbox },
  { key: "categorize", label: "Categorize", icon: Tags },
  { key: "reconcile", label: "Reconcile", icon: Scale },
  { key: "flag", label: "Flag", icon: Flag },
  { key: "report", label: "Report", icon: FileText },
] as const;

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function Stamp({ status }: { status: Transaction["status"] }) {
  if (status === "pending") {
    return (
      <span className="font-mono text-[10px] tracking-wider font-bold uppercase px-2 py-0.5 rounded border border-rule text-ledger-slate bg-white whitespace-nowrap">
        Pending
      </span>
    );
  }
  const isGood = status === "reconciled";
  return (
    <span
      className={`font-mono text-[10px] tracking-wider font-bold uppercase px-2 py-0.5 rounded border whitespace-nowrap ${
        isGood
          ? "border-ledger-green text-ledger-green bg-ledger-green-bg"
          : "border-ledger-amber text-ledger-amber bg-ledger-amber-bg"
      }`}
    >
      {isGood ? "Reconciled" : "Flagged"}
    </span>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-rule rounded-md p-4 bg-white">
      <div className="font-sans text-[11px] tracking-wide uppercase text-ledger-slate mb-1.5">
        {label}
      </div>
      <div className="font-mono text-[22px] font-semibold leading-none text-ink">{value}</div>
      {sub && <div className="font-sans text-xs text-ledger-slate mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [active, setActive] = useState<(typeof STEPS)[number]["key"]>("reconcile");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runClose() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: "2026-08", apiKey: apiKey || undefined }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json: AnalyzeResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const transactions = data?.transactions ?? [];
  const reconciled = transactions.filter((t) => t.status === "reconciled");
  const flagged = transactions.filter((t) => t.status === "flagged");
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const flaggedTotal = flagged.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-4xl mx-auto p-7">
      {/* Masthead */}
      <div className="flex justify-between items-end border-b-2 border-ink pb-3.5 mb-5">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">Folio</h1>
        <div className="text-right">
          <div className="font-sans text-xs text-ledger-slate">Period</div>
          <div className="font-mono text-sm font-semibold">Aug 2026</div>
          <div className="flex items-center gap-1.5 mt-1.5 justify-end">
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block ${
                data ? "bg-ledger-green" : "bg-rule"
              }`}
            />
            <span className="font-sans text-xs text-ledger-slate">
              {data ? "Books open" : "Not run yet"}
            </span>
          </div>
        </div>
      </div>

      {/* Workflow rail */}
      <div className="flex border-b border-rule mb-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = active === s.key;
          return (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => setActive(s.key)}
                className={`flex items-center gap-1.5 pr-3.5 pb-2.5 -mb-px border-b-2 font-sans text-[13px] ${
                  isActive
                    ? "border-ink text-ink font-semibold"
                    : "border-transparent text-ledger-slate font-normal"
                }`}
              >
                <Icon size={14} strokeWidth={1.8} />
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={13} className="text-rule mx-1 mb-2.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* BYOK + run control */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="password"
          placeholder="Groq API key (optional \u2014 leave blank to run offline)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="flex-1 border border-rule rounded-md px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:border-ink"
        />
        <button
          onClick={runClose}
          disabled={loading}
          className="flex items-center gap-2 bg-ink text-paper font-sans text-sm font-medium px-4 py-2 rounded-md disabled:opacity-60"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Closing the books\u2026" : "Run close"}
        </button>
      </div>

      {error && (
        <div className="mb-6 text-sm font-sans text-ledger-amber border border-ledger-amber bg-ledger-amber-bg rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 border border-dashed border-rule rounded-md mb-6">
          <p className="font-serif text-ledger-slate text-sm">
            Run close to ingest this period&rsquo;s book and let Folio reconcile it.
          </p>
        </div>
      )}

      {data && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <KPI label="Transactions reviewed" value={String(transactions.length)} sub="this period" />
            <KPI
              label="Reconciled value"
              value={fmtUSD(total - flaggedTotal)}
              sub={`${reconciled.length} of ${transactions.length} line items`}
            />
            <KPI label="Flagged for review" value={fmtUSD(flaggedTotal)} sub={`${flagged.length} line items`} />
            <KPI
              label="Auto-cleared on rules"
              value={`${Math.round(
                (reconciled.filter((t) => t.reason?.includes("tolerance")).length /
                  Math.max(transactions.length, 1)) *
                  100
              )}%`}
              sub="before agent review"
            />
          </div>

          {/* Ledger + memo */}
          <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: "1fr 260px" }}>
            <div className="border border-rule rounded-md bg-white overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-rule font-sans text-[11px] tracking-wide uppercase text-ledger-slate">
                Transaction ledger
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Vendor", "Category", "Conf.", "Amount", "Status"].map((h, i) => (
                      <th
                        key={h}
                        className={`font-sans text-[11px] text-ledger-slate font-medium px-3.5 py-2 border-b border-rule ${
                          i >= 3 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={t.id}>
                      <td
                        className={`px-3.5 py-2.5 text-sm ${
                          i < transactions.length - 1 ? "border-b border-rule" : ""
                        }`}
                      >
                        {t.vendor}
                      </td>
                      <td
                        className={`px-3.5 py-2.5 text-xs ${
                          t.category === "Uncategorized" ? "text-ledger-amber" : "text-ledger-slate"
                        } ${i < transactions.length - 1 ? "border-b border-rule" : ""}`}
                      >
                        {t.category}
                      </td>
                      <td
                        className={`px-3.5 py-2.5 font-mono text-xs ${
                          t.confidence < 70 ? "text-ledger-amber" : "text-ledger-slate"
                        } ${i < transactions.length - 1 ? "border-b border-rule" : ""}`}
                      >
                        {t.confidence}%
                      </td>
                      <td
                        className={`px-3.5 py-2.5 font-mono text-sm text-right ${
                          i < transactions.length - 1 ? "border-b border-rule" : ""
                        }`}
                      >
                        {fmtUSD(t.amount)}
                      </td>
                      <td
                        className={`px-3.5 py-2.5 text-right ${
                          i < transactions.length - 1 ? "border-b border-rule" : ""
                        }`}
                      >
                        <Stamp status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Agent memo */}
            <div className="border border-rule rounded-md bg-white p-4">
              <div className="font-sans text-[11px] tracking-wide uppercase text-ledger-slate mb-2.5">
                Agent memo
              </div>
              {data.memo.length === 0 && (
                <p className="font-serif text-sm text-ledger-slate">
                  Nothing needed review this period \u2014 every line cleared on rules.
                </p>
              )}
              {data.memo.map((m, i) => (
                <p
                  key={i}
                  className={`font-serif text-[13px] leading-relaxed text-ink pb-3 mb-3 ${
                    i < data.memo.length - 1 ? "border-b border-rule" : ""
                  }`}
                >
                  {m}
                </p>
              ))}
            </div>
          </div>

          {/* Footer summary */}
          <div className="flex justify-between items-center border border-ink rounded-md px-4 py-3 bg-white">
            <div className="font-sans text-xs text-ledger-slate">
              Reconciliation status &mdash; period Aug 2026
            </div>
            <div className="flex gap-7">
              <div className="text-right">
                <div className="font-sans text-[11px] text-ledger-slate">Total reviewed</div>
                <div className="font-mono text-sm font-semibold">{fmtUSD(total)}</div>
              </div>
              <div className="text-right">
                <div className="font-sans text-[11px] text-ledger-slate">Awaiting review</div>
                <div className="font-mono text-sm font-semibold text-ledger-amber">
                  {fmtUSD(flaggedTotal)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
