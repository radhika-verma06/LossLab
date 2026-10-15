"use client";

import { useState } from "react";
import { BadgeCheck, Check, Clipboard, Copy, Database, GitBranch, Layers2, Radio, Shield, TerminalSquare } from "lucide-react";
import { Card, CardHeader, Pill } from "@/components/ui/primitives";
import { useLossLabSession } from "@/lib/session";

const SDK_SNIPPET = `import { losslab } from "./lib/sdk";

const result = losslab.run("skybridge", { seed: 241, volume: 1 });
console.log(result.monthlyExposureCents);

const comparison = losslab.replay(result, ["transaction-idempotency"]);
console.log(comparison.remediated.monthlyExposureCents);`;

const REQUEST_SNIPPET = `POST /api/v1/runs
Content-Type: application/json

{
  "profileId": "skybridge",
  "seed": 241,
  "volumeMultiplier": 1,
  "guardrails": ["transaction-idempotency"]
}`;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
}

const PIPELINE = [
  { icon: GitBranch, title: "Structured trace", detail: "Action type, business event, currency, authorization source and retry metadata." },
  { icon: Shield, title: "Policy evaluation", detail: "Pure TypeScript checks each trace against explicit deterministic constraints." },
  { icon: Layers2, title: "Economic model", detail: "Monthly affected events × assumed unit contribution, in integer cents." },
  { icon: Database, title: "Replayable result", detail: "One canonical RunResult with a stable run ID and reproducible findings." },
];

export function IntegrationsScreen() {
  const { result } = useLossLabSession();
  const [copied, setCopied] = useState<string | null>(null);

  const doCopy = async (label: string, text: string) => {
    const ok = await copyText(text);
    setCopied(ok ? label : null);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Integrate LossLab"
          description="A local TypeScript facade and a validated HTTP route evaluate the seeded profiles."
          action={<Pill tone="primary"><BadgeCheck size={12} /> Local engine ready</Pill>}
        />
        <div className="grid gap-5 px-5 py-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-md border border-line">
            <div className="flex items-center justify-between border-b border-line bg-canvas px-3 py-2">
              <p className="flex items-center gap-2 text-[12px] font-semibold text-ink"><TerminalSquare size={13} className="text-primary" /> TypeScript SDK</p>
              <button
                onClick={() => void doCopy("sdk", SDK_SNIPPET)}
                className="inline-flex items-center gap-1.5 rounded border border-line bg-surface px-2 py-1 text-[12px] font-medium text-subtle transition-colors duration-200 hover:text-ink"
              >
                <Copy size={12} /> {copied === "sdk" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-ink">{SDK_SNIPPET}</pre>
            <p className="flex items-center gap-2 border-t border-line px-3 py-2 text-[12px] text-subtle">
              <Check size={12} className="text-success" /> Calls the local risk engine. No network request or credential.
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-line">
            <div className="flex items-center justify-between border-b border-line bg-canvas px-3 py-2">
              <p className="flex items-center gap-2 text-[12px] font-semibold text-ink"><Radio size={13} className="text-primary" /> HTTP contract</p>
              <button
                onClick={() => void doCopy("request", REQUEST_SNIPPET)}
                className="inline-flex items-center gap-1.5 rounded border border-line bg-surface px-2 py-1 text-[12px] font-medium text-subtle transition-colors duration-200 hover:text-ink"
              >
                <Clipboard size={12} /> {copied === "request" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-ink">{REQUEST_SNIPPET}</pre>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-3 py-2 text-[12px] text-subtle">
              <span>Live routes:</span>
              <a href="/api/v1/agents" target="_blank" rel="noreferrer" className="metric font-medium text-primary hover:underline">GET /api/v1/agents</a>
              <a href={`/api/v1/reports/${result.runId}`} target="_blank" rel="noreferrer" className="metric font-medium text-primary hover:underline">GET /api/v1/reports/{result.runId}</a>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Event contract" description="How an agent's actions reach the evaluator." />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          {PIPELINE.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="rounded-md border border-line bg-canvas p-4">
              <Icon size={15} className="text-primary" />
              <p className="mt-2.5 text-[13px] font-semibold text-ink">{title}</p>
              <p className="mt-1.5 text-[12px] leading-5 text-subtle">{detail}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-line px-5 py-4 text-[12px] leading-5 text-subtle">
          A customer agent would emit structured tool-call traces to an SDK or API adapter; LossLab evaluates a versioned
          policy set and returns typed findings. It never relies on the agent model to judge itself.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Available today" />
          <ul className="space-y-2 px-5 py-4">
            {[
              "Three seeded synthetic profiles with authored fixtures",
              "Deterministic evaluator covering nine policy rules",
              "Same-trace safeguard replay with integer-cent reconciliation",
              "Validated /api/v1 routes and a downloadable JSON report",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] leading-5 text-ink">
                <Check size={14} className="mt-0.5 shrink-0 text-success" /> {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Not implemented" />
          <ul className="space-y-2 px-5 py-4">
            {[
              "Live agent adapters, webhooks or production trace ingestion",
              "Hosted persistence, team identity or organisation onboarding",
              "Queue-backed workers or asynchronous orchestration",
              "CI release gating or historical trend comparison",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] leading-5 text-subtle">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-line-strong" /> {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
