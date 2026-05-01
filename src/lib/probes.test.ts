/* @vitest-environment node */

import { describe, expect, it } from "vitest";
import { buildProbePayload, buildProbeResponse } from "./probes";

describe("probe responses", () => {
  it("builds a stable health payload", async () => {
    const now = new Date("2026-04-30T12:34:56.000Z");
    const payload = buildProbePayload("healthz", now);

    expect(payload).toMatchObject({
      ok: true,
      status: "ok",
      service: "clawhub",
      probe: "healthz",
      timestamp: "2026-04-30T12:34:56.000Z",
    });
  });

  it("serves JSON probe responses without caching", async () => {
    const response = buildProbeResponse("readyz", "GET", new Date("2026-04-30T12:34:56.000Z"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: "ok",
      service: "clawhub",
      probe: "readyz",
    });
  });

  it("serves empty HEAD responses", async () => {
    const response = buildProbeResponse("healthz", "HEAD");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });
});
