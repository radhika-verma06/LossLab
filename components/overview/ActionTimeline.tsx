"use client";

import { CircleCheck } from "lucide-react";
import { formatUsdExact } from "@/lib/format";
import type { ActionOutcome, TimelineRow } from "@/lib/demo";
import type { ActionType } from "@/lib/types";

const ACTION_LABEL: Readonly<Record<ActionType, string>> = {
  refund: "Refund",
  support_credit: "Support credit",
  discount: "Discount",
  cancel: "Cancellation",
  escalate: "Escalation",
  retry: "Retry",
  block_payment: "Payment block",
  reassign: "Reassignment",
  authorize: "Authorization",
};

const OUTCOME: Readonly<Record<ActionOutcome, { readonly label: string; readonly chip: string; readonly dot: string }>> = {
  accepted: { label: "Accepted", chip: "border-line bg-canvas text-subtle", dot: "bg-line-strong" },
  duplicate: { label: "Duplicate detected", chip: "border-danger/25 bg-danger-soft text-danger", dot: "bg-danger" },
  blocked: { label: "Blocked by safeguard", chip: "border-success/25 bg-success-soft text-success", dot: "bg-success" },
};

export function ActionTimeline({ rows, title }: { readonly rows: readonly TimelineRow[]; readonly title: string }) {
  return (
    <div data-testid="demo-timeline">
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      <ol className="mt-3">
        {rows.map((row, index) => {
          const outcome = OUTCOME[row.outcome];
          const last = index === rows.length - 1;
          return (
            <li key={row.action.actionId} className="relative flex gap-3" data-outcome={row.outcome}>
              <div className="flex flex-col items-center pt-1.5">
                <span className={`size-2 shrink-0 rounded-full ${outcome.dot}`} />
                {!last ? <span className="mt-1 w-px flex-1 bg-line" /> : null}
              </div>
              <div className={`min-w-0 flex-1 ${last ? "pb-0" : "pb-4"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[14px] leading-5 text-ink">
                    <span className="metric mr-2 text-subtle">{index + 1}.</span>
                    {ACTION_LABEL[row.action.type]}
                    {row.amountCents > 0 ? <span className="metric ml-2 font-medium">{formatUsdExact(row.amountCents)}</span> : null}
                  </p>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 text-[12px] font-medium ${outcome.chip}`}>
                    {row.outcome === "blocked" ? <CircleCheck size={12} /> : null}
                    {outcome.label}
                  </span>
                </div>
                <p className="mt-1 truncate text-[12px] text-subtle">
                  <span className="metric">{row.reference}</span>
                  {row.action.approvedByHuman ? <span className="ml-2 text-subtle">· staff approved</span> : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
