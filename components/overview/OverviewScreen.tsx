"use client";

import { useMemo } from "react";
import { AlertTriangle, ChevronDown, Info, ShieldCheck } from "lucide-react";
import { Card, CardHeader, Pill, SeverityBadge } from "@/components/ui/primitives";
import { ActionTimeline } from "@/components/overview/ActionTimeline";
import { ResultCard } from "@/components/overview/ResultCard";
import { PROFILES, PROFILE_IDS } from "@/lib/data";
import { buildComparison, otherFindings, pickPrimaryScenario, primaryRuleId, safeguardFor } from "@/lib/demo";
import { formatUsd, formatUsdExact } from "@/lib/format";
import { useLossLabSession } from "@/lib/session";

export function OverviewScreen() {
  const { result, remediation, selectedGuardrails, profile, profileId, dispatch } = useLossLabSession();

  const baselineScenario = useMemo(() => pickPrimaryScenario(remediation.baseline), [remediation.baseline]);
  const comparison = useMemo(() => buildComparison(remediation, result), [remediation, result]);
  const safeguard = comparison.safeguard;
  const currentScenario = result.scenarios.find((scenario) => scenario.id === baselineScenario.id)!;
  const others = useMemo(() => otherFindings(remediation.baseline, baselineScenario.id), [remediation.baseline, baselineScenario.id]);

  const applySafeguard = () => dispatch({ type: "APPLY_GUARDRAILS", ids: [...new Set([...selectedGuardrails, safeguard])] });
  const resetTest = () => dispatch({ type: "APPLY_GUARDRAILS", ids: selectedGuardrails.filter((id) => id !== safeguard) });

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title={comparison.ruleCopy.title}
            description={comparison.ruleCopy.scenario}
            action={
              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* The badge always describes the *original* baseline evaluation. Once the replay has
                    run, a second chip states the current state so Critical is not read as the result. */}
                <span className="flex items-center gap-1.5">
                  {comparison.safeguardApplied ? <span className="label">Original risk</span> : null}
                  <SeverityBadge severity={baselineScenario.severity} />
                </span>
                {comparison.safeguardApplied ? <Pill tone="success">Mitigated replay passed</Pill> : null}
              </div>
            }
          />
          <div className="px-5 py-5">
            <ActionTimeline
              rows={comparison.timeline}
              title={comparison.safeguardApplied ? "Retest on the identical trace" : "Proposed actions"}
            />
            <div className="mt-5 rounded-md border border-line bg-canvas p-4">
              <p className="label flex items-center gap-1.5">
                {/* Once the safeguard is on, nothing is violated in the current run — the panel then
                    documents the rule the control now enforces, rather than contradicting the result. */}
                {comparison.safeguardApplied ? (
                  <><ShieldCheck size={12} className="text-success" /> Policy enforced</>
                ) : (
                  <><AlertTriangle size={12} className="text-danger" /> Policy violated</>
                )}
              </p>
              <p className="mt-2 text-[13px] leading-5 text-ink">{comparison.ruleCopy.explanation}</p>
              <p className="mt-3 border-t border-line pt-3 text-[12px] leading-5 text-subtle">
                <span className="font-medium text-ink">Rule {primaryRuleId(baselineScenario)}</span>
                <span className="mx-2 text-line-strong">·</span>
                {baselineScenario.violatedRuleDescription}
              </p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <ResultCard
            comparison={comparison}
            eventCount={baselineScenario.monthlyAffectedEvents}
            unitImpactCents={baselineScenario.unitEconomicImpactCents}
            onApply={applySafeguard}
            onReset={resetTest}
          />
        </div>
      </div>

      <Card>
        <CardHeader
          title="Other failing scenarios"
          description={`${others.length} remaining evaluated failures in ${profile.company}, largest modeled exposure first.`}
        />
        <ul className="divide-y divide-line">
          {others.map((scenario) => (
            <li key={scenario.id}>
              <details className="group px-5 py-3">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2">
                  <ChevronDown size={14} className="shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180" />
                  <span className="metric text-[12px] text-subtle">{scenario.caseId}</span>
                  <span className="text-[13px] font-medium text-ink">{scenario.name}</span>
                  <SeverityBadge severity={scenario.severity} />
                  <span className="ml-auto metric text-[13px] font-semibold text-ink">{formatUsd(scenario.modeledExposureCents)}</span>
                </summary>
                <div className="mt-3 ml-6 border-l border-line pl-4">
                  <p className="text-[13px] leading-5 text-ink">{scenario.violatedRuleDescription}</p>
                  <p className="mt-2 text-[12px] leading-5 text-subtle">
                    <span className="font-medium text-ink">Observed:</span> {scenario.observedAction}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-subtle">
                    <span className="font-medium text-ink">Expected:</span> {scenario.expectedAction}
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-subtle">
                    <span className="font-medium text-ink">Rule {scenario.violatedRuleId}</span>
                    <span className="mx-2 text-line-strong">·</span>
                    {scenario.monthlyAffectedEvents.toLocaleString("en-US")} events/mo × {formatUsdExact(scenario.unitEconomicImpactCents)}
                  </p>
                </div>
              </details>
            </li>
          ))}
          {others.length === 0 ? <li className="px-5 py-4 text-[13px] text-subtle">No other failures remain in this profile.</li> : null}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Agent profiles" description="Switch the environment under test. Figures are authored fixtures." />
          <ul className="divide-y divide-line">
            {PROFILE_IDS.map((id) => {
              const item = PROFILES[id];
              const selected = profileId === id;
              const failures = item.scenarios.filter((scenario) => scenario.violatedRuleId !== null).length;
              return (
                <li key={id}>
                  <button
                    onClick={() => dispatch({ type: "SELECT_PROFILE", profileId: id })}
                    aria-pressed={selected}
                    className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-left transition-colors duration-200 ${
                      selected ? "bg-primary-soft" : "hover:bg-canvas"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] font-semibold ${selected ? "text-primary" : "text-ink"}`}>{item.company}</span>
                      <span className="mt-0.5 block text-[12px] text-subtle">{item.agentName}</span>
                    </span>
                    <span className="text-right">
                      <span className="metric block text-[13px] font-semibold text-ink">{formatUsd(item.monthlyExposureCents)}</span>
                      <span className="block text-[12px] text-subtle">{failures} failing fixtures</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Technical evidence" description="The exact inputs behind the result above." />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4">
            {[
              { term: "Run ID", value: result.runId },
              { term: "Policy version", value: result.policyVersion },
              { term: "Seed", value: String(result.seed) },
              { term: "Volume multiplier", value: `${result.volumeMultiplier.toFixed(2)}×` },
              { term: "Safeguard control", value: safeguardFor(baselineScenario) },
              { term: "Blocked actions", value: currentScenario.evaluation.blockedActionIds.join(", ") || "none" },
            ].map((row) => (
              <div key={row.term}>
                <dt className="label">{row.term}</dt>
                <dd className="metric mt-1 break-all text-[12px] text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
          <details className="border-t border-line px-5 py-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-medium text-ink">
              <ChevronDown size={14} className="text-subtle transition-transform duration-200" />
              Evaluated action trace
            </summary>
            <pre className="mt-3 max-h-72 overflow-auto rounded-md border border-line bg-canvas p-3 text-[12px] leading-5 text-ink">
{JSON.stringify(currentScenario.evaluation.evaluatedActions, null, 2)}
            </pre>
            <p className="mt-3 flex items-start gap-2 text-[12px] leading-5 text-subtle">
              <Info size={13} className="mt-0.5 shrink-0 text-line-strong" />
              {currentScenario.evaluation.evidence}
            </p>
          </details>
        </Card>
      </div>

      <p className="pb-2 text-[12px] leading-5 text-subtle">
        Synthetic fixtures evaluated locally by the deterministic policy engine. Modeled exposure is not observed loss and
        no production agent is connected.
      </p>
    </div>
  );
}
