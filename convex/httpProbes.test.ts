/* @vitest-environment node */

import { describe, expect, it } from "vitest";
import { buildProbePayload, buildProbeResponse } from "./httpProbes";

describe("Convex probe responses", () => {
  it("builds a stable readiness payload", () => {
    const now = new Date("2026-04-30T12:34:56.000Z");
    const payload = buildProbePayload("readyz", now);

    expect(payload).toMatchObject({
      ok: true,
      status: "ok",
      service: "clawhub",
      probe: "readyz",
      timestamp: "2026-04-30T12:34:56.000Z",
    });
  });

  it("serves JSON probe responses without caching", async () => {
    const response = buildProbeResponse("healthz", "GET", new Date("2026-04-30T12:34:56.000Z"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: "ok",
      service: "clawhub",
      probe: "healthz",
    });
  });

  it("serves empty HEAD responses", async () => {
    const response = buildProbeResponse("readyz", "HEAD");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });
});
