import { NextResponse, type NextRequest } from "next/server";
import { findReport } from "@/lib/report-registry";
import { runRiskEngine } from "@/lib/risk-engine";
import { ReportRequestSchema } from "@/lib/validation";
import type { ProfileId } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KNOWN = ["skybridge", "meridian", "atlaspay"] as const;

export async function GET(_request: NextRequest, { params }: { params: { runId: string } }) {
  const parsed = ReportRequestSchema.safeParse({ runId: params.runId });
  if (!parsed.success) return NextResponse.json({ error: "Report identifier is invalid." }, { status: 400 });
  let report = findReport(parsed.data.runId);
  if (!report) {
    for (const profileId of KNOWN) {
      const candidate = runRiskEngine({ profileId: profileId as ProfileId });
      if (candidate.runId === parsed.data.runId) { report = candidate; break; }
    }
  }
  if (!report) return NextResponse.json({ error: "No synthetic report exists for this run identifier in this local process." }, { status: 404 });
  return NextResponse.json({ data: report }, { headers: { "Cache-Control": "no-store", "X-LossLab-Mode": "DEMO-SYNTHETIC" } });
}
