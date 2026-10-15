import type { ButtonHTMLAttributes, ReactNode } from "react";
import { severityClass, severityDotClass } from "@/lib/format";
import type { Severity } from "@/lib/types";

export function Card({ children, className = "" }: { readonly children: ReactNode; readonly className?: string }) {
  return <section className={`rounded-lg border border-line bg-surface shadow-card ${className}`}>{children}</section>;
}

export function CardHeader({ title, description, action }: {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold leading-6 text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-5 text-subtle">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Metric({ label, value, hint, tone = "ink", testId }: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly tone?: "ink" | "danger" | "success" | "subtle";
  readonly testId?: string;
}) {
  const toneClass = tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : tone === "subtle" ? "text-subtle" : "text-ink";
  return (
    <div>
      <p className="label" data-testid={testId ? `${testId}-label` : undefined}>{label}</p>
      <p data-testid={testId} className={`metric mt-1.5 text-[22px] font-semibold leading-none ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1.5 text-[12px] leading-4 text-subtle">{hint}</p> : null}
    </div>
  );
}

export function SeverityBadge({ severity }: { readonly severity: Severity }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${severityClass(severity)}`}>
      <span className={`size-1.5 rounded-full ${severityDotClass(severity)}`} />
      {severity}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { readonly children: ReactNode; readonly tone?: "neutral" | "primary" | "success" | "danger" }) {
  const tones = {
    neutral: "border-line bg-canvas text-subtle",
    primary: "border-primary/25 bg-primary-soft text-primary",
    success: "border-success/25 bg-success-soft text-success",
    danger: "border-danger/25 bg-danger-soft text-danger",
  } as const;
  return <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] font-medium ${tones[tone]}`}>{children}</span>;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: "border border-primary bg-primary text-white hover:bg-[#125a56] disabled:border-line-strong disabled:bg-line-strong",
    secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-canvas disabled:text-subtle",
    ghost: "border border-transparent text-subtle hover:border-line hover:bg-surface hover:text-ink disabled:text-line-strong",
    danger: "border border-danger/30 bg-danger-soft text-danger hover:border-danger/50 disabled:opacity-60",
  };
  return (
    <button
      {...rest}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3.5 text-[13px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
