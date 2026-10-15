"use client";

import { CircleAlert } from "lucide-react";
import { formatUsd } from "@/lib/format";
import type { RunResult } from "@/lib/types";

function Field2D({ result, onSelect, selectedId }: { result: Readonly<RunResult>; onSelect: (id: string) => void; selectedId: string | null }) {
  const width = 520, height = 340, cx = 210, cy = 170, radius = 126;
  const findings = result.scenarios.filter((scenario) => !scenario.evaluation.passed);
  return <div className="relative min-h-[310px] overflow-hidden border border-line bg-[#0b1216]">
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block h-[310px] w-full max-w-[520px]" role="img" aria-labelledby="field-title field-desc">
      <title id="field-title">Synthetic risk field</title>
      <desc id="field-desc">{findings.length} evaluated policy violations surround the cyan synthetic agent core. Select a finding from the list below.</desc>
      <circle cx={cx} cy={cy} r={radius + 38} fill="none" stroke="#26474f" strokeDasharray="2 9" />
      <circle cx={cx} cy={cy} r={radius + 20} fill="none" stroke="#296369" strokeWidth=".7" />
      <circle cx={cx} cy={cy} r={radius} fill="rgba(55,240,208,.025)" stroke="#265750" strokeWidth=".8" />
      <circle cx={cx} cy={cy} r="48" fill="none" stroke="#37f0d0" strokeOpacity=".24" />
      <circle cx={cx} cy={cy} r="39" fill="#37f0d0" fillOpacity=".035" stroke="#37f0d0" strokeOpacity=".7" />
      <circle cx={cx} cy={cy} r="30" fill="#0e2523" stroke="#63ffe3" strokeOpacity=".35" />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#a5fff1" fontSize="13" fontFamily="monospace">CORE</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#8ea5a9" fontSize="11" fontFamily="monospace">{result.violations} FINDINGS</text>
      {findings.map((scenario, index) => {
        const angle = index * 2.399963;
        const point = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
        const color = scenario.severity === "Critical" ? "#ff4545" : scenario.severity === "High" ? "#ffbf5b" : "#e4cb72";
        const active = selectedId === scenario.id;
        return <g key={scenario.id} onClick={() => onSelect(scenario.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(scenario.id); } }} tabIndex={0} role="button" aria-label={`${scenario.severity} finding: ${scenario.name}`} className="cursor-pointer">
          <circle cx={point.x} cy={point.y} r="13" fill="transparent" />
          <circle cx={point.x} cy={point.y} r="4.6" fill={color} />
          <circle cx={point.x} cy={point.y} r="8.6" fill="none" stroke={color} strokeOpacity={active ? ".75" : ".28"} strokeWidth={active ? "1.4" : ".8"} />
          <title>{scenario.caseId} · {scenario.name} · {formatUsd(scenario.modeledExposureCents)}</title>
        </g>;
      })}
    </svg>
    <ul className="grid grid-cols-1 gap-1.5 border-t border-line px-3 py-3 sm:grid-cols-2" aria-label="Clickable evaluated finding markers">
      {findings.map((scenario) => <li key={scenario.id}>
        <button onClick={() => onSelect(scenario.id)} aria-current={selectedId === scenario.id ? "true" : undefined} className={`flex w-full items-center gap-2 text-left text-[12px] ${selectedId === scenario.id ? "text-ink" : "text-muted hover:text-ink"}`}>
          <CircleAlert size={13} className={`shrink-0 ${scenario.severity === "Critical" ? "text-alert" : "text-amber"}`} />
          <span className="truncate">{scenario.caseId} · {scenario.name}</span>
          <span className="ml-auto font-mono text-ink">{formatUsd(scenario.modeledExposureCents)}</span>
        </button>
      </li>)}
    </ul>
  </div>;
}

export function CorePanel({ result, onSelect, selectedId }: { result: Readonly<RunResult>; onSelect: (id: string) => void; selectedId: string | null }) {
  const findings = result.scenarios.filter((scenario) => !scenario.evaluation.passed);
  return <section aria-label="Synthetic risk field" className="rounded-sm border border-line bg-panel">
    <div className="flex items-center justify-between border-b border-line px-3 py-2">
      <p className="micro text-ink">EVALUATED FINDING MAP</p>
      <span className="micro text-muted">{findings.length} VIOLATIONS / {result.scenarios.length} TRACES</span>
    </div>
    <Field2D result={result} onSelect={onSelect} selectedId={selectedId} />
    <p className="border-t border-line px-3 py-3 text-[12px] leading-relaxed text-muted">Marker position and colour come from the local evaluator result for each trace, not from live production traffic.</p>
  </section>;
}
