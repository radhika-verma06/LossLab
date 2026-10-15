"use client";

import { useEffect } from "react";
import { BarChart3, Code2, FlaskConical, LayoutDashboard, ShieldCheck } from "lucide-react";
import { PROFILES, PROFILE_IDS } from "@/lib/data";
import { useLossLabSession, type TabId } from "@/lib/session";
import { OverviewScreen } from "@/components/overview/OverviewScreen";
import { RunTestsScreen } from "@/components/run/RunTestsScreen";
import { ReportsScreen } from "@/components/reports/ReportsScreen";
import { IntegrationsScreen } from "@/components/integrations/IntegrationsScreen";

const NAV: readonly { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "run", label: "Run tests", icon: FlaskConical },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "integrations", label: "Integrations", icon: Code2 },
];

const SCREENS: Record<TabId, () => JSX.Element> = {
  overview: OverviewScreen,
  run: RunTestsScreen,
  reports: ReportsScreen,
  integrations: IntegrationsScreen,
};

export function AppShell() {
  const { activeTab, profileId, profile, result, dispatch } = useLossLabSession();

  useEffect(() => {
    document.documentElement.dataset.losslabHydrated = "true";
    return () => { delete document.documentElement.dataset.losslabHydrated; };
  }, []);

  const Screen = SCREENS[activeTab];

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col px-4 py-4">
          <a href="#workspace" className="flex items-center gap-2.5 px-1 py-1" aria-label="LossLab home">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-white">
              <ShieldCheck size={17} strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">LossLab</span>
          </a>

          <nav className="mt-5 grid grid-cols-2 gap-1 lg:flex lg:flex-col" aria-label="Primary">
            {NAV.map(({ id, label, icon: Icon }) => {
              const selected = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => dispatch({ type: "NAVIGATE", tab: id })}
                  aria-current={selected ? "page" : undefined}
                  className={`flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-200 ${
                    selected ? "bg-primary-soft text-primary" : "text-subtle hover:bg-canvas hover:text-ink"
                  }`}
                >
                  <Icon size={15} className={selected ? "text-primary" : "text-subtle"} />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 hidden lg:mt-auto lg:block">
            <div className="rounded-md border border-line bg-canvas px-3 py-2.5" data-testid="demo-indicator">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                <span className="size-1.5 rounded-full bg-line-strong" />
                Synthetic demo
              </p>
              <p className="mt-1 text-[11px] leading-4 text-subtle">
                Fixture data only. Not connected to production agents.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-canvas">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-end justify-between gap-4 px-5 py-5 md:px-8">
            <div className="min-w-0">
              <h1 className="text-[22px] font-semibold leading-7 tracking-tight text-ink">Agent safety testing</h1>
              <p className="mt-1 text-[14px] leading-5 text-subtle">Find costly AI mistakes before deployment.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="profile-selector" className="label hidden sm:block">Agent profile</label>
              <select
                id="profile-selector"
                value={profileId}
                onChange={(event) => dispatch({ type: "SELECT_PROFILE", profileId: event.target.value as typeof profileId })}
                className="min-h-10 rounded-md border border-line bg-surface px-3 text-[13px] font-medium text-ink transition-colors duration-200 hover:border-line-strong"
              >
                {PROFILE_IDS.map((id) => <option key={id} value={id}>{PROFILES[id].company}</option>)}
              </select>
            </div>
          </div>
        </header>

        <main id="workspace" className="mx-auto max-w-[1180px] px-5 py-6 md:px-8 md:py-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <p className="rounded border border-line bg-surface px-2 py-1 text-[12px] font-medium text-subtle lg:hidden">
              Synthetic demo — fixture data only
            </p>
            <p className="text-[12px] text-subtle" data-testid="active-profile">
              <span className="font-medium text-ink">{profile.company}</span>
              <span className="mx-2 text-line-strong">·</span>
              {profile.agentName}
              <span className="mx-2 text-line-strong">·</span>
              Run <span className="metric text-ink" data-testid="run-id">{result.runId}</span>
            </p>
          </div>
          <div className="mt-6">
            <Screen />
          </div>
        </main>
      </div>
    </div>
  );
}
