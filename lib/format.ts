import type { Severity } from "./types";

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(cents / 100);
}
export function formatUsdExact(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}
export function countLabel(count: number, singular: string, plural = `${singular}s`): string { return `${count} ${count === 1 ? singular : plural}`; }
export function severityClass(severity: Severity): string {
  return severity === "Critical" ? "text-alert bg-alert/10 border-alert/30" : severity === "High" ? "text-amber bg-amber/10 border-amber/25" : severity === "Medium" ? "text-[#dfcb77] bg-[#dfcb77]/10 border-[#dfcb77]/20" : "text-muted bg-white/[.025] border-line";
}
