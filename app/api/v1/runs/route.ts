import { NextRequest, NextResponse } from "next/server";
import { runRiskEngine } from "@/lib/risk-engine";
import { RunRequestSchema, ApiErrorSchema } from "@/lib/validation";
import type { RunResult } from "@/lib/types";
import { registerReport } from "@/lib/report-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json(ApiErrorSchema.parse({ error: "Request body must contain valid JSON." }), { status: 400 }); }
  const parsed = RunRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Run request failed schema validation.", issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`) }, { status: 400 });
  }
  const input = parsed.data;
  const result: Readonly<RunResult> = runRiskEngine({
    profileId: input.profileId,
    seed: input.seed,
    volumeMultiplier: input.volumeMultiplier,
    guardrails: input.guardrails,
  });
  registerReport(result);
  return NextResponse.json({ data: result }, { status: 201, headers: { "Cache-Control": "no-store", "X-LossLab-Mode": "DEMO-SYNTHETIC" } });
}
