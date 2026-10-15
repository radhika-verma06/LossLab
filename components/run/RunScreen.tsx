"use client";

import { useEffect, useState } from "react";
import { PROPOSED_GUARDRAILS } from "@/lib/policies";
import { Activity, ArrowRight, CheckCircle2, ChevronRight, CirclePause, CirclePlay, FastForward, RotateCcw, ShieldAlert, SkipForward } from "lucide-react";
import { CorePanel } from "@/components/scene/CorePanel";
import { FindingDrawer } from "@/components/run/FindingDrawer";
import { formatUsdExact, severityClass } from "@/lib/format";
import { useLossLabSession } from "@/lib/session";

export function RunScreen() {
  const { result, profile, phase, cursor, playbackRate, selectedFindingId, selectedScenario, selectedGuardrails, reducedMotion, visibleEvents, dispatch } = useLossLabSession();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (phase !== "RUNNING") return;
    const interval = window.setInterval(() => setElapsed((value) => Math.min(40, value + (reducedMotion ? 0.08 : 0.1) * playbackRate)), 100);
    return () => window.clearInterval(interval);
  }, [phase, playbackRate, reducedMotion, result.runId]);
  useEffect(() => { if (phase === "IDLE") setElapsed(0); if (phase === "COMPLETE") setElapsed(40); }, [phase]);

  const ticker = visibleEvents.reduce((total, event) => total + event.exposureDeltaCents, 0);
  const current = cursor > 0 ? result.events[cursor - 1] : null;
  const select = (id: string | null) => dispatch({ type: "SELECT_FINDING", id });
  const control = <T extends "PAUSE" | "RESUME" | "START" | "REPLAY" | "COMPLETE">(type: T) => dispatch({ type });

  return <section>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="micro text-cyan">SIMULATION CONTROL / SYNTHETIC TRACE EXECUTION</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">RUN CONTROL</h1><p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-muted">The policy engine has already evaluated {result.events.length} deterministic action traces. Playback controls reveal each result in sequence; accelerating or pausing does not change the report.</p></div><span className={`flex items-center gap-2 border px-3 py-2 font-mono text-[10px] ${phase === "RUNNING" ? "border-amber/30 bg-amber/5 text-amber" : phase === "COMPLETE" ? "border-cyan/30 bg-cyan/5 text-cyan" : "border-line bg-panel text-muted"}`}><span className={`size-1.5 rounded-full ${phase === "RUNNING" ? "animate-pulse bg-amber" : phase === "COMPLETE" ? "bg-cyan" : "bg-muted"}`} />{phase === "RUNNING" ? "RUNNING" : phase === "PAUSED" ? "PAUSED" : phase === "COMPLETE" ? "SIMULATION COMPLETE" : "IDLE / READY"}</span></div>

    <div className="mt-5 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-5">
      {[{ label: "RUN IDENTIFIER", value: result.runId }, { label: "SCENARIOS", value: `${String(cursor).padStart(2, "0")} / ${result.events.length}` }, { label: "VIOLATIONS", value: String(result.violations), tone: "text-alert" }, { label: "MODELED EXPOSURE / MONTH", value: formatUsdExact(ticker), tone: "text-amber" }, { label: "SIMULATION CLOCK", value: `${elapsed.toFixed(1).padStart(5, "0")}s` }].map((stat) => <div key={stat.label} className="bg-panel px-3 py-3"><p className="micro text-muted">{stat.label}</p><p className={`metric mt-2 text-[16px] ${stat.tone ?? "text-ink"}`}>{stat.value}</p></div>)}
    </div>
    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.78fr)]">
      <div className="space-y-3"><div className="grid grid-cols-2 gap-2 md:grid-cols-4"><div className="border border-line bg-panel px-3 py-2"><p className="micro text-muted">AGENT PROFILE</p><p className="mt-1 truncate text-xs text-ink">{profile.company}</p></div><div className="border border-line bg-panel px-3 py-2"><p className="micro text-muted">POLICY VERSION</p><p className="mt-1 truncate font-mono text-[10px] text-cyan">{result.policyVersion}</p></div><div className="border border-line bg-panel px-3 py-2"><p className="micro text-muted">DETERMINISTIC SEED</p><p className="mt-1 font-mono text-[10px] text-ink">{result.seed}</p></div><div className="border border-line bg-panel px-3 py-2"><p className="micro text-muted">EVALUATION</p><p className="mt-1 font-mono text-[10px] text-cyan">PURE / LOCAL</p></div></div>
        <CorePanel result={result} cursor={cursor} onSelect={select} selectedId={selectedFindingId} reducedMotion={reducedMotion} />
        {selectedScenario && <FindingDrawer scenario={selectedScenario} onClose={() => select(null)} remediation={result.guardrails.length > 0} />}
      </div>

      <aside className="flex min-h-[550px] flex-col rounded-sm border border-line bg-panel" aria-label="Simulation event feed">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><div><h2 className="micro flex items-center gap-2 text-ink"><Activity size={13} className="text-cyan" /> EVALUATED ACTION FEED</h2><p className="mt-1 font-mono text-[8px] text-muted">SEQUENCE LOCKED / CURSOR {String(cursor).padStart(2, "0")}</p></div><span className="micro text-muted">{result.events.length} FIXTURES</span></div>
        <div className="grid grid-cols-[48px_minmax(0,1fr)_72px] gap-2 border-b border-line px-3 py-2 text-[8px] font-mono text-muted"><span>OFFSET</span><span>CASE / POLICY / RESULT</span><span className="text-right">DELTA / MO</span></div>
        <div className="min-h-0 flex-1 divide-y divide-line/70 overflow-y-auto" role="log" aria-live="polite" aria-label="Evaluated action results">
          {result.events.map((event, index) => {
            const scenario = result.scenarios.find((candidate) => candidate.id === event.scenarioId)!;
            const visible = index < cursor;
            const selected = selectedFindingId === event.scenarioId;
            return <button key={event.eventId} onClick={() => !event.passed && select(event.scenarioId)} disabled={event.passed} aria-current={selected ? "true" : undefined}
              className={`grid w-full grid-cols-[48px_minmax(0,1fr)_72px] items-center gap-2 px-3 py-2 text-left transition-colors ${!visible ? "opacity-45" : event.passed ? "hover:bg-white/[.018]" : "hover:bg-alert/[.045]"} ${selected ? "bg-alert/[.075]" : ""}`}>
              <span className="font-mono text-[8px] text-muted">T+{event.sequence - 1}.{event.sequence === 1 ? "00" : "40"}s</span>
              <span className="min-w-0"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="font-mono text-[8px] text-cyan">{event.caseId}</span><span className="truncate text-[9px] text-ink">{scenario.name}</span><span className={`border px-1 py-[1px] font-mono text-[7px] ${event.passed ? "border-cyan/25 text-cyan" : severityClass(scenario.severity)}`}>{event.passed ? "PASS" : scenario.severity.toUpperCase()}</span></span><span className="mt-1 block truncate text-[8px] text-muted">{event.passed ? scenario.passExplanation : event.ruleId}</span></span>
              <span className={`metric text-right text-[9px] ${visible && event.exposureDeltaCents > 0 ? "text-alert" : "text-muted"}`}>{visible && event.exposureDeltaCents > 0 ? `+${formatUsdExact(event.exposureDeltaCents)}` : "—"}</span>
            </button>;
          })}
          {phase === "IDLE" && <div className="p-5 text-center"><p className="micro text-muted">READY TO BEGIN</p><p className="mt-2 text-[10px] text-muted">Start the deterministic test suite to activate the feed. Outcomes are fixed before playback.</p></div>}
        </div>
        <div className="border-t border-line p-3">
          <div className="flex flex-wrap gap-2">
            {phase === "IDLE" && <button onClick={() => control("START")} className="flex min-h-9 flex-1 items-center justify-center gap-2 border border-cyan/40 bg-cyan px-3 text-[9px] font-bold tracking-wider text-void"><CirclePlay size={14} /> START TEST RUN</button>}
            {phase === "RUNNING" && <button onClick={() => control("PAUSE")} className="flex min-h-9 flex-1 items-center justify-center gap-2 border border-amber/30 bg-amber/5 px-3 text-[9px] font-bold text-amber"><CirclePause size={14} /> PAUSE</button>}
            {phase === "PAUSED" && <button onClick={() => control("RESUME")} className="flex min-h-9 flex-1 items-center justify-center gap-2 border border-cyan/40 bg-cyan px-3 text-[9px] font-bold text-void"><CirclePlay size={14} /> RESUME</button>}
            <button onClick={() => dispatch({ type: "RATE", rate: playbackRate === 1 ? 4 : 1 })} aria-pressed={playbackRate === 4} className={`flex min-h-9 items-center gap-2 border px-3 text-[9px] ${playbackRate === 4 ? "border-amber/40 text-amber" : "border-line text-muted hover:text-ink"}`}><FastForward size={13} /> {playbackRate}×</button>
            {(phase === "COMPLETE" || phase === "PAUSED") && <button onClick={() => control("REPLAY")} className="flex min-h-9 items-center gap-2 border border-line px-3 text-[9px] text-muted hover:text-ink"><RotateCcw size={12} /> REPLAY</button>}
            {phase !== "IDLE" && phase !== "COMPLETE" && <button onClick={() => control("COMPLETE")} className="flex min-h-9 items-center gap-2 border border-line px-3 text-[9px] text-muted hover:border-cyan/40 hover:text-cyan"><SkipForward size={12} /> COMPLETE NOW</button>}
          </div>
          {phase === "COMPLETE" && <div className="mt-3 space-y-2 border border-cyan/25 bg-cyan/[.04] p-3"><p className="micro flex items-center gap-2 font-bold text-cyan"><CheckCircle2 size={13} /> SIMULATION COMPLETE</p><div className="flex flex-wrap gap-2"><button onClick={() => dispatch({ type: "APPLY_GUARDRAILS", ids: PROPOSED_GUARDRAILS })} className="min-h-8 border border-cyan/35 bg-cyan/10 px-2.5 text-[8px] font-bold text-cyan hover:bg-cyan/15">APPLY PROPOSED SUITE</button><button onClick={() => dispatch({ type: "NAVIGATE", tab: "report" })} className="flex min-h-8 items-center gap-1 text-[9px] font-bold text-ink hover:text-cyan">OPEN EXPOSURE REPORT <ArrowRight size={12} /></button></div></div>}
          <p className="mt-2 flex items-center gap-1 text-[8px] text-muted"><ShieldAlert size={10} className="text-amber" />The live feed is a cursor over the canonical evaluated findings—not live agent telemetry.</p>
        </div>
      </aside>
    </div>
    {current && <p className="sr-only" aria-live="polite">{current.caseId}: {current.passed ? "policy passed" : `policy violation, modeled exposure plus ${formatUsdExact(current.exposureDeltaCents)} per month`}</p>}
  </section>;
}
