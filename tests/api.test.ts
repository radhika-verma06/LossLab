import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as listAgents } from "@/app/api/v1/agents/route";
import { POST as createRun } from "@/app/api/v1/runs/route";
import { GET as readReport } from "@/app/api/v1/reports/[runId]/route";
import { runRiskEngine } from "@/lib/risk-engine";
import { registerReport } from "@/lib/report-registry";

const req = (url: string, body: unknown) => new NextRequest(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("local synthetic API", () => {
  beforeEach(() => { registerReport(runRiskEngine({ profileId: "skybridge" })); });
  it("lists all three seeded synthetic profiles", async () => {
    const response = await listAgents(); const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.map((agent: { id: string }) => agent.id)).toEqual(["skybridge", "meridian", "atlaspay"]);
    expect(body.data.every((agent: { mode: string }) => agent.mode === "DEMO MODE — SYNTHETIC TEST FIXTURES")).toBe(true);
  });
  it("evaluates a validated POST run deterministically with auditable cents", async () => {
    const response = await createRun(req("http://localhost/api/v1/runs", { profileId: "meridian", seed: 31, volumeMultiplier: 1, guardrails: [] }));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.data.monthlyExposureCents).toBe(892000);
    expect(body.data.events).toHaveLength(40);
    expect(response.headers.get("X-LossLab-Mode")).toBe("DEMO-SYNTHETIC");
  });
  it("returns a 400 response for an invalid profile or broken JSON", async () => {
    expect((await createRun(req("http://localhost/api/v1/runs", { profileId: "openai" }))).status).toBe(400);
    const badJson = new NextRequest("http://localhost/api/v1/runs", { method: "POST", body: "not-json" });
    expect((await createRun(badJson)).status).toBe(400);
  });
  it("returns a deterministic report by run ID and rejects malformed identifiers", async () => {
    const result = runRiskEngine({ profileId: "skybridge" }); registerReport(result);
    const request = new NextRequest("http://localhost/api/v1/reports/" + result.runId);
    const good = await readReport(request, { params: { runId: result.runId } });
    expect(good.status).toBe(200); expect((await good.json()).data.runId).toBe(result.runId);
    const bad = await readReport(request, { params: { runId: "not-a-run" } });
    expect(bad.status).toBe(400);
  });
});
