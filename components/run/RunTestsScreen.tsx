"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Play, ShieldAlert } from "lucide-react";
import { Button, Card, CardHeader, Metric, SeverityBadge } from "@/components/ui/primitives";
import { formatUsd, formatUsdExact } from "@/lib/format";
import { useLossLabSession } from "@/lib/session";

type Filter = "all" | "failing" | "passing";

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "All traces" },
  { id: "failing", label: "Failing" },
  { id: "passing", label: "Passing" },
];

export function RunTestsScreen() {
  const { result, profile, selectedGuardrails, dispatch } = useLossLabSession();
  const [filter, setFilter] = useState<Filter>("all");
  const [runs, setRuns] = useState(1);
  const [lastRunId, setLastRunId] = useState(result.runId);

  const rows = useMemo(() => result.scenarios.map((scenario, index) => ({
    scenario,
    event: result.events[index]!,
  })), [result]);

  const visible = rows.filter(({ scenario }) => filter === "all" ? true : filter === "failing" ? !scenario.evaluation.passed : scenario.evaluation.passed);

  const runSuite = () => {
    setLastRunId(result.runId);
    dispatch({ type: "RERUN" });
    setRuns((value) => value + 1);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Red-team suite"
          description={`${result.scenarios.length} deterministic action traces for ${profile.company}. The policy engine evaluates the whole suite locally.`}
          action={
            <Button variant="primary" onClick={runSuite} data-testid="run-suite">
              <Play size={14} /> Run suite
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-5 border-b border-line px-5 py-4 md:grid-cols-4">
          <Metric label="Traces" value={String(result.scenarios.length)} hint={`Run ${runs}`} />
          <Metric label="Failing" value={String(result.violations)} tone="danger" hint="Policy violations" />
          <Metric label="Passing" value={String(result.passing)} tone="success" hint="Safe behaviour" />
          <Metric label="Modeled exposure" value={formatUsd(result.monthlyExposureCents)} tone={result.violations ? "danger" : "success"} hint="Per month" />
        </div>
        <p className="flex items-center gap-2 px-5 py-3 text-[12px] text-subtle">
          {runs > 1 ? <CheckCircle2 size={13} className="text-success" /> : <ShieldAlert size={13} className="text-line-strong" />}
          {runs > 1 && lastRunId === result.runId
            ? <>Repeat run reproduced the identical run ID <span className="metric text-ink">{result.runId}</span> — the engine is deterministic.</>
            : <>Run ID <span className="metric text-ink">{result.runId}</span>. Identical inputs always reproduce this result.</>}
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Evaluated traces"
          description="Every trace is scored before playback; nothing here is sampled at random."
          action={
            <div className="flex gap-1 rounded-md border border-line bg-canvas p-0.5" role="group" aria-label="Filter traces">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  aria-pressed={filter === item.id}
                  className={`rounded px-2.5 py-1 text-[12px] font-medium transition-colors duration-200 ${
                    filter === item.id ? "bg-surface text-ink shadow-card" : "text-subtle hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          }
        />
        <ul className="divide-y divide-line" data-testid="trace-list">
          {visible.map(({ scenario }) => {
            const failed = !scenario.evaluation.passed;
            return (
              <li key={scenario.id}>
                <details className="group px-5 py-3">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2">
                    <ChevronDown size={14} className="shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180" />
                    <span className="metric shrink-0 text-[12px] text-subtle">{scenario.caseId}</span>
                    <span className="text-[13px] font-medium text-ink">{scenario.name}</span>
                    {failed ? <SeverityBadge severity={scenario.severity} /> : (
                      <span className="inline-flex items-center gap-1 rounded border border-success/25 bg-success-soft px-1.5 py-0.5 text-[11px] font-semibold text-success">
                        Passed
                      </span>
                    )}
                    <span className={`ml-auto metric text-[13px] font-semibold ${failed ? "text-ink" : "text-subtle"}`}>
                      {failed ? formatUsd(scenario.modeledExposureCents) : "—"}
                    </span>
                  </summary>
                  <div className="mt-3 ml-6 border-l border-line pl-4">
                    <p className="text-[13px] leading-5 text-ink">{failed ? scenario.violatedRuleDescription : scenario.passExplanation}</p>
                    <p className="mt-2 text-[12px] leading-5 text-subtle">
                      <span className="font-medium text-ink">Customer:</span> {scenario.userMessage}
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-subtle">
                      <span className="font-medium text-ink">Agent:</span> {scenario.agentResponse}
                    </p>
                    {failed ? (
                      <p className="mt-2 text-[12px] leading-5 text-subtle">
                        <span className="font-medium text-ink">Rule {scenario.evaluation.violations[0]?.ruleId ?? scenario.violatedRuleId}</span>
                        <span className="mx-2 text-line-strong">·</span>
                        {scenario.monthlyAffectedEvents.toLocaleString("en-US")} events/mo × {formatUsdExact(scenario.unitEconomicImpactCents)}
                      </p>
                    ) : null}
                    <pre className="mt-3 max-h-56 overflow-auto rounded-md border border-line bg-canvas p-3 text-[12px] leading-5 text-ink">
{JSON.stringify(scenario.evaluation.evaluatedActions, null, 2)}
                    </pre>
                  </div>
                </details>
              </li>
            );
          })}
          {visible.length === 0 ? <li className="px-5 py-4 text-[13px] text-subtle">No traces match this filter.</li> : null}
        </ul>
        <p className="border-t border-line px-5 py-3 text-[12px] text-subtle">
          {selectedGuardrails.length === 0
            ? "No safeguards are enabled, so these are the raw baseline results."
            : `${selectedGuardrails.length} safeguard control(s) enabled — traces were replayed rather than re-synthesised.`}
        </p>
      </Card>
    </div>
  );
}
