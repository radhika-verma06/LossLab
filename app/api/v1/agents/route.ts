import { NextResponse } from "next/server";
import { PROFILES } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = Object.values(PROFILES).map((profile) => ({
    id: profile.id,
    company: profile.company,
    agentName: profile.agentName,
    useCase: profile.useCase,
    dailyDecisionVolume: profile.dailyDecisionVolume,
    agentsTouchingMoney: profile.agentsTouchingMoney,
    modeledMonthlyExposureCents: profile.monthlyExposureCents,
    syntheticScenarioCount: profile.scenarios.filter((scenario) => scenario.violatedRuleId !== null).length,
    mode: "DEMO MODE — SYNTHETIC TEST FIXTURES",
  }));
  return NextResponse.json({ data: agents }, { headers: { "Cache-Control": "no-store" } });
}
