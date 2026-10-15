"use client";

import { useMemo } from "react";
import { Download, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button, Card, CardHeader, Metric, Pill, SeverityBadge } from "@/components/ui/primitives";
import { GUARDRAILS, PROPOSED_GUARDRAILS } from "@/lib/policies";
import { useLossLabSession } from "@/lib/session";
import { formatUsd, formatUsdExact } from "@/lib/format";
import type { ScenarioCategory } from "@/lib/types";

const CATEGORIES: readonly ScenarioCategory[] = ["Policy Breach", "Prompt Injection", "Economic Manipulation", "Escalation Loop"];

function downloadReport(payload: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ReportsScreen() {
  const { profile, profileId, result, remediation, selectedGuardrails, volumeMultiplier, dispatch } = useLossLabSession();
  const proposedApplied = PROPOSED_GUARDRAILS.every((id) => selectedGuardrails.includes(id));
  const top = useMemo(() => [...result.scenarios].filter((scenario) => !scenario.evaluation.passed).sort((a, b) => b.modeledExposureCents - a.modeledExposureCents).slice(0, 5), [result]);
  const reductionPercent = (remediation.reductionBasisPoints / 100).toFixed(2);
  const maxCategory = Math.max(1, ...Object.values(result.exposureByCategoryCents));

  const onExport = () => downloadReport({
    reportVersion: "2.0.0",
    mode: result.assumptions.mode,
    profile,
    run: result,
    findings: result.scenarios.filter((scenario) => !scenario.evaluation.passed),
    remediation,
    disclaimer:
      "All inputs, evaluations, event rates, unit economics and modeled exposure are synthetic fixtures. This report is not observed loss, live telemetry, or a forecast.",
  }, `${profileId}-${result.runId.toLowerCase()}-exposure-report.json`);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Exposure report"
          description={`${profile.company} at ${volumeMultiplier.toFixed(2)}× decision volume. Figures reconcile to the same evaluated run.`}
          action={<Button variant="secondary" onClick={onExport} data-testid="export-report"><Download size={14} /> Export JSON</Button>}
        />
        <div className="grid grid-cols-2 gap-5 border-b border-line px-5 py-4 lg:grid-cols-4">
          <Metric label="Baseline" value={formatUsd(remediation.baselineExposureCents)} tone="danger" hint="Per month" testId="report-baseline" />
          <Metric label="Prevented" value={formatUsd(remediation.preventedExposureCents)} tone="success" hint="With safeguards" testId="report-prevented" />
          <Metric label="Residual" value={formatUsd(remediation.residualExposureCents)} tone={remediation.residualExposureCents ? "ink" : "success"} hint="Remaining risk" testId="report-residual" />
          <Metric label="Reduction" value={`${reductionPercent}%`} tone="success" hint={`${selectedGuardrails.length} control(s)`} testId="report-reduction" />
        </div>
        <div className="px-5 py-4">
          <div className="h-2 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-success transition-all duration-250" style={{ width: `${Math.min(100, remediation.reductionBasisPoints / 100)}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-subtle" data-testid="reconciliation">
            Baseline <span className="metric text-ink">{formatUsdExact(remediation.baselineExposureCents)}</span> = prevented{" "}
            <span className="metric text-ink">{formatUsdExact(remediation.preventedExposureCents)}</span> + residual{" "}
            <span className="metric text-ink">{formatUsdExact(remediation.residualExposureCents)}</span>
          </p>
          <label htmlFor="volume" className="label mt-5 block">Decision volume {volumeMultiplier.toFixed(2)}×</label>
          <input
            id="volume"
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={volumeMultiplier}
            onChange={(event) => dispatch({ type: "VOLUME", value: Number(event.target.value) })}
            className="mt-2 w-full accent-[#176B66]"
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Safeguard controls"
            description="Enabling a control replays the identical traces under stricter rules."
            action={
              <Button
                variant={proposedApplied ? "secondary" : "primary"}
                data-testid="apply-suite"
                aria-pressed={proposedApplied}
                onClick={() => dispatch({ type: "APPLY_GUARDRAILS", ids: proposedApplied ? [] : [...PROPOSED_GUARDRAILS] })}
              >
                <ShieldCheck size={14} /> {proposedApplied ? "Clear suite" : "Apply proposed suite"}
              </Button>
            }
          />
          <ul className="divide-y divide-line">
            {GUARDRAILS.map((control) => {
              const checked = selectedGuardrails.includes(control.id);
              const intercepts = remediation.affectedScenarioIds.some((id) =>
                result.scenarios.find((scenario) => scenario.id === id)?.proposedGuardrail === control.id && checked);
              return (
                <li key={control.id}>
                  <label className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors duration-200 hover:bg-canvas">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => dispatch({ type: "TOGGLE_GUARDRAIL", id: control.id })}
                      className="mt-0.5 size-4 shrink-0 accent-[#176B66]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-ink">{control.label}</span>
                      <span className="mt-0.5 block text-[12px] leading-5 text-subtle">{control.description}</span>
                    </span>
                    {intercepts ? <Pill tone="success">Intercepted</Pill> : null}
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Exposure by category" description="Modeled monthly exposure of the current run." />
            <div className="space-y-3 px-5 py-4">
              {CATEGORIES.map((category) => {
                const cents = result.exposureByCategoryCents[category];
                return (
                  <div key={category}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] text-ink">{category}</span>
                      <span className="metric text-[12px] text-subtle">{formatUsdExact(cents)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                      <div className="h-full rounded-full bg-primary transition-all duration-250" style={{ width: `${(cents / maxCategory) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Most expensive failures" description="Largest modeled exposure still unguarded." />
            <ul className="divide-y divide-line">
              {top.map((scenario) => (
                <li key={scenario.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                  <span className="metric text-[12px] text-subtle">{scenario.caseId}</span>
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">{scenario.name}</span>
                  <SeverityBadge severity={scenario.severity} />
                  <span className="metric text-[13px] font-semibold text-ink">{formatUsd(scenario.modeledExposureCents)}</span>
                </li>
              ))}
              {top.length === 0 ? <li className="px-5 py-4 text-[13px] text-subtle">No failing traces remain with the current safeguards.</li> : null}
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-start gap-3 px-5 py-4">
          <TriangleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
          <p className="min-w-0 flex-1 text-[12px] leading-5 text-subtle">
            {remediation.assumptions}
          </p>
          <Pill tone="primary"><ShieldCheck size={12} /> {result.assumptions.mode}</Pill>
        </div>
      </Card>
    </div>
  );
}
