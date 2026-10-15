"use client";

import { ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { Button, Metric } from "@/components/ui/primitives";
import { formatUsd, formatUsdExact } from "@/lib/format";
import type { DemoComparison } from "@/lib/demo";
import { GUARDRAILS } from "@/lib/policies";

export function ResultCard({ comparison, eventCount, unitImpactCents, onApply, onReset }: {
  readonly comparison: DemoComparison;
  readonly eventCount: number;
  readonly unitImpactCents: number;
  readonly onApply: () => void;
  readonly onReset: () => void;
}) {
  const { attempts, atRiskCents, afterRiskCents, preventedCents, safeguardApplied, safeguard, severity } = comparison;
  const control = GUARDRAILS.find((item) => item.id === safeguard)!;
  const unsafeNow = comparison.timeline.filter((row) => row.outcome === "duplicate").length;
  // Duplicates are a property of the baseline trace, so this stays the pre-safeguard count even
  // after the retest turns those same rows into "blocked".
  const unsafeBefore = comparison.timeline.filter((row) => row.isDuplicate).length;

  return (
    <div className="rounded-lg border border-line bg-surface shadow-card">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold leading-6 text-ink">Result</h2>
          <span data-testid="safeguard-state" className={`rounded border px-2 py-0.5 text-[12px] font-medium ${
            safeguardApplied ? "border-success/25 bg-success-soft text-success" : "border-danger/25 bg-danger-soft text-danger"
          }`}>
            {safeguardApplied ? "Safeguard on" : "No safeguard"}
          </span>
        </div>
      </div>

      {/* "Modeled monthly exposure" wraps to three lines at this column width; reserving the same
          label height keeps the three numbers on one baseline instead of staggering the last one. */}
      <div className="grid grid-cols-3 gap-4 border-b border-line px-5 py-4 [&_.label]:min-h-[3.1rem]">
        <Metric label="Refund attempts" value={String(attempts)} hint="In this trace" testId="metric-attempts" />
        <Metric
          label="Unsafe actions"
          value={String(unsafeNow)}
          tone={unsafeNow > 0 ? "danger" : "success"}
          hint={unsafeNow > 0 ? "Would execute" : unsafeBefore > 0 ? `Was ${unsafeBefore} · now blocked` : "All clear"}
          testId="metric-unsafe"
        />
        <Metric
          label="Modeled monthly exposure"
          value={formatUsd(safeguardApplied ? afterRiskCents : atRiskCents)}
          tone={safeguardApplied ? "success" : "danger"}
          hint={safeguardApplied ? "Remaining per month" : "Not booked loss"}
          testId="metric-exposure"
        />
      </div>

      <div className="px-5 py-4">
        {!safeguardApplied ? (
          <>
            <Button variant="primary" onClick={onApply} data-testid="apply-safeguard" className="w-full">
              <ShieldCheck size={15} /> Apply safeguard and retest
            </Button>
            <p className="mt-3 text-[12px] leading-5 text-subtle">
              Enables <span className="font-medium text-ink">{control.label}</span> and replays the identical trace through the evaluator.
            </p>
          </>
        ) : (
          <>
            <div className="rounded-md border border-line bg-canvas p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label">Original run</p>
                  <p className="metric mt-1 text-[18px] font-semibold text-danger" data-testid="before-exposure">{formatUsdExact(atRiskCents)}</p>
                  <p className="mt-0.5 text-[12px] text-subtle">at risk · {severity} severity</p>
                </div>
                <div className="border-l border-line pl-4">
                  <p className="label">Mitigated replay</p>
                  <p className="metric mt-1 text-[18px] font-semibold text-success" data-testid="after-exposure">{formatUsdExact(afterRiskCents)}</p>
                  <p className="mt-0.5 text-[12px] text-subtle">at risk · replay passed</p>
                </div>
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[13px] leading-5 text-ink" data-testid="prevented">
                <span className="metric font-semibold text-success">{formatUsdExact(preventedCents)}</span> of modeled monthly exposure prevented in this simulated replay.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[12px] text-subtle">
                <ShieldCheck size={13} className="text-success" /> {control.label}
              </p>
              <button
                onClick={onReset}
                data-testid="reset-test"
                className="inline-flex items-center gap-1.5 rounded text-[12px] font-medium text-subtle transition-colors duration-200 hover:text-ink"
              >
                <RotateCcw size={12} /> Reset test
              </button>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-line px-5 py-3">
        <p className="flex items-start gap-2 text-[12px] leading-5 text-subtle">
          <ArrowRight size={13} className="mt-0.5 shrink-0 text-line-strong" />
          <span>
            Modeled monthly exposure assumes <span className="metric text-ink">{eventCount.toLocaleString("en-US")}</span> affected events per month at{" "}
            <span className="metric text-ink">{formatUsdExact(unitImpactCents)}</span> each — not the cost of a single test. Synthetic model, not booked loss.
          </span>
        </p>
      </div>
    </div>
  );
}
