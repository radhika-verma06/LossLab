"use client";

import { ArrowDownLeft, Ban, BookOpenCheck, Check, ChevronRight, CircleHelp, FileCode2, Fingerprint, ScanEye, ShieldAlert, X } from "lucide-react";
import { formatUsdExact, severityClass } from "@/lib/format";
import { useLossLabSession } from "@/lib/session";
import type { RunResult } from "@/lib/types";

export function FindingDrawer({ scenario, onClose, remediation = false }: {
  readonly scenario: RunResult["scenarios"][number];
  readonly onClose: () => void;
  readonly remediation?: boolean;
}) {
  const blocked = remediation && scenario.evaluation.passed && scenario.evaluation.guardrailsApplied.length > 0;
  const actionNames = scenario.structuredToolTrace.map((action) => action.type).join(" → ");
  return <section role="dialog" aria-modal="false" aria-labelledby="finding-title" className="mt-3 rounded-sm border border-alert/35 bg-[#130f11] p-4 shadow-[0_0_40px_rgba(255,69,69,.09)] md:p-5">
    <div className="flex items-start justify-between gap-3">
      <div><p className="micro flex items-center gap-2 text-alert"><ShieldAlert size={12} /> {blocked ? "PROPOSED ACTION BLOCKED" : "POLICY VIOLATION IDENTIFIED"}</p><h3 id="finding-title" className="mt-2 text-[16px] font-semibold">{scenario.name}</h3><p className="mt-1 font-mono text-[9px] text-muted">{scenario.caseId} <span className="mx-2 text-line">/</span> {scenario.evaluation.violations[0]?.ruleId ?? scenario.violatedRuleId ?? "PASS"}</p></div>
      <button onClick={onClose} aria-label="Close finding details" className="grid size-8 shrink-0 place-items-center border border-line text-muted hover:text-ink"><X size={14} /></button>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="border border-line bg-void/70 p-3"><p className="micro flex items-center gap-2 text-muted"><BookOpenCheck size={11} className="text-cyan" /> SOURCE POLICY</p><p className="mt-2 text-[10px] leading-relaxed text-ink">{scenario.violatedRuleDescription}</p></div>
      <div className="border border-line bg-void/70 p-3"><p className="micro flex items-center gap-2 text-muted"><Ban size={11} className="text-alert" /> EVALUATOR RESULT</p><p className="mt-2 text-[10px] leading-relaxed text-[#ffc6c6]">{blocked ? "Guardrail intercepted the unsafe effect before execution." : scenario.evaluation.violations.map((item) => `${item.ruleId}: ${item.observed}`).join("; ") || scenario.observedAction}</p></div>
    </div>
    <div className="mt-3 border border-line bg-void/70 p-3"><p className="micro flex items-center gap-2 text-muted"><CircleHelp size={11} className="text-cyan" /> REQUEST CONTEXT</p><p className="mt-2 text-[10px] leading-relaxed text-[#c9d5d4]">“{scenario.userMessage}”</p><p className="mt-2 text-[9px] leading-relaxed text-muted">AGENT RESPONSE · <span className="text-[#c9d5d4]">{scenario.agentResponse}</span></p></div>
    <details className="mt-3 border border-line bg-void/70 p-3" open><summary className="micro flex cursor-pointer list-none items-center gap-2 text-cyan"><FileCode2 size={12} /> STRUCTURED ACTION TRACE <span className="ml-auto font-mono text-muted">{actionNames}</span></summary>
      <pre className="mt-3 overflow-x-auto text-[9px] leading-relaxed text-[#bcd3d0]">{JSON.stringify(scenario.evaluation.evaluatedActions, null, 2)}</pre></details>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="border border-line p-3"><p className="micro text-muted"><Check size={11} className="mr-1 inline text-cyan" />EXPECTED ACTION</p><p className="mt-2 text-[10px] leading-relaxed text-[#bcd5d1]">{scenario.expectedAction}</p></div>
      <div className={`border p-3 ${blocked ? "border-cyan/30 bg-cyan/[.025]" : "border-alert/25 bg-alert/[.025]"}`}><p className="micro text-muted"><Fingerprint size={11} className={`mr-1 inline ${blocked ? "text-cyan" : "text-alert"}`} />MODELED EXPOSURE / MONTH</p><p className={`metric mt-1 text-lg ${blocked ? "text-cyan" : "text-alert"}`}>{formatUsdExact(scenario.modeledExposureCents)}</p><p className="mt-1 text-[8px] leading-relaxed text-muted">{scenario.monthlyAffectedEvents.toLocaleString()} assumed events × {formatUsdExact(scenario.unitEconomicImpactCents)} unit impact. Synthetic model; not observed loss.</p></div>
    </div>
    <div className="mt-3 flex items-start gap-2 border-l-2 border-amber/40 bg-amber/[.025] p-3"><ScanEye size={12} className="mt-0.5 shrink-0 text-amber" /><p className="text-[10px] leading-relaxed text-[#c6d0cb]"><span className="micro text-amber">PROPOSED CONTROL / </span>{scenario.proposedGuardrail}<br />{scenario.explanatoryEvidence}</p></div>
    {scenario.evaluation.evidence && <p className="mt-3 font-mono text-[8px] leading-relaxed text-muted">EVALUATOR · {scenario.evaluation.evidence}</p>}
  </section>;
}
