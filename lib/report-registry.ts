import type { RunResult } from "./types";

const reports = new Map<string, Readonly<RunResult>>();
const MAX_REPORTS = 100;

export function registerReport(result: Readonly<RunResult>): void {
  reports.delete(result.runId);
  reports.set(result.runId, result);
  while (reports.size > MAX_REPORTS) {
    const oldest = reports.keys().next().value as string | undefined;
    if (!oldest) break;
    reports.delete(oldest);
  }
}
export function findReport(runId: string): Readonly<RunResult> | null {
  return reports.get(runId) ?? null;
}
