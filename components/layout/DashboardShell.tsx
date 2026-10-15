"use client";

import { useEffect } from "react";
import { Activity, ArrowUpRight, BadgeCheck, BookOpenCheck, CircleHelp, Code2, Cpu, Database, Layers3, Play, Radar, ShieldAlert, Sparkles, SquareTerminal } from "lucide-react";
import { useLossLabSession, type TabId } from "@/lib/session";
import { SetupScreen } from "@/components/setup/SetupScreen";
import { RunScreen } from "@/components/run/RunScreen";
import { ReportScreen } from "@/components/report/ReportScreen";
import { IntegrateScreen } from "@/components/integrate/IntegrateScreen";

const nav: readonly { id: TabId; label: string; icon: typeof Radar; index: string }[] = [
  { id: "setup", label: "Setup", icon: Layers3, index: "01" },
  { id: "run", label: "Run", icon: Play, index: "02" },
  { id: "report", label: "Report", icon: Activity, index: "03" },
  { id: "integrate", label: "Integrate", icon: Code2, index: "04" },
];

const screens = {
  setup: SetupScreen,
  run: RunScreen,
  report: ReportScreen,
  integrate: IntegrateScreen,
} as const;

export function DashboardShell() {
  const { profile, profileId, result, phase, activeTab, dispatch } = useLossLabSession();
  useEffect(() => {
    document.documentElement.dataset.losslabHydrated = "true";
    return () => { delete document.documentElement.dataset.losslabHydrated; };
  }, []);
  const Screen = screens[activeTab];
  return (
    <div className="min-h-screen bg-void lg:grid lg:grid-cols-[228px_minmax(0,1fr)]">
      <aside className="desktop-sidebar sticky top-0 hidden h-screen border-r border-line bg-[#0c1317] px-4 pb-4 pt-5 lg:flex lg:flex-col">
        <a href="#overview" className="flex items-center gap-3 px-2 text-ink" aria-label="LossLab dashboard">
          <span className="grid size-9 place-items-center rounded-sm border border-cyan/30 bg-cyan/5 text-cyan"><Radar size={18} strokeWidth={1.8} /></span>
          <span><span className="block text-[14px] font-semibold tracking-[.22em]">LOSS<span className="text-cyan">LAB</span></span><span className="micro mt-1 block text-muted">RISK ENGINEERING</span></span>
        </a>
        <div className="mt-7 rounded-md border border-alert/30 bg-alert/[.045] p-3" role="status" aria-label="Synthetic demonstration mode">
          <p className="micro flex items-center gap-2 font-bold text-alert"><span className="status-dot size-1.5 rounded-full bg-alert" />Simulation only</p>
          <p className="micro mt-2 leading-relaxed text-[#d59a9a]">DEMO MODE — SYNTHETIC TEST FIXTURES</p>
        </div>
        <p className="micro mb-2 mt-8 px-2 text-muted">WORKSPACE / 01</p>
        <nav className="space-y-1" aria-label="Primary">
          {nav.map(({ id, label, icon: Icon, index }) => {
            const selected = activeTab === id;
            return <button key={id} onClick={() => dispatch({ type: "NAVIGATE", tab: id })} aria-current={selected ? "page" : undefined}
              className={`group flex min-h-[42px] w-full items-center gap-3 rounded-sm border px-3 text-left transition-colors ${selected ? "border-cyan/20 bg-cyan/[.075] text-ink" : "border-transparent text-muted hover:bg-white/[.025] hover:text-ink"}`}>
              <Icon size={15} className={selected ? "text-cyan" : "text-muted group-hover:text-cyan"} />
              <span className="text-[13px] font-medium">{label}</span>
              <span className={`ml-auto font-mono text-[11px] ${selected ? "text-cyan" : "text-[#4a6268]"}`}>{index}</span>
            </button>;
          })}
        </nav>
        <div className="mt-8 border-t border-line px-2 pt-5">
          <p className="micro mb-3 text-muted">SELECTED AGENT</p>
          <label htmlFor="sidebar-agent" className="sr-only">Select synthetic agent profile</label>
          <select id="sidebar-agent" value={profileId} onChange={(event) => dispatch({ type: "SELECT_PROFILE", profileId: event.target.value as typeof profileId })}
            className="w-full appearance-none rounded-sm border border-line bg-panel px-3 py-2.5 text-xs text-ink focus:border-cyan">
            <option value="skybridge">SkyBridge Airways</option><option value="meridian">Meridian Cloud</option><option value="atlaspay">AtlasPay</option>
          </select>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">{profile.agentName}</p>
        </div>
        <div className="mt-auto border-t border-line px-2 pt-4">
          <div className="flex items-center justify-between"><span className="micro text-muted">ENGINE STATUS</span><span className="micro text-cyan">LOCAL / READY</span></div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted"><Database size={12} className="text-cyan" /> Deterministic fixtures <BadgeCheck size={11} className="ml-auto text-cyan" /></div>
          <a href="#mode-note" className="mt-3 flex items-center gap-2 text-[11px] text-muted hover:text-ink"><CircleHelp size={12} /> Synthetic mode details <ArrowUpRight size={11} className="ml-auto" /></a>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-line bg-[#0a0f12]/95 px-4 py-3 backdrop-blur-sm md:px-7">
          <div className="mx-auto flex max-w-[1550px] items-center gap-3">
            <span className="grid size-8 place-items-center border border-cyan/30 bg-cyan/[.05] text-cyan lg:hidden"><Radar size={16} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{profile.company}</p><p className="micro mt-1 hidden text-muted sm:block">{profile.agentName}</p></div>
            <div className="hidden items-center gap-2 border-r border-line pr-4 sm:flex"><span className="micro text-muted">RUN ID</span><code className="text-[11px] text-cyan">{result.runId}</code></div>
            <div className="flex items-center gap-2 rounded-sm border border-line bg-panel px-2.5 py-1.5"><span className={`size-1.5 rounded-full ${phase === "RUNNING" ? "animate-pulse bg-amber" : phase === "COMPLETE" ? "bg-cyan" : "bg-muted"}`} /><span className={`micro ${phase === "RUNNING" ? "text-amber" : phase === "COMPLETE" ? "text-cyan" : "text-muted"}`}>{phase}</span></div>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto lg:hidden" aria-label="Primary">
            {nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => dispatch({ type: "NAVIGATE", tab: id })} aria-current={activeTab === id ? "page" : undefined} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-xs ${activeTab === id ? "border-cyan text-ink" : "border-transparent text-muted"}`}><Icon size={13} />{label}</button>)}
          </nav>
        </header>

        <main id="overview" className="mx-auto min-h-[calc(100vh-62px)] max-w-[1550px] px-4 py-6 md:px-7 md:py-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 border border-alert/20 bg-alert/[.035] px-3 py-2" id="mode-note">
            <ShieldAlert size={13} className="text-alert" aria-hidden="true" />
            <span className="micro font-bold tracking-[.12em] text-[#f3aaaa]">DEMO MODE — SYNTHETIC TEST FIXTURES</span>
            <span className="ml-auto hidden text-[11px] text-muted sm:inline">Modeled exposure ≠ actual customer losses</span>
          </div>
          <div key={activeTab} className="animate-in"><Screen /></div>
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[11px] text-muted">
            <p className="flex items-center gap-2"><Cpu size={12} className="text-cyan" /> LOSSLAB <span className="text-line">/</span> SYNTHETIC POLICY EVALUATION</p>
            <p>Rule outcomes are deterministic test fixtures—not production telemetry or loss estimates.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
