"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { Activity, ArrowDownRight, CircleAlert } from "lucide-react";
import { formatUsd } from "@/lib/format";
import type { RunResult } from "@/lib/types";

const RiskCoreScene = dynamic(() => import("./RiskCoreScene").then((module) => module.RiskCoreScene), { ssr: false, loading: () => <div className="grid h-full min-h-[310px] place-items-center border border-line bg-[#0b1216]"><div className="text-center"><span className="mx-auto block size-9 animate-pulse rounded-full border border-cyan/40 bg-cyan/[.04] shadow-[0_0_22px_rgba(55,240,208,.14)]" /><p className="micro mt-3 text-muted">INITIALIZING LOCAL RISK FIELD</p></div></div> });

function Field2D({ result, cursor, onSelect }: { result: Readonly<RunResult>; cursor: number; onSelect: (id: string) => void }) {
  const width = 520, height = 340, cx = 210, cy = 170, radius = 126;
  const findings = result.scenarios.filter((scenario) => !scenario.evaluation.passed);
  return <div className="panel-grid relative min-h-[310px] overflow-hidden border border-line bg-[#0b1216]">
    <p className="micro absolute left-3 top-3 z-10 text-cyan">2D CONTAINED RISK CORE · ACCESSIBLE FALLBACK</p>
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block h-[310px] w-full max-w-[520px]" role="img" aria-labelledby="field-title field-desc">
      <title id="field-title">Synthetic risk field</title><desc id="field-desc">{findings.length} evaluated policy violations surround the cyan synthetic agent core. Select a finding marker from the list below.</desc>
      <circle cx={cx} cy={cy} r={radius + 38} fill="none" stroke="#26474f" strokeDasharray="2 9" /><circle cx={cx} cy={cy} r={radius + 20} fill="none" stroke="#296369" strokeWidth=".7" /><circle cx={cx} cy={cy} r={radius} fill="rgba(55,240,208,.025)" stroke="#265750" strokeWidth=".8" />
      <circle cx={cx} cy={cy} r="48" fill="none" stroke="#37f0d0" strokeOpacity=".24" /><circle cx={cx} cy={cy} r="39" fill="#37f0d0" fillOpacity=".035" stroke="#37f0d0" strokeOpacity=".7" />
      <circle cx={cx} cy={cy} r="28" fill="#0e2523" stroke="#63ffe3" strokeOpacity=".35" /><text x={cx} y={cy - 1} textAnchor="middle" fill="#a5fff1" fontSize="9" fontFamily="monospace">CORE</text><text x={cx} y={cy + 11} textAnchor="middle" fill="#738b90" fontSize="6" fontFamily="monospace">{result.violations} FINDINGS</text>
      {Array.from({ length: 44 }, (_, index) => { const angle = index * 2.399963; const r = radius + (index * 17 % 36); return <circle key={index} cx={cx + Math.cos(angle) * r} cy={cy + Math.sin(angle) * r} r={index % 7 === 0 ? 1.8 : 1} fill="#37f0d0" opacity={index % 7 === 0 ? .8 : .36} />; })}
      {findings.map((scenario, index) => { const angle = index * 2.399963; const p = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }; const color = scenario.severity === "Critical" ? "#ff4545" : scenario.severity === "High" ? "#ffbf5b" : "#e4cb72"; return <g key={scenario.id} onClick={() => onSelect(scenario.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(scenario.id); } }} tabIndex={0} role="button" aria-label={`${scenario.severity} finding: ${scenario.name}`} className="cursor-pointer"><circle cx={p.x} cy={p.y} r="12" fill="transparent" /><circle cx={p.x} cy={p.y} r="4.3" fill={color} /><circle cx={p.x} cy={p.y} r="8" fill="none" stroke={color} strokeOpacity=".28" /><title>{scenario.caseId} · {scenario.name} · {formatUsd(scenario.modeledExposureCents)}</title></g>; })}
    </svg>
    <ul className="grid grid-cols-1 gap-1 border-t border-line px-3 py-2 sm:grid-cols-2" aria-label="Clickable evaluated finding markers">{findings.map((scenario) => <li key={scenario.id}><button onClick={() => onSelect(scenario.id)} className="flex w-full items-center gap-2 text-left text-[9px] text-muted hover:text-ink"><CircleAlert size={11} className={scenario.severity === "Critical" ? "text-alert" : "text-amber"} /><span className="truncate">{scenario.caseId} / {scenario.name}</span><span className="ml-auto font-mono text-ink">{formatUsd(scenario.modeledExposureCents)}</span></button></li>)}</ul>
  </div>;
}

export function CorePanel({ result, cursor, onSelect, selectedId, reducedMotion }: { result: Readonly<RunResult>; cursor: number; onSelect: (id: string) => void; selectedId: string | null; reducedMotion: boolean }) {
  const [force2D, setForce2D] = useState(false);
  if (reducedMotion || force2D) return <section aria-label="Two-dimensional synthetic risk field"><div className="flex items-center justify-between border-x border-t border-line bg-panel px-3 py-2"><p className="micro flex items-center gap-2 text-muted"><Activity size={12} className="text-cyan" /> {reducedMotion ? "REDUCED-MOTION MODE" : "LOW-IMPACT VISUAL MODE"}</p><button onClick={() => setForce2D((value) => !value)} className="micro text-cyan">{force2D ? "TRY 3D" : "2D FALLBACK"}</button></div><Field2D result={result} cursor={cursor} onSelect={onSelect} /></section>;
  return <Suspense fallback={<div className="grid min-h-[310px] place-items-center border border-line bg-[#0b1216]"><p className="micro text-cyan">LOADING 3D RISK FIELD</p></div>}><div className="relative"><RiskCoreScene result={result} cursor={cursor} onSelect={(id) => { if (id) onSelect(id); }} selectedId={selectedId} reducedMotion={reducedMotion} /><button onClick={() => setForce2D(true)} className="absolute bottom-9 right-2 border border-line bg-void/90 px-2 py-1 font-mono text-[8px] text-muted hover:text-cyan">SWITCH TO 2D</button></div></Suspense>;
}
