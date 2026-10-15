import type { Severity } from "./types";

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(cents / 100);
}

export function formatUsdExact(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Severity styling. This function returns Tailwind class strings, so `./lib/**` must stay in the
 * `content` globs in tailwind.config.ts — otherwise every class below is purged from the build.
 *
 * Critical and High both read as danger; they are separated by fill weight rather than by
 * introducing a third accent colour.
 */
export function severityClass(severity: Severity): string {
  return severity === "Critical"
    ? "text-danger bg-danger-soft border-danger/25"
    : severity === "High"
      ? "text-danger bg-surface border-danger/25"
      : severity === "Medium"
        ? "text-ink bg-surface border-line-strong"
        : "text-subtle bg-surface border-line";
}

/** Solid dot for Critical, ring for High, muted for the rest. */
export function severityDotClass(severity: Severity): string {
  return severity === "Critical"
    ? "bg-danger"
    : severity === "High"
      ? "border border-danger bg-transparent"
      : severity === "Medium"
        ? "bg-ink"
        : "bg-subtle";
}
