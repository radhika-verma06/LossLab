import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/v1/runs/route";

const post = (body: string) => new NextRequest("http://localhost/api/v1/runs", { method: "POST", headers: { "content-type": "application/json" }, body });

describe("local API input boundary", () => {
  it("does not leak an uncaught error for JSON primitives or missing fields", async () => {
    for (const body of ["null", "[]", "true", "{}", "{\"profileId\":null}"]) {
      const response = await POST(post(body));
      expect(response.status).toBe(400);
      expect((await response.json()).error).toMatch(/validation/i);
    }
  });

  it("rejects unexpected keys instead of accepting integration fantasies", async () => {
    const response = await POST(post(JSON.stringify({ profileId: "skybridge", apiKey: "do-not-accept", endpoint: "https://example.invalid" })));
    expect(response.status).toBe(400);
  });
});
