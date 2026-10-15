"use client";

import { ArrowDownRight, ArrowRight, BadgeCheck, CircleHelp, FileKey2, FileText, LockKeyhole, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { PROFILES } from "@/lib/data";
import { formatUsd } from "@/lib/format";
import { useLossLabSession } from "@/lib/session";
import type { ProfileId, ScenarioCategory, Severity } from "@/lib/types";

const marks: Record<Severity, string> = { Critical: "text-alert bg-alert/10 border-alert/20", High: "text-amber bg-amber/10 border-amber/20", Medium: "text-[#d5bc69] bg-[#d5bc69]/10 border-[#d5bc69]/20", Low: "text-muted bg-white/[.025] border-line" };
const profiles: readonly ProfileId[] = ["skybridge", "meridian", "atlaspay"];
const categories: readonly ScenarioCategory[] = ["Policy Breach", "Prompt Injection", "Economic Manipulation", "Escalation Loop"];

export function SetupScreen() {
  const { profile, profileId, result, phase, dispatch } = useLossLabSession();
  const violations = result.scenarios.filter((scenario) => scenario.violatedRuleId !== null);
  const preview = ["Critical", "High", "Medium", "Low"].map((severity) => ({ severity, count: violations.filter((scenario) => scenario.severity === severity).length }));
  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="micro text-cyan">RISK ENGINEERING / AUTONOMOUS COMMERCE</p><h1 className="mt-3 max-w-3xl text-[clamp(28px,4vw,49px)] font-semibold leading-[1.04] tracking-[-.045em]">TEST AUTONOMY<br className="hidden sm:block" /> BEFORE PRODUCTION.</h1><p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-muted">AI agents can sound helpful while crossing a business rule. LossLab evaluates structured action traces against explicit policy, then models the assumed economic exposure.</p></div>
      <div className="rounded-sm border border-line bg-panel px-3 py-2"><p className="micro text-muted">SUITE DESIGN</p><p className="mt-1 font-mono text-xs text-ink">40 TEST EVENTS <span className="text-line">·</span> REPLAYABLE <span className="text-line">·</span> SEEDED</p></div>
    </div>

    <div className="mt-7 flex flex-wrap items-center gap-2"><span className="micro text-muted">1 / SELECT AGENT PROFILE</span><span className="h-px min-w-[30px] flex-1 bg-line" /><span className="micro text-muted">3 SYNTHETIC ENVIRONMENTS</span></div>
    <div className="mt-3 grid gap-3 xl:grid-cols-3">
      {profiles.map((id, index) => {
        const item = PROFILES[id];
        const selected = profileId === id;
        const failing = item.scenarios.filter((scenario) => scenario.violatedRuleId !== null);
        const sample = failing[0]!;
        return <button key={id} onClick={() => dispatch({ type: "SELECT_PROFILE", profileId: id })} aria-pressed={selected} className={`group relative overflow-hidden rounded-sm border p-4 text-left transition-colors ${selected ? "border-cyan/50 bg-[#10211e]" : "border-line bg-panel hover:border-[#49666a]"}`}>
          {selected && <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" />}
          <div className="flex items-center justify-between"><span className={`micro ${selected ? "text-cyan" : "text-muted"}`}>PROFILE / {String(index + 1).padStart(2, "0")}</span><span className={`flex items-center gap-1 text-[9px] ${selected ? "text-cyan" : "text-muted"}`}>{selected ? <><BadgeCheck size={12} /> SELECTED</> : <>SELECT PROFILE <ArrowRight size={10} /></>}</span></div>
          <h2 className="mt-4 text-[19px] font-semibold tracking-tight">{item.company}</h2><p className="mt-1 text-[11px] text-muted">{item.agentName}</p>
          <p className="mt-3 min-h-[38px] text-[11px] leading-relaxed text-[#b6c5c5]">{item.useCase}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 border-y border-line py-3"><div><p className="micro text-muted">DECISIONS / DAY</p><p className="metric mt-1 text-[15px]">{item.dailyDecisionVolume.toLocaleString("en-US")}</p></div><div><p className="micro text-muted">AGENTS TOUCHING MONEY</p><p className="metric mt-1 text-[15px]">{item.agentsTouchingMoney}</p></div><div><p className="micro text-muted">BASELINE / MONTH</p><p className="metric mt-1 text-lg font-semibold text-amber">{formatUsd(item.monthlyExposureCents)}</p></div><div><p className="micro text-muted">VIOLATION FIXTURES</p><p className="metric mt-1 text-[15px]">{failing.length}<span className="text-muted"> / 40 cases</span></p></div></div>
          <div className="mt-3 flex items-center gap-1.5" aria-label={`Severity profile: ${failing.filter((scenario) => scenario.severity === "Critical").length} critical, ${failing.filter((scenario) => scenario.severity === "High").length} high`}>
            {preview.map(({ severity, count }) => count > 0 && <span key={severity} className={`border px-1.5 py-1 text-[8px] font-mono ${marks[severity as Severity]}`}>{severity.toUpperCase()} <b className="ml-1">{failing.filter((scenario) => scenario.severity === severity).length}</b></span>)}
          </div>
          <p className="mt-3 border-l border-line pl-2 text-[10px] leading-relaxed text-muted"><span className="text-alert">{sample.name}:</span> {sample.explanatoryEvidence}</p>
        </button>;
      })}
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-sm border border-line bg-panel p-4 md:p-5" aria-labelledby="policy-heading">
        <div className="flex items-center justify-between"><h2 id="policy-heading" className="micro flex items-center gap-2 text-ink"><FileKey2 size={13} className="text-cyan" /> KEY BUSINESS CONTROLS</h2><span className="micro text-muted">{profile.company.toUpperCase()}</span></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{profile.controlsSummary.map((control, index) => <p key={control} className="flex gap-2 border border-line/70 bg-void/50 px-3 py-2.5 text-[10px] leading-relaxed text-[#bdcdcc]"><span className="font-mono text-cyan">{String(index + 1).padStart(2, "0")}</span>{control}</p>)}</div>
      </section>
      <section className="rounded-sm border border-line bg-panel p-4 md:p-5" aria-labelledby="model-heading">
        <h2 id="model-heading" className="micro flex items-center gap-2 text-ink"><CircleHelp size={13} className="text-amber" /> EXPOSURE ASSUMPTION</h2>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">For every authored case, <span className="font-mono text-ink">monthly affected events × assumed unit impact</span> yields modeled monthly exposure. For {profile.company}, that fixture schedule is <span className="font-mono text-amber">{formatUsd(profile.monthlyExposureCents)}</span>.</p>
        <p className="mt-3 flex items-start gap-2 text-[9px] leading-relaxed text-muted"><TriangleAlert size={12} className="mt-px shrink-0 text-amber" />Modeled exposure assumes a synthetic 30-day incident rate and unit economic impact for each action. It is not actual loss, live telemetry, or an empirically measured forecast.</p>
      </section>
    </div>

    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
      <button disabled={phase === "RUNNING"} onClick={() => { dispatch({ type: "START" }); dispatch({ type: "NAVIGATE", tab: "run" }); }} className="inline-flex min-h-11 items-center gap-3 border border-cyan/50 bg-cyan px-5 text-[11px] font-bold tracking-[.1em] text-[#071210] transition-colors hover:bg-[#70ffe9] disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck size={15} /> RUN RED-TEAM SUITE <ArrowRight size={15} /></button>
      <button onClick={() => dispatch({ type: "SELECT_FINDING", id: result.scenarios.find((scenario) => !scenario.evaluation.passed)?.id ?? null })} className="inline-flex min-h-11 items-center gap-2 border border-line px-4 text-[10px] text-muted transition-colors hover:border-cyan/40 hover:text-ink"><FileText size={13} /> VIEW SAMPLE POLICY</button>
      <span className="ml-auto flex items-center gap-2 text-[9px] text-muted"><LockKeyhole size={11} className="text-cyan" /> Local deterministic engine <span className="text-line">/</span> no production integrations</span>
    </div>
    <div className="mt-5 flex items-start gap-2 text-[9px] leading-relaxed text-muted"><Sparkles size={11} className="mt-0.5 shrink-0 text-cyan" />Each selected profile has 14 or 8 authored violating fixtures and distinct passing controls. Remaining events repeat deterministic passing fixtures to model a 40-case test suite; they are not additional independent production observations.</div>
  </section>;
}
